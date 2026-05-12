export type UrlFilterState = {
  searchText: string;
  sortBy: string;
  hasGoodFirstIssueChecked: boolean;
  hasHelpWantedIssueChecked: boolean;
  hasCodeOfConductChecked: boolean;
  selectedTopics: string[];
  selectedLanguages: string[];
  selectedLicenses: string[];
  selectedOwners: string[];
  selectedCategories: string[];
  selectedFocusAreas: string[];
  selectedAudiences: string[];
};

export const defaultUrlFilterState: UrlFilterState = {
  searchText: '',
  sortBy: 'starsDesc',
  hasGoodFirstIssueChecked: false,
  hasHelpWantedIssueChecked: false,
  hasCodeOfConductChecked: false,
  selectedTopics: [],
  selectedLanguages: [],
  selectedLicenses: [],
  selectedOwners: [],
  selectedCategories: [],
  selectedFocusAreas: [],
  selectedAudiences: [],
};

const validSortValues = new Set([
  'starsAsc',
  'starsDesc',
  'alphabeticalAsc',
  'alphabeticalDesc',
  'recentlyUpdated',
  'recentlyReleased',
]);

const parseBoolean = (value: string | null): boolean => value === 'true' || value === '1';

const parseList = (value: string | null): string[] =>
  value ? value.split(',').map((item) => item.trim()).filter(Boolean) : [];

const parseSortBy = (value: string | null): string =>
  value && validSortValues.has(value) ? value : defaultUrlFilterState.sortBy;

export const parseFilterStateFromSearch = (search: string): UrlFilterState => {
  const params = new URLSearchParams(search);
  return {
    searchText: params.get('q') ?? defaultUrlFilterState.searchText,
    sortBy: parseSortBy(params.get('sort')),
    hasGoodFirstIssueChecked: parseBoolean(params.get('goodFirstIssue')),
    hasHelpWantedIssueChecked: parseBoolean(params.get('helpWantedIssue')),
    hasCodeOfConductChecked: parseBoolean(params.get('codeOfConduct')),
    selectedTopics: parseList(params.get('topics')),
    selectedLanguages: parseList(params.get('languages')),
    selectedLicenses: parseList(params.get('licenses')),
    selectedOwners: parseList(params.get('owners')),
    selectedCategories: parseList(params.get('categories')),
    selectedFocusAreas: parseList(params.get('focusAreas')),
    selectedAudiences: parseList(params.get('audiences')),
  };
};

export const serializeFilterStateToSearch = (state: UrlFilterState): string => {
  const params = new URLSearchParams();

  if (state.searchText) {
    params.set('q', state.searchText);
  }

  if (state.sortBy && state.sortBy !== defaultUrlFilterState.sortBy) {
    params.set('sort', state.sortBy);
  }

  if (state.hasGoodFirstIssueChecked) {
    params.set('goodFirstIssue', 'true');
  }

  if (state.hasHelpWantedIssueChecked) {
    params.set('helpWantedIssue', 'true');
  }

  if (state.hasCodeOfConductChecked) {
    params.set('codeOfConduct', 'true');
  }

  if (state.selectedTopics.length > 0) {
    params.set('topics', state.selectedTopics.join(','));
  }

  if (state.selectedLanguages.length > 0) {
    params.set('languages', state.selectedLanguages.join(','));
  }

  if (state.selectedLicenses.length > 0) {
    params.set('licenses', state.selectedLicenses.join(','));
  }

  if (state.selectedOwners.length > 0) {
    params.set('owners', state.selectedOwners.join(','));
  }

  if (state.selectedCategories.length > 0) {
    params.set('categories', state.selectedCategories.join(','));
  }

  if (state.selectedFocusAreas.length > 0) {
    params.set('focusAreas', state.selectedFocusAreas.join(','));
  }

  if (state.selectedAudiences.length > 0) {
    params.set('audiences', state.selectedAudiences.join(','));
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
};
