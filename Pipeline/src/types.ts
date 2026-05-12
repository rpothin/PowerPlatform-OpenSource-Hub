export const SCHEMA_VERSION = "1.0.0";

export interface SearchCriterion {
  topic: string;
  searchLimit: number;
}

export type RepositoryId = string | number;

export type RepositoryCategory =
  | "copilot-studio"
  | "power-apps"
  | "power-automate"
  | "power-pages"
  | "dataverse"
  | "power-bi"
  | "connectors"
  | "alm-devops"
  | "governance-admin"
  | "developer-tooling"
  | "samples-templates"
  | "learning-docs";

export type RepositoryFocusArea =
  | "agent-development"
  | "bot-building"
  | "custom-connectors"
  | "pcf-controls"
  | "canvas-apps"
  | "model-driven-apps"
  | "cloud-flows"
  | "desktop-flows"
  | "power-pages-sites"
  | "dataverse-modeling"
  | "environment-governance"
  | "solution-lifecycle"
  | "testing-quality"
  | "community-samples";

export type RepositoryAudience = "users" | "contributors" | "maintainers" | "makers" | "developers" | "admins";

export type CurationStatus = "unreviewed" | "reviewed" | "needs-review";

export type ComputedActivityStatus = "active" | "stale" | "inactive" | "archived";

export type CuratedMaturity = "experimental" | "stable" | "mature" | "unknown";

export type CuratedMaintenance = "maintained" | "limited" | "unmaintained" | "unknown";

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
  repositoryId: RepositoryId;
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

export interface ComputedRepositoryHealth {
  activityStatus?: ComputedActivityStatus;
  hasRecentRelease?: boolean;
  hasContributionSignals?: boolean;
  hasTrustSignals?: boolean;
}

export interface CuratedRepositoryHealth {
  maturity?: CuratedMaturity;
  maintenance?: CuratedMaintenance;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface GeneratedRepositoryHealth {
  computed: ComputedRepositoryHealth;
}

export interface CuratedRepositoryHealthContainer {
  curated: CuratedRepositoryHealth;
}

export interface RepositoryHealth {
  computed?: ComputedRepositoryHealth;
  curated?: CuratedRepositoryHealth;
}

export interface GeneratedRepositoryRecord extends SearchRepository, RepositoryDetails {
  openedToContributionsIssues: number;
  popularityScore: number;
  health?: GeneratedRepositoryHealth;
  _schemaVersion: string;
  _generatedAt: string;
  _workflowRunId: string;
}

export interface CuratedRepositoryOverlay {
  repositoryId: RepositoryId;
  fullName: string;
  previousFullNames?: string[];
  exclude?: boolean;
  curationStatus?: CurationStatus;
  category?: RepositoryCategory;
  focusAreas?: RepositoryFocusArea[];
  audiences?: RepositoryAudience[];
  featured?: boolean;
  customDescription?: string;
  maintainerNotes?: string;
  health?: CuratedRepositoryHealthContainer;
}

export interface MergedRepositoryRecord extends Omit<GeneratedRepositoryRecord, "health"> {
  previousFullNames?: string[];
  exclude?: boolean;
  curationStatus?: CurationStatus;
  category?: RepositoryCategory;
  focusAreas?: RepositoryFocusArea[];
  audiences?: RepositoryAudience[];
  featured?: boolean;
  customDescription?: string;
  displayDescription?: string;
  maintainerNotes?: string;
  health?: RepositoryHealth;
  _curatedAt?: string;
  _curatedBy?: string;
}

export type RepositoryRecord = GeneratedRepositoryRecord;

export interface Provenance {
  generatedAt: string;
  workflowRunId: string;
}

export interface CandidateProvider {
  searchRepositories(criterion: SearchCriterion): Promise<SearchRepository[]>;
  getRepositoryDetails(repositoryFullName: string, searchRepository: SearchRepository): Promise<RepositoryDetails>;
  batchGetRepositoryDetails?(repos: SearchRepository[]): Promise<Map<string, RepositoryDetails | Error>>;
}

export interface PipelineMetrics {
  criteriaCount: number;
  searchRequests: number;
  searchResultsBeforeDedupe: number;
  deduplicatedRepositories: number;
  activeRepositories: number;
  detailRequests: number;
  detailFailures: number;
  patPolicyFailures: number;
  patPolicyFailureNames: string[];
  detailBatchCalls: number;
  generatedRecords: number;
  warnings: string[];
  elapsedMs: number;
}

export interface GenerateResult {
  records: RepositoryRecord[];
  metrics: PipelineMetrics;
}
