use crate::config::{load_config, SearchCriterion};
use crate::error::{PipelineError, PipelineResult};
use crate::github::RepositorySource;
use crate::metrics::{MetricsTimer, PipelineMetrics};
use std::fs;
use std::path::Path;

pub fn generate(
    config_path: &Path,
    output_path: &Path,
    metrics_output_path: Option<&Path>,
    source: &mut dyn RepositorySource,
    generated_at: &str,
    workflow_run_id: &str,
) -> PipelineResult<PipelineMetrics> {
    validate_json_output_path(output_path)?;
    if let Some(path) = metrics_output_path {
        validate_json_output_path(path)?;
    }

    let criteria = load_config(config_path)?;
    generate_from_criteria(
        &criteria,
        output_path,
        metrics_output_path,
        source,
        generated_at,
        workflow_run_id,
    )
}

pub fn generate_from_criteria(
    criteria: &[SearchCriterion],
    output_path: &Path,
    metrics_output_path: Option<&Path>,
    source: &mut dyn RepositorySource,
    generated_at: &str,
    workflow_run_id: &str,
) -> PipelineResult<PipelineMetrics> {
    validate_json_output_path(output_path)?;

    let requested_limit = criteria
        .iter()
        .map(|criterion| u64::from(criterion.search_limit))
        .sum();
    let mut metrics = PipelineMetrics::new(source.mode(), criteria.len(), requested_limit);
    let timer = MetricsTimer::start();

    let mut records = source.fetch(criteria, generated_at, workflow_run_id, &mut metrics)?;
    records.sort_by(|left, right| {
        right
            .stargazer_count
            .cmp(&left.stargazer_count)
            .then_with(|| left.full_name.cmp(&right.full_name))
    });

    metrics.records_written = records.len();
    metrics.duration_ms = timer.elapsed_ms();

    write_json(output_path, &records)?;

    if let Some(path) = metrics_output_path {
        validate_json_output_path(path)?;
        write_json(path, &metrics)?;
    }

    Ok(metrics)
}

fn validate_json_output_path(path: &Path) -> PipelineResult<()> {
    if path.extension().and_then(|extension| extension.to_str()) != Some("json") {
        return Err(PipelineError::InvalidOutputPath(path.to_path_buf()));
    }

    Ok(())
}

fn write_json<T: serde::Serialize>(path: &Path, value: &T) -> PipelineResult<()> {
    if let Some(parent) = path
        .parent()
        .filter(|parent| !parent.as_os_str().is_empty())
    {
        fs::create_dir_all(parent).map_err(|source| PipelineError::Io {
            path: parent.to_path_buf(),
            source,
        })?;
    }

    let json = serde_json::to_string_pretty(value).map_err(|source| PipelineError::Json {
        context: format!("serializing '{}'", path.display()),
        source,
    })?;

    fs::write(path, format!("{json}\n")).map_err(|source| PipelineError::Io {
        path: path.to_path_buf(),
        source,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::github::DryRunSource;
    use serde_json::Value;
    use std::path::PathBuf;

    #[test]
    fn dry_run_generation_writes_records_and_metrics() {
        let criteria = vec![
            SearchCriterion {
                topic: "powerplatform".to_string(),
                search_limit: 20,
            },
            SearchCriterion {
                topic: "dataverse".to_string(),
                search_limit: 10,
            },
        ];
        let output_path = test_output_path("dry-run-records.json");
        let metrics_path = test_output_path("dry-run-metrics.json");
        let mut source = DryRunSource;

        let metrics = generate_from_criteria(
            &criteria,
            &output_path,
            Some(&metrics_path),
            &mut source,
            "2024-01-01T00:00:00Z",
            "unit-test",
        )
        .expect("dry-run generation should succeed");

        assert_eq!(metrics.records_written, 2);

        let records: Value = serde_json::from_str(
            &fs::read_to_string(output_path).expect("record output should be readable"),
        )
        .expect("record output should be valid JSON");
        assert_eq!(
            records
                .as_array()
                .expect("records should be an array")
                .len(),
            2
        );
        assert_eq!(records[0]["_workflowRunId"], "unit-test");

        let metrics_json: Value = serde_json::from_str(
            &fs::read_to_string(metrics_path).expect("metrics output should be readable"),
        )
        .expect("metrics output should be valid JSON");
        assert_eq!(metrics_json["mode"], "dry-run");
        assert_eq!(metrics_json["requestedLimit"], 30);
    }

    #[test]
    fn rejects_non_json_output_path() {
        let criteria = vec![SearchCriterion {
            topic: "powerplatform".to_string(),
            search_limit: 20,
        }];
        let mut source = DryRunSource;
        let error = generate_from_criteria(
            &criteria,
            &test_output_path("not-json.txt"),
            None,
            &mut source,
            "2024-01-01T00:00:00Z",
            "unit-test",
        )
        .expect_err("non-json output should be rejected");

        assert!(matches!(error, PipelineError::InvalidOutputPath(_)));
    }

    fn test_output_path(name: &str) -> PathBuf {
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("target")
            .join("test-output")
            .join(format!("{}-{name}", std::process::id()))
    }
}
