// Local files
import { Repository } from '../types/repository';
import { formatFacetLabel } from './filterPaneUtils';

/**
 * Represents the filter parameters for the gallery.
 */
export type FilterParams = {
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

export type RelaunchBadgeEntry = {
    key: string;
    testIdSuffix: 'featured' | 'category' | 'focus-area' | 'audience' | 'health' | 'maintenance' | 'maturity';
    label: string;
    appearance: 'filled' | 'tint' | 'outline';
    color?: 'brand';
};

export const getRepositoryDescription = (item?: Repository | null): string =>
    item?.displayDescription ?? item?.customDescription ?? item?.description ?? '';

export function getRelaunchBadgeEntries(item: Repository): RelaunchBadgeEntry[] {
    const entries: RelaunchBadgeEntry[] = [];

    if (item.featured) {
        entries.push({ key: 'featured', testIdSuffix: 'featured', label: 'Featured', appearance: 'filled', color: 'brand' });
    }
    if (item.category) {
        entries.push({ key: `category-${item.category}`, testIdSuffix: 'category', label: `Category: ${formatFacetLabel(item.category)}`, appearance: 'tint' });
    }
    item.focusAreas?.forEach((focusArea, index) => {
        entries.push({
            key: `focus-${focusArea}-${index}`,
            testIdSuffix: 'focus-area',
            label: `Focus: ${formatFacetLabel(focusArea)}`,
            appearance: 'outline',
        });
    });
    item.audiences?.forEach((audience, index) => {
        entries.push({
            key: `audience-${audience}-${index}`,
            testIdSuffix: 'audience',
            label: `Audience: ${formatFacetLabel(audience)}`,
            appearance: 'outline',
        });
    });
    if (item.health?.computed?.activityStatus) {
        entries.push({
            key: `health-${item.health.computed.activityStatus}`,
            testIdSuffix: 'health',
            label: `Health: ${formatFacetLabel(item.health.computed.activityStatus)}`,
            appearance: 'tint',
        });
    }
    if (item.health?.curated?.maintenance) {
        entries.push({
            key: `maintenance-${item.health.curated.maintenance}`,
            testIdSuffix: 'maintenance',
            label: `Maintenance: ${formatFacetLabel(item.health.curated.maintenance)}`,
            appearance: 'tint',
        });
    }
    if (item.health?.curated?.maturity) {
        entries.push({
            key: `maturity-${item.health.curated.maturity}`,
            testIdSuffix: 'maturity',
            label: `Maturity: ${formatFacetLabel(item.health.curated.maturity)}`,
            appearance: 'tint',
        });
    }

    return entries;
}

const includesAllSelectedValues = (itemValues: readonly string[] | undefined, selectedValues: string[]): boolean =>
    selectedValues.length === 0 || selectedValues.every(value => itemValues?.includes(value));

const includesSelectedValue = (itemValue: string | undefined, selectedValues: string[]): boolean =>
    selectedValues.length === 0 || (!!itemValue && selectedValues.includes(itemValue));

/**
 * Filters the items based on the provided filter parameters.
 * @param items - The array of items to filter.
 * @param filterParams - The object containing the filter parameters.
 * @returns The filtered array of items.
 */
export function filterItems(items: Repository[], filterParams: FilterParams): Repository[] {
    const itemsCopy = [...items]; // Create a copy of the array
    return itemsCopy.filter(item => {
        const {
            hasGoodFirstIssueChecked,
            hasHelpWantedIssueChecked,
            hasCodeOfConductChecked,
            selectedTopics,
            selectedLanguages,
            selectedLicenses,
            selectedOwners,
            selectedCategories,
            selectedFocusAreas,
            selectedAudiences,
        } = filterParams;
        return (
                (!hasGoodFirstIssueChecked || item.hasGoodFirstIssues) &&
                (!hasHelpWantedIssueChecked || item.hasHelpWantedIssues) &&
                (!hasCodeOfConductChecked || (item.codeOfConduct && item.codeOfConduct.name)) &&
                includesAllSelectedValues(item.topics, selectedTopics) &&
                includesAllSelectedValues(item.languages, selectedLanguages) &&
                (selectedLicenses.length === 0 || (item.license && selectedLicenses.includes(item.license.name))) &&
                (selectedOwners.length === 0 || selectedOwners.includes(item.owner.login)) &&
                includesSelectedValue(item.category, selectedCategories) &&
                includesAllSelectedValues(item.focusAreas, selectedFocusAreas) &&
                includesAllSelectedValues(item.audiences, selectedAudiences)
        );
    });
}

/**
 * Sorts the items based on the selected options.
 * 
 * @param {Array} items - The array of items to be sorted.
 * @param {Array} selectedOptions - The selected options for sorting.
 * @returns {Array} - The sorted array of items.
 */
export function sortItems(items, selectedOptions) {
    const itemsCopy = [...items]; // Create a copy of the array
    const selectedOption = selectedOptions[0];
    switch (selectedOption) {
        case 'starsAsc':
            return itemsCopy.sort((a, b) => a.stargazerCount - b.stargazerCount);
        case 'starsDesc':
            return itemsCopy.sort((a, b) => b.stargazerCount - a.stargazerCount);
        case 'alphabeticalAsc':
            return itemsCopy.sort((a, b) => a.fullName.localeCompare(b.fullName));
        case 'alphabeticalDesc':
            return itemsCopy.sort((a, b) => b.fullName.localeCompare(a.fullName));
        default:
            return itemsCopy;
    }
}

/**
 * Checks if a given date is within the last 10 days.
 * @param {string} dateString - The date string to check.
 * @returns {boolean} - True if the date is within the last 10 days, false otherwise.
 */
export function isActive(dateString) {
    const date = new Date(dateString);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 10);
    return date >= thirtyDaysAgo;
}
