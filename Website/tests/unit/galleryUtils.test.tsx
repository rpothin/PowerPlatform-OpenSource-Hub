import { data } from './mockData';
import { filterItems, sortItems, isActive } from '../../src/utils/galleryUtils';

describe('filterItems', () => {
  it('returns the full list when no filters are specified', () => {
    const result = filterItems(data, {
      hasGoodFirstIssueChecked: false,
      hasHelpWantedIssueChecked: false,
      hasCodeOfConductChecked: false,
      selectedTopics: [],
      selectedLanguages: [],
      selectedLicenses: [],
      selectedOwners: []
    });
    expect(result).toEqual(data);
  });

  it('returns a filtered list when the filters are not empty and the hasGoodFirstIssueChecked option is checked', () => {
    const result = filterItems(data, {
      hasGoodFirstIssueChecked: true,
      hasHelpWantedIssueChecked: false,
      hasCodeOfConductChecked: false,
      selectedTopics: [],
      selectedLanguages: [],
      selectedLicenses: [],
      selectedOwners: []
    });
    expect(result).toEqual([data[0]]);
  });

  it('returns a filtered list when the filters are not empty and the hasHelpWantedIssueChecked option is checked', () => {
    const result = filterItems(data, {
      hasGoodFirstIssueChecked: false,
      hasHelpWantedIssueChecked: true,
      hasCodeOfConductChecked: false,
      selectedTopics: [],
      selectedLanguages: [],
      selectedLicenses: [],
      selectedOwners: []
    });
    expect(result).toEqual([data[1]]);
  });

  it('returns a filtered list when the filters are not empty and the hasCodeOfConductChecked option is checked', () => {
    const result = filterItems(data, {
      hasGoodFirstIssueChecked: false,
      hasHelpWantedIssueChecked: false,
      hasCodeOfConductChecked: true,
      selectedTopics: [],
      selectedLanguages: [],
      selectedLicenses: [],
      selectedOwners: []
    });
    expect(result).toEqual([data[0], data[1]]);
  });

  it('returns a filtered list when the filters are not empty and a topic is selected', () => {
    const result = filterItems(data, {
      hasGoodFirstIssueChecked: false,
      hasHelpWantedIssueChecked: false,
      hasCodeOfConductChecked: false,
      selectedTopics: ['powerapps'],
      selectedLanguages: [],
      selectedLicenses: [],
      selectedOwners: []
    });
    expect(result).toEqual([data[0]]);
    });

    it('returns a filtered list when the filters are not empty and a language is selected', () => {
        const result = filterItems(data, {
            hasGoodFirstIssueChecked: false,
            hasHelpWantedIssueChecked: false,
            hasCodeOfConductChecked: false,
            selectedTopics: [],
            selectedLanguages: ['JavaScript'],
            selectedLicenses: [],
            selectedOwners: []
        });
        expect(result).toEqual([data[0]]);
    });

    it('returns a filtered list when the filters are not empty and a license is selected', () => {
        const result = filterItems(data, {
            hasGoodFirstIssueChecked: false,
            hasHelpWantedIssueChecked: false,
            hasCodeOfConductChecked: false,
            selectedTopics: [],
            selectedLanguages: [],
            selectedLicenses: ['MIT'],
            selectedOwners: []
        });
        expect(result).toEqual([data[0]]);
    });

    it('returns a filtered list when the filters are not empty and an owner is selected', () => {
        const result = filterItems(data, {
            hasGoodFirstIssueChecked: false,
            hasHelpWantedIssueChecked: false,
            hasCodeOfConductChecked: false,
            selectedTopics: [],
            selectedLanguages: [],
            selectedLicenses: [],
            selectedOwners: ['microsoft']
        });
        expect(result).toEqual([data[0]]);
    });
});

describe('sortItems', () => {
    it('returns the full list with its order by default when no sort option is specified', () => {
        const result = sortItems(data, []);
        expect(result).toEqual(data);
    });

    it('returns a sorted list by number of stars in ascending order when a sort option is specified and the starsAsc option is selected', () => {
        const result = sortItems(data, ['starsAsc']);
        expect(result).toEqual([data[0], data[1]]);
    });

    it('returns a sorted list by number of stars in descending order when a sort option is specified and the starsDesc option is selected', () => {
        const result = sortItems(data, ['starsDesc']);
        expect(result).toEqual([data[1], data[0]]);
    });

    it('returns a sorted list by full name in alphabetical order when a sort option is specified and the alphabeticalAsc option is selected', () => {
        const result = sortItems(data, ['alphabeticalAsc']);
        expect(result).toEqual([data[0], data[1]]);
    });

    it('returns a sorted list by full name in reverse alphabetical order when a sort option is specified and the alphabeticalDesc option is selected', () => {
        const result = sortItems(data, ['alphabeticalDesc']);
        expect(result).toEqual([data[1], data[0]]);
    });
});

describe('isActive', () => {
    it('returns true when the date is within the last 10 days', () => {
        const today = new Date();
        today.setDate(today.getDate() - 5);
        const result = isActive(today.toISOString());
        expect(result).toEqual(true);
    });

    it('returns false when the date is not within the last 10 days', () => {
        const today = new Date();
        today.setDate(today.getDate() - 30);
        const result = isActive(today.toISOString());
        expect(result).toEqual(false);
    });
});