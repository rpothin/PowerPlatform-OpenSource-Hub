import { readdir } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";

import { Ajv2020, type AnySchema } from "ajv/dist/2020.js";

const packageRoot = process.cwd();
const repositoryRoot = path.resolve(packageRoot, "..");
const schemaRoot = path.join(repositoryRoot, "Configuration", "Schemas");
const taxonomyRoot = path.join(repositoryRoot, "Configuration", "Taxonomy");
const overlayRoot = path.join(repositoryRoot, "Data", "CuratedRepositories");
const generatedRoot = path.join(repositoryRoot, "Data", "GeneratedRepositories");

type TaxonomyDefinitionName = "repositoryCategory" | "repositoryFocusArea" | "repositoryAudience";

interface TaxonomyEntry {
  value: string;
  label: string;
  description: string;
}

interface CuratedOverlay {
  repositoryId: string | number;
  fullName: string;
  exclude?: boolean;
}

interface RepositoryDetailsRecord {
  repositoryId?: string | number;
  fullName?: string;
}

interface SentinelRepository {
  fullName: string;
}

function compileSchema(schemaName: string) {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  ajv.addSchema(loadSchema("GitHubRepositoryDefinitions.schema.json"));
  return ajv.compile(loadSchema(schemaName));
}

function loadSchema(schemaName: string): AnySchema {
  return JSON.parse(readFileSync(path.join(schemaRoot, schemaName), "utf8")) as AnySchema;
}

function generatedRecord(): Record<string, unknown> {
  return {
    createdAt: "2024-01-01T00:00:00Z",
    description: "Sample repository",
    fullName: "owner/repo",
    repositoryId: 123,
    hasIssues: true,
    homepage: "",
    isArchived: false,
    language: "TypeScript",
    license: { key: "mit", name: "MIT License", url: "https://api.github.com/licenses/mit" },
    name: "repo",
    openIssuesCount: 1,
    owner: { id: "1", is_bot: false, login: "owner", type: "Organization", url: "https://github.com/owner" },
    updatedAt: "2026-01-01T00:00:00Z",
    url: "https://github.com/owner/repo",
    codeOfConduct: null,
    forkCount: 1,
    fundingLinks: [],
    isSecurityPolicyEnabled: false,
    isTemplate: false,
    latestRelease: null,
    primaryLanguage: { name: "TypeScript" },
    securityPolicyUrl: null,
    stargazerCount: 10,
    watchers: { totalCount: 2 },
    topics: ["powerplatform"],
    languages: ["TypeScript"],
    openedGoodFirstIssues: 1,
    hasGoodFirstIssues: true,
    openedHelpWantedIssues: 0,
    hasHelpWantedIssues: false,
    openedToContributionsIssues: 1,
    popularityScore: 12,
    health: {
      computed: {
        activityStatus: "active",
        hasRecentRelease: false,
        hasContributionSignals: true,
        hasTrustSignals: false
      }
    },
    _schemaVersion: "1.0.0",
    _generatedAt: "2026-01-01T00:00:00.000Z",
    _workflowRunId: "local"
  };
}

function loadJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

function normalizeFullName(fullName: string): string {
  return fullName.toLowerCase();
}

function getDefinitionEnum(definitionName: TaxonomyDefinitionName): string[] {
  const definitions = loadSchema("GitHubRepositoryDefinitions.schema.json") as {
    $defs?: Record<string, { enum?: string[] }>;
  };
  const values = definitions.$defs?.[definitionName]?.enum;

  if (!Array.isArray(values)) {
    throw new Error(`Missing schema enum for ${definitionName}`);
  }

  return values;
}

function loadTaxonomy(fileName: string): TaxonomyEntry[] {
  const taxonomy = loadJson<unknown>(path.join(taxonomyRoot, fileName));

  if (!Array.isArray(taxonomy)) {
    throw new Error(`${fileName} must contain an array of taxonomy entries.`);
  }

  const entries = taxonomy as TaxonomyEntry[];
  const seen = new Set<string>();

  for (const entry of entries) {
    expect(Object.keys(entry).sort()).toEqual(["description", "label", "value"]);
    expect(typeof entry.value).toBe("string");
    expect(entry.value).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    expect(entry.label).toEqual(expect.any(String));
    expect(entry.label.length).toBeGreaterThan(0);
    expect(entry.description).toEqual(expect.any(String));
    expect(entry.description.length).toBeGreaterThan(0);
    expect(seen.has(entry.value)).toBe(false);
    seen.add(entry.value);
  }

  return entries;
}

async function listJsonFiles(directoryPath: string): Promise<string[]> {
  const entries = await readdir(directoryPath, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directoryPath, entry.name);

      if (entry.isDirectory()) {
        return listJsonFiles(entryPath);
      }

      return entry.isFile() && entry.name.endsWith(".json") ? [entryPath] : [];
    })
  );

  return files.flat().sort();
}

describe("repository schemas", () => {
  it("validates the current merged frontend artifact", () => {
    const validate = compileSchema("GitHubRepositoriesDetails.schema.json");
    const data = JSON.parse(readFileSync(path.join(repositoryRoot, "Data", "GitHubRepositoriesDetails.json"), "utf8")) as unknown;

    expect(validate(data)).toBe(true);
  });

  it("validates a generated repository record with stable identity and computed health", () => {
    const validate = compileSchema("GitHubRepositoryGenerated.schema.json");
    const withoutRepositoryId = generatedRecord();
    delete withoutRepositoryId.repositoryId;

    expect(validate(generatedRecord())).toBe(true);
    expect(validate(withoutRepositoryId)).toBe(false);
  });

  it("allows curated overlay fields and rejects generated-field overrides", () => {
    const validate = compileSchema("GitHubRepositoryOverlay.schema.json");
    const overlay = {
      repositoryId: 123,
      fullName: "owner/repo",
      curationStatus: "reviewed",
      category: "power-apps",
      focusAreas: ["canvas-apps"],
      audiences: ["makers", "admins"],
      featured: true,
      customDescription: "Curated summary",
      health: {
        curated: {
          maturity: "stable",
          maintenance: "maintained",
          reviewedAt: "2026-01-01",
          reviewedBy: "maintainer"
        }
      }
    };

    expect(validate(overlay)).toBe(true);
    expect(validate({ ...overlay, stargazerCount: 10 })).toBe(false);
    expect(validate({ ...overlay, category: "unknown-category" })).toBe(false);
  });

  it("keeps taxonomy configuration aligned with shared schema enums", () => {
    const categories = loadTaxonomy("RepositoryCategories.json");
    const focusAreas = loadTaxonomy("RepositoryFocusAreas.json");
    const audiences = loadTaxonomy("RepositoryAudiences.json");

    expect(categories.map((entry) => entry.value)).toEqual(getDefinitionEnum("repositoryCategory"));
    expect(focusAreas.map((entry) => entry.value)).toEqual(getDefinitionEnum("repositoryFocusArea"));
    expect(audiences.map((entry) => entry.value)).toEqual(getDefinitionEnum("repositoryAudience"));
    expect(audiences.map((entry) => entry.value)).toContain("admins");
  });

  it("validates curated overlay examples and sentinel safeguards", async () => {
    const validate = compileSchema("GitHubRepositoryOverlay.schema.json");
    const [overlayFiles, generatedFiles] = await Promise.all([listJsonFiles(overlayRoot), listJsonFiles(generatedRoot)]);
    const generatedData = generatedFiles.map((filePath) => loadJson<RepositoryDetailsRecord>(filePath));
    const generatedByRepositoryId = new Map(generatedData.map((record) => [String(record.repositoryId ?? ""), record]));
    const sentinelConfig = loadJson<{ repositories: SentinelRepository[] }>(path.join(repositoryRoot, "Configuration", "SentinelRepositories.json"));
    const sentinelFullNames = new Set(sentinelConfig.repositories.map((repository) => normalizeFullName(repository.fullName)));
    const repositoryIds = new Set<string>();
    const fullNames = new Set<string>();

    expect(overlayFiles.length).toBeGreaterThan(0);

    for (const overlayFile of overlayFiles) {
      const overlay = loadJson<CuratedOverlay>(overlayFile);
      const relativePath = path.relative(overlayRoot, overlayFile);
      const isValid = validate(overlay);

      if (!isValid) {
        throw new Error(`${relativePath} failed overlay schema validation: ${JSON.stringify(validate.errors)}`);
      }

      const fullNameParts = overlay.fullName.split("/");
      expect(fullNameParts).toHaveLength(2);
      const owner = fullNameParts[0] ?? "";
      const repositoryName = fullNameParts[1] ?? "";
      const normalizedRelativePath = relativePath.split(path.sep).join("/").toLowerCase();
      expect(normalizedRelativePath).toBe(`${owner.toLowerCase()}/${repositoryName.toLowerCase()}.json`);

      const normalizedFullName = normalizeFullName(overlay.fullName);
      const generatedRecord = generatedByRepositoryId.get(String(overlay.repositoryId));
      expect(generatedRecord).toBeDefined();

      if (generatedRecord?.fullName !== undefined) {
        expect(normalizeFullName(generatedRecord.fullName)).toBe(normalizedFullName);
      }

      expect(repositoryIds.has(String(overlay.repositoryId))).toBe(false);
      repositoryIds.add(String(overlay.repositoryId));
      expect(fullNames.has(normalizedFullName)).toBe(false);
      fullNames.add(normalizedFullName);

      if (sentinelFullNames.has(normalizedFullName)) {
        expect(overlay.exclude).not.toBe(true);
      }
    }
  });
});
