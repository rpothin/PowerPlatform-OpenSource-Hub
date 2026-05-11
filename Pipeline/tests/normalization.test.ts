import { deduplicateByFullName, normalizeRepositoryRecord, serializeRecords, sortByPopularity } from "../src/normalization.js";
import type { RepositoryDetails, SearchRepository } from "../src/types.js";

function searchRepository(fullName: string): SearchRepository {
  const name = fullName.split("/")[1] ?? fullName;
  return {
    createdAt: "2024-01-01T00:00:00Z",
    description: "Sample repository",
    fullName,
    repositoryId: "1",
    hasIssues: true,
    homepage: "",
    isArchived: false,
    language: "TypeScript",
    license: { key: "mit", name: "MIT License", url: "https://api.github.com/licenses/mit" },
    name,
    openIssuesCount: 3,
    owner: { id: "1", is_bot: false, login: "owner", type: "Organization", url: "https://github.com/owner" },
    updatedAt: "2026-01-01T00:00:00Z",
    url: `https://github.com/${fullName}`
  };
}

function details(stargazerCount = 10, watcherCount = 2): RepositoryDetails {
  return {
    codeOfConduct: null,
    forkCount: 1,
    fundingLinks: [],
    isSecurityPolicyEnabled: false,
    isTemplate: false,
    latestRelease: null,
    primaryLanguage: { name: "TypeScript" },
    securityPolicyUrl: null,
    stargazerCount,
    watchers: { totalCount: watcherCount },
    topics: ["powerplatform", "powerplatform", "typescript"],
    languages: ["TypeScript", "TypeScript"],
    openedGoodFirstIssues: 2,
    hasGoodFirstIssues: true,
    openedHelpWantedIssues: 1,
    hasHelpWantedIssues: true
  };
}

describe("normalization", () => {
  it("emits the Phase 1 schema-backed record shape", () => {
    const record = normalizeRepositoryRecord(searchRepository("owner/repo"), details(), {
      generatedAt: "2026-01-01T00:00:00.000Z",
      workflowRunId: "local"
    });

    expect(Object.keys(record)).toEqual([
      "createdAt",
      "description",
      "fullName",
      "repositoryId",
      "hasIssues",
      "homepage",
      "isArchived",
      "language",
      "license",
      "name",
      "openIssuesCount",
      "owner",
      "updatedAt",
      "url",
      "codeOfConduct",
      "forkCount",
      "fundingLinks",
      "isSecurityPolicyEnabled",
      "isTemplate",
      "latestRelease",
      "primaryLanguage",
      "securityPolicyUrl",
      "stargazerCount",
      "watchers",
      "topics",
      "languages",
      "openedGoodFirstIssues",
      "hasGoodFirstIssues",
      "openedHelpWantedIssues",
      "hasHelpWantedIssues",
      "openedToContributionsIssues",
      "popularityScore",
      "_schemaVersion",
      "_generatedAt",
      "_workflowRunId"
    ]);
    expect(record.openedToContributionsIssues).toBe(3);
    expect(record.popularityScore).toBe(12);
    expect(record.topics).toEqual(["powerplatform", "typescript"]);
    expect(serializeRecords([record])).toMatch(/\n$/);
  });

  it("deduplicates by fullName and sorts by popularity", () => {
    const first = searchRepository("owner/a");
    const duplicate = searchRepository("owner/a");
    const second = searchRepository("owner/b");

    expect(deduplicateByFullName([second, first, duplicate]).map((repository) => repository.fullName)).toEqual(["owner/a", "owner/b"]);

    const low = normalizeRepositoryRecord(first, details(10), { generatedAt: "now", workflowRunId: "local" });
    const high = normalizeRepositoryRecord(second, details(20), { generatedAt: "now", workflowRunId: "local" });
    expect(sortByPopularity([low, high]).map((repository) => repository.fullName)).toEqual(["owner/b", "owner/a"]);
  });
});
