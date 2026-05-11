import { SCHEMA_VERSION, type Provenance, type RepositoryDetails, type RepositoryRecord, type SearchRepository } from "./types.js";

export function normalizeRepositoryRecord(
  repository: SearchRepository,
  details: RepositoryDetails,
  provenance: Provenance
): RepositoryRecord {
  const openedGoodFirstIssues = toNonNegativeInteger(details.openedGoodFirstIssues);
  const openedHelpWantedIssues = toNonNegativeInteger(details.openedHelpWantedIssues);
  const stargazerCount = toNonNegativeInteger(details.stargazerCount);
  const watcherCount = toNonNegativeInteger(details.watchers.totalCount);

  return {
    createdAt: repository.createdAt,
    description: repository.description ?? "",
    fullName: repository.fullName,
    hasIssues: Boolean(repository.hasIssues),
    homepage: repository.homepage ?? "",
    isArchived: Boolean(repository.isArchived),
    language: repository.language ?? "",
    license: repository.license,
    name: repository.name,
    openIssuesCount: toNonNegativeInteger(repository.openIssuesCount),
    owner: repository.owner,
    updatedAt: repository.updatedAt,
    url: repository.url,
    codeOfConduct: details.codeOfConduct,
    forkCount: toNonNegativeInteger(details.forkCount),
    fundingLinks: details.fundingLinks,
    isSecurityPolicyEnabled: Boolean(details.isSecurityPolicyEnabled),
    isTemplate: Boolean(details.isTemplate),
    latestRelease: details.latestRelease,
    primaryLanguage: details.primaryLanguage,
    securityPolicyUrl: details.securityPolicyUrl,
    stargazerCount,
    watchers: { totalCount: watcherCount },
    topics: uniqueStrings(details.topics),
    languages: uniqueStrings(details.languages),
    openedGoodFirstIssues,
    hasGoodFirstIssues: openedGoodFirstIssues > 0,
    openedHelpWantedIssues,
    hasHelpWantedIssues: openedHelpWantedIssues > 0,
    openedToContributionsIssues: openedGoodFirstIssues + openedHelpWantedIssues,
    popularityScore: stargazerCount + watcherCount,
    _schemaVersion: SCHEMA_VERSION,
    _generatedAt: provenance.generatedAt,
    _workflowRunId: provenance.workflowRunId
  };
}

export function serializeRecords(records: readonly RepositoryRecord[]): string {
  return `${JSON.stringify(records, null, 2)}\n`;
}

export function deduplicateByFullName(repositories: readonly SearchRepository[]): SearchRepository[] {
  const byFullName = new Map<string, SearchRepository>();
  for (const repository of repositories) {
    if (!byFullName.has(repository.fullName)) {
      byFullName.set(repository.fullName, repository);
    }
  }

  return [...byFullName.values()].sort((left, right) => left.fullName.localeCompare(right.fullName));
}

export function isRecentlyUpdated(repository: SearchRepository, now: Date, maxAgeMonths: number): boolean {
  const updatedAt = new Date(repository.updatedAt);
  if (Number.isNaN(updatedAt.getTime())) {
    return false;
  }

  const cutoff = new Date(now.getTime());
  cutoff.setUTCMonth(cutoff.getUTCMonth() - maxAgeMonths);
  return updatedAt > cutoff;
}

export function sortByPopularity(records: readonly RepositoryRecord[]): RepositoryRecord[] {
  return [...records].sort((left, right) => {
    const popularityDelta = right.stargazerCount - left.stargazerCount;
    return popularityDelta === 0 ? left.fullName.localeCompare(right.fullName) : popularityDelta;
  });
}

function toNonNegativeInteger(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  return Math.trunc(value);
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.trim() !== ""))];
}
