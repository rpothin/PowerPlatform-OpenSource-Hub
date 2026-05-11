import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const DEFAULT_REPOSITORY_COUNT_DELTA_THRESHOLD = 0.15;

const MAX_REPORTED_DIFFERENCES = 500;
const VOLATILE_FIELD_PATHS = new Set([
  "_generatedAt",
  "forkCount",
  "hasGoodFirstIssues",
  "hasHelpWantedIssues",
  "latestRelease",
  "openIssuesCount",
  "openedGoodFirstIssues",
  "openedHelpWantedIssues",
  "openedToContributionsIssues",
  "popularityScore",
  "stargazerCount",
  "updatedAt",
  "watchers.totalCount"
]);
const IGNORED_FIELD_PATHS = new Set(["_workflowRunId"]);

type InputLabel = "baseline" | "candidate" | "sentinels";
type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
type ReportValue = JsonValue | { missing: true };

type RepositoryOutputRecord = Record<string, unknown> & { fullName: string };

export type DifferenceClassification = "stable" | "volatile" | "ignored";

export interface CompareOptions {
  baselinePath: string;
  candidatePath: string;
  sentinelsPath: string;
  reportPath?: string;
  repositoryCountDeltaThreshold?: number;
  generatedAt?: string;
}

export interface InputFailure {
  input: InputLabel;
  path: string;
  reason: string;
}

export interface DuplicateFullNameFailure {
  input: "baseline" | "candidate";
  fullName: string;
  indexes: number[];
}

export interface RepositoryCountDelta {
  baselineCount: number;
  candidateCount: number;
  absoluteDelta: number;
  percentDelta: number;
  threshold: number;
  exceeded: boolean;
}

export interface MissingSentinels {
  baseline: string[];
  candidate: string[];
}

export interface FieldDifference {
  fullName: string;
  path: string;
  baseline: ReportValue;
  candidate: ReportValue;
  classification: DifferenceClassification;
}

export interface DifferenceSection {
  total: number;
  truncated: boolean;
  omitted: number;
  items: FieldDifference[];
}

export interface ComparisonFailures {
  invalidInputs: InputFailure[];
  duplicateFullNames: DuplicateFullNameFailure[];
  missingRepositories: string[];
  extraRepositories: string[];
  missingSentinels: MissingSentinels;
  repositoryCountDelta?: RepositoryCountDelta;
}

export interface ComparisonReport {
  schemaVersion: "1.0.0";
  generatedAt: string;
  status: "passed" | "failed";
  inputs: {
    baselinePath: string;
    candidatePath: string;
    sentinelsPath: string;
    repositoryCountDeltaThreshold: number;
  };
  summary: {
    baselineCount: number;
    candidateCount: number;
    sentinelCount: number;
    failureCount: number;
    missingRepositories: number;
    extraRepositories: number;
    missingSentinels: number;
    stableDifferences: number;
    volatileDifferences: number;
    ignoredDifferences: number;
    repositoryCountDeltaPercent: number;
  };
  failures: ComparisonFailures;
  differences: {
    stable: DifferenceSection;
    volatile: DifferenceSection;
    ignored: DifferenceSection;
  };
}

interface RepositoryLoadResult {
  records: RepositoryOutputRecord[];
  failures: InputFailure[];
  duplicateFullNames: DuplicateFullNameFailure[];
}

interface SentinelLoadResult {
  fullNames: string[];
  failures: InputFailure[];
}

export async function compareRepositoryOutputs(options: CompareOptions): Promise<ComparisonReport> {
  const threshold = options.repositoryCountDeltaThreshold ?? DEFAULT_REPOSITORY_COUNT_DELTA_THRESHOLD;
  if (!Number.isFinite(threshold) || threshold < 0) {
    throw new Error("repositoryCountDeltaThreshold must be a non-negative number.");
  }

  const [baseline, candidate, sentinels] = await Promise.all([
    loadRepositoryOutput(options.baselinePath, "baseline"),
    loadRepositoryOutput(options.candidatePath, "candidate"),
    loadSentinelRepositories(options.sentinelsPath)
  ]);

  const invalidInputs = [...baseline.failures, ...candidate.failures, ...sentinels.failures];
  const repositoryInputFailures = [...baseline.failures, ...candidate.failures];
  const duplicateFullNames = [...baseline.duplicateFullNames, ...candidate.duplicateFullNames];
  const failures: ComparisonFailures = {
    invalidInputs,
    duplicateFullNames,
    missingRepositories: [],
    extraRepositories: [],
    missingSentinels: { baseline: [], candidate: [] }
  };
  const countDelta = buildRepositoryCountDelta(baseline.records.length, candidate.records.length, threshold);
  let stableDifferences: FieldDifference[] = [];
  let volatileDifferences: FieldDifference[] = [];
  let ignoredDifferences: FieldDifference[] = [];

  if (countDelta.exceeded) {
    failures.repositoryCountDelta = countDelta;
  }

  if (repositoryInputFailures.length === 0 && duplicateFullNames.length === 0) {
    const baselineByFullName = indexByFullName(baseline.records);
    const candidateByFullName = indexByFullName(candidate.records);
    failures.missingRepositories = sortedDifference(baselineByFullName, candidateByFullName);
    failures.extraRepositories = sortedDifference(candidateByFullName, baselineByFullName);

    if (sentinels.failures.length === 0) {
      failures.missingSentinels = {
        baseline: sentinels.fullNames.filter((fullName) => !baselineByFullName.has(fullName)),
        candidate: sentinels.fullNames.filter((fullName) => !candidateByFullName.has(fullName))
      };
    }

    const commonFullNames = [...baselineByFullName.keys()]
      .filter((fullName) => candidateByFullName.has(fullName))
      .sort((left, right) => left.localeCompare(right));

    const differences: FieldDifference[] = [];
    for (const fullName of commonFullNames) {
      collectFieldDifferences(fullName, baselineByFullName.get(fullName), candidateByFullName.get(fullName), [], differences);
    }

    stableDifferences = differences.filter((difference) => difference.classification === "stable");
    volatileDifferences = differences.filter((difference) => difference.classification === "volatile");
    ignoredDifferences = differences.filter((difference) => difference.classification === "ignored");
  }

  const missingSentinelCount = failures.missingSentinels.baseline.length + failures.missingSentinels.candidate.length;
  const failureCount =
    invalidInputs.length +
    duplicateFullNames.length +
    failures.missingRepositories.length +
    failures.extraRepositories.length +
    missingSentinelCount +
    stableDifferences.length +
    (countDelta.exceeded ? 1 : 0);

  return {
    schemaVersion: "1.0.0",
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    status: failureCount === 0 ? "passed" : "failed",
    inputs: {
      baselinePath: options.baselinePath,
      candidatePath: options.candidatePath,
      sentinelsPath: options.sentinelsPath,
      repositoryCountDeltaThreshold: threshold
    },
    summary: {
      baselineCount: baseline.records.length,
      candidateCount: candidate.records.length,
      sentinelCount: sentinels.fullNames.length,
      failureCount,
      missingRepositories: failures.missingRepositories.length,
      extraRepositories: failures.extraRepositories.length,
      missingSentinels: missingSentinelCount,
      stableDifferences: stableDifferences.length,
      volatileDifferences: volatileDifferences.length,
      ignoredDifferences: ignoredDifferences.length,
      repositoryCountDeltaPercent: countDelta.percentDelta
    },
    failures,
    differences: {
      stable: buildDifferenceSection(stableDifferences),
      volatile: buildDifferenceSection(volatileDifferences),
      ignored: buildDifferenceSection(ignoredDifferences)
    }
  };
}

export async function writeComparisonReport(report: ComparisonReport, reportPath: string): Promise<void> {
  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

export function formatComparisonSummary(report: ComparisonReport, reportPath?: string): string {
  const lines = [
    `### Output parity comparison: ${report.status === "passed" ? "passed" : "failed"}`,
    "",
    "| Check | Value |",
    "| --- | ---: |",
    `| Baseline repositories | ${report.summary.baselineCount} |`,
    `| Candidate repositories | ${report.summary.candidateCount} |`,
    `| Repository count delta | ${(report.summary.repositoryCountDeltaPercent * 100).toFixed(2)}% |`,
    `| Missing repositories | ${report.summary.missingRepositories} |`,
    `| Extra repositories | ${report.summary.extraRepositories} |`,
    `| Missing sentinels | ${report.summary.missingSentinels} |`,
    `| Stable differences | ${report.summary.stableDifferences} |`,
    `| Volatile differences (report-only) | ${report.summary.volatileDifferences} |`,
    `| Ignored differences (report-only) | ${report.summary.ignoredDifferences} |`
  ];

  if (report.failures.invalidInputs.length > 0) {
    lines.push("", "#### Invalid inputs");
    for (const failure of report.failures.invalidInputs.slice(0, 10)) {
      lines.push(`- ${failure.input}: ${failure.reason} (${failure.path})`);
    }
  }

  if (report.failures.repositoryCountDelta !== undefined) {
    lines.push(
      "",
      `Repository-count delta exceeded ${(report.failures.repositoryCountDelta.threshold * 100).toFixed(2)}%.`
    );
  }

  appendNameList(lines, "Missing repositories", report.failures.missingRepositories);
  appendNameList(lines, "Extra repositories", report.failures.extraRepositories);
  appendNameList(lines, "Missing baseline sentinels", report.failures.missingSentinels.baseline);
  appendNameList(lines, "Missing candidate sentinels", report.failures.missingSentinels.candidate);
  appendDifferenceList(lines, "Stable differences", report.differences.stable);
  appendDifferenceList(lines, "Volatile differences (report-only)", report.differences.volatile);
  appendDifferenceList(lines, "Ignored differences (report-only)", report.differences.ignored);

  if (reportPath !== undefined) {
    lines.push("", `Report: ${reportPath}`);
  }

  return `${lines.join("\n")}\n`;
}

async function loadRepositoryOutput(filePath: string, input: "baseline" | "candidate"): Promise<RepositoryLoadResult> {
  const parsed = await parseJsonFile(filePath, input);
  if (parsed.failures.length > 0) {
    return { records: [], failures: parsed.failures, duplicateFullNames: [] };
  }

  if (!Array.isArray(parsed.value)) {
    return {
      records: [],
      failures: [{ input, path: filePath, reason: "Expected top-level JSON array." }],
      duplicateFullNames: []
    };
  }

  const records: RepositoryOutputRecord[] = [];
  const failures: InputFailure[] = [];
  const fullNameIndexes = new Map<string, number[]>();

  parsed.value.forEach((item, index) => {
    if (!isRecord(item) || typeof item.fullName !== "string" || item.fullName.trim() === "") {
      failures.push({ input, path: filePath, reason: `Record at index ${index} is missing a non-empty fullName string.` });
      return;
    }

    records.push(item as RepositoryOutputRecord);
    const indexes = fullNameIndexes.get(item.fullName) ?? [];
    indexes.push(index);
    fullNameIndexes.set(item.fullName, indexes);
  });

  const duplicateFullNames = [...fullNameIndexes.entries()]
    .filter(([, indexes]) => indexes.length > 1)
    .map(([fullName, indexes]) => ({ input, fullName, indexes }));

  return { records, failures, duplicateFullNames };
}

async function loadSentinelRepositories(filePath: string): Promise<SentinelLoadResult> {
  const parsed = await parseJsonFile(filePath, "sentinels");
  if (parsed.failures.length > 0) {
    return { fullNames: [], failures: parsed.failures };
  }

  if (!isRecord(parsed.value) || !Array.isArray(parsed.value.repositories)) {
    return {
      fullNames: [],
      failures: [{ input: "sentinels", path: filePath, reason: "Expected an object with a repositories array." }]
    };
  }

  const failures: InputFailure[] = [];
  const fullNames = parsed.value.repositories.flatMap((item, index) => {
    if (!isRecord(item) || typeof item.fullName !== "string" || item.fullName.trim() === "") {
      failures.push({ input: "sentinels", path: filePath, reason: `Sentinel at index ${index} is missing a non-empty fullName string.` });
      return [];
    }

    return [item.fullName];
  });

  return { fullNames: [...new Set(fullNames)].sort((left, right) => left.localeCompare(right)), failures };
}

async function parseJsonFile(filePath: string, input: InputLabel): Promise<{ value: unknown; failures: InputFailure[] }> {
  try {
    const value = JSON.parse(await readFile(filePath, "utf8")) as unknown;
    return { value, failures: [] };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { value: undefined, failures: [{ input, path: filePath, reason }] };
  }
}

function buildRepositoryCountDelta(baselineCount: number, candidateCount: number, threshold: number): RepositoryCountDelta {
  const absoluteDelta = Math.abs(candidateCount - baselineCount);
  const percentDelta = baselineCount === 0 ? (candidateCount === 0 ? 0 : 1) : absoluteDelta / baselineCount;

  return {
    baselineCount,
    candidateCount,
    absoluteDelta,
    percentDelta: Number(percentDelta.toFixed(6)),
    threshold,
    exceeded: percentDelta > threshold
  };
}

function indexByFullName(records: RepositoryOutputRecord[]): Map<string, RepositoryOutputRecord> {
  return new Map(records.map((record) => [record.fullName, record]));
}

function sortedDifference(left: Map<string, unknown>, right: Map<string, unknown>): string[] {
  return [...left.keys()].filter((fullName) => !right.has(fullName)).sort((leftName, rightName) => leftName.localeCompare(rightName));
}

function collectFieldDifferences(
  fullName: string,
  baseline: unknown,
  candidate: unknown,
  segments: string[],
  differences: FieldDifference[]
): void {
  if (areEqualJsonValues(baseline, candidate)) {
    return;
  }

  if (isRecord(baseline) && isRecord(candidate)) {
    const keys = [...new Set([...Object.keys(baseline), ...Object.keys(candidate)])].sort((left, right) => left.localeCompare(right));
    for (const key of keys) {
      collectFieldDifferences(fullName, baseline[key], candidate[key], [...segments, key], differences);
    }
    return;
  }

  const fieldPath = segments.length === 0 ? "$" : segments.join(".");
  const classification = classifyFieldPath(fieldPath);
  differences.push({
    fullName,
    path: fieldPath,
    baseline: toReportValue(baseline),
    candidate: toReportValue(candidate),
    classification
  });
}

function classifyFieldPath(fieldPath: string): DifferenceClassification {
  if (matchesPathSet(fieldPath, IGNORED_FIELD_PATHS)) {
    return "ignored";
  }

  return matchesPathSet(fieldPath, VOLATILE_FIELD_PATHS) ? "volatile" : "stable";
}

function matchesPathSet(fieldPath: string, pathSet: Set<string>): boolean {
  for (const configuredPath of pathSet) {
    if (
      fieldPath === configuredPath ||
      fieldPath.startsWith(`${configuredPath}.`) ||
      configuredPath.startsWith(`${fieldPath}.`)
    ) {
      return true;
    }
  }

  return false;
}

function areEqualJsonValues(left: unknown, right: unknown): boolean {
  return JSON.stringify(canonicalize(left)) === JSON.stringify(canonicalize(right));
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => canonicalize(item));
  }

  if (!isRecord(value)) {
    return value;
  }

  return Object.fromEntries(Object.keys(value).sort((left, right) => left.localeCompare(right)).map((key) => [key, canonicalize(value[key])]));
}

function toReportValue(value: unknown): ReportValue {
  if (value === undefined) {
    return { missing: true };
  }

  return value as JsonValue;
}

function buildDifferenceSection(items: FieldDifference[]): DifferenceSection {
  const displayed = items.slice(0, MAX_REPORTED_DIFFERENCES);
  return {
    total: items.length,
    truncated: items.length > displayed.length,
    omitted: items.length - displayed.length,
    items: displayed
  };
}

function appendNameList(lines: string[], title: string, names: string[]): void {
  if (names.length === 0) {
    return;
  }

  lines.push("", `#### ${title}`);
  for (const name of names.slice(0, 20)) {
    lines.push(`- ${name}`);
  }
  if (names.length > 20) {
    lines.push(`- ... ${names.length - 20} more`);
  }
}

function appendDifferenceList(lines: string[], title: string, section: DifferenceSection): void {
  if (section.total === 0) {
    return;
  }

  lines.push("", `#### ${title}`);
  for (const difference of section.items.slice(0, 10)) {
    lines.push(`- ${difference.fullName} \`${difference.path}\``);
  }
  if (section.total > 10) {
    lines.push(`- ... ${section.total - 10} more`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
