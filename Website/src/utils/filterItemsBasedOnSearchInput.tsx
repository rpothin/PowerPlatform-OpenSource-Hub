
// Third-party libraries
import Fuse from 'fuse.js';

// Local files
import { Repository } from '../types/repository';
import { getTaxonomyLabel } from '../data/taxonomy';

type SearchableRepository = {
    repository: Repository;
    index: number;
    taxonomyLabels: string[];
};

const getRepositoryTaxonomyLabels = (repository: Repository): string[] => {
    const taxonomyValues: string[] = [];

    if (repository.category) {
      taxonomyValues.push(repository.category);
    }
    taxonomyValues.push(...(repository.focusAreas ?? []));
    taxonomyValues.push(...(repository.audiences ?? []));

    return taxonomyValues
      .flatMap((value) => [value, getTaxonomyLabel(value)])
      .filter((value): value is string => !!value);
};

/**
 * Filters an array of repositories based on a search text.
 * @param data - The array of repositories to filter.
 * @param searchText - The search text to filter the repositories by.
 * @returns The filtered array of repositories.
 */
export const filterItemsBasedOnSearchInput = (data: Repository[], searchText: string): Repository[] => {
    if (searchText === '') {
      return data;
    }

    const searchableData: SearchableRepository[] = data.map((repository, index) => ({
      repository,
      index,
      taxonomyLabels: getRepositoryTaxonomyLabels(repository),
    }));

    const fuse = new Fuse(searchableData, {
      keys: [
        { name: 'repository.fullName', weight: 3 },
        { name: 'repository.displayDescription', weight: 2.5 },
        { name: 'repository.customDescription', weight: 2 },
        { name: 'taxonomyLabels', weight: 2 },
        { name: 'repository.description', weight: 1 },
        { name: 'repository.topics', weight: 0.8 },
        { name: 'repository.language', weight: 0.5 },
        { name: 'repository.owner.login', weight: 0.5 },
        { name: 'repository.license.name', weight: 0.3 },
        { name: 'repository.codeOfConduct.name', weight: 0.3 },
      ],
      includeScore: true,
      findAllMatches: true,
      threshold: 0.3
    });

    const result = fuse.search(searchText);
    return result.map(item => data[item.item.index]);
  };
