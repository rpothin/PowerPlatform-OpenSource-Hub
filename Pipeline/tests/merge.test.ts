import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { runCli } from "../src/cli.js";
import { generatedRepositoryRelativePath } from "../src/generatedFiles.js";
import { mergeRepositoryDetails } from "../src/merge.js";
import { createSchemaValidator } from "../src/schema.js";
import type { CuratedRepositoryOverlay, GeneratedRepositoryRecord, MergedRepositoryRecord } from "../src/types.js";

const packageRoot = process.cwd();
const repositoryRoot = path.resolve(packageRoot, "..");
const schemaRoot = path.join(repositoryRoot, "Configuration", "Schemas");
const schemaPath = path.join(schemaRoot, "GitHubRepositoriesDetails.schema.json");
const generatedSchemaPath = path.join(schemaRoot, "GitHubRepositoryGenerated.schema.json");
const overlaySchemaPath = path.join(schemaRoot, "GitHubRepositoryOverlay.schema.json");
const taxonomyDirPath = path.join(repositoryRoot, "Configuration", "Taxonomy");
const outputRoot = path.join(packageRoot, ".test-output", "merge");

describe("mergeRepositoryDetails", () => {
  beforeEach(async () => {
    await rm(outputRoot, { recursive: true, force: true });
    await mkdir(outputRoot, { recursive: true });
  });

  it("merges curated overlay fields, preserves generated fields and health, writes schema-valid output, and reports metrics", async () => {
    const paths = await createFixturePaths("success");
    await writeGenerated(paths.generatedDirPath, generatedRecord({ repositoryId: 1, fullName: "owner/alpha", stars: 20 }));
    await writeGenerated(paths.generatedDirPath, generatedRecord({ repositoryId: 2, fullName: "owner/beta", stars: 5 }));
    await writeOverlay(paths.overlayDirPath, {
      repositoryId: 1,
      fullName: "owner/alpha",
      category: "power-apps",
      focusAreas: ["canvas-apps"],
      audiences: ["makers"],
      featured: true,
      customDescription: "Curated alpha",
      maintainerNotes: "Reviewed by maintainers",
      curationStatus: "reviewed",
      previousFullNames: ["owner/old-alpha"],
      health: { curated: { maturity: "stable", maintenance: "maintained" } }
    });
    await writeSentinels(paths.sentinelsPath, []);

    const result = await mergeRepositoryDetails(paths);
    const output = JSON.parse(await readFile(paths.outputPath, "utf8")) as MergedRepositoryRecord[];
    const validate = await createSchemaValidator(schemaPath);

    expect(result.metrics).toEqual({
      generatedCount: 2,
      overlayCount: 1,
      matchedOverlays: 1,
      excludedRepositories: 0,
      missingCategoryCount: 1,
      missingFocusAreasCount: 1,
      missingAudiencesCount: 1
    });
    expect(output).toHaveLength(2);
    expect(output[0]).toMatchObject({
      repositoryId: 1,
      fullName: "owner/alpha",
      description: "Generated owner/alpha",
      category: "power-apps",
      focusAreas: ["canvas-apps"],
      audiences: ["makers"],
      featured: true,
      customDescription: "Curated alpha",
      maintainerNotes: "Reviewed by maintainers",
      curationStatus: "reviewed",
      previousFullNames: ["owner/old-alpha"],
      health: {
        computed: { activityStatus: "active", hasRecentRelease: true, hasContributionSignals: true, hasTrustSignals: true },
        curated: { maturity: "stable", maintenance: "maintained" }
      }
    });
    expect(output[0]).not.toHaveProperty("exclude");
    expect(() => validate(output, "Merged fixture output")).not.toThrow();
  });

  it("rejects duplicate generated repository ids", async () => {
    const paths = await createFixturePaths("duplicate-generated");
    await writeGenerated(paths.generatedDirPath, generatedRecord({ repositoryId: 1, fullName: "owner/alpha" }));
    await writeGenerated(paths.generatedDirPath, generatedRecord({ repositoryId: 1, fullName: "owner/beta" }));
    await writeSentinels(paths.sentinelsPath, []);

    await expect(mergeRepositoryDetails(paths)).rejects.toThrow("Duplicate generated repositoryId '1'");
  });

  it("rejects duplicate curated overlay ids", async () => {
    const paths = await createFixturePaths("duplicate-overlays");
    await writeGenerated(paths.generatedDirPath, generatedRecord({ repositoryId: 1, fullName: "owner/alpha" }));
    await writeGenerated(paths.generatedDirPath, generatedRecord({ repositoryId: 2, fullName: "owner/beta" }));
    await writeOverlay(paths.overlayDirPath, { repositoryId: 1, fullName: "owner/alpha" });
    await writeOverlay(paths.overlayDirPath, { repositoryId: 1, fullName: "owner/beta" });
    await writeSentinels(paths.sentinelsPath, []);

    await expect(mergeRepositoryDetails(paths)).rejects.toThrow("Duplicate curated overlay repositoryId '1'");
  });

  it("rejects overlays that do not match generated repository ids", async () => {
    const paths = await createFixturePaths("unknown-overlay");
    await writeGenerated(paths.generatedDirPath, generatedRecord({ repositoryId: 1, fullName: "owner/alpha" }));
    await writeOverlay(paths.overlayDirPath, { repositoryId: 2, fullName: "owner/beta" });
    await writeSentinels(paths.sentinelsPath, []);

    await expect(mergeRepositoryDetails(paths)).rejects.toThrow("unknown repositoryId '2'");
  });

  it("rejects overlays whose repository id matches but fullName points to a different repository", async () => {
    const paths = await createFixturePaths("mismatched-full-name");
    await writeGenerated(paths.generatedDirPath, generatedRecord({ repositoryId: 1, fullName: "owner/current" }));
    await writeOverlay(paths.overlayDirPath, { repositoryId: 1, fullName: "owner/old-name", previousFullNames: ["owner/current"] });
    await writeSentinels(paths.sentinelsPath, []);

    await expect(mergeRepositoryDetails(paths)).rejects.toThrow("has fullName 'owner/old-name' but generated data has 'owner/current'");
  });

  it("excludes repositories before writing merged output", async () => {
    const paths = await createFixturePaths("exclude");
    await writeGenerated(paths.generatedDirPath, generatedRecord({ repositoryId: 1, fullName: "owner/keep", stars: 10 }));
    await writeGenerated(paths.generatedDirPath, generatedRecord({ repositoryId: 2, fullName: "owner/drop", stars: 50 }));
    await writeOverlay(paths.overlayDirPath, { repositoryId: 1, fullName: "owner/keep", category: "developer-tooling", focusAreas: ["testing-quality"], audiences: ["developers"] });
    await writeOverlay(paths.overlayDirPath, { repositoryId: 2, fullName: "owner/drop", exclude: true });
    await writeSentinels(paths.sentinelsPath, []);

    const result = await mergeRepositoryDetails(paths);
    const output = JSON.parse(await readFile(paths.outputPath, "utf8")) as MergedRepositoryRecord[];

    expect(result.metrics.excludedRepositories).toBe(1);
    expect(output.map((record) => record.fullName)).toEqual(["owner/keep"]);
  });

  it("rejects curated exclusions for sentinel repositories", async () => {
    const paths = await createFixturePaths("sentinel-exclude");
    await writeGenerated(paths.generatedDirPath, generatedRecord({ repositoryId: 1, fullName: "owner/sentinel" }));
    await writeOverlay(paths.overlayDirPath, { repositoryId: 1, fullName: "owner/sentinel", exclude: true });
    await writeSentinels(paths.sentinelsPath, ["owner/sentinel"]);

    await expect(mergeRepositoryDetails(paths)).rejects.toThrow("cannot exclude sentinel repository 'owner/sentinel'");
  });

  it("rejects taxonomy values that are not present in taxonomy configuration", async () => {
    const paths = await createFixturePaths("taxonomy-rejection");
    const customTaxonomyDir = path.join(outputRoot, "taxonomy-rejection", "Taxonomy");
    paths.taxonomyDirPath = customTaxonomyDir;
    await writeGenerated(paths.generatedDirPath, generatedRecord({ repositoryId: 1, fullName: "owner/alpha" }));
    await writeOverlay(paths.overlayDirPath, { repositoryId: 1, fullName: "owner/alpha", category: "power-apps", focusAreas: ["canvas-apps"], audiences: ["makers"] });
    await writeSentinels(paths.sentinelsPath, []);
    await writeTaxonomy(customTaxonomyDir, "RepositoryCategories.json", ["connectors"]);
    await writeTaxonomy(customTaxonomyDir, "RepositoryFocusAreas.json", ["canvas-apps"]);
    await writeTaxonomy(customTaxonomyDir, "RepositoryAudiences.json", ["makers"]);

    await expect(mergeRepositoryDetails(paths)).rejects.toThrow("category value 'power-apps' that is not present in taxonomy configuration");
  });

  it("sorts merged output deterministically by popularity and full name", async () => {
    const paths = await createFixturePaths("ordering");
    await writeGenerated(paths.generatedDirPath, generatedRecord({ repositoryId: 3, fullName: "owner/beta", stars: 1 }));
    await writeGenerated(paths.generatedDirPath, generatedRecord({ repositoryId: 2, fullName: "owner/zeta", stars: 5 }));
    await writeGenerated(paths.generatedDirPath, generatedRecord({ repositoryId: 1, fullName: "owner/alpha", stars: 5 }));
    await writeSentinels(paths.sentinelsPath, []);

    const result = await mergeRepositoryDetails(paths);

    expect(result.records.map((record) => record.fullName)).toEqual(["owner/alpha", "owner/zeta", "owner/beta"]);
  });
});

describe("merge CLI command", () => {
  beforeEach(async () => {
    await rm(outputRoot, { recursive: true, force: true });
    await mkdir(outputRoot, { recursive: true });
  });

  it("runs merge from the CLI and prints summary metrics", async () => {
    const paths = await createFixturePaths("cli");
    const stdout: string[] = [];
    await writeGenerated(paths.generatedDirPath, generatedRecord({ repositoryId: 1, fullName: "owner/alpha" }));
    await writeOverlay(paths.overlayDirPath, { repositoryId: 1, fullName: "owner/alpha", category: "power-apps" });
    await writeSentinels(paths.sentinelsPath, []);

    const exitCode = await runCli(
      [
        "merge",
        "--generated-dir",
        paths.generatedDirPath,
        "--overlay-dir",
        paths.overlayDirPath,
        "--schema",
        paths.schemaPath,
        "--output",
        paths.outputPath,
        "--taxonomy-dir",
        paths.taxonomyDirPath,
        "--sentinels",
        paths.sentinelsPath
      ],
      {},
      { stdout: (message) => stdout.push(message) }
    );

    expect(exitCode).toBe(0);
    expect(JSON.parse(await readFile(paths.outputPath, "utf8"))).toHaveLength(1);
    expect(JSON.parse(stdout.join("\n"))).toMatchObject({ generatedCount: 1, overlayCount: 1, matchedOverlays: 1 });
  });

  it("returns a non-zero exit code and does not write output when merge validation fails", async () => {
    const paths = await createFixturePaths("cli-failure");
    const stderr: string[] = [];
    await writeGenerated(paths.generatedDirPath, generatedRecord({ repositoryId: 1, fullName: "owner/alpha" }));
    await writeOverlay(paths.overlayDirPath, { repositoryId: 2, fullName: "owner/beta" });
    await writeSentinels(paths.sentinelsPath, []);

    const exitCode = await runCli(
      [
        "merge",
        "--generated-dir",
        paths.generatedDirPath,
        "--overlay-dir",
        paths.overlayDirPath,
        "--schema",
        paths.schemaPath,
        "--output",
        paths.outputPath,
        "--taxonomy-dir",
        paths.taxonomyDirPath,
        "--sentinels",
        paths.sentinelsPath
      ],
      {},
      { stderr: (message) => stderr.push(message) }
    );

    expect(exitCode).toBe(1);
    expect(stderr.join("\n")).toContain("unknown repositoryId '2'");
    await expect(readFile(paths.outputPath, "utf8")).rejects.toMatchObject({ code: "ENOENT" });
  });
});

async function createFixturePaths(name: string) {
  const root = path.join(outputRoot, name);
  const generatedDirPath = path.join(root, "GeneratedRepositories");
  const overlayDirPath = path.join(root, "CuratedRepositories");
  await mkdir(generatedDirPath, { recursive: true });
  await mkdir(overlayDirPath, { recursive: true });

  return {
    generatedDirPath,
    overlayDirPath,
    outputPath: path.join(root, "GitHubRepositoriesDetails.json"),
    schemaPath,
    taxonomyDirPath,
    sentinelsPath: path.join(root, "SentinelRepositories.json"),
    generatedSchemaPath,
    overlaySchemaPath
  };
}

function generatedRecord(options: { repositoryId: string | number; fullName: string; stars?: number }): GeneratedRepositoryRecord {
  const owner = options.fullName.split("/")[0] ?? "owner";
  const name = options.fullName.split("/")[1] ?? "repo";
  const stars = options.stars ?? 10;

  return {
    createdAt: "2024-01-01T00:00:00Z",
    description: `Generated ${options.fullName}`,
    fullName: options.fullName,
    repositoryId: options.repositoryId,
    hasIssues: true,
    homepage: "",
    isArchived: false,
    language: "TypeScript",
    license: { key: "mit", name: "MIT License", url: "https://api.github.com/licenses/mit" },
    name,
    openIssuesCount: 1,
    owner: { id: "1", is_bot: false, login: owner, type: "Organization", url: `https://github.com/${owner}` },
    updatedAt: "2026-01-01T00:00:00Z",
    url: `https://github.com/${options.fullName}`,
    codeOfConduct: null,
    forkCount: 1,
    fundingLinks: [],
    isSecurityPolicyEnabled: true,
    isTemplate: false,
    latestRelease: null,
    primaryLanguage: { name: "TypeScript" },
    securityPolicyUrl: null,
    stargazerCount: stars,
    watchers: { totalCount: 1 },
    topics: ["powerplatform"],
    languages: ["TypeScript"],
    openedGoodFirstIssues: 1,
    hasGoodFirstIssues: true,
    openedHelpWantedIssues: 0,
    hasHelpWantedIssues: false,
    openedToContributionsIssues: 1,
    popularityScore: stars + 1,
    health: {
      computed: {
        activityStatus: "active",
        hasRecentRelease: true,
        hasContributionSignals: true,
        hasTrustSignals: true
      }
    },
    _schemaVersion: "1.0.0",
    _generatedAt: "2026-01-01T00:00:00.000Z",
    _workflowRunId: "test"
  };
}

async function writeGenerated(generatedDirPath: string, record: GeneratedRepositoryRecord): Promise<void> {
  await writeJson(path.join(generatedDirPath, generatedRepositoryRelativePath(record.fullName)), record);
}

async function writeOverlay(overlayDirPath: string, overlay: CuratedRepositoryOverlay): Promise<void> {
  await writeJson(path.join(overlayDirPath, generatedRepositoryRelativePath(overlay.fullName)), overlay);
}

async function writeSentinels(sentinelsPath: string, fullNames: string[]): Promise<void> {
  await writeJson(sentinelsPath, { repositories: fullNames.map((fullName) => ({ fullName, rationale: "Test sentinel" })) });
}

async function writeTaxonomy(taxonomyDir: string, fileName: string, values: string[]): Promise<void> {
  await writeJson(
    path.join(taxonomyDir, fileName),
    values.map((value) => ({ value, label: value, description: value }))
  );
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
