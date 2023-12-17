import { Repository } from '../../src/types/repository';
import { filterItemsBasedOnSearchInput } from '../../src/utils/filterItemsBasedOnSearchInput';

// Mock data
const data: Repository[] = [
  {
    fullName: 'microsoft/PowerPlatform',
    url: 'https://github.com/user1/repo1',
    name: 'repo1',
    owner: {
      login: 'user1',
    },
    description: 'This is Repo 1',
    license: {
      name: 'MIT',
    },
    codeOfConduct: {
      name: 'Contributor Covenant',
    },
    topics: ['topic1', 'topic2'],
    language: 'JavaScript',
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
      login: 'user2',
    },
    description: 'This is Repo 2',
    license: {
      name: 'Apache',
    },
    codeOfConduct: {
      name: 'Citizen Code of Conduct',
    },
    topics: ['topic3', 'topic4'],
    language: 'TypeScript',
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
  },
  // more mock repositories...
];

describe('filterItemsBasedOnSearchInput', () => {
  it('returns the full list when the search text is empty', () => {
    const result = filterItemsBasedOnSearchInput(data, '');
    expect(result).toEqual(data);
  });

  it('returns a filtered list when the search text is not empty and the search text has an exact match in the fullname of a repository', () => {
    const result = filterItemsBasedOnSearchInput(data, 'rpothin');
    expect(result).toEqual([data[1]]);
  });

  it('return a filtered list when the search text is not empty and the search text has a fuzzy match in the fullname of a repository', () => {
    const result = filterItemsBasedOnSearchInput(data, 'rppooothin');
    expect(result).toEqual([data[1]]);
  });

  it('returns a filtered list when the search text is not empty and the search text has an exact match in the license name of a repository', () => {
    const result = filterItemsBasedOnSearchInput(data, 'MIT');
    expect(result).toEqual([data[0]]);
  });

  it('returns a filtered list when the search text is not empty and the search text has a fuzzy match in the code of conduct name of a repository', () => {
    const result = filterItemsBasedOnSearchInput(data, 'Covenaant');
    expect(result).toEqual([data[0]]);
  });
});