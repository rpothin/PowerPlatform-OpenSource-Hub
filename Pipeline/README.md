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

## Curated repository overlays

Phase 3 separates machine-generated repository facts from human-owned curation:

- `Data\GitHubRepositoriesDetails.json` remains the generated/merged frontend artifact and may be updated by automation.
- `Data\CuratedRepositories\<owner>\<repository>.json` contains PR-reviewed overlays owned by humans. The daily bot workflow must read existing overlays only; it must not create, rewrite, or stage overlay files.
- Overlay paths use lowercase owner and repository path segments for filesystem stability, for example `Data\CuratedRepositories\microsoft\powerapps-samples.json` for `microsoft/PowerApps-Samples`.

Each overlay is validated with `Configuration\Schemas\GitHubRepositoryOverlay.schema.json`. Required identity fields are `repositoryId` and `fullName`: `repositoryId` is the stable GitHub repository id used for matching, while `fullName` is required readable metadata and should match the current canonical `owner/repo`. Do not invent repository ids; copy them from generated data once present or verify them from GitHub before opening a curation PR. Use `previousFullNames` only for known renames or transfers.

Allowed overlay fields are intentionally small: `previousFullNames`, `exclude`, `curationStatus`, `category`, `focusAreas`, `audiences`, `featured`, `customDescription`, `maintainerNotes`, and `health.curated`. Overlays must not override generated GitHub facts such as stars, releases, issues, topics, license, or URLs.

Taxonomy values live in `Configuration\Taxonomy\RepositoryCategories.json`, `RepositoryFocusAreas.json`, and `RepositoryAudiences.json`. Each entry has a stable `value`, display `label`, and maintenance `description`. Request new taxonomy values in the same PR as the overlays that need them, and keep schema enums, pipeline types, and taxonomy files aligned.

Exclusions are allowed only through reviewed overlays. `exclude: true` should explain the reason in `maintainerNotes`; sentinel repositories from `Configuration\SentinelRepositories.json` must not be excluded unless the sentinel configuration is intentionally changed and reviewed in the same work. Featured status and curated health fields (`maturity`, `maintenance`, `reviewedAt`, `reviewedBy`) are human judgments and should be reviewed by maintainers before setting `curationStatus` to `reviewed`.

Before requesting review for curation changes, run:

```powershell
cd .\Pipeline
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
node dist\cli.js generate --dry-run --output ..\Data\GitHubRepositoriesDetails.json --generated-dir ..\Data\GeneratedRepositories
node dist\cli.js merge --generated-dir ..\Data\GeneratedRepositories --overlay-dir ..\Data\CuratedRepositories --schema ..\Configuration\Schemas\GitHubRepositoriesDetails.schema.json --output ..\Data\GitHubRepositoriesDetails.json --taxonomy-dir ..\Configuration\Taxonomy --sentinels ..\Configuration\SentinelRepositories.json
node dist\cli.js generate --live --concurrency 4 --output .\Output\GitHubRepositoriesDetails.json
```

Schema validation is performed with `ajv`. The array output validates against `GitHubRepositoriesDetails.schema.json`; when `--generated-dir` is provided, each per-repository file is validated against `GitHubRepositoryGenerated.schema.json`, written through a staging directory, and the generated directory is replaced so orphaned repository files are removed. The `merge` command validates generated records and curated overlays, rejects duplicate or unknown overlay identities, blocks sentinel exclusions, checks taxonomy values, applies only the approved curated fields, and writes the same frontend artifact format.

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
