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
    filterFacet?: 'category' | 'focusArea' | 'audience';
    filterValue?: string;
};

export const getRepositoryDescription = (item?: Repository | null): string =>
    item?.displayDescription ?? item?.customDescription ?? item?.description ?? '';

export const appendSelectedFilterValue = (selectedValues: string[], value: string): string[] =>
    selectedValues.includes(value) ? selectedValues : [...selectedValues, value];

export const getFeaturedSpotlightItems = (items: Repository[]): Repository[] =>
    items.filter((item) => item.featured);

export function getRelaunchBadgeEntries(item: Repository): RelaunchBadgeEntry[] {
    const entries: RelaunchBadgeEntry[] = [];

    if (item.featured) {
        entries.push({ key: 'featured', testIdSuffix: 'featured', label: 'Featured', appearance: 'filled', color: 'brand' });
    }
    if (item.category) {
        entries.push({
            key: `category-${item.category}`,
            testIdSuffix: 'category',
            label: `Category: ${formatFacetLabel(item.category)}`,
            appearance: 'tint',
            filterFacet: 'category',
            filterValue: item.category,
        });
    }
    item.focusAreas?.forEach((focusArea, index) => {
        entries.push({
            key: `focus-${focusArea}-${index}`,
            testIdSuffix: 'focus-area',
            label: `Focus: ${formatFacetLabel(focusArea)}`,
            appearance: 'outline',
            filterFacet: 'focusArea',
            filterValue: focusArea,
        });
    });
    item.audiences?.forEach((audience, index) => {
        entries.push({
            key: `audience-${audience}-${index}`,
            testIdSuffix: 'audience',
            label: `Audience: ${formatFacetLabel(audience)}`,
            appearance: 'outline',
            filterFacet: 'audience',
            filterValue: audience,
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
export function sortItems(items: Repository[], selectedOptions: string[]): Repository[] {
    const itemsCopy = [...items]; // Create a copy of the array
    const selectedOption = selectedOptions[0];
    const compareByFullName = (a: Repository, b: Repository) => a.fullName.localeCompare(b.fullName);
    const getSortableDate = (date: string | undefined): number => {
        const timestamp = date ? Date.parse(date) : Number.NEGATIVE_INFINITY;
        return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
    };
    switch (selectedOption) {
        case 'starsAsc':
            return itemsCopy.sort((a, b) => a.stargazerCount - b.stargazerCount);
        case 'starsDesc':
            return itemsCopy.sort((a, b) => b.stargazerCount - a.stargazerCount);
        case 'alphabeticalAsc':
            return itemsCopy.sort((a, b) => a.fullName.localeCompare(b.fullName));
        case 'alphabeticalDesc':
            return itemsCopy.sort((a, b) => b.fullName.localeCompare(a.fullName));
        case 'recentlyUpdated':
            return itemsCopy.sort((a, b) => getSortableDate(b.updatedAt) - getSortableDate(a.updatedAt) || compareByFullName(a, b));
        case 'recentlyReleased':
            return itemsCopy.sort((a, b) => {
                const leftReleaseTimestamp = getSortableDate(a.latestRelease?.publishedAt);
                const rightReleaseTimestamp = getSortableDate(b.latestRelease?.publishedAt);
                const leftHasReleaseDate = leftReleaseTimestamp !== Number.NEGATIVE_INFINITY;
                const rightHasReleaseDate = rightReleaseTimestamp !== Number.NEGATIVE_INFINITY;

                if (!leftHasReleaseDate && !rightHasReleaseDate) {
                    return b.stargazerCount - a.stargazerCount || compareByFullName(a, b);
                }
                if (!leftHasReleaseDate) {
                    return 1;
                }
                if (!rightHasReleaseDate) {
                    return -1;
                }
                return rightReleaseTimestamp - leftReleaseTimestamp
                    || b.stargazerCount - a.stargazerCount
                    || compareByFullName(a, b);
            });
        default:
            return itemsCopy;
    }
}

/**
 * Checks if a given date is within the last 10 days.
 * @param {string} dateString - The date string to check.
 * @returns {boolean} - True if the date is within the last 10 days, false otherwise.
 */
export function isActive(dateString: string | null | undefined): boolean {
    if (!dateString) {
        return false;
    }

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
        return false;
    }

    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    return date >= tenDaysAgo;
}
