import { data } from './mockData';
import { filterItemsBasedOnSearchInput } from '../../src/utils/filterItemsBasedOnSearchInput';

describe('filterItemsBasedOnSearchInput', () => {
  it('returns the full list when the search text is empty', () => {
    const result = filterItemsBasedOnSearchInput(data, '');
    expect(result).toEqual(data);
  });

  it('returns a filtered list when the search text is not empty and the search text has an exact match in the fullname of a repository', () => {
    const result = filterItemsBasedOnSearchInput(data, 'rpothin');
    expect(result).toEqual([data[1]]);
  });

  it('returns a filtered list when the search text is not empty and the search text has a fuzzy match in the fullname of a repository', () => {
    const result = filterItemsBasedOnSearchInput(data, 'rppooothin');
    expect(result).toEqual([data[1]]);
  });

  it('returns a filtered list when the search text is not empty and the search text has an exact match in the description of a repository', () => {
    const result = filterItemsBasedOnSearchInput(data, 'awesome');
    expect(result).toEqual([data[0]]);
  });

  it('returns a filtered list when the search text is not empty and the search text has a fuzzy match in the description of a repository', () => {
    const result = filterItemsBasedOnSearchInput(data, 'awesom');
    expect(result).toEqual([data[0]]);
  });

  it('returns a filtered list when the search text is not empty and the search text has an exact match in the topics of a repository', () => {
    const result = filterItemsBasedOnSearchInput(data, 'powerapps');
    expect(result).toEqual([data[0]]);
  });

  it('returns a filtered list when the search text is not empty and the search text has a fuzzy match in the topics of a repository', () => {
    const result = filterItemsBasedOnSearchInput(data, 'powerautomt');
    expect(result).toEqual([data[0]]);
  });

  it('returns a filtered list when the search text is not empty and the search text has an exact match in the language of a repository', () => {
    const result = filterItemsBasedOnSearchInput(data, 'JavaScript');
    expect(result).toEqual([data[0]]);
  });

  it('returns a filtered list when the search text is not empty and the search text has a fuzzy match in the language of a repository', () => {
    const result = filterItemsBasedOnSearchInput(data, 'JavScrpt');
    expect(result).toEqual([data[0]]);
  });

  it('returns a filtered list when the search text is not empty and the search text has an exact match in the owner of a repository', () => {
    const result = filterItemsBasedOnSearchInput(data, 'rpothin');
    expect(result).toEqual([data[1]]);
  });

  it('returns a filtered list when the search text is not empty and the search text has a fuzzy match in the owner of a repository', () => {
    const result = filterItemsBasedOnSearchInput(data, 'rppooothin');
    expect(result).toEqual([data[1]]);
  });

  it('returns a filtered list when the search text is not empty and the search text has an exact match in the license name of a repository', () => {
    const result = filterItemsBasedOnSearchInput(data, 'MIT');
    expect(result).toEqual([data[0]]);
  });

  it('returns a filtered list when the search text is not empty and the search text has a fuzzy match in the license name of a repository', () => {
    const result = filterItemsBasedOnSearchInput(data, 'MIIT');
    expect(result).toEqual([data[0]]);
  });

  it('returns a filtered list when the search text is not empty and the search text has an exact match in the code of conduct name of a repository', () => {
    const result = filterItemsBasedOnSearchInput(data, 'Citizen Code of Conduct');
    expect(result).toEqual([data[1]]);
  });

  it('returns a filtered list when the search text is not empty and the search text has a fuzzy match in the code of conduct name of a repository', () => {
    const result = filterItemsBasedOnSearchInput(data, 'Covenaant');
    expect(result).toEqual([data[0]]);
  });

  it('returns an empty list when the search text is not empty and the search text does not match any of the fields of a repository', () => {
    const result = filterItemsBasedOnSearchInput(data, 'abc');
    expect(result).toEqual([]);
  });
});