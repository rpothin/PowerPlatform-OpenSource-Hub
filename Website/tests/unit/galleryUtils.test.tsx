import { data } from './mockData';
import { appendSelectedFilterValue, filterItems, sortItems, isActive, getRepositoryDescription, getRelaunchBadgeEntries, getFeaturedSpotlightItems } from '../../src/utils/galleryUtils';

describe('filterItems', () => {
  it('returns the full list when the items array is empty, but the filter parameters are not', () => {
    const result = filterItems([], {
      hasGoodFirstIssueChecked: false,
      hasHelpWantedIssueChecked: false,
      hasCodeOfConductChecked: false,
      selectedTopics: [],
      selectedLanguages: [],
      selectedLicenses: [],
      selectedOwners: [],
      selectedCategories: [],
      selectedFocusAreas: [],
      selectedAudiences: []
    });
    expect(result).toEqual([]);
  });
  
  it('returns the full list when no filters are specified', () => {
    const result = filterItems(data, {
      hasGoodFirstIssueChecked: false,
      hasHelpWantedIssueChecked: false,
      hasCodeOfConductChecked: false,
      selectedTopics: [],
      selectedLanguages: [],
      selectedLicenses: [],
      selectedOwners: [],
      selectedCategories: [],
      selectedFocusAreas: [],
      selectedAudiences: []
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
      selectedOwners: [],
      selectedCategories: [],
      selectedFocusAreas: [],
      selectedAudiences: []
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
      selectedOwners: [],
      selectedCategories: [],
      selectedFocusAreas: [],
      selectedAudiences: []
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
      selectedOwners: [],
      selectedCategories: [],
      selectedFocusAreas: [],
      selectedAudiences: []
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
      selectedOwners: [],
      selectedCategories: [],
      selectedFocusAreas: [],
      selectedAudiences: []
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
            selectedOwners: [],
      selectedCategories: [],
      selectedFocusAreas: [],
      selectedAudiences: []
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
            selectedOwners: [],
      selectedCategories: [],
      selectedFocusAreas: [],
      selectedAudiences: []
        });
        expect(result).toEqual([data[0]]);
    });

    it('handles repositories with null license when filtering by license', () => {
        const dataWithNullLicense = [
            data[0],
            {
                ...data[1],
                license: null,
            },
        ];

        const result = filterItems(dataWithNullLicense, {
            hasGoodFirstIssueChecked: false,
            hasHelpWantedIssueChecked: false,
            hasCodeOfConductChecked: false,
            selectedTopics: [],
            selectedLanguages: [],
            selectedLicenses: ['MIT'],
            selectedOwners: [],
      selectedCategories: [],
      selectedFocusAreas: [],
      selectedAudiences: []
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
            selectedOwners: ['microsoft'],
            selectedCategories: [],
            selectedFocusAreas: [],
            selectedAudiences: []
        });
        expect(result).toEqual([data[0]]);
    });

    it('returns a filtered list when a category is selected', () => {
        const result = filterItems(data, {
            hasGoodFirstIssueChecked: false,
            hasHelpWantedIssueChecked: false,
            hasCodeOfConductChecked: false,
            selectedTopics: [],
            selectedLanguages: [],
            selectedLicenses: [],
            selectedOwners: [],
            selectedCategories: ['power-apps'],
            selectedFocusAreas: [],
            selectedAudiences: []
        });
        expect(result).toEqual([data[0]]);
    });

    it('returns a filtered list when focus areas are selected', () => {
        const result = filterItems(data, {
            hasGoodFirstIssueChecked: false,
            hasHelpWantedIssueChecked: false,
            hasCodeOfConductChecked: false,
            selectedTopics: [],
            selectedLanguages: [],
            selectedLicenses: [],
            selectedOwners: [],
            selectedCategories: [],
            selectedFocusAreas: ['canvas-apps', 'community-samples'],
            selectedAudiences: []
        });
        expect(result).toEqual([data[0]]);
    });

    it('excludes repositories without curated data when curated filters are selected', () => {
        const result = filterItems(data, {
            hasGoodFirstIssueChecked: false,
            hasHelpWantedIssueChecked: false,
            hasCodeOfConductChecked: false,
            selectedTopics: [],
            selectedLanguages: [],
            selectedLicenses: [],
            selectedOwners: [],
            selectedCategories: [],
            selectedFocusAreas: [],
            selectedAudiences: ['developers']
        });
        expect(result).toEqual([data[0]]);
    });
});

describe('sortItems', () => {
    it('returns an empty list when the items array is empty', () => {
        const result = sortItems([], []);
        expect(result).toEqual([]);
    });

    it('returns the full list with its order by default when no sort option is specified', () => {
        const result = sortItems(data, []);
        expect(result).toEqual(data);
    });

    it('returns an empty list when the items array is empty, but the sort option is not empty', () => {
        const result = sortItems([], ['starsAsc']);
        expect(result).toEqual([]);
    });

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

    it('returns a sorted list by recently updated date in descending order when the recentlyUpdated option is selected', () => {
        const olderRepository = {
            ...data[0],
            fullName: 'z/older',
            updatedAt: '2024-01-01T00:00:00Z',
        };
        const newerRepository = {
            ...data[1],
            fullName: 'a/newer',
            updatedAt: '2024-02-01T00:00:00Z',
        };

        const result = sortItems([olderRepository, newerRepository], ['recentlyUpdated']);

        expect(result).toEqual([newerRepository, olderRepository]);
    });

    it('returns a sorted list by recently released date with repositories without releases last when the recentlyReleased option is selected', () => {
        const newestReleaseRepository = {
            ...data[0],
            fullName: 'gamma/newest',
            stargazerCount: 10,
            latestRelease: {
                ...data[0].latestRelease!,
                publishedAt: '2024-03-01T00:00:00Z',
            },
        };
        const sameReleaseHigherStarsRepository = {
            ...data[0],
            fullName: 'zeta/higher-stars',
            stargazerCount: 30,
            latestRelease: {
                ...data[0].latestRelease!,
                publishedAt: '2024-02-01T00:00:00Z',
            },
        };
        const sameReleaseLowerStarsRepository = {
            ...data[1],
            fullName: 'alpha/lower-stars',
            stargazerCount: 20,
            latestRelease: {
                ...data[1].latestRelease!,
                publishedAt: '2024-02-01T00:00:00Z',
            },
        };
        const noReleaseRepository = {
            ...data[1],
            fullName: 'beta/no-release',
            stargazerCount: 1000,
            latestRelease: null,
        };
        const invalidReleaseRepository = {
            ...data[1],
            fullName: 'delta/invalid-release',
            stargazerCount: 500,
            latestRelease: {
                ...data[1].latestRelease!,
                publishedAt: 'not-a-date',
            },
        };

        const result = sortItems([
            noReleaseRepository,
            invalidReleaseRepository,
            sameReleaseLowerStarsRepository,
            newestReleaseRepository,
            sameReleaseHigherStarsRepository,
        ], ['recentlyReleased']);

        expect(result).toEqual([
            newestReleaseRepository,
            sameReleaseHigherStarsRepository,
            sameReleaseLowerStarsRepository,
            noReleaseRepository,
            invalidReleaseRepository,
        ]);
    });
});

describe('isActive', () => {
    it('returns false when the date is null', () => {
        const result = isActive(null);
        expect(result).toEqual(false);
    });

    it('returns false when the date is not a valid date string', () => {
        const result = isActive('abc');
        expect(result).toEqual(false);
    });

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

describe('relaunch metadata helpers', () => {
    it('prefers curated display descriptions over generated descriptions', () => {
        expect(getRepositoryDescription({
            ...data[0],
            description: 'Generated description',
            customDescription: 'Curated description',
            displayDescription: 'Display description',
        })).toEqual('Display description');
        expect(getRepositoryDescription({
            ...data[0],
            description: 'Generated description',
            customDescription: 'Curated description',
            displayDescription: undefined,
        })).toEqual('Curated description');
        expect(getRepositoryDescription(null)).toEqual('');
    });

    it('builds badge labels for featured, taxonomy, computed health, and curated health fields', () => {
        const badges = getRelaunchBadgeEntries(data[0]);

        expect(badges.map((badge) => badge.label)).toEqual([
            'Featured',
            'Category: Power Apps',
            'Focus: Canvas Apps',
            'Focus: Community Samples',
            'Audience: Makers',
            'Audience: Developers',
            'Health: Active',
            'Maintenance: Maintained',
            'Maturity: Stable',
        ]);
        expect(badges.map((badge) => badge.testIdSuffix)).toEqual([
            'featured',
            'category',
            'focus-area',
            'focus-area',
            'audience',
            'audience',
            'health',
            'maintenance',
            'maturity',
        ]);
        expect(badges.filter((badge) => badge.filterFacet).map((badge) => [badge.filterFacet, badge.filterValue])).toEqual([
            ['category', 'power-apps'],
            ['focusArea', 'canvas-apps'],
            ['focusArea', 'community-samples'],
            ['audience', 'makers'],
            ['audience', 'developers'],
        ]);
    });

    it('does not create relaunch badges for repositories without curated or health fields', () => {
        expect(getRelaunchBadgeEntries(data[1])).toEqual([]);
    });
});

describe('appendSelectedFilterValue', () => {
    it('adds a missing selected value', () => {
        expect(appendSelectedFilterValue(['power-apps'], 'makers')).toEqual(['power-apps', 'makers']);
    });

    it('does not duplicate an already selected value', () => {
        const selectedValues = ['power-apps'];

        expect(appendSelectedFilterValue(selectedValues, 'power-apps')).toBe(selectedValues);
    });
});

describe('getFeaturedSpotlightItems', () => {
    it('returns featured repositories for the spotlight', () => {
        expect(getFeaturedSpotlightItems(data)).toEqual([data[0]]);
    });

    it('returns an empty list when no repositories are featured', () => {
        expect(getFeaturedSpotlightItems(data.map((item) => ({ ...item, featured: false })))).toEqual([]);
    });
});
