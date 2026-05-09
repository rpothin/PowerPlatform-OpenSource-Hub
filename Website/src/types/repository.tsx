export interface Repository {
  createdAt: string;
  description: string;
  fullName: string;
  hasIssues: boolean;
  homepage: string | null;
  isArchived: boolean;
  language: string;
  license: {
    key?: string;
    name: string;
    url?: string;
  };
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
  _schemaVersion: string;
  _generatedAt: string;
  _workflowRunId: string;
}

export type Item = {
  hasGoodFirstIssues: boolean;
  hasHelpWantedIssues: boolean;
  codeOfConduct: { name: string } | null;
  topics: string[];
  languages: string[];
  license: { name: string };
  owner: { login: string };
};
