# PipelineRust

Isolated Rust comparison candidate for generating repository details from
`Configuration\GitHubRepositoriesSearchCriteria.json`.

## Commands

From this folder:

```powershell
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test
```

Dry-run generation does not call GitHub and writes production-shaped records:

```powershell
cargo run -- generate --config ..\Configuration\GitHubRepositoriesSearchCriteria.json --output .\target\dry-run-repositories.json
```

Live generation requires `GITHUB_TOKEN`:

```powershell
$env:GITHUB_TOKEN = "<token>"
cargo run -- generate --config ..\Configuration\GitHubRepositoriesSearchCriteria.json --output .\target\repositories.json --live --metrics-output .\target\metrics.json
```

The candidate emits normalized repository records close to the Phase 1 schema
and prints metrics for record counts, duration, retry count, and rate-limit
observations. Tests use deterministic fixtures and do not perform network calls.

