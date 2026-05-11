export const SCHEMA_VERSION = "1.0.0";

export interface SearchCriterion {
  topic: string;
  searchLimit: number;
}

export interface LicenseInfo {
  key?: string;
  name: string;
  url?: string;
}

export interface RepositoryOwner {
  id?: string;
  is_bot?: boolean;
  login: string;
  type?: string;
  url?: string;
}

export interface SearchRepository {
  createdAt: string;
  description: string;
  fullName: string;
  hasIssues: boolean;
  homepage: string | null;
  isArchived: boolean;
  language: string;
  license: LicenseInfo | null;
  name: string;
  openIssuesCount: number;
  owner: RepositoryOwner;
  updatedAt: string;
  url: string;
}

export interface CodeOfConductInfo {
  key?: string;
  name?: string;
  url?: string;
}

export interface LatestReleaseInfo {
  name: string;
  tagName: string;
  url: string;
  publishedAt: string;
}

export interface PrimaryLanguageInfo {
  name: string;
}

export interface WatchersInfo {
  totalCount: number;
}

export interface RepositoryDetails {
  codeOfConduct: CodeOfConductInfo | null;
  forkCount: number;
  fundingLinks: unknown[];
  isSecurityPolicyEnabled: boolean;
  isTemplate: boolean;
  latestRelease: LatestReleaseInfo | null;
  primaryLanguage: PrimaryLanguageInfo | null;
  securityPolicyUrl: string | null;
  stargazerCount: number;
  watchers: WatchersInfo;
  topics: string[];
  languages: string[];
  openedGoodFirstIssues: number;
  hasGoodFirstIssues: boolean;
  openedHelpWantedIssues: number;
  hasHelpWantedIssues: boolean;
}

export interface RepositoryRecord extends SearchRepository, RepositoryDetails {
  openedToContributionsIssues: number;
  popularityScore: number;
  _schemaVersion: string;
  _generatedAt: string;
  _workflowRunId: string;
}

export interface Provenance {
  generatedAt: string;
  workflowRunId: string;
}

export interface CandidateProvider {
  searchRepositories(criterion: SearchCriterion): Promise<SearchRepository[]>;
  getRepositoryDetails(repositoryFullName: string, searchRepository: SearchRepository): Promise<RepositoryDetails>;
}

export interface PipelineMetrics {
  criteriaCount: number;
  searchRequests: number;
  searchResultsBeforeDedupe: number;
  deduplicatedRepositories: number;
  activeRepositories: number;
  detailRequests: number;
  detailFailures: number;
  generatedRecords: number;
  warnings: string[];
  elapsedMs: number;
}

export interface GenerateResult {
  records: RepositoryRecord[];
  metrics: PipelineMetrics;
}
