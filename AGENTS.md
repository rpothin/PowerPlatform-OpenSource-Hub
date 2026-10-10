# Repository guidance for agents

## Start here

- Read `README.md` for the project overview and the applicable component
  documentation before changing that component.
- Keep each change limited to the requested work surface. The main areas are
  `Pipeline\`, `Scripts\`, `Website\`, `Configuration\`, and `Data\`.
- Follow the repository's existing validation and review practices. Describe
  only checks that were actually run.

## Data ownership

- `Data\GeneratedRepositories\` is pipeline-owned generated data. Do not edit
  it by hand.
- `Data\CuratedRepositories\` contains human-owned overlays. Change an overlay
  only when the task explicitly requests curation, and keep it within the
  rules in `Pipeline\README.md`.
- `Data\GitHubRepositoriesDetails.json` is generated output. Do not edit it
  directly unless the task explicitly requests a reviewed data change.
- Do not invent repository identities or make curation judgments on behalf of
  maintainers.

## Safety boundaries

- Do not read or expose credentials, `.env` files, or private data.
- Do not run live generation, deployment, GitHub write operations, or
  write-capable workflow dispatches unless the user explicitly authorizes the
  exact action.
- Preserve existing CI, security, and review safeguards. Never weaken checks
  or permissions to make a change pass.
- Keep generated changes and human-reviewed curation separate.
