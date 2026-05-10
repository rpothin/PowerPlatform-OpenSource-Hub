import { Repository } from '../../src/types/repository';

// Mock data
export const data: Repository[] = [
    {
      createdAt: '2021-01-01T00:00:00Z',
      fullName: 'microsoft/PowerPlatform',
      url: 'https://github.com/user1/repo1',
      name: 'repo1',
      hasIssues: true,
      homepage: '',
      isArchived: false,
      openIssuesCount: 10,
      owner: {
        id: 'owner-1',
        is_bot: false,
        login: 'microsoft',
        type: 'Organization',
        url: 'https://github.com/microsoft',
      },
      description: 'This is an awesome repository!',
      license: {
        key: 'mit',
        name: 'MIT',
        url: 'https://api.github.com/licenses/mit',
      },
      codeOfConduct: {
        key: 'contributor_covenant',
        name: 'Contributor Covenant',
        url: 'https://example.com/codeofconduct',
      },
      topics: ['powerapps', 'powerautomate'],
      language: 'JavaScript',
      languages: [
        'JavaScript'
      ],
      stargazerCount: 100,
      watchers: {
        totalCount: 10,
      },
      hasGoodFirstIssues: true,
      hasHelpWantedIssues: false,
      openedGoodFirstIssues: 1,
      openedHelpWantedIssues: 0,
      openedToContributionsIssues: 1,
      popularityScore: 110,
      forkCount: 20,
      fundingLinks: [],
      isSecurityPolicyEnabled: true,
      isTemplate: false,
      latestRelease: {
        name: 'v1.0',
        tagName: 'v1.0',
        url: 'https://github.com/user1/repo1/releases/tag/v1.0',
        publishedAt: '2022-01-01T00:00:00Z',
      },
      primaryLanguage: {
        name: 'JavaScript',
      },
      securityPolicyUrl: null,
      _schemaVersion: '1.0.0',
      _generatedAt: '2026-01-01T00:00:00Z',
      _workflowRunId: 'local',
      updatedAt: '2022-01-01T00:00:00Z',
    },
    {
      createdAt: '2021-01-02T00:00:00Z',
      fullName: 'rpothin/PowerPlatform',
      url: 'https://github.com/user2/repo2',
      name: 'repo2',
      hasIssues: true,
      homepage: '',
      isArchived: false,
      openIssuesCount: 5,
      owner: {
        id: 'owner-2',
        is_bot: false,
        login: 'rpothin',
        type: 'User',
        url: 'https://github.com/rpothin',
      },
      description: 'This is Repo 2',
      license: {
        key: 'apache-2.0',
        name: 'Apache',
        url: 'https://api.github.com/licenses/apache-2.0',
      },
      codeOfConduct: {
        key: 'citizen_code_of_conduct',
        name: 'Citizen Code of Conduct',
        url: 'https://example.com/codeofconduct2',
      },
      topics: ['azure', 'cloud'],
      language: 'TypeScript',
      languages: [
        'TypeScript'
      ],
      stargazerCount: 200,
      watchers: {
        totalCount: 20,
      },
      hasGoodFirstIssues: false,
      hasHelpWantedIssues: true,
      openedGoodFirstIssues: 0,
      openedHelpWantedIssues: 2,
      openedToContributionsIssues: 2,
      popularityScore: 220,
      forkCount: 15,
      fundingLinks: [],
      isSecurityPolicyEnabled: true,
      isTemplate: false,
      latestRelease: {
        name: 'v2.0',
        tagName: 'v2.0',
        url: 'https://github.com/user2/repo2/releases/tag/v2.0',
        publishedAt: '2022-02-02T00:00:00Z',
      },
      primaryLanguage: {
        name: 'TypeScript',
      },
      securityPolicyUrl: null,
      _schemaVersion: '1.0.0',
      _generatedAt: '2026-01-01T00:00:00Z',
      _workflowRunId: 'local',
      updatedAt: '2022-02-02T00:00:00Z',
    }
    // more mock repositories...
  ];
