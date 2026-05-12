import type {
  CandidateProvider,
  CodeOfConductInfo,
  LatestReleaseInfo,
  LicenseInfo,
  RepositoryDetails,
  RepositoryOwner,
  SearchCriterion,
  SearchRepository
} from "./types.js";

interface GitHubSearchRepositoryItem {
  archived?: boolean;
  created_at?: string | null;
  description?: string | null;
  full_name?: string;
  has_issues?: boolean;
  homepage?: string | null;
  html_url?: string;
  id?: number | string;
  language?: string | null;
  license?: { key?: string | null; name?: string | null; url?: string | null } | null;
  name?: string;
  open_issues_count?: number;
  owner?: { id?: number | string; login?: string; type?: string; html_url?: string } | null;
  updated_at?: string | null;
}

interface GitHubRepositoryResponse {
  fork?: boolean;
  forks_count?: number;
  full_name?: string;
  has_issues?: boolean;
  is_template?: boolean;
  language?: string | null;
  subscribers_count?: number;
  stargazers_count?: number;
}

interface GitHubReleaseResponse {
  name?: string | null;
  tag_name?: string;
  html_url?: string;
  published_at?: string | null;
}

interface GitHubCodeOfConductResponse {
  key?: string;
  name?: string;
  html_url?: string;
  url?: string;
}

interface GitHubCommunityProfileResponse {
  files?: {
    code_of_conduct?: { html_url?: string; name?: string; key?: string } | null;
    security_policy?: { html_url?: string } | null;
  };
}

interface GraphQLRepositoryNode {
  forkCount: number;
  stargazerCount: number;
  watchers: { totalCount: number };
  primaryLanguage: { name: string } | null;
  isTemplate: boolean;
  hasIssuesEnabled: boolean;
  latestRelease: { name: string | null; tagName: string; url: string; publishedAt: string | null } | null;
  repositoryTopics: { nodes: Array<{ topic: { name: string } }> };
  languages: { nodes: Array<{ name: string }> };
  codeOfConduct: { key: string; name: string; url: string } | null;
  securityPolicyUrl: string | null;
  fundingLinks: Array<{ platform: string; url: string }>;
  goodFirstIssues: { totalCount: number };
  helpWanted: { totalCount: number };
}

interface GraphQLRateLimit {
  remaining: number;
  resetAt: string;
}

interface GraphQLErrorResponse {
  message: string;
  path?: Array<string | number>;
}

interface GraphQLBatchResponse {
  data?: Record<string, unknown>;
  errors?: GraphQLErrorResponse[];
}

export interface GitHubClient {
  rest: {
    search: {
      repos(parameters: Record<string, string | number>): Promise<{ data: { items: GitHubSearchRepositoryItem[] } }>;
      issuesAndPullRequests(parameters: Record<string, string | number>): Promise<{ data: { total_count: number } }>;
    };
    repos: {
      get(parameters: { owner: string; repo: string }): Promise<{ data: GitHubRepositoryResponse }>;
      getAllTopics(parameters: { owner: string; repo: string }): Promise<{ data: { names: string[] } }>;
      listLanguages(parameters: { owner: string; repo: string }): Promise<{ data: Record<string, number> }>;
      getLatestRelease(parameters: { owner: string; repo: string }): Promise<{ data: GitHubReleaseResponse }>;
    };
  };
  request<T>(route: string, parameters: Record<string, unknown>): Promise<{ data: T }>;
}

export class DryRunProvider implements CandidateProvider {
  private readonly generatedAt: Date;

  public constructor(now: Date = new Date()) {
    this.generatedAt = now;
  }

  public async searchRepositories(criterion: SearchCriterion): Promise<SearchRepository[]> {
    const safeTopic = criterion.topic.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    const fullName = `powerplatform-open-source-hub-dry-run/${safeTopic}`;

    return [
      {
        createdAt: "2023-01-01T00:00:00Z",
        description: `Dry-run repository fixture for ${criterion.topic}`,
        fullName,
        repositoryId: `dry-run:${safeTopic}`,
        hasIssues: true,
        homepage: "",
        isArchived: false,
        language: "TypeScript",
        license: { key: "mit", name: "MIT License", url: "https://api.github.com/licenses/mit" },
        name: safeTopic,
        openIssuesCount: 2,
        owner: {
          id: "dry-run-owner",
          is_bot: false,
          login: "powerplatform-open-source-hub-dry-run",
          type: "Organization",
          url: "https://github.com/powerplatform-open-source-hub-dry-run"
        },
        updatedAt: this.generatedAt.toISOString(),
        url: `https://github.com/${fullName}`
      }
    ];
  }

  public async getRepositoryDetails(_repositoryFullName: string, searchRepository: SearchRepository): Promise<RepositoryDetails> {
    return {
      codeOfConduct: {
        key: "contributor_covenant",
        name: "Contributor Covenant",
        url: `${searchRepository.url}/blob/main/CODE_OF_CONDUCT.md`
      },
      forkCount: 1,
      fundingLinks: [],
      isSecurityPolicyEnabled: true,
      isTemplate: false,
      latestRelease: null,
      primaryLanguage: { name: searchRepository.language },
      securityPolicyUrl: `${searchRepository.url}/security/policy`,
      stargazerCount: 10,
      watchers: { totalCount: 1 },
      topics: [searchRepository.name, "powerplatform", "dry-run"],
      languages: [searchRepository.language],
      openedGoodFirstIssues: 1,
      hasGoodFirstIssues: true,
      openedHelpWantedIssues: 0,
      hasHelpWantedIssues: false
    };
  }
}

export class OctokitRepositoryProvider implements CandidateProvider {
  public constructor(private readonly client: GitHubClient) {}

  public async searchRepositories(criterion: SearchCriterion): Promise<SearchRepository[]> {
    const repositories: SearchRepository[] = [];
    let page = 1;

    while (repositories.length < criterion.searchLimit) {
      const remaining = criterion.searchLimit - repositories.length;
      const perPage = Math.min(100, remaining);
      const response = await this.client.rest.search.repos({
        q: `topic:${criterion.topic} is:public`,
        per_page: perPage,
        page
      });

      const items = response.data.items.slice(0, remaining);
      repositories.push(...items.map(mapSearchRepository));

      if (items.length < perPage) {
        break;
      }

      page += 1;
    }

    return repositories;
  }

  public async getRepositoryDetails(repositoryFullName: string, searchRepository: SearchRepository): Promise<RepositoryDetails> {
    const [owner, repo] = splitRepositoryFullName(repositoryFullName);
    const repositoryResponse = await this.client.rest.repos.get({ owner, repo });

    const [topics, languages, latestRelease, codeOfConduct, communityProfile] = await Promise.all([
      this.client.rest.repos.getAllTopics({ owner, repo }).then((response) => response.data.names),
      this.client.rest.repos.listLanguages({ owner, repo }).then((response) => Object.keys(response.data)),
      this.getOptional(() => this.client.rest.repos.getLatestRelease({ owner, repo })),
      this.getOptional(() => this.client.request<GitHubCodeOfConductResponse>("GET /repos/{owner}/{repo}/community/code_of_conduct", { owner, repo })),
      this.getOptional(() => this.client.request<GitHubCommunityProfileResponse>("GET /repos/{owner}/{repo}/community/profile", { owner, repo }))
    ]);

    const hasIssuesEnabled = repositoryResponse.data.has_issues ?? searchRepository.hasIssues;
    const goodFirstIssues = hasIssuesEnabled ? await this.countOpenIssuesByLabel(repositoryFullName, "good first issue") : 0;
    const helpWantedIssues = hasIssuesEnabled ? await this.countOpenIssuesByLabel(repositoryFullName, "help wanted") : 0;
    const securityPolicyUrl = communityProfile?.files?.security_policy?.html_url ?? null;

    return {
      codeOfConduct: mapCodeOfConduct(codeOfConduct, communityProfile),
      forkCount: repositoryResponse.data.forks_count ?? 0,
      fundingLinks: [],
      isSecurityPolicyEnabled: securityPolicyUrl !== null,
      isTemplate: repositoryResponse.data.is_template ?? false,
      latestRelease: mapLatestRelease(latestRelease),
      primaryLanguage: mapPrimaryLanguage(repositoryResponse.data.language ?? searchRepository.language),
      securityPolicyUrl,
      stargazerCount: repositoryResponse.data.stargazers_count ?? 0,
      watchers: { totalCount: repositoryResponse.data.subscribers_count ?? 0 },
      topics,
      languages,
      openedGoodFirstIssues: goodFirstIssues,
      hasGoodFirstIssues: goodFirstIssues > 0,
      openedHelpWantedIssues: helpWantedIssues,
      hasHelpWantedIssues: helpWantedIssues > 0
    };
  }

  public async batchGetRepositoryDetails(repos: SearchRepository[]): Promise<Map<string, RepositoryDetails | Error>> {
    const result = new Map<string, RepositoryDetails | Error>();
    const batchSize = 20;

    for (let i = 0; i < repos.length; i += batchSize) {
      const batch = repos.slice(i, i + batchSize);
      const query = this.buildBatchQuery(batch);

      try {
        const response = await this.client.request<GraphQLBatchResponse>("POST /graphql", { query });
        const responseData = response.data.data ?? {};
        const gqlErrors = response.data.errors ?? [];

        // Root-level errors (no path, or path not matching a repo alias) indicate a batch-wide failure
        // (e.g. PAT-policy rejection arriving as a top-level GraphQL error without a repo path).
        const rootLevelErrors = gqlErrors.filter(
          (gqlError) => gqlError.path === undefined || gqlError.path === null || gqlError.path.length === 0
        );
        const aliasKeys = new Set(batch.map((_, j) => `repo${j}`));
        const hasAnyRepoData = [...aliasKeys].some((alias) => responseData[alias] !== undefined);

        if (!hasAnyRepoData && (rootLevelErrors.length > 0 || gqlErrors.length > 0)) {
          const batchError = new Error(gqlErrors.map((error) => error.message).join("; "));
          for (const repo of batch) {
            result.set(repo.fullName, batchError);
          }
          continue;
        }

        const rateLimit = responseData["rateLimit"] as GraphQLRateLimit | undefined;
        if (rateLimit !== undefined && rateLimit.remaining < 50) {
          const resetAt = new Date(rateLimit.resetAt).getTime();
          const waitMs = Math.max(0, resetAt - Date.now()) + 1000;
          await new Promise((resolve) => setTimeout(resolve, waitMs));
        }

        // Collect per-alias errors (errors with a path pointing to a specific repo alias)
        const failedAliases = new Set<string>();
        for (const gqlError of gqlErrors) {
          const alias = typeof gqlError.path?.[0] === "string" ? gqlError.path[0] : undefined;
          if (alias !== undefined && aliasKeys.has(alias)) {
            failedAliases.add(alias);
          }
        }

        for (let j = 0; j < batch.length; j += 1) {
          const repo = batch[j];
          if (repo === undefined) {
            continue;
          }

          const alias = `repo${j}`;
          if (failedAliases.has(alias)) {
            const error = gqlErrors.find((gqlError) => gqlError.path?.[0] === alias);
            result.set(repo.fullName, new Error(error?.message ?? "GraphQL error"));
            continue;
          }

          const node = responseData[alias] as GraphQLRepositoryNode | null | undefined;
          if (node === undefined || node === null) {
            if (rootLevelErrors.length > 0) {
              // Root-level error present: propagate its message so the caller can classify
              // PAT-policy errors (vs. blocking data failures). Applies to both the
              // Azure-Samples/Azure pattern (alias absent = undefined) and cases where
              // GraphQL explicitly returns null alongside a root-level error.
              result.set(repo.fullName, new Error(rootLevelErrors.map((e) => e.message).join("; ")));
            } else if (node === undefined) {
              // Alias absent with no error — unexpected, likely a malformed response.
              result.set(repo.fullName, new Error(`GraphQL response missing alias '${alias}' for ${repo.fullName}`));
            } else {
              // GraphQL returned null with no error. All repos in this batch were found by the
              // search API so they exist. GitHub can silently null-out repos for PAT-policy
              // restrictions without surfacing an explicit GraphQL error (behaviour differs by
              // org). Fall back to REST — getRepositoryDetails() calls repos.get first, so a
              // 403 PAT-policy error surfaces immediately and can be classified by the caller.
              try {
                result.set(repo.fullName, await this.getRepositoryDetails(repo.fullName, repo));
              } catch (fallbackError) {
                result.set(
                  repo.fullName,
                  fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError))
                );
              }
            }
            continue;
          }

          // Catch per-repo mapping errors so one bad node doesn't poison the whole batch
          try {
            result.set(repo.fullName, this.mapGraphQLNodeToDetails(node));
          } catch (mapError) {
            result.set(repo.fullName, mapError instanceof Error ? mapError : new Error(String(mapError)));
          }
        }
      } catch (error) {
        const batchError = error instanceof Error ? error : new Error(String(error));
        for (const repo of batch) {
          result.set(repo.fullName, batchError);
        }
      }
    }

    return result;
  }

  private buildBatchQuery(batch: SearchRepository[]): string {
    const aliases = batch
      .map((repository, index) => {
        const [owner, name] = splitRepositoryFullName(repository.fullName);
        return `
      repo${index}: repository(owner: ${JSON.stringify(owner)}, name: ${JSON.stringify(name)}) {
        forkCount
        stargazerCount
        watchers { totalCount }
        primaryLanguage { name }
        isTemplate
        hasIssuesEnabled
        latestRelease { name tagName url publishedAt }
        repositoryTopics(first: 20) { nodes { topic { name } } }
        languages(first: 20, orderBy: {field: SIZE, direction: DESC}) { nodes { name } }
        codeOfConduct { key name url }
        securityPolicyUrl
        fundingLinks { platform url }
        goodFirstIssues: issues(first: 1, states: OPEN, labels: ["good first issue"]) { totalCount }
        helpWanted: issues(first: 1, states: OPEN, labels: ["help wanted"]) { totalCount }
      }
`;
      })
      .join("\n");

    return `query BatchRepositoryDetails {\n  rateLimit { remaining resetAt }\n${aliases}}`;
  }

  private mapGraphQLNodeToDetails(node: GraphQLRepositoryNode): RepositoryDetails {
    const openedGoodFirstIssues = node.hasIssuesEnabled ? node.goodFirstIssues.totalCount : 0;
    const openedHelpWantedIssues = node.hasIssuesEnabled ? node.helpWanted.totalCount : 0;

    return {
      forkCount: node.forkCount,
      stargazerCount: node.stargazerCount,
      watchers: node.watchers,
      primaryLanguage: mapPrimaryLanguage(node.primaryLanguage?.name ?? null),
      isTemplate: node.isTemplate,
      latestRelease:
        node.latestRelease === null
          ? null
          : {
              name: node.latestRelease.name ?? node.latestRelease.tagName,
              tagName: node.latestRelease.tagName,
              url: node.latestRelease.url,
              publishedAt: node.latestRelease.publishedAt ?? ""
            },
      topics: node.repositoryTopics.nodes.map((topicNode) => topicNode.topic.name),
      languages: node.languages.nodes.map((languageNode) => languageNode.name),
      codeOfConduct:
        node.codeOfConduct === null
          ? null
          : {
              key: node.codeOfConduct.key,
              name: node.codeOfConduct.name,
              url: node.codeOfConduct.url
            },
      securityPolicyUrl: node.securityPolicyUrl,
      isSecurityPolicyEnabled: node.securityPolicyUrl !== null,
      fundingLinks: node.fundingLinks,
      openedGoodFirstIssues,
      hasGoodFirstIssues: openedGoodFirstIssues > 0,
      openedHelpWantedIssues,
      hasHelpWantedIssues: openedHelpWantedIssues > 0
    };
  }

  private async countOpenIssuesByLabel(repositoryFullName: string, label: string): Promise<number> {
    const response = await this.client.rest.search.issuesAndPullRequests({
      q: `repo:${repositoryFullName} is:issue is:open label:\"${label}\"`,
      per_page: 1
    });

    return response.data.total_count;
  }

  private async getOptional<T>(request: () => Promise<{ data: T }>): Promise<T | null> {
    try {
      return (await request()).data;
    } catch (error) {
      if (isNotFound(error)) {
        return null;
      }

      throw error;
    }
  }
}

function mapSearchRepository(item: GitHubSearchRepositoryItem): SearchRepository {
  const owner = mapOwner(item.owner);
  const name = item.name ?? item.full_name?.split("/").at(1) ?? "";
  const fullName = item.full_name ?? `${owner.login}/${name}`;

  return {
    createdAt: item.created_at ?? "",
    description: item.description ?? "",
    fullName,
    repositoryId: item.id ?? fullName,
    hasIssues: item.has_issues ?? false,
    homepage: item.homepage ?? "",
    isArchived: item.archived ?? false,
    language: item.language ?? "",
    license: mapLicense(item.license),
    name,
    openIssuesCount: item.open_issues_count ?? 0,
    owner,
    updatedAt: item.updated_at ?? "",
    url: item.html_url ?? `https://github.com/${fullName}`
  };
}

function mapOwner(owner: GitHubSearchRepositoryItem["owner"]): RepositoryOwner {
  return {
    id: owner?.id === undefined ? "" : String(owner.id),
    is_bot: owner?.type === "Bot",
    login: owner?.login ?? "",
    type: owner?.type ?? "",
    url: owner?.html_url ?? ""
  };
}

function mapLicense(license: GitHubSearchRepositoryItem["license"]): LicenseInfo | null {
  if (license === null || license === undefined || license.name === null || license.name === undefined) {
    return null;
  }

  return {
    key: license.key ?? "",
    name: license.name,
    url: license.url ?? ""
  };
}

function mapLatestRelease(release: GitHubReleaseResponse | null): LatestReleaseInfo | null {
  if (release === null) {
    return null;
  }

  return {
    name: release.name ?? release.tag_name ?? "",
    tagName: release.tag_name ?? "",
    url: release.html_url ?? "",
    publishedAt: release.published_at ?? ""
  };
}

function mapPrimaryLanguage(language: string | null): { name: string } | null {
  if (language === null || language === "") {
    return null;
  }

  return { name: language };
}

function mapCodeOfConduct(
  codeOfConduct: GitHubCodeOfConductResponse | null,
  communityProfile: GitHubCommunityProfileResponse | null
): CodeOfConductInfo | null {
  const communityCodeOfConduct = communityProfile?.files?.code_of_conduct;
  if (codeOfConduct === null && (communityCodeOfConduct === null || communityCodeOfConduct === undefined)) {
    return null;
  }

  return {
    key: codeOfConduct?.key ?? communityCodeOfConduct?.key ?? "",
    name: codeOfConduct?.name ?? communityCodeOfConduct?.name ?? "",
    url: codeOfConduct?.html_url ?? codeOfConduct?.url ?? communityCodeOfConduct?.html_url ?? ""
  };
}

function splitRepositoryFullName(repositoryFullName: string): [string, string] {
  const parts = repositoryFullName.split("/");
  const owner = parts[0];
  const repo = parts[1];
  if (parts.length !== 2 || owner === undefined || repo === undefined || owner === "" || repo === "") {
    throw new Error(`Repository full name '${repositoryFullName}' is not valid.`);
  }

  return [owner, repo];
}

function isNotFound(error: unknown): boolean {
  return typeof error === "object" && error !== null && "status" in error && (error as { status?: unknown }).status === 404;
}
