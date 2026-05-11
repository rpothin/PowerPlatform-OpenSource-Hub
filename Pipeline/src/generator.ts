import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { mapWithConcurrency } from "./concurrency.js";
import { loadSearchCriteria } from "./config.js";
import { deduplicateByFullName, isRecentlyUpdated, normalizeRepositoryRecord, serializeRecords, sortByPopularity } from "./normalization.js";
import { validateRecordsWithSchema } from "./schema.js";
import type { CandidateProvider, GenerateResult, PipelineMetrics, RepositoryRecord } from "./types.js";

export interface GenerateOptions {
  configPath: string;
  outputPath: string;
  schemaPath: string;
  provider: CandidateProvider;
  metricsPath?: string;
  concurrency?: number;
  now?: Date;
  workflowRunId?: string;
  maxRepositoryAgeMonths?: number;
  minPopularityScore?: number;
  continueOnRepositoryError?: boolean;
}

export async function generateRepositoryDetails(options: GenerateOptions): Promise<GenerateResult> {
  assertJsonPath(options.outputPath, "output");
  if (options.metricsPath !== undefined) {
    assertJsonPath(options.metricsPath, "metrics");
  }

  const startedAt = Date.now();
  const now = options.now ?? new Date();
  const criteria = await loadSearchCriteria(options.configPath);
  const metrics = createMetrics(criteria.length);
  const allSearchResults = [];

  for (const criterion of criteria) {
    metrics.searchRequests += 1;
    let repositories;
    try {
      repositories = await options.provider.searchRepositories(criterion);
    } catch (error) {
      throw new Error(`Failed searching repositories for topic '${criterion.topic}'.`, { cause: error });
    }

    if (repositories.length >= criterion.searchLimit) {
      metrics.warnings.push(`The number of repositories found for topic '${criterion.topic}' reached the configured searchLimit of ${criterion.searchLimit}.`);
    }

    allSearchResults.push(...repositories);
  }

  metrics.searchResultsBeforeDedupe = allSearchResults.length;
  const deduplicatedRepositories = deduplicateByFullName(allSearchResults);
  metrics.deduplicatedRepositories = deduplicatedRepositories.length;

  const activeRepositories = deduplicatedRepositories.filter(
    (repository) => !repository.isArchived && isRecentlyUpdated(repository, now, options.maxRepositoryAgeMonths ?? 6)
  );
  metrics.activeRepositories = activeRepositories.length;

  const provenance = {
    generatedAt: now.toISOString(),
    workflowRunId: options.workflowRunId ?? process.env.GITHUB_RUN_ID ?? "local"
  };

  const hydratedRecords = await mapWithConcurrency(activeRepositories, options.concurrency ?? 4, async (repository) => {
    metrics.detailRequests += 1;
    try {
      const details = await options.provider.getRepositoryDetails(repository.fullName, repository);
      return normalizeRepositoryRecord(repository, details, provenance);
    } catch (error) {
      metrics.detailFailures += 1;
      if (options.continueOnRepositoryError ?? true) {
        metrics.warnings.push(`Skipping '${repository.fullName}' because detail hydration failed: ${errorMessage(error)}`);
        return null;
      }

      throw new Error(`Failed hydrating repository '${repository.fullName}'.`, { cause: error });
    }
  });

  const minPopularityScore = options.minPopularityScore ?? 10;
  const records = sortByPopularity(
    hydratedRecords
      .filter((record): record is RepositoryRecord => record !== null)
      .filter((record) => record.stargazerCount >= minPopularityScore || record.watchers.totalCount >= minPopularityScore)
  );
  metrics.generatedRecords = records.length;

  await validateRecordsWithSchema(records, options.schemaPath);
  await writeTextFile(options.outputPath, serializeRecords(records));

  metrics.elapsedMs = Date.now() - startedAt;
  if (options.metricsPath !== undefined) {
    await writeTextFile(options.metricsPath, `${JSON.stringify(metrics, null, 2)}\n`);
  }

  return { records, metrics };
}

function createMetrics(criteriaCount: number): PipelineMetrics {
  return {
    criteriaCount,
    searchRequests: 0,
    searchResultsBeforeDedupe: 0,
    deduplicatedRepositories: 0,
    activeRepositories: 0,
    detailRequests: 0,
    detailFailures: 0,
    generatedRecords: 0,
    warnings: [],
    elapsedMs: 0
  };
}

async function writeTextFile(filePath: string, content: string): Promise<void> {
  const parent = path.dirname(filePath);
  await mkdir(parent, { recursive: true });
  await writeFile(filePath, content, "utf8");
}

function assertJsonPath(filePath: string, label: string): void {
  if (!filePath.toLowerCase().endsWith(".json")) {
    throw new Error(`The ${label} file path '${filePath}' is not targeting a JSON file.`);
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
