import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  generatedRepositoryRelativePath,
  planGeneratedRepositoryFiles,
  writeGeneratedRepositoryFilesAtomically
} from "../src/generatedFiles.js";
import type { RepositoryRecord } from "../src/types.js";

const packageRoot = process.cwd();
const repositoryRoot = path.resolve(packageRoot, "..");
const generatedSchemaPath = path.join(repositoryRoot, "Configuration", "Schemas", "GitHubRepositoryGenerated.schema.json");
const outputRoot = path.join(packageRoot, ".test-output", "generated-files");

function repositoryRecord(fullName: string, stars = 10): RepositoryRecord {
  const [owner = "owner", name = "repo"] = fullName.split("/");
  return {
    createdAt: "2024-01-01T00:00:00Z",
    description: `Repository ${fullName}`,
    fullName,
    repositoryId: `fixture:${fullName}`,
    hasIssues: true,
    homepage: "",
    isArchived: false,
    language: "TypeScript",
    license: { key: "mit", name: "MIT License", url: "https://api.github.com/licenses/mit" },
    name,
    openIssuesCount: 0,
    owner: { id: "1", is_bot: false, login: owner, type: "Organization", url: `https://github.com/${owner}` },
    updatedAt: "2026-01-01T00:00:00Z",
    url: `https://github.com/${fullName}`,
    codeOfConduct: null,
    forkCount: 0,
    fundingLinks: [],
    isSecurityPolicyEnabled: false,
    isTemplate: false,
    latestRelease: null,
    primaryLanguage: { name: "TypeScript" },
    securityPolicyUrl: null,
    stargazerCount: stars,
    watchers: { totalCount: 1 },
    topics: ["powerplatform"],
    languages: ["TypeScript"],
    openedGoodFirstIssues: 0,
    hasGoodFirstIssues: false,
    openedHelpWantedIssues: 0,
    hasHelpWantedIssues: false,
    openedToContributionsIssues: 0,
    popularityScore: stars + 1,
    _schemaVersion: "1.0.0",
    _generatedAt: "2026-01-01T00:00:00.000Z",
    _workflowRunId: "test-run"
  };
}

describe("generated repository files", () => {
  beforeEach(async () => {
    await rm(outputRoot, { recursive: true, force: true });
    await mkdir(outputRoot, { recursive: true });
  });

  it("maps fullName to deterministic lowercase owner/repo paths and rejects invalid names", () => {
    expect(generatedRepositoryRelativePath("Owner/Repo.Name")).toBe(path.join("owner", "repo.name.json"));
    expect(() => generatedRepositoryRelativePath("owner")).toThrow("Invalid repository fullName");
    expect(() => generatedRepositoryRelativePath("owner/repo/extra")).toThrow("Invalid repository fullName");
    expect(() => generatedRepositoryRelativePath("owner/..")).toThrow("Invalid repository fullName");
    expect(() => generatedRepositoryRelativePath("owner/bad name")).toThrow("Invalid repository fullName");
  });

  it("detects case-insensitive generated path collisions", () => {
    expect(() =>
      planGeneratedRepositoryFiles([{ fullName: "Owner/Repo" }, { fullName: "owner/repo" }], outputRoot)
    ).toThrow("path collision");
  });

  it("writes validated generated records under lowercase per-repo paths", async () => {
    const generatedDir = path.join(outputRoot, "GeneratedRepositories");

    await writeGeneratedRepositoryFilesAtomically([repositoryRecord("Owner/Repo")], {
      generatedDir,
      schemaPath: generatedSchemaPath
    });

    const generated = JSON.parse(await readFile(path.join(generatedDir, "owner", "repo.json"), "utf8")) as { fullName?: string };
    expect(generated.fullName).toBe("Owner/Repo");
  });

  it("replaces the generated directory so orphaned files are removed", async () => {
    const generatedDir = path.join(outputRoot, "GeneratedRepositories");
    const orphanPath = path.join(generatedDir, "owner", "orphan.json");
    await mkdir(path.dirname(orphanPath), { recursive: true });
    await writeFile(orphanPath, "orphan", "utf8");

    await writeGeneratedRepositoryFilesAtomically([repositoryRecord("Owner/Keep")], {
      generatedDir,
      schemaPath: generatedSchemaPath
    });

    await expect(readFile(orphanPath, "utf8")).rejects.toMatchObject({ code: "ENOENT" });
    expect(JSON.parse(await readFile(path.join(generatedDir, "owner", "keep.json"), "utf8"))).toMatchObject({ fullName: "Owner/Keep" });
  });

  it("validates each record before replacement and leaves the previous directory intact on failure", async () => {
    const generatedDir = path.join(outputRoot, "GeneratedRepositories");
    const existingPath = path.join(generatedDir, "owner", "existing.json");
    await mkdir(path.dirname(existingPath), { recursive: true });
    await writeFile(existingPath, "existing", "utf8");

    const invalidRecord = repositoryRecord("Owner/Invalid") as Partial<RepositoryRecord>;
    delete invalidRecord.repositoryId;

    await expect(
      writeGeneratedRepositoryFilesAtomically([invalidRecord as RepositoryRecord], {
        generatedDir,
        schemaPath: generatedSchemaPath
      })
    ).rejects.toThrow("Generated repository 'Owner/Invalid'");

    await expect(readFile(path.join(generatedDir, "owner", "invalid.json"), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
    expect(await readFile(existingPath, "utf8")).toBe("existing");
  });
});
