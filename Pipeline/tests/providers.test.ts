import { OctokitRepositoryProvider } from "../src/providers.js";
import type { GitHubClient } from "../src/providers.js";
import type { SearchRepository } from "../src/types.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function repo(fullName: string): SearchRepository {
  const [login = "owner", name = fullName] = fullName.split("/");
  return {
    createdAt: "2024-01-01T00:00:00Z",
    description: `Repo ${fullName}`,
    fullName,
    repositoryId: `id:${fullName}`,
    hasIssues: true,
    homepage: "",
    isArchived: false,
    language: "TypeScript",
    license: { key: "mit", name: "MIT License", url: "https://api.github.com/licenses/mit" },
    name,
    openIssuesCount: 0,
    owner: { id: "1", is_bot: false, login, type: "Organization", url: `https://github.com/${login}` },
    updatedAt: "2026-01-01T00:00:00Z",
    url: `https://github.com/${fullName}`
  };
}

function goodNode(overrides: Record<string, unknown> = {}) {
  return {
    forkCount: 5,
    stargazerCount: 100,
    watchers: { totalCount: 20 },
    primaryLanguage: { name: "TypeScript" },
    isTemplate: false,
    hasIssuesEnabled: true,
    latestRelease: null,
    repositoryTopics: { nodes: [{ topic: { name: "powerplatform" } }] },
    languages: { nodes: [{ name: "TypeScript" }] },
    codeOfConduct: null,
    securityPolicyUrl: null,
    fundingLinks: [],
    goodFirstIssues: { totalCount: 2 },
    helpWanted: { totalCount: 3 },
    ...overrides
  };
}

const FAR_FUTURE_RESET = new Date(Date.now() + 3_600_000).toISOString();
const RATE_LIMIT_OK = { remaining: 5000, resetAt: FAR_FUTURE_RESET };

function makeClient(responses: Array<Record<string, unknown>>): GitHubClient {
  let callIndex = 0;
  return {
    rest: {} as GitHubClient["rest"],
    request<T>(_route: string, _params: Record<string, unknown>): Promise<{ data: T }> {
      const response = responses[callIndex] ?? {};
      callIndex += 1;
      return Promise.resolve({ data: response as T });
    }
  };
}

// ---------------------------------------------------------------------------
// batchGetRepositoryDetails — happy path
// ---------------------------------------------------------------------------

describe("OctokitRepositoryProvider.batchGetRepositoryDetails", () => {
  it("maps a successful GraphQL response to RepositoryDetails for each repo", async () => {
    const node = goodNode();
    const client = makeClient([
      {
        data: {
          rateLimit: RATE_LIMIT_OK,
          repo0: node,
          repo1: goodNode({ stargazerCount: 42 })
        },
        errors: []
      }
    ]);

    const provider = new OctokitRepositoryProvider(client);
    const results = await provider.batchGetRepositoryDetails([repo("owner/a"), repo("owner/b")]);

    const a = results.get("owner/a");
    const b = results.get("owner/b");

    expect(a).not.toBeInstanceOf(Error);
    expect(b).not.toBeInstanceOf(Error);

    if (!(a instanceof Error) && a !== undefined) {
      expect(a.stargazerCount).toBe(100);
      expect(a.forkCount).toBe(5);
      expect(a.topics).toEqual(["powerplatform"]);
      expect(a.languages).toEqual(["TypeScript"]);
      expect(a.openedGoodFirstIssues).toBe(2);
      expect(a.hasGoodFirstIssues).toBe(true);
      expect(a.openedHelpWantedIssues).toBe(3);
      expect(a.hasHelpWantedIssues).toBe(true);
    }

    if (!(b instanceof Error) && b !== undefined) {
      expect(b.stargazerCount).toBe(42);
    }
  });

  it("maps hasIssuesEnabled=false to zero issue counts", async () => {
    const client = makeClient([
      {
        data: {
          rateLimit: RATE_LIMIT_OK,
          repo0: goodNode({ hasIssuesEnabled: false, goodFirstIssues: { totalCount: 99 }, helpWanted: { totalCount: 99 } })
        },
        errors: []
      }
    ]);

    const provider = new OctokitRepositoryProvider(client);
    const results = await provider.batchGetRepositoryDetails([repo("owner/a")]);
    const a = results.get("owner/a");

    expect(a).not.toBeInstanceOf(Error);
    if (!(a instanceof Error) && a !== undefined) {
      expect(a.openedGoodFirstIssues).toBe(0);
      expect(a.hasGoodFirstIssues).toBe(false);
      expect(a.openedHelpWantedIssues).toBe(0);
      expect(a.hasHelpWantedIssues).toBe(false);
    }
  });

  // ---------------------------------------------------------------------------
  // Per-alias GraphQL errors
  // ---------------------------------------------------------------------------

  it("maps a per-alias GraphQL error to Error for that repo only", async () => {
    const client = makeClient([
      {
        data: {
          rateLimit: RATE_LIMIT_OK,
          repo0: goodNode()
          // repo1 deliberately absent — covered by per-alias error below
        },
        errors: [{ message: "Could not resolve to a Repository", path: ["repo1"] }]
      }
    ]);

    const provider = new OctokitRepositoryProvider(client);
    const results = await provider.batchGetRepositoryDetails([repo("owner/ok"), repo("owner/bad")]);

    expect(results.get("owner/ok")).not.toBeInstanceOf(Error);
    const bad = results.get("owner/bad");
    expect(bad).toBeInstanceOf(Error);
    expect((bad as Error).message).toContain("Could not resolve to a Repository");
  });

  // ---------------------------------------------------------------------------
  // Root-level GraphQL errors (PAT-policy scenario)
  // ---------------------------------------------------------------------------

  it("applies root-level error to all repos when no repo data is present", async () => {
    const patMessage =
      "The 'Microsoft Open Source' enterprise forbids access via a fine-grained personal access tokens if the token's lifetime is greater than 90 days.";

    const client = makeClient([
      {
        data: { rateLimit: RATE_LIMIT_OK },
        errors: [{ message: patMessage }] // no path = root-level error
      }
    ]);

    const provider = new OctokitRepositoryProvider(client);
    const results = await provider.batchGetRepositoryDetails([repo("owner/a"), repo("owner/b")]);

    for (const fullName of ["owner/a", "owner/b"]) {
      const r = results.get(fullName);
      expect(r).toBeInstanceOf(Error);
      expect((r as Error).message).toContain("fine-grained personal access tokens");
    }
  });

  it("applies root-level error to missing repos even when some repos have data (partial batch)", async () => {
    const patMessage = "enterprise forbids access via a fine-grained personal access tokens";

    const client = makeClient([
      {
        data: {
          rateLimit: RATE_LIMIT_OK,
          repo0: goodNode() // repo0 succeeds
          // repo1 absent — should get root-level error, NOT "Repository not found"
        },
        errors: [{ message: patMessage }]
      }
    ]);

    const provider = new OctokitRepositoryProvider(client);
    const results = await provider.batchGetRepositoryDetails([repo("owner/ok"), repo("owner/blocked")]);

    // repo0 (owner/ok) should still succeed
    expect(results.get("owner/ok")).not.toBeInstanceOf(Error);

    // repo1 (owner/blocked) should carry the root-level PAT error message, not "not found"
    const blocked = results.get("owner/blocked");
    expect(blocked).toBeInstanceOf(Error);
    expect((blocked as Error).message).toContain("fine-grained personal access tokens");
    expect((blocked as Error).message).not.toContain("Repository not found");
  });

  // ---------------------------------------------------------------------------
  // Per-alias mapping error isolation
  // ---------------------------------------------------------------------------

  it("isolates mapGraphQLNodeToDetails errors so one bad node does not fail the whole batch", async () => {
    // A node where repositoryTopics is null will cause .nodes access to throw
    const malformedNode = goodNode({ repositoryTopics: null });

    const client = makeClient([
      {
        data: {
          rateLimit: RATE_LIMIT_OK,
          repo0: goodNode(), // fine
          repo1: malformedNode // will throw inside mapGraphQLNodeToDetails
        },
        errors: []
      }
    ]);

    const provider = new OctokitRepositoryProvider(client);
    const results = await provider.batchGetRepositoryDetails([repo("owner/good"), repo("owner/bad")]);

    expect(results.get("owner/good")).not.toBeInstanceOf(Error);
    expect(results.get("owner/bad")).toBeInstanceOf(Error);
  });

  // ---------------------------------------------------------------------------
  // Multiple batches (> 20 repos)
  // ---------------------------------------------------------------------------

  it("splits repos into batches of 20 and makes one request per batch", async () => {
    const repoList = Array.from({ length: 21 }, (_, i) => repo(`owner/repo${i}`));

    let callCount = 0;

    const multiClient: GitHubClient = {
      rest: {} as GitHubClient["rest"],
      request<T>(_route: string, params: Record<string, unknown>): Promise<{ data: T }> {
        callCount += 1;
        const query = params["query"] as string;

        // First call: 20 repos (repo0–repo19), second call: 1 repo (repo0)
        const aliasCount = (query.match(/repo\d+:/g) ?? []).length;

        const aliases: Record<string, unknown> = { rateLimit: RATE_LIMIT_OK };
        for (let i = 0; i < aliasCount; i += 1) {
          aliases[`repo${i}`] = goodNode({ stargazerCount: callCount * 10 + i });
        }

        return Promise.resolve({ data: { data: aliases, errors: [] } as T });
      }
    };

    const provider = new OctokitRepositoryProvider(multiClient);
    const results = await provider.batchGetRepositoryDetails(repoList);

    expect(callCount).toBe(2); // 20 + 1
    expect(results.size).toBe(21);
    for (const r of repoList) {
      expect(results.get(r.fullName)).not.toBeInstanceOf(Error);
    }
  });

  // ---------------------------------------------------------------------------
  // Edge case: null node in data (repo exists but is null — e.g. private repo)
  // ---------------------------------------------------------------------------

  it("records 'Repository not found' error for a null node with no root-level errors", async () => {
    const client = makeClient([
      {
        data: { rateLimit: RATE_LIMIT_OK, repo0: null },
        errors: []
      }
    ]);

    const provider = new OctokitRepositoryProvider(client);
    const results = await provider.batchGetRepositoryDetails([repo("owner/private")]);

    const r = results.get("owner/private");
    expect(r).toBeInstanceOf(Error);
    expect((r as Error).message).toContain("Repository not found");
  });
});
