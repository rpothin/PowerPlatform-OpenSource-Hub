use serde::Serialize;
use std::time::Instant;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PipelineMetrics {
    pub mode: String,
    pub criteria_count: usize,
    pub requested_limit: u64,
    pub records_written: usize,
    pub duration_ms: u128,
    pub retries: u32,
    pub rate_limit_remaining: Option<String>,
    pub rate_limit_reset: Option<String>,
    pub observations: Vec<String>,
}

impl PipelineMetrics {
    pub fn new(mode: impl Into<String>, criteria_count: usize, requested_limit: u64) -> Self {
        Self {
            mode: mode.into(),
            criteria_count,
            requested_limit,
            records_written: 0,
            duration_ms: 0,
            retries: 0,
            rate_limit_remaining: None,
            rate_limit_reset: None,
            observations: Vec::new(),
        }
    }
}

pub struct MetricsTimer {
    started_at: Instant,
}

impl MetricsTimer {
    pub fn start() -> Self {
        Self {
            started_at: Instant::now(),
        }
    }

    pub fn elapsed_ms(&self) -> u128 {
        self.started_at.elapsed().as_millis()
    }
}
