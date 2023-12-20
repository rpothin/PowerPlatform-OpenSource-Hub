import { data } from './mockData';
import { countItemsByProperty, extractDistinctProperties } from '../../src/utils/filterPaneUtils';

describe('countItemsByProperty', () => {
    it('returns the count of repositories with good first issues', () => {
        const result = countItemsByProperty(data, 'hasGoodFirstIssues', true);
        expect(result).toEqual(1);
    });

    it('returns the count of repositories with help wanted issues', () => {
        const result = countItemsByProperty(data, 'hasHelpWantedIssues', true);
        expect(result).toEqual(1);
    });

    it('returns the count of repositories with a code of conduct', () => {
        const result = countItemsByProperty(data, 'codeOfConduct', 'NotNull');
        expect(result).toEqual(2);
    });

    it('returns the count of repositories with a specific topic', () => {
        const result = countItemsByProperty(data, 'topics', 'powerapps');
        expect(result).toEqual(1);
    });

    it('returns the count of repositories with a specific language', () => {
        const result = countItemsByProperty(data, 'language', 'JavaScript');
        expect(result).toEqual(1);
    });

    it('returns the count of repositories with a specific license', () => {
        const result = countItemsByProperty(data, 'license.name', 'MIT');
        expect(result).toEqual(1);
    });

    it('returns the count of repositories with a specific owner', () => {
        const result = countItemsByProperty(data, 'owner.login', 'microsoft');
        expect(result).toEqual(1);
    });
});

describe('extractDistinctProperties', () => {
    it('returns the distinct topics', () => {
        const result = extractDistinctProperties(data, 'topics');
        expect(result).toEqual(['powerapps', 'powerautomate', 'azure', 'cloud']);
    });

    it('returns the distinct languages', () => {
        const result = extractDistinctProperties(data, 'language');
        expect(result).toEqual(['JavaScript', 'TypeScript']);
    });

    it('returns the distinct licenses', () => {
        const result = extractDistinctProperties(data, 'license.name');
        expect(result).toEqual(['MIT', 'Apache']);
    });

    it('returns the distinct owners', () => {
        const result = extractDistinctProperties(data, 'owner.login');
        expect(result).toEqual(['microsoft', 'rpothin']);
    });
});