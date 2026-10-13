import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const GENERATED_DIRECTORY = "Data/GeneratedRepositories/";
const MERGED_DATA_FILE = "Data/GitHubRepositoriesDetails.json";
const GENERATED_DATA_BRANCH = "automation/update-github-repositories-details";
const MANUAL_DATA_BRANCH = "automation/manual-update-github-repositories-details";

export function classifyRefreshPullRequest({ eventName, pipeline, allowSuspiciousRepositoryDelta, paths }) {
  const normalizedPaths = normalizePaths(paths);
  const hasOutOfScopePaths = normalizedPaths.some((entry) => !isGeneratedDataPath(entry));
  const eligible =
    eventName === "schedule" &&
    pipeline === "typescript" &&
    allowSuspiciousRepositoryDelta !== true &&
    !hasOutOfScopePaths;

  let reason = "eligible-scheduled-typescript-generated-data";
  if (eventName !== "schedule") {
    reason = "manual-run";
  } else if (pipeline !== "typescript") {
    reason = "non-typescript-pipeline";
  } else if (allowSuspiciousRepositoryDelta === true) {
    reason = "repository-count-guard-overridden";
  } else if (hasOutOfScopePaths) {
    reason = "out-of-scope-paths";
  }

  return {
    eligible,
    branch: eligible ? GENERATED_DATA_BRANCH : MANUAL_DATA_BRANCH,
    reason,
    paths: normalizedPaths
  };
}

export function validateGeneratedDataPaths(paths) {
  const normalizedPaths = normalizePaths(paths);
  const outOfScopePaths = normalizedPaths.filter((entry) => !isGeneratedDataPath(entry));
  if (outOfScopePaths.length > 0) {
    throw new Error(`Generated-data PR contains out-of-scope paths: ${outOfScopePaths.join(", ")}`);
  }
  return normalizedPaths;
}

export function validateRepositoryCountDelta(baselineCount, candidateCount, threshold = 0.15) {
  if (!Number.isInteger(baselineCount) || baselineCount < 0 || !Number.isInteger(candidateCount) || candidateCount < 0) {
    throw new Error("Repository counts must be non-negative integers.");
  }
  if (!Number.isFinite(threshold) || threshold < 0) {
    throw new Error("Repository-count delta threshold must be a non-negative number.");
  }

  const percentDelta = baselineCount === 0
    ? (candidateCount === 0 ? 0 : 1)
    : Math.abs(candidateCount - baselineCount) / baselineCount;
  if (percentDelta > threshold) {
    throw new Error(
      `Repository-count delta ${(percentDelta * 100).toFixed(2)}% exceeds ${(threshold * 100).toFixed(2)}%.`
    );
  }

  return { baselineCount, candidateCount, percentDelta, threshold };
}

function normalizePaths(paths) {
  if (!Array.isArray(paths) || paths.length === 0 || paths.some((entry) => typeof entry !== "string")) {
    throw new Error("Refresh PR paths must be a non-empty array of strings.");
  }
  return paths.map((entry) => entry.replaceAll("\\", "/").replace(/^\.\//, ""));
}

function isGeneratedDataPath(filePath) {
  if (filePath === MERGED_DATA_FILE) {
    return true;
  }

  if (!filePath.startsWith(GENERATED_DIRECTORY)) {
    return false;
  }

  const generatedRelativePath = filePath.slice(GENERATED_DIRECTORY.length);
  return (
    generatedRelativePath.length > 0 &&
    generatedRelativePath.endsWith(".json") &&
    !generatedRelativePath.split("/").some((segment) => segment === "" || segment === "." || segment === "..")
  );
}

function runCli() {
  const [mode, eventName, pipeline, overrideValue = "false"] = process.argv.slice(2);
  if (mode === "validate-paths") {
    const paths = JSON.parse(readFileSync(0, "utf8"));
    process.stdout.write(`${JSON.stringify({ valid: true, paths: validateGeneratedDataPaths(paths) })}\n`);
    return;
  }

  if (mode === "validate-count") {
    const baselineCount = Number(eventName);
    const candidateCount = Number(pipeline);
    const threshold = overrideValue === "false" ? 0.15 : Number(overrideValue);
    process.stdout.write(`${JSON.stringify(validateRepositoryCountDelta(baselineCount, candidateCount, threshold))}\n`);
    return;
  }

  const refreshEventName = mode;
  const refreshPipeline = eventName;
  const refreshOverrideValue = pipeline ?? "false";
  if (!refreshEventName || !refreshPipeline) {
    throw new Error("Usage: refresh-pr-policy.mjs <event-name> <pipeline> <override-true-or-false>");
  }

  const paths = JSON.parse(readFileSync(0, "utf8"));
  const result = classifyRefreshPullRequest({
    eventName: refreshEventName,
    pipeline: refreshPipeline,
    allowSuspiciousRepositoryDelta: refreshOverrideValue.toLowerCase() === "true",
    paths
  });

  process.stdout.write(`${JSON.stringify(result)}\n`);
}

if (process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    runCli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
