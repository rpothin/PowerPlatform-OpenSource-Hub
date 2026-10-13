import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const snapshotWorkflow = readFileSync(path.join(repositoryRoot, ".github", "workflows", "snapshot-github-repositories-popularity-score.yml"), "utf8");
const dataWorkflow = readFileSync(path.join(repositoryRoot, ".github", "workflows", "update-github-repositories-details.yml"), "utf8");
const readmeWorkflow = readFileSync(path.join(repositoryRoot, ".github", "workflows", "update-readme-with-github-repositories-details.yml"), "utf8");
const validationWorkflow = readFileSync(path.join(repositoryRoot, ".github", "workflows", "validate-generated-data.yml"), "utf8");

test("snapshot writer only runs after a successful snapshot produced both outputs", () => {
  assert.match(snapshotWorkflow, /schedule:\s*\n\s+- cron: "0 13 \* \* 1"/);
  assert.doesNotMatch(snapshotWorkflow, /workflow_run:/);
  assert.match(snapshotWorkflow, /id: take_snapshot[\s\S]*?snapshot_ready=true/);
  assert.match(snapshotWorkflow, /if: \$\{\{ steps\.take_snapshot\.outputs\.snapshot_ready == 'true' \}\}/);
  assert.match(snapshotWorkflow, /Test-Path -LiteralPath \$outputPath/);
  assert.doesNotMatch(snapshotWorkflow, /gh pr merge .*--auto/);
});

test("daily data refresh has separate stable branches for eligible and manual candidates", () => {
  assert.match(dataWorkflow, /node Scripts\/refresh-pr-policy\.mjs/);
  assert.match(dataWorkflow, /if \(\$isEligibleForAutoMerge -and \$env:AUTOMATION_AUTO_MERGE_ENABLED -eq "true"\)/);
  assert.match(dataWorkflow, /gh pr merge \$prNumber --auto --merge/);
  assert.match(dataWorkflow, /automation\/manual-update-github-repositories-details/);
  assert.doesNotMatch(dataWorkflow, /An automated repository-details pull request is already open; skipping/);
});

test("scheduled refresh PR validation rechecks paths and repository-count delta", () => {
  assert.match(validationWorkflow, /github\.head_ref == 'automation\/update-github-repositories-details'/);
  assert.match(validationWorkflow, /Validate scheduled refresh path allowlist[\s\S]*?PULL_REQUEST_HEAD_SHA: \$\{\{ github\.event\.pull_request\.head\.sha \}\}[\s\S]*?refresh-pr-policy\.mjs validate-paths/);
  assert.match(validationWorkflow, /Recheck scheduled refresh repository-count delta[\s\S]*?PULL_REQUEST_HEAD_SHA: \$\{\{ github\.event\.pull_request\.head\.sha \}\}[\s\S]*?git merge-base[\s\S]*?refresh-pr-policy\.mjs validate-count/);
});

test("README refresh is input-scoped, marker-guarded, and updates a stable PR", () => {
  assert.doesNotMatch(readmeWorkflow, /'Data\/\*\*'/);
  assert.match(readmeWorkflow, /node Scripts\/validate-generated-readme\.mjs/);
  assert.match(readmeWorkflow, /automation\/update-readme-with-github-repositories-details"/);
  assert.doesNotMatch(readmeWorkflow, /An automated README pull request is already open; skipping/);
  assert.doesNotMatch(readmeWorkflow, /AUTOMATION_AUTO_MERGE_ENABLED|gh pr merge .*--auto/);
});
