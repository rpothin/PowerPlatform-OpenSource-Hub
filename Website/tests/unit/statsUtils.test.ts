import {
  computeTotalRepos,
  computeActiveRepos,
  computeContributionOpportunities,
  computeTotalStars,
  computeMomentum,
  type SnapshotEntry,
  type SnapshotMetadata,
} from '../../src/utils/statsUtils';
import type { Repository } from '../../src/types/repository';

function makeRepo(overrides: Partial<Repository>): Repository {
  return {
    createdAt: '2021-01-01T00:00:00Z',
    fullName: 'owner/repo',
    url: 'https://github.com/owner/repo',
    name: 'repo',
    hasIssues: true,
    homepage: null,
    isArchived: false,
    openIssuesCount: 0,
    owner: { login: 'owner' },
    description: '',
    license: null,
    codeOfConduct: null,
    topics: [],
    language: 'TypeScript',
    languages: ['TypeScript'],
    stargazerCount: 0,
    watchers: { totalCount: 0 },
    hasGoodFirstIssues: false,
    hasHelpWantedIssues: false,
    openedGoodFirstIssues: 0,
    openedHelpWantedIssues: 0,
    openedToContributionsIssues: 0,
    popularityScore: 0,
    forkCount: 0,
    fundingLinks: [],
    isSecurityPolicyEnabled: false,
    isTemplate: false,
    latestRelease: null,
    primaryLanguage: null,
    securityPolicyUrl: null,
    updatedAt: '2021-01-01T00:00:00Z',
    _schemaVersion: '1.0.0',
    _generatedAt: '2026-01-01T00:00:00Z',
    _workflowRunId: 'test',
    ...overrides,
  };
}

describe('computeTotalRepos', () => {
  it('returns 0 for empty array', () => {
    expect(computeTotalRepos([])).toBe(0);
  });

  it('returns the count of repos', () => {
    const repos = [makeRepo({ fullName: 'a/b' }), makeRepo({ fullName: 'c/d' }), makeRepo({ fullName: 'e/f' })];
    expect(computeTotalRepos(repos)).toBe(3);
  });
});

describe('computeActiveRepos', () => {
  const reference = new Date('2026-05-21T12:00:00Z');

  it('returns 0 for empty array', () => {
    expect(computeActiveRepos([], reference)).toBe(0);
  });

  it('counts repos updated within 30 days (strictly greater than cutoff)', () => {
    // cutoff = 2026-04-21T12:00:00Z
    const repos = [
      makeRepo({ fullName: 'a/active', updatedAt: '2026-05-01T00:00:00Z' }), // 20 days ago — active
      makeRepo({ fullName: 'b/stale', updatedAt: '2026-03-01T00:00:00Z' }),  // >30 days ago — stale
    ];
    expect(computeActiveRepos(repos, reference)).toBe(1);
  });

  it('excludes repo updated exactly 30 days ago (boundary: not strictly greater)', () => {
    // Cutoff = 2026-04-21T12:00:00Z; exactly 30 days before reference
    const repos = [
      makeRepo({ fullName: 'a/exact30', updatedAt: '2026-04-21T12:00:00Z' }), // equal to cutoff — NOT included
    ];
    expect(computeActiveRepos(repos, reference)).toBe(0);
  });

  it('includes repo updated 29 days ago', () => {
    // 29 days before reference = 2026-04-22T12:00:00Z
    const repos = [
      makeRepo({ fullName: 'a/recent', updatedAt: '2026-04-22T12:00:00Z' }),
    ];
    expect(computeActiveRepos(repos, reference)).toBe(1);
  });

  it('includes repo updated 1 second after the cutoff', () => {
    // cutoff = 2026-04-21T12:00:00Z; 1 second after = 2026-04-21T12:00:01Z
    const repos = [
      makeRepo({ fullName: 'a/just-inside', updatedAt: '2026-04-21T12:00:01Z' }),
    ];
    expect(computeActiveRepos(repos, reference)).toBe(1);
  });

  it('does not mutate the reference date', () => {
    const refCopy = new Date(reference);
    computeActiveRepos([makeRepo({})], reference);
    expect(reference.getTime()).toBe(refCopy.getTime());
  });
});

describe('computeContributionOpportunities', () => {
  it('returns zeros for empty array', () => {
    const result = computeContributionOpportunities([]);
    expect(result.issueCount).toBe(0);
    expect(result.repoCount).toBe(0);
  });

  it('ignores repos with zero contribution issues', () => {
    const repos = [
      makeRepo({ fullName: 'a/no-issues', openedToContributionsIssues: 0 }),
      makeRepo({ fullName: 'b/no-issues', openedToContributionsIssues: 0 }),
    ];
    const result = computeContributionOpportunities(repos);
    expect(result.issueCount).toBe(0);
    expect(result.repoCount).toBe(0);
  });

  it('sums issues and counts repos correctly', () => {
    const repos = [
      makeRepo({ fullName: 'a/repo', openedToContributionsIssues: 5 }),
      makeRepo({ fullName: 'b/repo', openedToContributionsIssues: 3 }),
      makeRepo({ fullName: 'c/repo', openedToContributionsIssues: 0 }),
    ];
    const result = computeContributionOpportunities(repos);
    expect(result.issueCount).toBe(8);
    expect(result.repoCount).toBe(2);
  });
});

describe('computeTotalStars', () => {
  it('returns 0 for empty array', () => {
    expect(computeTotalStars([])).toBe(0);
  });

  it('sums star counts across all repos', () => {
    const repos = [
      makeRepo({ fullName: 'a/r', stargazerCount: 100 }),
      makeRepo({ fullName: 'b/r', stargazerCount: 250 }),
      makeRepo({ fullName: 'c/r', stargazerCount: 50 }),
    ];
    expect(computeTotalStars(repos)).toBe(400);
  });
});

describe('computeMomentum', () => {
  const metadata: SnapshotMetadata = { _snapshotTakenAt: '2026-04-21T00:00:00.000Z' };

  it('returns delta=0 and null snapshotTakenAt when metadata is null', () => {
    const repos = [makeRepo({ fullName: 'a/r', popularityScore: 100 })];
    const snapshot: SnapshotEntry[] = [{ fullName: 'a/r', popularityScore: 100 }];
    const result = computeMomentum(repos, snapshot, null);
    expect(result.delta).toBe(0);
    expect(result.snapshotTakenAt).toBeNull();
  });

  it('returns the snapshotTakenAt from metadata when provided', () => {
    const result = computeMomentum([], [], metadata);
    expect(result.snapshotTakenAt).toBe('2026-04-21T00:00:00.000Z');
  });

  it('returns null snapshotTakenAt when metadata._snapshotTakenAt is null', () => {
    const result = computeMomentum([], [], { _snapshotTakenAt: null });
    expect(result.snapshotTakenAt).toBeNull();
  });

  it('computes positive delta when score increased', () => {
    const repos = [makeRepo({ fullName: 'a/r', popularityScore: 150 })];
    const snapshot: SnapshotEntry[] = [{ fullName: 'a/r', popularityScore: 100 }];
    const result = computeMomentum(repos, snapshot, metadata);
    expect(result.delta).toBe(50);
  });

  it('computes negative delta when score decreased', () => {
    const repos = [makeRepo({ fullName: 'a/r', popularityScore: 80 })];
    const snapshot: SnapshotEntry[] = [{ fullName: 'a/r', popularityScore: 100 }];
    const result = computeMomentum(repos, snapshot, metadata);
    expect(result.delta).toBe(-20);
  });

  it('treats repos missing from snapshot as baseline 0', () => {
    const repos = [makeRepo({ fullName: 'new/repo', popularityScore: 200 })];
    const snapshot: SnapshotEntry[] = [];
    const result = computeMomentum(repos, snapshot, metadata);
    expect(result.delta).toBe(200);
  });

  it('sums delta across multiple repos', () => {
    const repos = [
      makeRepo({ fullName: 'a/r', popularityScore: 150 }),
      makeRepo({ fullName: 'b/r', popularityScore: 90 }),
      makeRepo({ fullName: 'new/r', popularityScore: 50 }),
    ];
    const snapshot: SnapshotEntry[] = [
      { fullName: 'a/r', popularityScore: 100 }, // +50
      { fullName: 'b/r', popularityScore: 100 }, // -10
      // new/r missing → baseline 0, +50
    ];
    const result = computeMomentum(repos, snapshot, metadata);
    expect(result.delta).toBe(90);
  });

  it('returns delta=0 for empty data array', () => {
    const result = computeMomentum([], [{ fullName: 'a/r', popularityScore: 100 }], metadata);
    expect(result.delta).toBe(0);
  });
});
