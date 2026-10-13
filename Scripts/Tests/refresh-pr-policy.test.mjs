import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyRefreshPullRequest,
  validateGeneratedDataPaths,
  validateRepositoryCountDelta
} from "../refresh-pr-policy.mjs";

test("only scheduled TypeScript runs with the generated-data allowlist are eligible", () => {
  const result = classifyRefreshPullRequest({
    eventName: "schedule",
    pipeline: "typescript",
    allowSuspiciousRepositoryDelta: false,
    paths: [
      "Data/GeneratedRepositories/microsoft/powerapps-samples.json",
      "Data/GitHubRepositoriesDetails.json"
    ]
  });

  assert.equal(result.eligible, true);
  assert.equal(result.branch, "automation/update-github-repositories-details");
});

test("manual, fallback, override, empty, and mixed-path candidates stay in the manual lane", () => {
  const cases = [
    { eventName: "workflow_dispatch", pipeline: "typescript", allowSuspiciousRepositoryDelta: false, paths: ["Data/GitHubRepositoriesDetails.json"] },
    { eventName: "schedule", pipeline: "powershell", allowSuspiciousRepositoryDelta: false, paths: ["Data/GitHubRepositoriesDetails.json"] },
    { eventName: "schedule", pipeline: "typescript", allowSuspiciousRepositoryDelta: true, paths: ["Data/GitHubRepositoriesDetails.json"] },
    { eventName: "schedule", pipeline: "typescript", allowSuspiciousRepositoryDelta: false, paths: ["Data/GeneratedRepositories/owner/repo.json", "Data/CuratedRepositories/owner/repo.json"] }
  ];

  for (const candidate of cases) {
    const result = classifyRefreshPullRequest(candidate);
    assert.equal(result.eligible, false);
    assert.equal(result.branch, "automation/manual-update-github-repositories-details");
  }

  assert.throws(
    () => classifyRefreshPullRequest({ eventName: "schedule", pipeline: "typescript", allowSuspiciousRepositoryDelta: false, paths: [] }),
    /non-empty array/
  );
});

test("generated paths must be JSON records under the generated directory", () => {
  for (const path of [
    "Data/GeneratedRepositories/README.md",
    "Data/GeneratedRepositories/../CuratedRepositories/repo.json",
    "data/GeneratedRepositories/owner/repo.json",
    "Data/GitHubRepositoriesDetails.json/extra"
  ]) {
    const result = classifyRefreshPullRequest({
      eventName: "schedule",
      pipeline: "typescript",
      allowSuspiciousRepositoryDelta: false,
      paths: [path]
    });
    assert.equal(result.eligible, false, path);
  }
});

test("scheduled generated-data paths can be validated independently at PR time", () => {
  assert.deepEqual(
    validateGeneratedDataPaths([
      "Data/GeneratedRepositories/microsoft/powerapps-samples.json",
      "Data/GitHubRepositoriesDetails.json"
    ]),
    [
      "Data/GeneratedRepositories/microsoft/powerapps-samples.json",
      "Data/GitHubRepositoriesDetails.json"
    ]
  );
  assert.throws(
    () => validateGeneratedDataPaths(["Data/GeneratedRepositories/owner/repo.json", "README.md"]),
    /out-of-scope paths/
  );
});

test("scheduled generated-data PRs must remain within the production 15% count threshold", () => {
  assert.equal(validateRepositoryCountDelta(20, 23).percentDelta, 0.15);
  assert.throws(() => validateRepositoryCountDelta(20, 24), /exceeds 15\.00%/);
  assert.throws(() => validateRepositoryCountDelta(0, 1), /exceeds 15\.00%/);
  assert.throws(() => validateRepositoryCountDelta(-1, 0), /non-negative integers/);
});
