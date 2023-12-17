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