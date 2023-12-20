// Defining the Repository interface
export interface Repository {
    fullName: string;
    url: string;
    name: string;
    owner: {
        login: string;
    };
    description: string;
    license: {
        name: string;
    };
    codeOfConduct: {
        name: string;
    };
    topics: string[];
    language: string;
    languages: string[];
    stargazerCount: number;
    watchers: {
        totalCount: number;
    };
    hasGoodFirstIssues?: boolean;
    hasHelpWantedIssues?: boolean;
    latestRelease?: {
      tagName: string;
      publishedAt: string;
    };
    updatedAt: string;
}

/**
 * Represents an item in the gallery.
 */
export type Item = {
    hasGoodFirstIssues: boolean;
    hasHelpWantedIssues: boolean;
    codeOfConduct: { name: string } | null;
    topics: string[];
    languages: string[];
    license: { name: string };
    owner: { login: string };
};