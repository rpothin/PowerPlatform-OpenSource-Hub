import {
  defaultUrlFilterState,
  parseFilterStateFromSearch,
  serializeFilterStateToSearch,
} from '../../src/utils/filterUrlState';

describe('filterUrlState', () => {
  it('returns default values when query string is empty', () => {
    const result = parseFilterStateFromSearch('');
    expect(result).toEqual(defaultUrlFilterState);
  });

  it('parses comma separated values and booleans from query string', () => {
    const result = parseFilterStateFromSearch(
      '?q=power&sort=alphabeticalAsc&goodFirstIssue=true&helpWantedIssue=true&codeOfConduct=true&topics=a,b&languages=TypeScript,JavaScript&licenses=MIT&owners=microsoft',
    );

    expect(result.searchText).toEqual('power');
    expect(result.sortBy).toEqual('alphabeticalAsc');
    expect(result.hasGoodFirstIssueChecked).toEqual(true);
    expect(result.hasHelpWantedIssueChecked).toEqual(true);
    expect(result.hasCodeOfConductChecked).toEqual(true);
    expect(result.selectedTopics).toEqual(['a', 'b']);
    expect(result.selectedLanguages).toEqual(['TypeScript', 'JavaScript']);
    expect(result.selectedLicenses).toEqual(['MIT']);
    expect(result.selectedOwners).toEqual(['microsoft']);
  });

  it('serializes state to comma separated query parameters', () => {
    const search = serializeFilterStateToSearch({
      searchText: 'test',
      sortBy: 'alphabeticalDesc',
      hasGoodFirstIssueChecked: true,
      hasHelpWantedIssueChecked: false,
      hasCodeOfConductChecked: true,
      selectedTopics: ['a', 'b'],
      selectedLanguages: ['TypeScript'],
      selectedLicenses: ['MIT'],
      selectedOwners: ['microsoft'],
    });

    expect(search).toContain('q=test');
    expect(search).toContain('sort=alphabeticalDesc');
    expect(search).toContain('goodFirstIssue=true');
    expect(search).toContain('codeOfConduct=true');
    expect(search).toContain('topics=a%2Cb');
    expect(search).toContain('languages=TypeScript');
    expect(search).toContain('licenses=MIT');
    expect(search).toContain('owners=microsoft');
  });

  it('omits default sort from query string', () => {
    const search = serializeFilterStateToSearch({
      ...defaultUrlFilterState,
      searchText: 'power',
    });

    expect(search).toContain('q=power');
    expect(search).not.toContain('sort=');
  });
});
