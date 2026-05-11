use crate::config::SearchCriterion;
use crate::error::{PipelineError, PipelineResult};
use crate::metrics::PipelineMetrics;
use crate::models::{LicenseInfo, NameOnly, OwnerInfo, RepositoryRecord, Watchers};
use reqwest::blocking::Client;
use reqwest::header::{ACCEPT, AUTHORIZATION, HeaderMap, HeaderValue, USER_AGENT};
use serde::Deserialize;
use std::collections::BTreeMap;

pub trait RepositorySource {
    fn mode(&self) -> &'static str;

    fn fetch(
        &mut self,
        criteria: &[SearchCriterion],
        generated_at: &str,
        workflow_run_id: &str,
        metrics: &mut PipelineMetrics,
    ) -> PipelineResult<Vec<RepositoryRecord>>;
}

#[derive(Debug, Default)]
pub struct DryRunSource;

impl RepositorySource for DryRunSource {
    fn mode(&self) -> &'static str {
        "dry-run"
    }

    fn fetch(
        &mut self,
        criteria: &[SearchCriterion],
        generated_at: &str,
        workflow_run_id: &str,
        metrics: &mut PipelineMetrics,
    ) -> PipelineResult<Vec<RepositoryRecord>> {
        metrics.observations.push(
            "dry-run mode used deterministic fixture records; no network calls made".to_string(),
        );

        Ok(criteria
            .iter()
            .map(|criterion| {
                RepositoryRecord::dry_run_from_criterion(
                    criterion,
                    generated_at,
                    workflow_run_id,
                )
            })
            .collect())
    }
}

#[derive(Debug)]
pub struct LiveGithubSource {
    client: Client,
}

impl LiveGithubSource {
    pub fn from_env() -> PipelineResult<Self> {
        Self::new(std::env::var("GITHUB_TOKEN").ok())
    }

    pub fn new(token: Option<String>) -> PipelineResult<Self> {
        let token = token
            .filter(|value| !value.trim().is_empty())
            .ok_or(PipelineError::MissingGithubToken)?;

        let mut headers = HeaderMap::new();
        headers.insert(
            USER_AGENT,
            HeaderValue::from_static("PowerPlatform-OpenSource-Hub-PipelineRust"),
        );
        headers.insert(
            ACCEPT,
            HeaderValue::from_static("application/vnd.github+json"),
        );
        headers.insert(
            "X-GitHub-Api-Version",
            HeaderValue::from_static("2022-11-28"),
        );
        headers.insert(
            AUTHORIZATION,
            HeaderValue::from_str(&format!("Bearer {token}")).map_err(|_| {
                PipelineError::InvalidConfig(
                    "GITHUB_TOKEN contains invalid header characters".into(),
                )
            })?,
        );

        let client = Client::builder().default_headers(headers).build()?;
        Ok(Self { client })
    }
}

impl RepositorySource for LiveGithubSource {
    fn mode(&self) -> &'static str {
        "live"
    }

    fn fetch(
        &mut self,
        criteria: &[SearchCriterion],
        generated_at: &str,
        workflow_run_id: &str,
        metrics: &mut PipelineMetrics,
    ) -> PipelineResult<Vec<RepositoryRecord>> {
        let mut repositories = BTreeMap::new();

        for criterion in criteria {
            let mut remaining = usize::from(criterion.search_limit);
            let mut page = 1usize;

            while remaining > 0 {
                let per_page = remaining.min(100);
                let url = format!(
                    "https://api.github.com/search/repositories?q=topic:{}+is:public&sort=stars&order=desc&per_page={per_page}&page={page}",
                    criterion.topic
                );
                let response = self.client.get(url).send()?;

                if let Some(value) = header_to_string(response.headers(), "x-ratelimit-remaining") {
                    metrics.rate_limit_remaining = Some(value);
                }
                if let Some(value) = header_to_string(response.headers(), "x-ratelimit-reset") {
                    metrics.rate_limit_reset = Some(value);
                }

                let status = response.status();
                if !status.is_success() {
                    let body = response.text().unwrap_or_default();
                    if status.as_u16() == 403 || status.as_u16() == 429 {
                        metrics.observations.push(format!(
                            "rate-limit or abuse protection response observed for topic '{}'",
                            criterion.topic
                        ));
                    }
                    return Err(PipelineError::HttpStatus {
                        status: status.as_u16(),
                        body,
                    });
                }

                let payload: SearchResponse = response.json()?;
                if payload.incomplete_results {
                    metrics.observations.push(format!(
                        "GitHub reported incomplete search results for topic '{}'",
                        criterion.topic
                    ));
                }

                let item_count = payload.items.len();
                for item in payload.items {
                    let record = item.into_record(generated_at, workflow_run_id);
                    repositories.entry(record.full_name.clone()).or_insert(record);
                }

                if item_count < per_page {
                    break;
                }

                remaining -= item_count;
                page += 1;
            }
        }

        let mut records: Vec<_> = repositories.into_values().collect();
        records.sort_by(|left, right| {
            right
                .stargazer_count
                .cmp(&left.stargazer_count)
                .then_with(|| left.full_name.cmp(&right.full_name))
        });
        Ok(records)
    }
}

fn header_to_string(headers: &HeaderMap, name: &'static str) -> Option<String> {
    headers
        .get(name)
        .and_then(|value| value.to_str().ok())
        .map(ToOwned::to_owned)
}

#[derive(Debug, Deserialize)]
struct SearchResponse {
    incomplete_results: bool,
    items: Vec<GithubRepository>,
}

#[derive(Debug, Deserialize)]
struct GithubRepository {
    name: String,
    full_name: String,
    owner: GithubOwner,
    html_url: String,
    description: Option<String>,
    created_at: String,
    updated_at: String,
    homepage: Option<String>,
    stargazers_count: u64,
    watchers_count: u64,
    language: Option<String>,
    forks_count: u64,
    archived: bool,
    open_issues_count: u64,
    license: Option<GithubLicense>,
    topics: Option<Vec<String>>,
    has_issues: Option<bool>,
    is_template: Option<bool>,
}

impl GithubRepository {
    fn into_record(self, generated_at: &str, workflow_run_id: &str) -> RepositoryRecord {
        let language = self.language.unwrap_or_default();
        let topics = self.topics.unwrap_or_default();
        let languages = if language.is_empty() {
            Vec::new()
        } else {
            vec![language.clone()]
        };

        RepositoryRecord {
            created_at: self.created_at,
            description: self.description.unwrap_or_default(),
            full_name: self.full_name,
            has_issues: self.has_issues.unwrap_or(true),
            homepage: self.homepage,
            is_archived: self.archived,
            language: language.clone(),
            license: self.license.map(Into::into),
            name: self.name,
            open_issues_count: self.open_issues_count,
            owner: self.owner.into(),
            updated_at: self.updated_at,
            url: self.html_url,
            code_of_conduct: None,
            fork_count: self.forks_count,
            funding_links: Vec::new(),
            is_security_policy_enabled: false,
            is_template: self.is_template.unwrap_or(false),
            latest_release: None,
            primary_language: if language.is_empty() {
                None
            } else {
                Some(NameOnly { name: language })
            },
            security_policy_url: None,
            stargazer_count: self.stargazers_count,
            watchers: Watchers {
                total_count: self.watchers_count,
            },
            topics,
            languages,
            opened_good_first_issues: 0,
            has_good_first_issues: false,
            opened_help_wanted_issues: 0,
            has_help_wanted_issues: false,
            opened_to_contributions_issues: 0,
            popularity_score: self.stargazers_count + self.watchers_count,
            schema_version: "1.0.0".to_string(),
            generated_at: generated_at.to_string(),
            workflow_run_id: workflow_run_id.to_string(),
        }
    }
}

#[derive(Debug, Deserialize)]
struct GithubOwner {
    id: u64,
    login: String,
    #[serde(rename = "type")]
    owner_type: String,
    html_url: String,
}

impl From<GithubOwner> for OwnerInfo {
    fn from(value: GithubOwner) -> Self {
        Self {
            id: value.id.to_string(),
            is_bot: value.owner_type.eq_ignore_ascii_case("Bot"),
            login: value.login,
            owner_type: value.owner_type,
            url: value.html_url,
        }
    }
}

#[derive(Debug, Deserialize)]
struct GithubLicense {
    key: String,
    name: String,
    url: Option<String>,
}

impl From<GithubLicense> for LicenseInfo {
    fn from(value: GithubLicense) -> Self {
        Self {
            key: value.key,
            name: value.name,
            url: value.url.unwrap_or_default(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn live_source_requires_token() {
        let error = LiveGithubSource::new(None).expect_err("missing token should fail");

        assert!(matches!(error, PipelineError::MissingGithubToken));
    }
}

