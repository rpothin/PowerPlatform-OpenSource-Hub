use chrono::Utc;
use clap::{Parser, Subcommand};
use pipeline_rust::github::{DryRunSource, LiveGithubSource};
use pipeline_rust::pipeline::generate;
use std::path::PathBuf;
use std::process::ExitCode;

#[derive(Debug, Parser)]
#[command(author, version, about)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Debug, Subcommand)]
enum Commands {
    /// Generate repository details JSON from search criteria.
    Generate {
        /// Search criteria JSON path.
        #[arg(long, default_value = "Configuration/GitHubRepositoriesSearchCriteria.json")]
        config: PathBuf,

        /// Output repository details JSON path.
        #[arg(long)]
        output: PathBuf,

        /// Use GitHub API instead of deterministic dry-run fixture records.
        #[arg(long)]
        live: bool,

        /// Optional metrics JSON output path.
        #[arg(long)]
        metrics_output: Option<PathBuf>,
    },
}

fn main() -> ExitCode {
    let cli = Cli::parse();
    match run(cli) {
        Ok(()) => ExitCode::SUCCESS,
        Err(error) => {
            eprintln!("error: {error}");
            ExitCode::from(1)
        }
    }
}

fn run(cli: Cli) -> pipeline_rust::error::PipelineResult<()> {
    match cli.command {
        Commands::Generate {
            config,
            output,
            live,
            metrics_output,
        } => {
            let generated_at = Utc::now().to_rfc3339();
            let workflow_run_id =
                std::env::var("GITHUB_RUN_ID").unwrap_or_else(|_| "local".to_string());

            let metrics = if live {
                let mut source = LiveGithubSource::from_env()?;
                generate(
                    &config,
                    &output,
                    metrics_output.as_deref(),
                    &mut source,
                    &generated_at,
                    &workflow_run_id,
                )?
            } else {
                let mut source = DryRunSource;
                generate(
                    &config,
                    &output,
                    metrics_output.as_deref(),
                    &mut source,
                    &generated_at,
                    &workflow_run_id,
                )?
            };
            eprintln!(
                "{}",
                serde_json::to_string_pretty(&metrics).map_err(|source| {
                    pipeline_rust::error::PipelineError::Json {
                        context: "serializing metrics".to_string(),
                        source,
                    }
                })?
            );
            Ok(())
        }
    }
}

