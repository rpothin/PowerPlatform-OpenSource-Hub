use std::fmt::{Display, Formatter};
use std::path::PathBuf;

pub type PipelineResult<T> = Result<T, PipelineError>;

#[derive(Debug)]
pub enum PipelineError {
    Io {
        path: PathBuf,
        source: std::io::Error,
    },
    Json {
        context: String,
        source: serde_json::Error,
    },
    InvalidConfig(String),
    InvalidOutputPath(PathBuf),
    MissingGithubToken,
    HttpStatus {
        status: u16,
        body: String,
    },
    Http(reqwest::Error),
}

impl Display for PipelineError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Io { path, source } => {
                write!(formatter, "I/O error for '{}': {source}", path.display())
            }
            Self::Json { context, source } => {
                write!(formatter, "JSON error while {context}: {source}")
            }
            Self::InvalidConfig(message) => write!(formatter, "invalid configuration: {message}"),
            Self::InvalidOutputPath(path) => {
                write!(
                    formatter,
                    "output path must target a .json file: '{}'",
                    path.display()
                )
            }
            Self::MissingGithubToken => {
                write!(formatter, "live GitHub API calls require GITHUB_TOKEN")
            }
            Self::HttpStatus { status, body } => {
                write!(formatter, "GitHub API returned HTTP {status}: {body}")
            }
            Self::Http(source) => write!(formatter, "HTTP error: {source}"),
        }
    }
}

impl std::error::Error for PipelineError {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        match self {
            Self::Io { source, .. } => Some(source),
            Self::Json { source, .. } => Some(source),
            Self::Http(source) => Some(source),
            _ => None,
        }
    }
}

impl From<reqwest::Error> for PipelineError {
    fn from(source: reqwest::Error) -> Self {
        Self::Http(source)
    }
}
