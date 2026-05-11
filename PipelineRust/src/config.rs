use crate::error::{PipelineError, PipelineResult};
use serde::Deserialize;
use std::fs;
use std::path::Path;

#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
pub struct SearchCriterion {
    pub topic: String,
    #[serde(rename = "searchLimit")]
    pub search_limit: u16,
}

impl SearchCriterion {
    pub fn validate(&self) -> PipelineResult<()> {
        if self.topic.trim().is_empty() {
            return Err(PipelineError::InvalidConfig(
                "topic cannot be empty".to_string(),
            ));
        }

        if self.topic.chars().any(char::is_whitespace) {
            return Err(PipelineError::InvalidConfig(format!(
                "topic '{}' cannot contain whitespace",
                self.topic
            )));
        }

        if !(1..=1000).contains(&self.search_limit) {
            return Err(PipelineError::InvalidConfig(format!(
                "searchLimit for topic '{}' must be between 1 and 1000",
                self.topic
            )));
        }

        Ok(())
    }
}

pub fn load_config(path: &Path) -> PipelineResult<Vec<SearchCriterion>> {
    let content = fs::read_to_string(path).map_err(|source| PipelineError::Io {
        path: path.to_path_buf(),
        source,
    })?;
    load_config_from_str(&content)
}

pub fn load_config_from_str(content: &str) -> PipelineResult<Vec<SearchCriterion>> {
    let criteria: Vec<SearchCriterion> =
        serde_json::from_str(content).map_err(|source| PipelineError::Json {
            context: "reading search criteria".to_string(),
            source,
        })?;

    if criteria.is_empty() {
        return Err(PipelineError::InvalidConfig(
            "at least one search criterion is required".to_string(),
        ));
    }

    for criterion in &criteria {
        criterion.validate()?;
    }

    Ok(criteria)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn loads_valid_search_criteria_shape() {
        let criteria = load_config_from_str(
            r#"[
                { "topic": "powerplatform", "searchLimit": 200 },
                { "topic": "power-apps", "searchLimit": 50 }
            ]"#,
        )
        .expect("valid criteria should load");

        assert_eq!(criteria.len(), 2);
        assert_eq!(criteria[0].topic, "powerplatform");
        assert_eq!(criteria[0].search_limit, 200);
    }

    #[test]
    fn rejects_whitespace_in_topic() {
        let error =
            load_config_from_str(r#"[{ "topic": "power platform", "searchLimit": 10 }]"#)
                .expect_err("topic whitespace should be rejected");

        assert!(error.to_string().contains("cannot contain whitespace"));
    }

    #[test]
    fn rejects_out_of_range_search_limit() {
        let error = load_config_from_str(r#"[{ "topic": "powerplatform", "searchLimit": 0 }]"#)
            .expect_err("zero searchLimit should be rejected");

        assert!(error.to_string().contains("between 1 and 1000"));
    }
}

