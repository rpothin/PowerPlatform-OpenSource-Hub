import type { Repository } from '../types/repository';

export interface SnapshotEntry {
  fullName: string;
  popularityScore: number;
}

export interface SnapshotMetadata {
  _snapshotTakenAt: string | null;
}

export interface ContributionOpportunities {
  issueCount: number;
  repoCount: number;
}

export interface MomentumResult {
  delta: number;
  snapshotTakenAt: string | null;
}

export function computeTotalRepos(data: Repository[]): number {
  return data.length;
}

export function computeActiveRepos(data: Repository[], referenceDate: Date): number {
  const cutoff = new Date(referenceDate);
  cutoff.setDate(cutoff.getDate() - 30);
  return data.filter(repo => new Date(repo.updatedAt) > cutoff).length;
}

export function computeContributionOpportunities(data: Repository[]): ContributionOpportunities {
  const reposWithIssues = data.filter(r => r.openedToContributionsIssues > 0);
  return {
    issueCount: reposWithIssues.reduce((sum, r) => sum + r.openedToContributionsIssues, 0),
    repoCount: reposWithIssues.length,
  };
}

export function computeTotalStars(data: Repository[]): number {
  return data.reduce((sum, r) => sum + r.stargazerCount, 0);
}

export function computeMomentum(
  data: Repository[],
  snapshot: SnapshotEntry[],
  metadata: SnapshotMetadata | null,
): MomentumResult {
  const snapshotMap = new Map(snapshot.map(s => [s.fullName, s.popularityScore]));
  const delta = data.reduce((sum, r) => {
    const base = snapshotMap.get(r.fullName) ?? 0;
    return sum + (r.popularityScore - base);
  }, 0);
  return {
    delta,
    snapshotTakenAt: metadata?._snapshotTakenAt ?? null,
  };
}
