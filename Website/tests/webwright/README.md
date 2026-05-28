# Webwright generated tests pilot

This folder contains the first experimental Webwright-style generated test artifact for the website.

The pilot follows the recommendation from the Webwright research review: keep the existing deterministic validations as the primary quality gates, and run reviewed generated Playwright scripts in parallel as an exploratory acceptance signal. The CI workflow re-runs committed generated scripts without any LLM or API key.

## Pilot scenarios

The initial generated script covers high-value user journeys for the Power Platform Open-Source Hub:

- landing page renders the key insights and navigates to the gallery;
- gallery renders repository cards and a repository count;
- search filters repositories and updates URL state;
- clearing filters restores the original gallery state;
- topic badge filtering updates URL state and narrows results;
- repository detail dialog opens and exposes repository metadata.

## Local execution

From `Website`:

```bash
npm run build
python -m pip install -r tests/webwright/requirements.txt
python -m playwright install chromium
npm run test:webwright
```

The runner starts `npm run serve`, executes every script in `tests/webwright/generated`, and writes screenshots plus `report.json` under `tests/webwright/artifacts`.

## Regeneration model

Use Webwright to explore a scenario and produce a `final_script.py`, then review and commit the hardened generated script here. CI should only execute committed scripts so that pull-request validation remains deterministic and does not require model credentials.
