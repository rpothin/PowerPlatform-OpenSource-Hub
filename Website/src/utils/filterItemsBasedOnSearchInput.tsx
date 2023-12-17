
// Third-party libraries
import Fuse from 'fuse.js';

// Local files
import { Repository } from '../types/repository';

/**
 * Filters an array of repositories based on a search text.
 * @param data - The array of repositories to filter.
 * @param searchText - The search text to filter the repositories by.
 * @returns The filtered array of repositories.
 */
export const filterItemsBasedOnSearchInput = (data: Repository[], searchText: string): Repository[] => {
    const fuse = new Fuse(data, {
      keys: ['fullName', 'description', 'topics', 'language', 'owner.login', 'license.name', 'codeOfConduct.name'],
      includeScore: true,
      findAllMatches: true,
      threshold: 0.3
    });
  
    if (searchText === '') {
      return data;
    } else {
      const result = fuse.search(searchText);
      return result.map(item => item.item);
    }
  };