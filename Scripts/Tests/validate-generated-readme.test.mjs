import assert from "node:assert/strict";
import test from "node:test";

import { assertOnlyGeneratedReadmeSectionsChanged } from "../validate-generated-readme.mjs";

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

test("rejects changes outside generated sections", () => {
  const candidate = baseline.replace("Human-authored footer", "Changed footer");
  assert.throws(() => assertOnlyGeneratedReadmeSectionsChanged(baseline, candidate), /outside the generated sections/);
});

test("rejects missing, duplicated, or malformed section markers", () => {
  assert.throws(() => assertOnlyGeneratedReadmeSectionsChanged(baseline, baseline.replace("<!--END_SECTION:summary-->", "")), /exactly one/);
  assert.throws(() => assertOnlyGeneratedReadmeSectionsChanged(baseline, baseline.replace("<!--START_SECTION:summary-->", "<!--START_SECTION:summary--><!--START_SECTION:summary-->")), /exactly one/);
  assert.throws(() => assertOnlyGeneratedReadmeSectionsChanged(baseline, baseline.replace("<!--END_SECTION:summary-->", "").replace("<!--START_SECTION:repositories-opened-to-contribution-->", "")), /exactly one/);
});
