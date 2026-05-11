# TypeScript candidate pipeline

This standalone package is the Phase 2 TypeScript + Octokit candidate for generating `Data/GitHubRepositoriesDetails.json`-shaped records. It is intentionally isolated from the existing PowerShell pipeline and from `PipelineRust/`.

## Setup and validation

```powershell
cd .\Pipeline
npm ci
npm run typecheck
npm test
```

## Dry-run generation (no network)

```powershell
cd .\Pipeline
npm run dry-run
```

The dry-run loads `..\Configuration\GitHubRepositoriesSearchCriteria.json`, uses deterministic in-memory repository fixtures, validates the output with `..\Configuration\Schemas\GitHubRepositoriesDetails.schema.json`, writes `Output\GitHubRepositoriesDetails.json`, and writes `Output\metrics.json`.

## Optional live mode

Live mode uses Octokit REST APIs with retry and throttling plugins. It requires `GITHUB_TOKEN` and uses bounded concurrency for repository detail hydration.

```powershell
cd .\Pipeline
$env:GITHUB_TOKEN = "<token>"
npm run generate:live
```

Useful direct CLI options:

```powershell
node dist\cli.js generate --dry-run --output .\Output\GitHubRepositoriesDetails.json --metrics .\Output\metrics.json
node dist\cli.js generate --live --concurrency 4 --output .\Output\GitHubRepositoriesDetails.json
```

Schema validation is performed with `ajv` against the repository's existing JSON Schema so the candidate remains focused on the Phase 1 record shape.

## Output parity comparison (no network)

The comparison command checks a baseline output against a candidate output by `fullName`, applies the sentinel repository guardrail from `..\Configuration\SentinelRepositories.json`, and writes a JSON report plus a markdown-ish console summary.

```powershell
cd .\Pipeline
npm run compare:fixtures
```

`compare:fixtures` uses deterministic local fixtures and is intended as a quick CLI smoke test.

Direct usage against a generated candidate:

```powershell
node dist\cli.js compare `
  --baseline ..\Data\GitHubRepositoriesDetails.json `
  --candidate .\Output\GitHubRepositoriesDetails.json `
  --sentinels ..\Configuration\SentinelRepositories.json `
  --report .\Output\parity-report.json
```

The initial repository-count delta threshold is 15% and can be adjusted with `--count-delta-threshold 0.15`. Missing or extra repositories, missing sentinels, invalid/non-array JSON inputs, duplicate `fullName` values, threshold breaches, and stable field differences fail the comparison. Volatile fields such as stars, watchers, open issue counts, release timestamps, and provenance timestamps are reported separately; `_workflowRunId` is treated as ignored/report-only.
