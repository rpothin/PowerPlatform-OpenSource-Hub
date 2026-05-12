import * as React from 'react';
import Link from '@docusaurus/Link';

import data from '../../../Data/GitHubRepositoriesDetails.json';
import { categories } from '../data/taxonomy';
import type { Repository, RepositoryCategory } from '../types/repository';
import { getRepositoryDescription } from '../utils/galleryUtils';

type CategoryRepositoryListProps = {
  categoryId: RepositoryCategory;
};

const numberFormatter = new Intl.NumberFormat('en-US');

const getPrimaryLanguage = (repository: Repository): string | undefined =>
  repository.primaryLanguage?.name ?? repository.language ?? undefined;

const formatDate = (date: string): string =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));

const buildMetadata = (repository: Repository): string[] => {
  const metadata = [`★ ${numberFormatter.format(repository.stargazerCount)}`];
  const language = getPrimaryLanguage(repository);

  if (language) {
    metadata.push(language);
  }

  if (repository.updatedAt) {
    metadata.push(`Updated ${formatDate(repository.updatedAt)}`);
  }

  if (repository.hasGoodFirstIssues) {
    metadata.push(`${repository.openedGoodFirstIssues} good first issue${repository.openedGoodFirstIssues === 1 ? '' : 's'}`);
  }

  return metadata;
};

export default function CategoryRepositoryList({ categoryId }: CategoryRepositoryListProps): JSX.Element {
  const category = categories.find((entry) => entry.value === categoryId);
  const repositories = (data as Repository[])
    .filter((repository) => !repository.exclude && repository.category === categoryId)
    .sort((left, right) =>
      right.stargazerCount - left.stargazerCount || left.fullName.localeCompare(right.fullName),
    );
  const galleryFilterUrl = `/?categories=${encodeURIComponent(categoryId)}`;

  return (
    <section aria-labelledby={`category-${categoryId}-repositories`}>
      <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'space-between' }}>
        <h2 id={`category-${categoryId}-repositories`} style={{ marginBottom: 0 }}>
          {category?.label ?? categoryId} repositories
        </h2>
        <Link className="button button--primary button--sm" to={galleryFilterUrl}>
          View all in gallery
        </Link>
      </div>

      {repositories.length === 0 ? (
        <p style={{ marginTop: '1rem' }}>
          <em>No repositories in this category yet.</em>
        </p>
      ) : (
        <ul style={{ display: 'grid', gap: '0.75rem', listStyle: 'none', paddingLeft: 0 }}>
          {repositories.map((repository) => {
            const description = getRepositoryDescription(repository);
            const metadata = buildMetadata(repository);

            return (
              <li
                key={repository.fullName}
                style={{ border: '1px solid var(--ifm-color-emphasis-300)', borderRadius: '8px', padding: '1rem' }}
              >
                <div style={{ alignItems: 'flex-start', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'space-between' }}>
                  <div>
                    <strong>{repository.name}</strong>
                    <div style={{ color: 'var(--ifm-color-emphasis-700)', fontSize: '0.9rem' }}>{repository.fullName}</div>
                  </div>
                  <a href={repository.url} rel="noopener noreferrer" target="_blank">
                    GitHub
                  </a>
                </div>
                {description && <p style={{ margin: '0.75rem 0 0.5rem' }}>{description}</p>}
                <small style={{ color: 'var(--ifm-color-emphasis-700)' }}>{metadata.join(' · ')}</small>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

