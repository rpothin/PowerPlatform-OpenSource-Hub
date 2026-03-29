export interface RepositoryOwner {
  id: string;
  is_bot: boolean;
  login: string;
  type: string;
  url: string;
}

export interface RepositoryLicense {
  key: string;
  name: string;
  url: string;
}

export interface RepositoryRelease {
  name: string;
  tagName: string;
  url: string;
  publishedAt: string;
}

export interface Repository {
  createdAt: string;
  description: string;
  fullName: string;
  hasIssues: boolean;
  homepage: string;
  isArchived: boolean;
  language: string;
  license: RepositoryLicense | null;
  name: string;
  openIssuesCount: number;
  owner: RepositoryOwner;
  updatedAt: string;
  url: string;
  forkCount: number;
  isTemplate: boolean;
  latestRelease: RepositoryRelease | null;
  primaryLanguage: { name: string } | null;
  stargazerCount: number;
  watchers: { totalCount: number };
  topics: string[];
  languages: string[];
  openedGoodFirstIssues: number;
  hasGoodFirstIssues: boolean;
  openedHelpWantedIssues: number;
  hasHelpWantedIssues: boolean;
  openedToContributionsIssues: number;
  popularityScore: number;
}
