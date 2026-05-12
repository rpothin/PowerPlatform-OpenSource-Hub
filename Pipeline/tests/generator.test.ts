import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { generateRepositoryDetails } from "../src/generator.js";
import type { CandidateProvider, RepositoryDetails, SearchCriterion, SearchRepository } from "../src/types.js";

const packageRoot = process.cwd();
const repositoryRoot = path.resolve(packageRoot, "..");
const schemaPath = path.join(repositoryRoot, "Configuration", "Schemas", "GitHubRepositoriesDetails.schema.json");
const outputRoot = path.join(packageRoot, ".test-output", "generator");

function searchRepository(fullName: string, overrides: Partial<SearchRepository> = {}): SearchRepository {
  const name = fullName.split("/")[1] ?? fullName;
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
    owner: { id: "1", is_bot: false, login: fullName.split("/")[0] ?? "owner", type: "Organization", url: "https://github.com/owner" },
    updatedAt: "2026-01-01T00:00:00Z",
    url: `https://github.com/${fullName}`,
    ...overrides
  };
}

function repositoryDetails(stars = 10): RepositoryDetails {
  return {
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
    hasHelpWantedIssues: false
  };
}

class FakeProvider implements CandidateProvider {
  public readonly detailOrder: string[] = [];

  public constructor(
    private readonly searchResults: Record<string, SearchRepository[]>,
    private readonly detailResults: Record<string, RepositoryDetails | Error>
  ) {}

  public async searchRepositories(criterion: SearchCriterion): Promise<SearchRepository[]> {
    return this.searchResults[criterion.topic] ?? [];
  }

  public async getRepositoryDetails(repositoryFullName: string): Promise<RepositoryDetails> {
    this.detailOrder.push(repositoryFullName);
    const result = this.detailResults[repositoryFullName];
    if (result === undefined) {
      throw new Error(`No fixture for ${repositoryFullName}`);
    }

    if (result instanceof Error) {
      throw result;
    }

    return result;
  }
}

class BatchFakeProvider implements CandidateProvider {
  public batchCallCount = 0;

  public constructor(
    private readonly searchResults: Record<string, SearchRepository[]>,
    private readonly detailResults: Record<string, RepositoryDetails | Error>
  ) {}

  public async searchRepositories(criterion: SearchCriterion): Promise<SearchRepository[]> {
    return this.searchResults[criterion.topic] ?? [];
  }

  public async getRepositoryDetails(repositoryFullName: string): Promise<RepositoryDetails> {
    const result = this.detailResults[repositoryFullName];
    if (result === undefined) {
      throw new Error(`No fixture for ${repositoryFullName}`);
    }

    if (result instanceof Error) {
      throw result;
    }

    return result;
  }

  public async batchGetRepositoryDetails(repos: SearchRepository[]): Promise<Map<string, RepositoryDetails | Error>> {
    this.batchCallCount += 1;
    const map = new Map<string, RepositoryDetails | Error>();
    for (const repo of repos) {
      const result = this.detailResults[repo.fullName];
      if (result === undefined) {
        map.set(repo.fullName, new Error(`No fixture for ${repo.fullName}`));
      } else {
        map.set(repo.fullName, result);
      }
    }

    return map;
  }
}

describe("generateRepositoryDetails", () => {
  beforeEach(async () => {
    await rm(outputRoot, { recursive: true, force: true });
    await mkdir(outputRoot, { recursive: true });
  });

  it("loads config, deduplicates, filters, validates, writes output, and records metrics", async () => {
    const configPath = path.join(outputRoot, "criteria.json");
    const outputPath = path.join(outputRoot, "details.json");
    const metricsPath = path.join(outputRoot, "metrics.json");
    await writeFile(configPath, JSON.stringify([{ topic: "powerplatform", searchLimit: 3 }, { topic: "powerapps", searchLimit: 3 }]), "utf8");

    const provider = new FakeProvider(
      {
        powerplatform: [
          searchRepository("owner/keep"),
          searchRepository("owner/archive", { isArchived: true }),
          searchRepository("owner/stale", { updatedAt: "2024-01-01T00:00:00Z" })
        ],
        powerapps: [searchRepository("owner/keep"), searchRepository("owner/second")]
      },
      {
        "owner/keep": repositoryDetails(15),
        "owner/second": repositoryDetails(12)
      }
    );

    const result = await generateRepositoryDetails({
      configPath,
      outputPath,
      metricsPath,
      schemaPath,
      provider,
      now: new Date("2026-01-01T00:00:00Z"),
      workflowRunId: "test-run",
      concurrency: 2
    });

    expect(result.records.map((record) => record.fullName)).toEqual(["owner/keep", "owner/second"]);
    expect(result.metrics).toMatchObject({
      criteriaCount: 2,
      searchRequests: 2,
      searchResultsBeforeDedupe: 5,
      deduplicatedRepositories: 4,
      activeRepositories: 2,
      detailRequests: 2,
      detailFailures: 0,
      generatedRecords: 2
    });

    const output = JSON.parse(await readFile(outputPath, "utf8")) as unknown[];
    const metrics = JSON.parse(await readFile(metricsPath, "utf8")) as { generatedRecords: number };
    expect(output).toHaveLength(2);
    expect(metrics.generatedRecords).toBe(2);
  });

  it("filters repositories by popularity: keeps if stargazerCount >= 10 OR watchers.totalCount >= 10", async () => {
    const configPath = path.join(outputRoot, "criteria-popularity.json");
    const outputPath = path.join(outputRoot, "details-popularity.json");
    await writeFile(configPath, JSON.stringify([{ topic: "powerplatform", searchLimit: 10 }]), "utf8");

    const provider = new FakeProvider(
      {
        powerplatform: [
          searchRepository("owner/stars-pass"),   // 10 stars, 1 watcher — passes via stars
          searchRepository("owner/watchers-pass"), // 0 stars, 10 watchers — passes via watchers
          searchRepository("owner/both-fail"),     // 9 stars, 9 watchers — fails both conditions
          searchRepository("owner/sum-pass-or-fail") // 9 stars, 1 watcher — sum=10 but fails OR
        ]
      },
      {
        "owner/stars-pass": { ...repositoryDetails(10), watchers: { totalCount: 1 } },
        "owner/watchers-pass": { ...repositoryDetails(0), watchers: { totalCount: 10 } },
        "owner/both-fail": { ...repositoryDetails(9), watchers: { totalCount: 9 } },
        "owner/sum-pass-or-fail": { ...repositoryDetails(9), watchers: { totalCount: 1 } }
      }
    );

    const result = await generateRepositoryDetails({
      configPath,
      outputPath,
      schemaPath,
      provider,
      now: new Date("2026-01-01T00:00:00Z"),
      workflowRunId: "test-run"
    });

    expect(result.records.map((r) => r.fullName)).toEqual(["owner/stars-pass", "owner/watchers-pass"]);
  });


  it("skips repository detail failures by default and reports them in metrics", async () => {
    const configPath = path.join(outputRoot, "criteria-errors.json");
    const outputPath = path.join(outputRoot, "details-errors.json");
    await writeFile(configPath, JSON.stringify([{ topic: "powerplatform", searchLimit: 2 }]), "utf8");

    const result = await generateRepositoryDetails({
      configPath,
      outputPath,
      schemaPath,
      provider: new FakeProvider(
        { powerplatform: [searchRepository("owner/keep"), searchRepository("owner/fail")] },
        { "owner/keep": repositoryDetails(15), "owner/fail": new Error("boom") }
      ),
      now: new Date("2026-01-01T00:00:00Z"),
      workflowRunId: "test-run"
    });

    expect(result.records.map((record) => record.fullName)).toEqual(["owner/keep"]);
    expect(result.metrics.detailFailures).toBe(1);
    expect(result.metrics.warnings.join("\n")).toContain("owner/fail");
  });

  it("routes PAT-policy 403 errors to patPolicyFailures metric (serial path)", async () => {
    const configPath = path.join(outputRoot, "criteria-pat-policy.json");
    const outputPath = path.join(outputRoot, "details-pat-policy.json");
    await writeFile(configPath, JSON.stringify([{ topic: "powerplatform", searchLimit: 3 }]), "utf8");

    const patError = new Error(
      "The 'Microsoft Open Source' enterprise forbids access via a fine-grained personal access tokens if the token's lifetime is greater than 90 days."
    );

    const result = await generateRepositoryDetails({
      configPath,
      outputPath,
      schemaPath,
      provider: new FakeProvider(
        { powerplatform: [searchRepository("owner/keep"), searchRepository("owner/pat-blocked")] },
        { "owner/keep": repositoryDetails(15), "owner/pat-blocked": patError }
      ),
      now: new Date("2026-01-01T00:00:00Z"),
      workflowRunId: "test-run"
    });

    expect(result.records.map((r) => r.fullName)).toEqual(["owner/keep"]);
    expect(result.metrics.patPolicyFailures).toBe(1);
    expect(result.metrics.patPolicyFailureNames).toContain("owner/pat-blocked");
    expect(result.metrics.detailFailures).toBe(0);
  });

  it("routes non-PAT errors to detailFailures metric, not patPolicyFailures", async () => {
    const configPath = path.join(outputRoot, "criteria-ordinary-error.json");
    const outputPath = path.join(outputRoot, "details-ordinary-error.json");
    await writeFile(configPath, JSON.stringify([{ topic: "powerplatform", searchLimit: 2 }]), "utf8");

    const result = await generateRepositoryDetails({
      configPath,
      outputPath,
      schemaPath,
      provider: new FakeProvider(
        { powerplatform: [searchRepository("owner/keep"), searchRepository("owner/fail")] },
        { "owner/keep": repositoryDetails(15), "owner/fail": new Error("network timeout") }
      ),
      now: new Date("2026-01-01T00:00:00Z"),
      workflowRunId: "test-run"
    });

    expect(result.metrics.detailFailures).toBe(1);
    expect(result.metrics.patPolicyFailures).toBe(0);
    expect(result.metrics.patPolicyFailureNames).toHaveLength(0);
  });

  it("uses batchGetRepositoryDetails when available and sets detailBatchCalls", async () => {
    const configPath = path.join(outputRoot, "criteria-batch.json");
    const outputPath = path.join(outputRoot, "details-batch.json");
    await writeFile(configPath, JSON.stringify([{ topic: "powerplatform", searchLimit: 3 }]), "utf8");

    const provider = new BatchFakeProvider(
      { powerplatform: [searchRepository("owner/a"), searchRepository("owner/b")] },
      { "owner/a": repositoryDetails(15), "owner/b": repositoryDetails(12) }
    );

    const result = await generateRepositoryDetails({
      configPath,
      outputPath,
      schemaPath,
      provider,
      now: new Date("2026-01-01T00:00:00Z"),
      workflowRunId: "test-run"
    });

    expect(result.records.map((r) => r.fullName)).toEqual(["owner/a", "owner/b"]);
    expect(result.metrics.detailRequests).toBe(2);
    expect(result.metrics.detailBatchCalls).toBeGreaterThan(0);
    expect(result.metrics.detailFailures).toBe(0);
    expect(provider.batchCallCount).toBe(1);
  });

  it("handles partial batch failure: failed repo goes to detailFailures, others succeed", async () => {
    const configPath = path.join(outputRoot, "criteria-batch-partial.json");
    const outputPath = path.join(outputRoot, "details-batch-partial.json");
    await writeFile(configPath, JSON.stringify([{ topic: "powerplatform", searchLimit: 3 }]), "utf8");

    const result = await generateRepositoryDetails({
      configPath,
      outputPath,
      schemaPath,
      provider: new BatchFakeProvider(
        { powerplatform: [searchRepository("owner/ok"), searchRepository("owner/err")] },
        { "owner/ok": repositoryDetails(20), "owner/err": new Error("GraphQL partial failure") }
      ),
      now: new Date("2026-01-01T00:00:00Z"),
      workflowRunId: "test-run"
    });

    expect(result.records.map((r) => r.fullName)).toEqual(["owner/ok"]);
    expect(result.metrics.detailFailures).toBe(1);
    expect(result.metrics.patPolicyFailures).toBe(0);
  });

  it("routes PAT-policy errors in batch path to patPolicyFailures", async () => {
    const configPath = path.join(outputRoot, "criteria-batch-pat.json");
    const outputPath = path.join(outputRoot, "details-batch-pat.json");
    await writeFile(configPath, JSON.stringify([{ topic: "powerplatform", searchLimit: 3 }]), "utf8");

    const patError = new Error("enterprise forbids access via a fine-grained personal access tokens");

    const result = await generateRepositoryDetails({
      configPath,
      outputPath,
      schemaPath,
      provider: new BatchFakeProvider(
        { powerplatform: [searchRepository("owner/ok"), searchRepository("owner/pat-blocked")] },
        { "owner/ok": repositoryDetails(15), "owner/pat-blocked": patError }
      ),
      now: new Date("2026-01-01T00:00:00Z"),
      workflowRunId: "test-run"
    });

    expect(result.records.map((r) => r.fullName)).toEqual(["owner/ok"]);
    expect(result.metrics.patPolicyFailures).toBe(1);
    expect(result.metrics.patPolicyFailureNames).toContain("owner/pat-blocked");
    expect(result.metrics.detailFailures).toBe(0);
  });

  it("wraps search failures with topic context", async () => {
    const configPath = path.join(outputRoot, "criteria-search-error.json");
    const outputPath = path.join(outputRoot, "details-search-error.json");
    await writeFile(configPath, JSON.stringify([{ topic: "powerplatform", searchLimit: 2 }]), "utf8");

    const provider: CandidateProvider = {
      async searchRepositories() {
        throw new Error("network down");
      },
      async getRepositoryDetails() {
        return repositoryDetails();
      }
    };

    await expect(
      generateRepositoryDetails({ configPath, outputPath, schemaPath, provider, now: new Date("2026-01-01T00:00:00Z") })
    ).rejects.toThrow("topic 'powerplatform'");
  });
});
