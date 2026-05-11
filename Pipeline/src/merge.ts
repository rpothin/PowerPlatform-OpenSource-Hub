import { mkdir, readdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { generatedRepositoryRelativePath } from "./generatedFiles.js";
import { serializeRecords, sortByPopularity } from "./normalization.js";
import { createSchemaValidator, validateValueWithSchema } from "./schema.js";
import type {
  CuratedRepositoryHealth,
  CuratedRepositoryOverlay,
  GeneratedRepositoryRecord,
  MergedRepositoryRecord,
  RepositoryAudience,
  RepositoryCategory,
  RepositoryFocusArea,
  RepositoryHealth,
  RepositoryId
} from "./types.js";

export interface MergeOptions {
  generatedDirPath: string;
  overlayDirPath: string;
  schemaPath: string;
  outputPath: string;
  taxonomyDirPath: string;
  sentinelsPath: string;
  generatedSchemaPath?: string;
  overlaySchemaPath?: string;
}

export interface MergeMetrics {
  generatedCount: number;
  overlayCount: number;
  matchedOverlays: number;
  excludedRepositories: number;
  missingCategoryCount: number;
  missingFocusAreasCount: number;
  missingAudiencesCount: number;
}

export interface MergeResult {
  records: MergedRepositoryRecord[];
  metrics: MergeMetrics;
}

interface LoadedJson<T> {
  filePath: string;
  value: T;
}

interface SentinelConfig {
  repositories?: Array<{ fullName?: string }>;
}

interface TaxonomyEntry {
  value?: string;
}

interface TaxonomyValues {
  categories: ReadonlySet<string>;
  focusAreas: ReadonlySet<string>;
  audiences: ReadonlySet<string>;
}

export async function mergeRepositoryDetails(options: MergeOptions): Promise<MergeResult> {
  assertJsonPath(options.outputPath, "output");
  assertJsonPath(options.schemaPath, "schema");

  const [generatedRecords, overlays, taxonomy, sentinelFullNames] = await Promise.all([
    loadGeneratedRecords(options.generatedDirPath, options.generatedSchemaPath ?? defaultGeneratedSchemaPath(options.schemaPath)),
    loadOverlays(options.overlayDirPath, options.overlaySchemaPath ?? defaultOverlaySchemaPath(options.schemaPath)),
    loadTaxonomyValues(options.taxonomyDirPath),
    loadSentinelFullNames(options.sentinelsPath)
  ]);

  const generatedById = indexGeneratedRecords(generatedRecords);
  const overlaysById = indexOverlays(overlays, generatedById, taxonomy, sentinelFullNames);
  let matchedOverlays = 0;
  let excludedRepositories = 0;
  const mergedRecords: MergedRepositoryRecord[] = [];

  for (const record of generatedRecords) {
    const overlay = overlaysById.get(repositoryIdKey(record.repositoryId));
    if (overlay !== undefined) {
      matchedOverlays += 1;
      if (overlay.exclude === true) {
        excludedRepositories += 1;
        continue;
      }
    }

    mergedRecords.push(applyOverlay(record, overlay));
  }

  const records = sortByPopularity(mergedRecords);
  await validateValueWithSchema(records, options.schemaPath, "Merged repository data");
  await writeTextFile(options.outputPath, serializeRecords(records));

  const metrics: MergeMetrics = {
    generatedCount: generatedRecords.length,
    overlayCount: overlays.length,
    matchedOverlays,
    excludedRepositories,
    missingCategoryCount: records.filter((record) => record.category === undefined).length,
    missingFocusAreasCount: records.filter((record) => record.focusAreas === undefined || record.focusAreas.length === 0).length,
    missingAudiencesCount: records.filter((record) => record.audiences === undefined || record.audiences.length === 0).length
  };

  return { records, metrics };
}

async function loadGeneratedRecords(generatedDirPath: string, schemaPath: string): Promise<GeneratedRepositoryRecord[]> {
  const validate = await createSchemaValidator(schemaPath);
  const files = await listJsonFiles(generatedDirPath);
  const records: GeneratedRepositoryRecord[] = [];

  for (const filePath of files) {
    const value = await loadJsonFile<unknown>(filePath);
    validate(value, `Generated repository '${filePath}'`);
    records.push(value as GeneratedRepositoryRecord);
  }

  return records;
}

async function loadOverlays(overlayDirPath: string, schemaPath: string): Promise<Array<LoadedJson<CuratedRepositoryOverlay>>> {
  const validate = await createSchemaValidator(schemaPath);
  const files = await listJsonFiles(overlayDirPath);
  const overlays: Array<LoadedJson<CuratedRepositoryOverlay>> = [];

  for (const filePath of files) {
    const value = await loadJsonFile<unknown>(filePath);
    validate(value, `Curated overlay '${filePath}'`);
    overlays.push({ filePath, value: value as CuratedRepositoryOverlay });
  }

  return overlays;
}

async function loadTaxonomyValues(taxonomyDirPath: string): Promise<TaxonomyValues> {
  const [categories, focusAreas, audiences] = await Promise.all([
    loadTaxonomyFile(path.join(taxonomyDirPath, "RepositoryCategories.json")),
    loadTaxonomyFile(path.join(taxonomyDirPath, "RepositoryFocusAreas.json")),
    loadTaxonomyFile(path.join(taxonomyDirPath, "RepositoryAudiences.json"))
  ]);

  return { categories, focusAreas, audiences };
}

async function loadTaxonomyFile(filePath: string): Promise<ReadonlySet<string>> {
  const value = await loadJsonFile<unknown>(filePath);
  if (!Array.isArray(value)) {
    throw new Error(`Taxonomy file '${filePath}' must contain an array.`);
  }

  const values = new Set<string>();
  for (const entry of value as TaxonomyEntry[]) {
    if (typeof entry.value !== "string" || entry.value.trim() === "") {
      throw new Error(`Taxonomy file '${filePath}' contains an entry without a non-empty value.`);
    }
    if (values.has(entry.value)) {
      throw new Error(`Taxonomy file '${filePath}' contains duplicate value '${entry.value}'.`);
    }
    values.add(entry.value);
  }

  return values;
}

async function loadSentinelFullNames(sentinelsPath: string): Promise<ReadonlySet<string>> {
  const value = await loadJsonFile<SentinelConfig>(sentinelsPath);
  if (!Array.isArray(value.repositories)) {
    throw new Error(`Sentinel file '${sentinelsPath}' must contain a repositories array.`);
  }

  return new Set(
    value.repositories.map((repository) => {
      if (typeof repository.fullName !== "string" || repository.fullName.trim() === "") {
        throw new Error(`Sentinel file '${sentinelsPath}' contains a repository without a non-empty fullName.`);
      }
      return normalizeFullName(repository.fullName);
    })
  );
}

function indexGeneratedRecords(records: readonly GeneratedRepositoryRecord[]): ReadonlyMap<string, GeneratedRepositoryRecord> {
  const byId = new Map<string, GeneratedRepositoryRecord>();
  for (const record of records) {
    const key = repositoryIdKey(record.repositoryId);
    const existing = byId.get(key);
    if (existing !== undefined) {
      throw new Error(`Duplicate generated repositoryId '${key}' for '${existing.fullName}' and '${record.fullName}'.`);
    }
    byId.set(key, record);
  }

  return byId;
}

function indexOverlays(
  overlays: readonly LoadedJson<CuratedRepositoryOverlay>[],
  generatedById: ReadonlyMap<string, GeneratedRepositoryRecord>,
  taxonomy: TaxonomyValues,
  sentinelFullNames: ReadonlySet<string>
): ReadonlyMap<string, CuratedRepositoryOverlay> {
  const byId = new Map<string, CuratedRepositoryOverlay>();

  for (const overlayFile of overlays) {
    const overlay = overlayFile.value;
    const key = repositoryIdKey(overlay.repositoryId);
    const existing = byId.get(key);
    if (existing !== undefined) {
      throw new Error(`Duplicate curated overlay repositoryId '${key}' for '${existing.fullName}' and '${overlay.fullName}'.`);
    }

    const generated = generatedById.get(key);
    if (generated === undefined) {
      throw new Error(`Curated overlay '${overlayFile.filePath}' references unknown repositoryId '${key}' (${overlay.fullName}).`);
    }

    validateOverlayPath(overlayFile.filePath, overlay);
    validateOverlayFullName(overlayFile.filePath, overlay, generated);
    validateOverlayTaxonomy(overlayFile.filePath, overlay, taxonomy);
    if (overlay.exclude === true && sentinelFullNames.has(normalizeFullName(overlay.fullName))) {
      throw new Error(`Curated overlay '${overlayFile.filePath}' cannot exclude sentinel repository '${overlay.fullName}'.`);
    }

    byId.set(key, overlay);
  }

  return byId;
}

function validateOverlayPath(filePath: string, overlay: CuratedRepositoryOverlay): void {
  const expectedRelativePath = generatedRepositoryRelativePath(overlay.fullName);
  const normalizedFilePath = filePath.split(path.sep).join("/").toLowerCase();
  const normalizedExpectedSuffix = expectedRelativePath.split(path.sep).join("/").toLowerCase();
  if (!normalizedFilePath.endsWith(normalizedExpectedSuffix)) {
    throw new Error(`Curated overlay '${filePath}' path does not match fullName '${overlay.fullName}'. Expected suffix '${expectedRelativePath}'.`);
  }
}

function validateOverlayFullName(filePath: string, overlay: CuratedRepositoryOverlay, generated: GeneratedRepositoryRecord): void {
  if (normalizeFullName(overlay.fullName) !== normalizeFullName(generated.fullName)) {
    throw new Error(
      `Curated overlay '${filePath}' repositoryId '${repositoryIdKey(overlay.repositoryId)}' has fullName '${overlay.fullName}' but generated data has '${generated.fullName}'.`
    );
  }
}

function validateOverlayTaxonomy(filePath: string, overlay: CuratedRepositoryOverlay, taxonomy: TaxonomyValues): void {
  validateTaxonomyValue(filePath, "category", overlay.category, taxonomy.categories);
  validateTaxonomyValues(filePath, "focusAreas", overlay.focusAreas, taxonomy.focusAreas);
  validateTaxonomyValues(filePath, "audiences", overlay.audiences, taxonomy.audiences);
}

function validateTaxonomyValue<TValue extends RepositoryCategory | RepositoryFocusArea | RepositoryAudience>(
  filePath: string,
  fieldName: string,
  value: TValue | undefined,
  allowedValues: ReadonlySet<string>
): void {
  if (value !== undefined && !allowedValues.has(value)) {
    throw new Error(`Curated overlay '${filePath}' has ${fieldName} value '${value}' that is not present in taxonomy configuration.`);
  }
}

function validateTaxonomyValues<TValue extends RepositoryFocusArea | RepositoryAudience>(
  filePath: string,
  fieldName: string,
  values: readonly TValue[] | undefined,
  allowedValues: ReadonlySet<string>
): void {
  for (const value of values ?? []) {
    validateTaxonomyValue(filePath, fieldName, value, allowedValues);
  }
}

function applyOverlay(record: GeneratedRepositoryRecord, overlay: CuratedRepositoryOverlay | undefined): MergedRepositoryRecord {
  const merged: MergedRepositoryRecord = { ...record };

  if (record.health !== undefined) {
    merged.health = { computed: record.health.computed };
  }

  if (overlay === undefined) {
    return merged;
  }

  assignIfPresent(merged, "category", overlay.category);
  assignIfPresent(merged, "featured", overlay.featured);
  assignIfPresent(merged, "customDescription", overlay.customDescription);
  assignIfPresent(merged, "maintainerNotes", overlay.maintainerNotes);
  assignIfPresent(merged, "curationStatus", overlay.curationStatus);
  if (overlay.focusAreas !== undefined) {
    merged.focusAreas = [...overlay.focusAreas];
  }
  if (overlay.audiences !== undefined) {
    merged.audiences = [...overlay.audiences];
  }
  if (overlay.previousFullNames !== undefined) {
    merged.previousFullNames = [...overlay.previousFullNames];
  }
  if (overlay.health?.curated !== undefined) {
    merged.health = mergeHealth(merged.health, overlay.health.curated);
  }

  return merged;
}

function mergeHealth(existing: RepositoryHealth | undefined, curated: CuratedRepositoryHealth): RepositoryHealth {
  return {
    ...(existing?.computed === undefined ? {} : { computed: existing.computed }),
    curated
  };
}

function assignIfPresent<TKey extends keyof MergedRepositoryRecord>(
  target: MergedRepositoryRecord,
  key: TKey,
  value: MergedRepositoryRecord[TKey] | undefined
): void {
  if (value !== undefined) {
    target[key] = value;
  }
}

async function listJsonFiles(directoryPath: string): Promise<string[]> {
  const entries = await readdir(directoryPath, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directoryPath, entry.name);
      if (entry.isDirectory()) {
        return listJsonFiles(entryPath);
      }

      return entry.isFile() && entry.name.endsWith(".json") ? [entryPath] : [];
    })
  );

  return nestedFiles.flat().sort();
}

async function loadJsonFile<T>(filePath: string): Promise<T> {
  try {
    return JSON.parse(await readFile(filePath, "utf8")) as T;
  } catch (error) {
    throw new Error(`Failed to load JSON file '${filePath}': ${errorMessage(error)}`);
  }
}

async function writeTextFile(filePath: string, content: string): Promise<void> {
  const parent = path.dirname(filePath);
  await mkdir(parent, { recursive: true });

  for (let attempt = 0; attempt < 100; attempt += 1) {
    const temporaryPath = path.join(parent, `.${path.basename(filePath)}.staging-${process.pid}-${Date.now()}-${attempt}`);
    let temporaryFileCreated = false;
    try {
      await writeFile(temporaryPath, content, { encoding: "utf8", flag: "wx" });
      temporaryFileCreated = true;
      await rename(temporaryPath, filePath);
      return;
    } catch (error) {
      if (temporaryFileCreated) {
        await rm(temporaryPath, { force: true });
      }
      if (!isNodeError(error) || error.code !== "EEXIST") {
        throw error;
      }
    }
  }

  throw new Error(`Unable to create staging file for '${filePath}'.`);
}

function repositoryIdKey(repositoryId: RepositoryId): string {
  return String(repositoryId);
}

function normalizeFullName(fullName: string): string {
  return fullName.toLowerCase();
}

function defaultGeneratedSchemaPath(schemaPath: string): string {
  return path.join(path.dirname(schemaPath), "GitHubRepositoryGenerated.schema.json");
}

function defaultOverlaySchemaPath(schemaPath: string): string {
  return path.join(path.dirname(schemaPath), "GitHubRepositoryOverlay.schema.json");
}

function assertJsonPath(filePath: string, label: string): void {
  if (!filePath.toLowerCase().endsWith(".json")) {
    throw new Error(`The ${label} file path '${filePath}' is not targeting a JSON file.`);
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === "object" && error !== null && "code" in error;
}
