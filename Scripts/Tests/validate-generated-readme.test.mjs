import assert from "node:assert/strict";
import test from "node:test";

import { assertGeneratedReadmeMatches, assertOnlyGeneratedReadmeSectionsChanged } from "../validate-generated-readme.mjs";
import { expectedTopGrowingRefresh } from "../validate-readme-pr.mjs";

const baseline = [
  "# Hub",
  "<!--START_SECTION:summary-->",
  "Old summary",
  "<!--END_SECTION:summary-->",
  "<!--START_SECTION:repositories-opened-to-contribution-->",
  "Old repositories",
  "<!--END_SECTION:repositories-opened-to-contribution-->",
  "<!--START_SECTION:top-growing-repositories-->",
  "Old top growing",
  "<!--END_SECTION:top-growing-repositories-->",
  "Human-authored footer"
].join("\n");

test("allows generated-section updates and preserves surrounding content", () => {
  const candidate = baseline
    .replace("Old summary", "New summary")
    .replace("Old repositories", "New repositories")
    .replace("Old top growing", "New top growing");

  assert.doesNotThrow(() => assertOnlyGeneratedReadmeSectionsChanged(baseline, candidate));
});

test("treats Windows and Unix line endings as equivalent", () => {
  const candidate = baseline.replace("Old summary", "New summary").replaceAll("\n", "\r\n");
  assert.doesNotThrow(() => assertOnlyGeneratedReadmeSectionsChanged(baseline, candidate));
});

test("requires a deterministic rendering when expected content is provided", () => {
  assert.doesNotThrow(() => assertGeneratedReadmeMatches(`${baseline}\r\n`, `${baseline}\n`));
  assert.throws(
    () => assertGeneratedReadmeMatches(baseline, baseline.replace("Old summary", "Unexpected summary")),
    /deterministic rendering/
  );
});

test("refreshes the weekly README section only for its scheduled policy inputs", () => {
  const autoBranch = "automation/update-readme-with-github-repositories-details";
  assert.equal(expectedTopGrowingRefresh({
    branch: autoBranch,
    sourceBefore: "a".repeat(40),
    sourceCommitDate: "2026-10-12T11:00:00Z",
    snapshotChanged: false
  }), true);
  assert.equal(expectedTopGrowingRefresh({
    branch: autoBranch,
    sourceBefore: "a".repeat(40),
    sourceCommitDate: "2026-10-13T11:00:00Z",
    snapshotChanged: true
  }), true);
  assert.equal(expectedTopGrowingRefresh({
    branch: autoBranch,
    sourceBefore: "a".repeat(40),
    sourceCommitDate: "2026-10-13T11:00:00Z",
    snapshotChanged: false
  }), false);
  assert.equal(expectedTopGrowingRefresh({
    branch: "automation/manual-update-readme-with-github-repositories-details",
    sourceBefore: "workflow_dispatch",
    sourceCommitDate: "2026-10-13T11:00:00Z",
    snapshotChanged: false
  }), true);
  assert.throws(() => expectedTopGrowingRefresh({
    branch: autoBranch,
    sourceBefore: "workflow_dispatch",
    sourceCommitDate: "2026-10-13T11:00:00Z",
    snapshotChanged: false
  }), /cannot originate/);
});

test("rejects changes outside generated sections", () => {
  const candidate = baseline.replace("Human-authored footer", "Changed footer");
  assert.throws(() => assertOnlyGeneratedReadmeSectionsChanged(baseline, candidate), /outside the generated sections/);
});

test("rejects missing, duplicated, or malformed section markers", () => {
  assert.throws(() => assertOnlyGeneratedReadmeSectionsChanged(baseline, baseline.replace("<!--END_SECTION:summary-->", "")), /exactly one/);
  assert.throws(() => assertOnlyGeneratedReadmeSectionsChanged(baseline, baseline.replace("<!--START_SECTION:summary-->", "<!--START_SECTION:summary--><!--START_SECTION:summary-->")), /exactly one/);
  assert.throws(() => assertOnlyGeneratedReadmeSectionsChanged(baseline, baseline.replace("<!--END_SECTION:summary-->", "").replace("<!--START_SECTION:repositories-opened-to-contribution-->", "")), /exactly one/);
});
