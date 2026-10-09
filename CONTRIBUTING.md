# Contributing

Choose the component that owns the behavior you are changing, read its
documentation, and keep the pull request focused. Do not include generated
data, curation judgments, workflow changes, or unrelated cleanup in a code
change.

## Local validation

Run the checks relevant to the changed component:

| Component | Commands |
| --- | --- |
| Pipeline | `cd .\Pipeline`; `npm ci`; `npm run typecheck`; `npm test` |
| Website | `cd .\Website`; `npm ci`; `npm run typecheck`; `npm run test:unit`; `npm run build` |
| PowerShell scripts | From the repository root, run `Invoke-Pester -CI` |

The Website commands follow the repository's npm lockfile and CI workflow;
`Website\README.md` currently documents Yarn. Do not use website deployment
commands as a local validation step. The browser suite is not included in the
validated command list; do not report it as passing unless it was run.

## Repository data

- Do not edit `Data\GeneratedRepositories\` by hand.
- `Data\CuratedRepositories\` is human-reviewed. Read the overlay authoring
  guidance in `Pipeline\README.md` before changing it.
- Do not invent repository IDs. Confirm identity against generated data or an
  authoritative source.
- `maintainerNotes` becomes public repository content; do not put private or
  confidential information in it.

## Pull requests

Describe the purpose and scope of the change, the affected component, and the
validation performed. If a check was not run, say so and explain why. Call out
curated data or user-visible changes so maintainers can review them. Never
include credentials, private data, or unredacted sensitive logs.
