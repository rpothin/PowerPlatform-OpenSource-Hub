use crate::config::SearchCriterion;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct LicenseInfo {
    pub key: String,
    pub name: String,
    pub url: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct OwnerInfo {
    pub id: String,
    #[serde(rename = "is_bot")]
    pub is_bot: bool,
    pub login: String,
    #[serde(rename = "type")]
    pub owner_type: String,
    pub url: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct NameOnly {
    pub name: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Watchers {
    #[serde(rename = "totalCount")]
    pub total_count: u64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RepositoryRecord {
    pub created_at: String,
    pub description: String,
    pub full_name: String,
    pub has_issues: bool,
    pub homepage: Option<String>,
    pub is_archived: bool,
    pub language: String,
    pub license: Option<LicenseInfo>,
    pub name: String,
    pub open_issues_count: u64,
    pub owner: OwnerInfo,
    pub updated_at: String,
    pub url: String,
    pub code_of_conduct: Option<serde_json::Value>,
    pub fork_count: u64,
    pub funding_links: Vec<serde_json::Value>,
    pub is_security_policy_enabled: bool,
    pub is_template: bool,
    pub latest_release: Option<serde_json::Value>,
    pub primary_language: Option<NameOnly>,
    pub security_policy_url: Option<String>,
    pub stargazer_count: u64,
    pub watchers: Watchers,
    pub topics: Vec<String>,
    pub languages: Vec<String>,
    pub opened_good_first_issues: u64,
    pub has_good_first_issues: bool,
    pub opened_help_wanted_issues: u64,
    pub has_help_wanted_issues: bool,
    pub opened_to_contributions_issues: u64,
    pub popularity_score: u64,
    #[serde(rename = "_schemaVersion")]
    pub schema_version: String,
    #[serde(rename = "_generatedAt")]
    pub generated_at: String,
    #[serde(rename = "_workflowRunId")]
    pub workflow_run_id: String,
}

impl RepositoryRecord {
    pub fn dry_run_from_criterion(
        criterion: &SearchCriterion,
        generated_at: &str,
        workflow_run_id: &str,
    ) -> Self {
        let topic = criterion.topic.to_ascii_lowercase();
        let name = format!("{topic}-sample");
        let full_name = format!("dry-run/{name}");
        let url = format!("https://github.com/{full_name}");

        Self {
            created_at: generated_at.to_string(),
            description: format!(
                "Dry-run repository fixture for the '{}' topic.",
                criterion.topic
            ),
            full_name,
            has_issues: true,
            homepage: None,
            is_archived: false,
            language: "Rust".to_string(),
            license: Some(LicenseInfo {
                key: "mit".to_string(),
                name: "MIT License".to_string(),
                url: "https://api.github.com/licenses/mit".to_string(),
            }),
            name,
            open_issues_count: 0,
            owner: OwnerInfo {
                id: "dry-run-owner".to_string(),
                is_bot: false,
                login: "dry-run".to_string(),
                owner_type: "Organization".to_string(),
                url: "https://github.com/dry-run".to_string(),
            },
            updated_at: generated_at.to_string(),
            url,
            code_of_conduct: None,
            fork_count: 0,
            funding_links: Vec::new(),
            is_security_policy_enabled: false,
            is_template: false,
            latest_release: None,
            primary_language: Some(NameOnly {
                name: "Rust".to_string(),
            }),
            security_policy_url: None,
            stargazer_count: u64::from(criterion.search_limit),
            watchers: Watchers { total_count: 0 },
            topics: vec![criterion.topic.clone()],
            languages: vec!["Rust".to_string()],
            opened_good_first_issues: 0,
            has_good_first_issues: false,
            opened_help_wanted_issues: 0,
            has_help_wanted_issues: false,
            opened_to_contributions_issues: 0,
            popularity_score: u64::from(criterion.search_limit),
            schema_version: "1.0.0".to_string(),
            generated_at: generated_at.to_string(),
            workflow_run_id: workflow_run_id.to_string(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn serializes_phase_one_compatible_fields() {
        let criterion = SearchCriterion {
            topic: "powerplatform".to_string(),
            search_limit: 42,
        };

        let record = RepositoryRecord::dry_run_from_criterion(
            &criterion,
            "2024-01-01T00:00:00Z",
            "local-test",
        );
        let value = serde_json::to_value(record).expect("record should serialize");

        assert_eq!(value["fullName"], "dry-run/powerplatform-sample");
        assert_eq!(value["owner"]["login"], "dry-run");
        assert_eq!(value["watchers"]["totalCount"], 0);
        assert_eq!(value["_schemaVersion"], "1.0.0");
        assert_eq!(value["_workflowRunId"], "local-test");
    }
}
