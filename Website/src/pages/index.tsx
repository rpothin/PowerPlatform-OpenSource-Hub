import * as React from 'react';
import { useEffect } from 'react';
import Link from '@docusaurus/Link';
import { useHistory } from '@docusaurus/router';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import type { Repository } from '../types/repository';
import type { SnapshotEntry, SnapshotMetadata } from '../utils/statsUtils';
import {
  computeTotalRepos,
  computeActiveRepos,
  computeContributionOpportunities,
  computeTotalStars,
  computeMomentum,
} from '../utils/statsUtils';
import styles from './index.module.css';
import repoData from '../../../Data/GitHubRepositoriesDetails.json';
import snapshotData from '../../../Data/GitHubRepositoriesPopularityScoresSnapshot.json';
import snapshotMetadata from '../../../Data/GitHubRepositoriesPopularityScoresSnapshotMetadata.json';

const data = repoData as Repository[];
const snapshot = snapshotData as SnapshotEntry[];
const metadata = (snapshotMetadata as SnapshotMetadata)._snapshotTakenAt
  ? (snapshotMetadata as SnapshotMetadata)
  : null;

// Reference date from first repo's _generatedAt field (build-time reference)
const rawGeneratedAt = data.length > 0 ? data[0]._generatedAt : undefined;
const parsedReferenceDate = rawGeneratedAt ? new Date(rawGeneratedAt) : new Date();
const referenceDate = Number.isNaN(parsedReferenceDate.getTime()) ? new Date() : parsedReferenceDate;

const totalRepos = computeTotalRepos(data);
const activeRepos = computeActiveRepos(data, referenceDate);
const contributions = computeContributionOpportunities(data);
const totalStars = computeTotalStars(data);
const momentum = computeMomentum(data, snapshot, metadata);

const numberFormatter = new Intl.NumberFormat('en-US');

const galleryParams = [
  'q', 'sort', 'topics', 'languages', 'licenses', 'owners',
  'categories', 'focusAreas', 'audiences', 'goodFirstIssue', 'helpWantedIssue', 'codeOfConduct',
];

interface StatCardProps {
  emoji: string;
  value: string;
  label: string;
}

function StatCard({ emoji, value, label }: StatCardProps): React.JSX.Element {
  return (
    <div className={styles.statCard}>
      <div className={styles.statIcon}>{emoji}</div>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}

export default function LandingPage(): React.JSX.Element {
  const history = useHistory();
  const galleryUrl = useBaseUrl('/gallery');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const hasGalleryParams = galleryParams.some(p => params.has(p));
    if (hasGalleryParams) {
      history.replace(galleryUrl + window.location.search);
    }
  }, []);

  return (
    <Layout
      title="Power Platform Open-Source Hub"
      description="Discover, contribute to, and maintain open-source projects for Microsoft Power Platform and Copilot Studio. Track hundreds of community repositories updated continuously from GitHub."
    >
      <header className={styles.heroBanner}>
        <div className="container">
          <Heading as="h1" className={styles.heroTitle}>
            Power Platform Open-Source Hub
          </Heading>
          <p className={styles.heroSubtitle}>
            Discover, contribute to, and maintain open-source projects for Microsoft Power Platform and Copilot Studio.
          </p>
          <p className={styles.heroBody}>
            The hub tracks <strong>{numberFormatter.format(totalRepos)}</strong> open-source repositories — from Power Apps components and connectors
            to Dataverse tools and governance frameworks. Updated continuously from GitHub.
          </p>
        </div>
      </header>

      <main>
        <div className="container">
          <div data-testid="stats-row" className={styles.statsRow}>
            <StatCard
              emoji="🗂"
              value={numberFormatter.format(totalRepos)}
              label="Tracked Repositories"
            />
            <StatCard
              emoji="⚡"
              value={numberFormatter.format(activeRepos)}
              label="Active in Last 30 Days"
            />
            <StatCard
              emoji="🤝"
              value={`${numberFormatter.format(contributions.issueCount)} issues across ${numberFormatter.format(contributions.repoCount)} repos`}
              label="Open to Contributions"
            />
            <StatCard
              emoji="⭐"
              value={numberFormatter.format(totalStars)}
              label="Stars Across the Ecosystem"
            />
            {momentum.snapshotTakenAt && (
              <StatCard
                emoji="📈"
                value={`${momentum.delta >= 0 ? '+' : ''}${numberFormatter.format(momentum.delta)}`}
                label="Stars+Watchers Since Last Snapshot"
              />
            )}
          </div>

          <div className={styles.ctaSection}>
            <Link to="/gallery" className="button button--primary button--lg">
              Explore the Gallery →
            </Link>
          </div>
        </div>
      </main>
    </Layout>
  );
}
