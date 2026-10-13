import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { assertGeneratedReadmeMatches, assertOnlyGeneratedReadmeSectionsChanged } from "./validate-generated-readme.mjs";

const AUTO_BRANCH = "automation/update-readme-with-github-repositories-details";
const MANUAL_BRANCH = "automation/manual-update-readme-with-github-repositories-details";

export function expectedTopGrowingRefresh({ branch, sourceBefore, sourceCommitDate, snapshotChanged }) {
  if (branch === MANUAL_BRANCH) {
    if (sourceBefore !== "workflow_dispatch") {
      throw new Error("Manual README candidates must record workflow_dispatch provenance.");
    }
    return true;
  }
  if (branch !== AUTO_BRANCH) {
    throw new Error(`Unsupported README automation branch '${branch}'.`);
  }
  if (sourceBefore === "workflow_dispatch") {
    throw new Error("The automatic README lane cannot originate from workflow_dispatch.");
  }
  if (!/^(?:[0-9a-f]{40}|0{40})$/i.test(sourceBefore)) {
    throw new Error("Automatic README candidates must record the push's previous commit SHA.");
  }

  const timestamp = Date.parse(sourceCommitDate);
  if (!Number.isFinite(timestamp)) {
    throw new Error("README source commit timestamp is invalid.");
  }
  const isMonday = new Date(timestamp).getUTCDay() === 1;
  return isMonday || sourceBefore === "0".repeat(40) || snapshotChanged;
}

function git(args, options = {}) {
  try {
    return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...options }).trimEnd();
  } catch (error) {
    const stderr = error?.stderr?.toString().trim();
    throw new Error(`git ${args.join(" ")} failed${stderr ? `: ${stderr}` : "."}`);
  }
}

function gitRaw(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (error) {
    const stderr = error?.stderr?.toString().trim();
    throw new Error(`git ${args.join(" ")} failed${stderr ? `: ${stderr}` : "."}`);
  }
}

function gitHasDiff(left, right, paths) {
  const result = spawnSync("git", ["diff", "--quiet", left, right, "--", ...paths], { encoding: "utf8" });
  if (result.status === 0) {
    return false;
  }
  if (result.status === 1) {
    return true;
  }
  throw new Error(`Unable to compare ${left} and ${right}: ${result.stderr?.trim() || "git diff failed"}`);
}

function isAncestor(ancestor, descendant) {
  const result = spawnSync("git", ["merge-base", "--is-ancestor", ancestor, descendant], { encoding: "utf8" });
  if (result.status === 0) {
    return true;
  }
  if (result.status === 1) {
    return false;
  }
  throw new Error(`Unable to verify commit ancestry: ${result.stderr?.trim() || "git merge-base failed"}`);
}

function normalizeGitPath(value) {
  return value.replaceAll("\\", "/").replace(/^\.\//, "");
}

function runValidation({ headSha, baseRef, branch, configurationPath, dataPath, snapshotPath }) {
  const parents = git(["show", "-s", "--format=%P", headSha]).split(/\s+/).filter(Boolean);
  if (parents.length !== 1) {
    throw new Error("README automation commits must have exactly one source parent.");
  }
  const sourceCommit = parents[0];
  const baseCommit = `origin/${baseRef}`;
  if (!isAncestor(sourceCommit, baseCommit)) {
    throw new Error("README source commit is not an ancestor of the current base branch.");
  }

  const changedPaths = git(["diff", "--name-only", `${baseCommit}...${headSha}`]).split(/\r?\n/).filter(Boolean);
  if (changedPaths.length !== 1 || changedPaths[0] !== "README.md") {
    throw new Error("README automation PRs must change exactly README.md.");
  }

  const inputs = ["README.md", normalizeGitPath(configurationPath), normalizeGitPath(dataPath), normalizeGitPath(snapshotPath)];
  if (gitHasDiff(sourceCommit, baseCommit, inputs)) {
    throw new Error("README candidate is stale because a consumed input or its baseline changed after generation.");
  }

  const commitMessage = git(["show", "-s", "--format=%B", headSha]);
  const beforeMatches = [...commitMessage.matchAll(/^README-Source-Before: (.+)$/gm)];
  const refreshMatches = [...commitMessage.matchAll(/^README-Top-Growing-Refreshed: (true|false)$/gm)];
  if (beforeMatches.length !== 1 || refreshMatches.length !== 1) {
    throw new Error("README automation commit is missing unique generation provenance trailers.");
  }
  const sourceBefore = beforeMatches[0][1];
  const sourceCommitDate = git(["show", "-s", "--format=%cI", sourceCommit]);
  let snapshotChanged = false;
  if (branch === AUTO_BRANCH && sourceBefore !== "0".repeat(40)) {
    if (!isAncestor(sourceBefore, sourceCommit)) {
      throw new Error("README previous source commit is not an ancestor of the generated source.");
    }
    snapshotChanged = gitHasDiff(sourceBefore, sourceCommit, [normalizeGitPath(snapshotPath)]);
  }
  const expectedRefresh = expectedTopGrowingRefresh({ branch, sourceBefore, sourceCommitDate, snapshotChanged });
  if ((refreshMatches[0][1] === "true") !== expectedRefresh) {
    throw new Error("README top-growing refresh provenance does not match the weekly/snapshot refresh policy.");
  }

  const candidate = gitRaw(["show", `${headSha}:README.md`]);
  const baseline = gitRaw(["show", `${sourceCommit}:README.md`]);
  const temporaryDirectory = mkdtempSync(path.join(os.tmpdir(), "readme-pr-validation-"));
  try {
    const expectedReadmePath = path.join(temporaryDirectory, "README.md");
    writeFileSync(expectedReadmePath, baseline, "utf8");
    const normalizedConfigurationPath = path.resolve(normalizeGitPath(configurationPath));
    const normalizedDataPath = path.resolve(normalizeGitPath(dataPath));
    const normalizedSnapshotPath = path.resolve(normalizeGitPath(snapshotPath));
    const sourceTimestamp = git(["show", "-s", "--format=%cI", sourceCommit]);
    const args = [
      "-NoProfile",
      "-File",
      path.resolve("Scripts/Generate-Readme.ps1"),
      "-MarkdownFilePath",
      expectedReadmePath,
      "-ConfigurationFilePath",
      normalizedConfigurationPath,
      "-DataFilePath",
      normalizedDataPath,
      "-DataSnapshotFilePath",
      normalizedSnapshotPath,
      "-AsOf",
      sourceTimestamp
    ];
    if (expectedRefresh) {
      args.push("-UpdateTopGrowing");
    }
    const generated = spawnSync("pwsh", args, { encoding: "utf8" });
    if (generated.error || generated.status !== 0) {
      throw new Error(`README deterministic generation failed: ${generated.stderr?.trim() || generated.error?.message || `exit ${generated.status}`}`);
    }
    const expected = readFileSync(expectedReadmePath, "utf8");
    assertOnlyGeneratedReadmeSectionsChanged(baseline, candidate);
    assertGeneratedReadmeMatches(candidate, expected);
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

function runCli() {
  const [, , headSha, baseRef, branch, configurationPath, dataPath, snapshotPath] = process.argv;
  if (!headSha || !baseRef || !branch || !configurationPath || !dataPath || !snapshotPath) {
    throw new Error("Usage: validate-readme-pr.mjs <head-sha> <base-ref> <branch> <configuration> <repository-details> <snapshot>");
  }
  runValidation({ headSha, baseRef, branch, configurationPath, dataPath, snapshotPath });
  process.stdout.write("README PR paths, provenance, freshness, and deterministic rendering are valid.\n");
}

if (process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    runCli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
