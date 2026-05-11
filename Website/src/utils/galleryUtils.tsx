// Local files
import { Repository } from '../types/repository';

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
