import { data } from './mockData';
import { countItemsByProperty, extractDistinctProperties } from '../../src/utils/filterPaneUtils';

describe('countItemsByProperty', () => {
    it('returns 0 when all the inputs are empty', () => {
        const result = countItemsByProperty([], '', '');
        expect(result).toEqual(0);
    });

    it('returns 0 when the items array is empty, but the property path and value are not', () => {
        const result = countItemsByProperty([], 'fullName', 'abc');
        expect(result).toEqual(0);
    });

    it('returns 0 when the items array is empty, but the property path is not empty', () => {
        const result = countItemsByProperty([], 'fullName', '');
        expect(result).toEqual(0);
    });

    it('returns 0 when the items array is empty, but the value is not empty', () => {
        const result = countItemsByProperty([], '', 'abc');
        expect(result).toEqual(0);
    });

    it('returns 0 when the items array is not empty, but the property path is empty', () => {
        const result = countItemsByProperty(data, '', 'abc');
        expect(result).toEqual(0);
    });

    it('returns 0 when the items array is not empty, but the value is empty', () => {
        const result = countItemsByProperty(data, 'fullName', '');
        expect(result).toEqual(0);
    });
    
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
    it('returns an empty array when all inputs are empty', () => {
        const result = extractDistinctProperties([], '');
        expect(result).toEqual([]);
    });

    it('returns an empty array when the items array is empty, but the property path is not', () => {
        const result = extractDistinctProperties([], 'fullName');
        expect(result).toEqual([]);
    });
    
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