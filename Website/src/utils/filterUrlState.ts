export type UrlFilterState = {
  searchText: string;
  hasGoodFirstIssueChecked: boolean;
  hasHelpWantedIssueChecked: boolean;
  hasCodeOfConductChecked: boolean;
  selectedTopics: string[];
  selectedLanguages: string[];
  selectedLicenses: string[];
  selectedOwners: string[];
};

export const defaultUrlFilterState: UrlFilterState = {
  searchText: '',
  hasGoodFirstIssueChecked: false,
  hasHelpWantedIssueChecked: false,
  hasCodeOfConductChecked: false,
  selectedTopics: [],
  selectedLanguages: [],
  selectedLicenses: [],
  selectedOwners: [],
};

const parseBoolean = (value: string | null): boolean => value === 'true' || value === '1';

const parseList = (value: string | null): string[] =>
  value ? value.split(',').map((item) => item.trim()).filter(Boolean) : [];

export const parseFilterStateFromSearch = (search: string): UrlFilterState => {
  const params = new URLSearchParams(search);
  return {
    searchText: params.get('q') ?? defaultUrlFilterState.searchText,
    hasGoodFirstIssueChecked: parseBoolean(params.get('goodFirstIssue')),
    hasHelpWantedIssueChecked: parseBoolean(params.get('helpWantedIssue')),
    hasCodeOfConductChecked: parseBoolean(params.get('codeOfConduct')),
    selectedTopics: parseList(params.get('topics')),
    selectedLanguages: parseList(params.get('languages')),
    selectedLicenses: parseList(params.get('licenses')),
    selectedOwners: parseList(params.get('owners')),
  };
};

export const serializeFilterStateToSearch = (state: UrlFilterState): string => {
  const params = new URLSearchParams();

  if (state.searchText) {
    params.set('q', state.searchText);
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

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
};
