import { Repository } from '../../src/types/repository';

// Mock data
export const data: Repository[] = [
    {
      fullName: 'microsoft/PowerPlatform',
      url: 'https://github.com/user1/repo1',
      name: 'repo1',
      owner: {
        login: 'microsoft',
      },
      description: 'This is an awesome repository!',
      license: {
        name: 'MIT',
      },
      codeOfConduct: {
        name: 'Contributor Covenant',
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
      latestRelease: {
        tagName: 'v1.0',
        publishedAt: '2022-01-01T00:00:00Z',
      },
      updatedAt: '2022-01-01T00:00:00Z',
    },
    {
      fullName: 'rpothin/PowerPlatform',
      url: 'https://github.com/user2/repo2',
      name: 'repo2',
      owner: {
        login: 'rpothin',
      },
      description: 'This is Repo 2',
      license: {
        name: 'Apache',
      },
      codeOfConduct: {
        name: 'Citizen Code of Conduct',
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
      latestRelease: {
        tagName: 'v2.0',
        publishedAt: '2022-02-02T00:00:00Z',
      },
      updatedAt: '2022-02-02T00:00:00Z',
    }
    // more mock repositories...
  ];