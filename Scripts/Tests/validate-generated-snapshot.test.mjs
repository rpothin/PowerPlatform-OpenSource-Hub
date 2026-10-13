import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import { assertSnapshotPaths, validateSnapshotArtifacts } from "../validate-generated-snapshot.mjs";

const sourceJson = JSON.stringify([
  { fullName: "owner/one", popularityScore: 30 },
  { fullName: "owner/two", popularityScore: 20 }
]);
const sourceSha256 = createHash("sha256").update(sourceJson, "utf8").digest("hex");
const snapshotJson = JSON.stringify([
  { fullName: "owner/one", popularityScore: 30 },
  { fullName: "owner/two", popularityScore: 20 }
]);
const metadataJson = JSON.stringify({
  _snapshotTakenAt: "2026-10-12T13:00:00.000Z",
  _sourceCommit: "a".repeat(40),
  _sourceSha256: sourceSha256
});
const now = new Date("2026-10-13T13:00:00.000Z");

test("accepts a complete, fresh snapshot with matching provenance", () => {
  const result = validateSnapshotArtifacts({ sourceJson, snapshotJson, metadataJson, now });
  assert.equal(result.repositoryCount, 2);
  assert.equal(result.sourceCommit, "a".repeat(40));
});

test("rejects missing, duplicated, extra, or stale snapshot data", () => {
  const incomplete = JSON.stringify([{ fullName: "owner/one", popularityScore: 30 }]);
  assert.throws(
    () => validateSnapshotArtifacts({ sourceJson, snapshotJson: incomplete, metadataJson, now }),
    /exactly one entry/
  );

  const duplicate = JSON.stringify([
    { fullName: "owner/one", popularityScore: 30 },
    { fullName: "owner/one", popularityScore: 30 }
  ]);
  assert.throws(
    () => validateSnapshotArtifacts({ sourceJson, snapshotJson: duplicate, metadataJson, now }),
    /duplicated/
  );

  const staleMetadata = metadataJson.replace("2026-10-12T13:00:00.000Z", "2026-10-01T13:00:00.000Z");
  assert.throws(
    () => validateSnapshotArtifacts({ sourceJson, snapshotJson, metadataJson: staleMetadata, now }),
    /older than eight days/
  );
});

test("rejects a source hash mismatch and non-descending snapshots", () => {
  const badMetadata = metadataJson.replace(sourceSha256, "0".repeat(64));
  assert.throws(
    () => validateSnapshotArtifacts({ sourceJson, snapshotJson, metadataJson: badMetadata, now }),
    /provenance/
  );

  const unsorted = JSON.stringify([
    { fullName: "owner/two", popularityScore: 20 },
    { fullName: "owner/one", popularityScore: 30 }
  ]);
  assert.throws(
    () => validateSnapshotArtifacts({ sourceJson, snapshotJson: unsorted, metadataJson, now }),
    /descending/
  );
});

test("requires the exact snapshot and provenance paths", () => {
  assert.doesNotThrow(() => assertSnapshotPaths(
    [".\\Data\\snapshot.json", "Data/metadata.json"],
    "Data/snapshot.json",
    "Data/metadata.json"
  ));
  assert.doesNotThrow(() => assertSnapshotPaths(
    ["Data/metadata.json"],
    "Data/snapshot.json",
    "Data/metadata.json"
  ));
  assert.throws(
    () => assertSnapshotPaths(["Data/snapshot.json", "README.md"], "Data/snapshot.json", "Data/metadata.json"),
    /must update metadata/
  );
  assert.throws(
    () => assertSnapshotPaths(["Data/snapshot.json"], "Data/snapshot.json", "Data/metadata.json"),
    /must update metadata/
  );
});
