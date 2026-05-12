export type RepositoryId = string | number;

export type RepositoryCategory =
  | 'copilot-studio'
  | 'power-apps'
  | 'power-automate'
  | 'power-pages'
  | 'dataverse'
  | 'power-bi'
  | 'connectors'
  | 'alm-devops'
  | 'governance-admin'
  | 'developer-tooling'
  | 'samples-templates'
  | 'learning-docs';

export type RepositoryFocusArea =
  | 'agent-development'
  | 'bot-building'
  | 'custom-connectors'
  | 'pcf-controls'
  | 'canvas-apps'
  | 'model-driven-apps'
  | 'cloud-flows'
  | 'desktop-flows'
  | 'power-pages-sites'
  | 'dataverse-modeling'
  | 'environment-governance'
  | 'solution-lifecycle'
  | 'testing-quality'
  | 'community-samples';

export type RepositoryAudience = 'users' | 'contributors' | 'maintainers' | 'makers' | 'developers' | 'admins';

export type CurationStatus = 'unreviewed' | 'reviewed' | 'needs-review';

export interface ComputedRepositoryHealth {
  activityStatus?: 'active' | 'stale' | 'inactive' | 'archived';
  hasRecentRelease?: boolean;
  hasContributionSignals?: boolean;
  hasTrustSignals?: boolean;
}

export interface CuratedRepositoryHealth {
  maturity?: 'experimental' | 'stable' | 'mature' | 'unknown';
  maintenance?: 'maintained' | 'limited' | 'unmaintained' | 'unknown';
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface RepositoryHealth {
  computed?: ComputedRepositoryHealth;
  curated?: CuratedRepositoryHealth;
}

export interface Repository {
  createdAt: string;
  description: string;
  fullName: string;
  repositoryId?: RepositoryId;
  hasIssues: boolean;
  homepage: string | null;
  isArchived: boolean;
  language: string;
  license: {
    key?: string;
    name: string;
    url?: string;
  } | null;
  name: string;
  openIssuesCount: number;
  owner: {
    id?: string;
    is_bot?: boolean;
    login: string;
    type?: string;
    url?: string;
  };
  updatedAt: string;
  url: string;
  codeOfConduct: {
    key?: string;
    name: string;
    url?: string;
  } | null;
  forkCount: number;
  fundingLinks: unknown[];
  isSecurityPolicyEnabled: boolean;
  isTemplate: boolean;
  latestRelease: {
    name?: string;
    tagName: string;
    url?: string;
    publishedAt: string;
  } | null;
  primaryLanguage: {
    name: string;
  } | null;
  securityPolicyUrl: string | null;
  stargazerCount: number;
  watchers: {
    totalCount: number;
  };
  topics: string[];
  languages: string[];
  openedGoodFirstIssues: number;
  hasGoodFirstIssues: boolean;
  openedHelpWantedIssues: number;
  hasHelpWantedIssues: boolean;
  openedToContributionsIssues: number;
  popularityScore: number;
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
  _schemaVersion: string;
  _generatedAt: string;
  _workflowRunId: string;
  _curatedAt?: string;
  _curatedBy?: string;
}

export type Item = {
  hasGoodFirstIssues: boolean;
  hasHelpWantedIssues: boolean;
  codeOfConduct: { name: string } | null;
  topics: string[];
  languages: string[];
  license: { name: string } | null;
  owner: { login: string };
};
