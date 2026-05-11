# TypeScript candidate pipeline

This standalone package is the retained Phase 2 TypeScript + Octokit pipeline for generating `Data/GitHubRepositoriesDetails.json`-shaped records.

## Stack decision

Phase 2 retains TypeScript + Octokit and removes the Rust comparison candidate from the final PR. The TypeScript implementation already provides the production-shaped detail hydration surface, Octokit retry/throttling, schema validation, dry-run/live modes, parity comparison tooling, tests, and manual shadow validation needed for the planned cutover. The Rust candidate was useful for comparison, but its live path remained primarily search-shaped and did not hydrate the full current PowerShell detail surface to the same production-parity level.

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

## Production workflow cutover

The `1-update-github-repositories-details` workflow now runs this TypeScript pipeline by default for scheduled and manual production generation. It writes the configured repository details data path unchanged, validates the existing schema during generation, compares the new output with the previous committed data, blocks suspicious repository-count deltas above 15%, and only dispatches downstream workflows after a data commit. Stable parity differences are reported for review but are not production commit blockers. Manual `workflow_dispatch` runs can select `pipeline: powershell` as a rollback fallback during the stabilization window; the PowerShell scripts remain in place.

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

## Manual validation workflow

The `backend-pipeline-manual-validation` GitHub Actions workflow is manual-only (`workflow_dispatch`) and can be used to run the TypeScript pipeline in dry-run or live mode outside the daily production schedule. By default it runs TypeScript dry-run generation, compares generated artifacts against `Data\GitHubRepositoriesDetails.json` when present, uploads outputs/reports as artifacts, and does not commit generated data. Live TypeScript generation must be explicitly selected in the workflow inputs and uses `GITHUB_TOKEN` only inside the generation step.
