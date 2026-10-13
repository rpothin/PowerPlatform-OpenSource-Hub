import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MAX_SNAPSHOT_AGE_MS = 8 * 24 * 60 * 60 * 1000;
const FUTURE_TOLERANCE_MS = 5 * 60 * 1000;

export function assertSnapshotPaths(changedPaths, snapshotPath, metadataPath) {
  if (!Array.isArray(changedPaths) || changedPaths.some((entry) => typeof entry !== "string")) {
    throw new Error("Snapshot PR paths must be an array of strings.");
  }

  const normalize = (value) => value.replaceAll("\\", "/").replace(/^\.\//, "");
  const expected = [normalize(snapshotPath), normalize(metadataPath)].sort();
  const actual = changedPaths.map(normalize).sort();
  if (
    actual.length === 0 ||
    actual.length > expected.length ||
    !actual.includes(normalize(metadataPath)) ||
    actual.some((value) => !expected.includes(value)) ||
    new Set(actual).size !== actual.length
  ) {
    throw new Error(`Snapshot PR may change only these files and must update metadata: ${expected.join(", ")}.`);
  }
}

export function validateSnapshotArtifacts({
  sourceJson,
  snapshotJson,
  metadataJson,
  now = new Date(),
  maxAgeMs = MAX_SNAPSHOT_AGE_MS
}) {
  const source = parseJson(sourceJson, "source repository details");
  const snapshot = parseJson(snapshotJson, "popularity snapshot");
  const metadata = parseJson(metadataJson, "snapshot metadata");

  if (!Array.isArray(source) || source.length === 0) {
    throw new Error("Source repository details must be a non-empty JSON array.");
  }
  if (!Array.isArray(snapshot) || snapshot.length !== source.length) {
    throw new Error("Popularity snapshot must contain exactly one entry per source repository.");
  }
  if (!isObject(metadata)) {
    throw new Error("Snapshot metadata must be a JSON object.");
  }

  const sourceByName = new Map();
  for (const repository of source) {
    if (!isObject(repository) || typeof repository.fullName !== "string" || repository.fullName.length === 0) {
      throw new Error("Every source repository must have a non-empty fullName.");
    }
    if (!Number.isSafeInteger(repository.popularityScore) || repository.popularityScore < 0) {
      throw new Error(`Source popularityScore is invalid for '${repository.fullName}'.`);
    }
    if (sourceByName.has(repository.fullName)) {
      throw new Error(`Source repository '${repository.fullName}' is duplicated.`);
    }
    sourceByName.set(repository.fullName, repository.popularityScore);
  }

  const seenNames = new Set();
  let previousScore = Number.POSITIVE_INFINITY;
  for (const entry of snapshot) {
    if (!isObject(entry) || Object.keys(entry).sort().join(",") !== "fullName,popularityScore") {
      throw new Error("Each snapshot entry must contain only fullName and popularityScore.");
    }
    if (typeof entry.fullName !== "string" || entry.fullName.length === 0) {
      throw new Error("Every snapshot entry must have a non-empty fullName.");
    }
    if (!Number.isSafeInteger(entry.popularityScore) || entry.popularityScore < 0) {
      throw new Error(`Snapshot popularityScore is invalid for '${entry.fullName}'.`);
    }
    if (seenNames.has(entry.fullName)) {
      throw new Error(`Snapshot repository '${entry.fullName}' is duplicated.`);
    }
    if (!sourceByName.has(entry.fullName) || sourceByName.get(entry.fullName) !== entry.popularityScore) {
      throw new Error(`Snapshot entry does not match source repository '${entry.fullName}'.`);
    }
    if (entry.popularityScore > previousScore) {
      throw new Error("Popularity snapshot entries must be sorted by descending popularityScore.");
    }
    seenNames.add(entry.fullName);
    previousScore = entry.popularityScore;
  }

  if (seenNames.size !== sourceByName.size) {
    throw new Error("Popularity snapshot is incomplete.");
  }

  if (typeof metadata._snapshotTakenAt !== "string" || !/(?:Z|[+-]\d{2}:\d{2})$/i.test(metadata._snapshotTakenAt)) {
    throw new Error("Snapshot metadata must contain a timezone-aware _snapshotTakenAt timestamp.");
  }
  const snapshotTime = Date.parse(metadata._snapshotTakenAt);
  if (!Number.isFinite(snapshotTime)) {
    throw new Error("Snapshot metadata contains an invalid _snapshotTakenAt timestamp.");
  }
  if (snapshotTime > now.getTime() + FUTURE_TOLERANCE_MS) {
    throw new Error("Snapshot timestamp is in the future.");
  }
  if (now.getTime() - snapshotTime > maxAgeMs) {
    throw new Error("Popularity snapshot is older than eight days.");
  }
  if (typeof metadata._sourceCommit !== "string" || !/^[0-9a-f]{40}$/i.test(metadata._sourceCommit)) {
    throw new Error("Snapshot metadata must contain a valid _sourceCommit SHA.");
  }
  if (typeof metadata._sourceSha256 !== "string" || !/^[0-9a-f]{64}$/i.test(metadata._sourceSha256)) {
    throw new Error("Snapshot metadata must contain a valid _sourceSha256 digest.");
  }

  const normalizedSourceJson = normalizeLineEndings(sourceJson);
  const sourceSha256 = createHash("sha256").update(normalizedSourceJson, "utf8").digest("hex");
  if (sourceSha256 !== metadata._sourceSha256.toLowerCase()) {
    throw new Error("Snapshot provenance does not match the source repository-details artifact.");
  }

  return {
    repositoryCount: source.length,
    sourceCommit: metadata._sourceCommit.toLowerCase(),
    sourceSha256
  };
}

function parseJson(value, label) {
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeLineEndings(value) {
  return value.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
}

async function runCli() {
  const [, , ...args] = process.argv;
  if (args[0] === "--validate-paths") {
    const [, snapshotPath, metadataPath] = args;
    if (!snapshotPath || !metadataPath) {
      throw new Error("Usage: validate-generated-snapshot.mjs --validate-paths <snapshot-path> <metadata-path>");
    }
    const paths = (await readStdin()).split(/\r?\n/).filter(Boolean);
    assertSnapshotPaths(paths, snapshotPath, metadataPath);
    process.stdout.write("Snapshot PR paths are limited to the data and metadata artifacts.\n");
    return;
  }

  function readStdin() {
    return new Promise((resolve, reject) => {
      let input = "";
      process.stdin.setEncoding("utf8");
      process.stdin.on("data", (chunk) => {
        input += chunk;
      });
      process.stdin.on("end", () => resolve(input));
      process.stdin.on("error", reject);
    });
  }

  const [sourcePath, snapshotPath, metadataPath] = args;
  if (!sourcePath || !snapshotPath || !metadataPath) {
    throw new Error("Usage: validate-generated-snapshot.mjs <source-details> <snapshot> <metadata>");
  }
  const [sourceJson, snapshotJson, metadataJson] = await Promise.all([
    readFile(sourcePath, "utf8"),
    readFile(snapshotPath, "utf8"),
    readFile(metadataPath, "utf8")
  ]);
  const result = validateSnapshotArtifacts({ sourceJson, snapshotJson, metadataJson });
  process.stdout.write(`Validated a complete snapshot of ${result.repositoryCount} repositories from ${result.sourceCommit}.\n`);
}

if (process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCli().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
