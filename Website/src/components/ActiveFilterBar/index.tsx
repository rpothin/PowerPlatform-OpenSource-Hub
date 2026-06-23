import * as React from 'react';
import { Dismiss16Regular } from '@fluentui/react-icons';
import { UrlFilterState } from '../../utils/filterUrlState';
import { formatFacetLabel } from '../../utils/filterPaneUtils';
import styles from './styles.module.css';

type SetFilterState = (
  updater: (prev: UrlFilterState) => UrlFilterState,
  historyMode?: 'replace' | 'push',
) => void;

type ActiveFilterBarProps = {
  filterState: UrlFilterState;
  setFilterState: SetFilterState;
  onClearAllFilters: () => void;
};

type Chip = {
  id: string;
  label: string;
  onRemove: () => void;
};

const ActiveFilterBar: React.FC<ActiveFilterBarProps> = ({
  filterState,
  setFilterState,
  onClearAllFilters,
}) => {
  const chips: Chip[] = [];

  // Search text chip — truncate long queries for readability
  if (filterState.searchText) {
    const displayText = filterState.searchText.length > 28
      ? `${filterState.searchText.slice(0, 28)}\u2026`
      : filterState.searchText;
    chips.push({
      id: 'search',
      label: `"${displayText}"`,
      onRemove: () => setFilterState((prev) => ({ ...prev, searchText: '' }), 'push'),
    });
  }

  // Boolean filters
  if (filterState.hasGoodFirstIssueChecked) {
    chips.push({
      id: 'goodFirstIssue',
      label: 'Good First Issue',
      onRemove: () => setFilterState((prev) => ({ ...prev, hasGoodFirstIssueChecked: false }), 'push'),
    });
  }
  if (filterState.hasHelpWantedIssueChecked) {
    chips.push({
      id: 'helpWanted',
      label: 'Help Wanted',
      onRemove: () => setFilterState((prev) => ({ ...prev, hasHelpWantedIssueChecked: false }), 'push'),
    });
  }
  if (filterState.hasCodeOfConductChecked) {
    chips.push({
      id: 'codeOfConduct',
      label: 'Has Code of Conduct',
      onRemove: () => setFilterState((prev) => ({ ...prev, hasCodeOfConductChecked: false }), 'push'),
    });
  }

  // Multi-value filters — one chip per value
  filterState.selectedTopics.forEach((v) =>
    chips.push({
      id: `topic-${v}`,
      label: v,
      onRemove: () =>
        setFilterState((prev) => ({ ...prev, selectedTopics: prev.selectedTopics.filter((t) => t !== v) }), 'push'),
    }),
  );
  filterState.selectedLanguages.forEach((v) =>
    chips.push({
      id: `lang-${v}`,
      label: v,
      onRemove: () =>
        setFilterState((prev) => ({ ...prev, selectedLanguages: prev.selectedLanguages.filter((t) => t !== v) }), 'push'),
    }),
  );
  filterState.selectedLicenses.forEach((v) =>
    chips.push({
      id: `license-${v}`,
      label: v,
      onRemove: () =>
        setFilterState((prev) => ({ ...prev, selectedLicenses: prev.selectedLicenses.filter((t) => t !== v) }), 'push'),
    }),
  );
  filterState.selectedOwners.forEach((v) =>
    chips.push({
      id: `owner-${v}`,
      label: v,
      onRemove: () =>
        setFilterState((prev) => ({ ...prev, selectedOwners: prev.selectedOwners.filter((t) => t !== v) }), 'push'),
    }),
  );
  filterState.selectedCategories.forEach((v) =>
    chips.push({
      id: `cat-${v}`,
      label: formatFacetLabel(v),
      onRemove: () =>
        setFilterState((prev) => ({ ...prev, selectedCategories: prev.selectedCategories.filter((t) => t !== v) }), 'push'),
    }),
  );
  filterState.selectedFocusAreas.forEach((v) =>
    chips.push({
      id: `focus-${v}`,
      label: formatFacetLabel(v),
      onRemove: () =>
        setFilterState((prev) => ({ ...prev, selectedFocusAreas: prev.selectedFocusAreas.filter((t) => t !== v) }), 'push'),
    }),
  );
  filterState.selectedAudiences.forEach((v) =>
    chips.push({
      id: `audience-${v}`,
      label: formatFacetLabel(v),
      onRemove: () =>
        setFilterState((prev) => ({ ...prev, selectedAudiences: prev.selectedAudiences.filter((t) => t !== v) }), 'push'),
    }),
  );

  if (chips.length === 0) {
    return null;
  }

  return (
    <div className={styles.activeFilterBar}>
      <ul className={styles.chipList} aria-label="Active filters">
        {chips.map((chip) => (
          <li key={chip.id} className={styles.chipItem}>
            <span className={styles.chip}>
              <span className={styles.chipLabel}>{chip.label}</span>
              <button
                type="button"
                className={styles.chipDismiss}
                onClick={chip.onRemove}
                aria-label={`Remove filter: ${chip.label}`}
              >
                <Dismiss16Regular style={{ width: 12, height: 12 }} />
              </button>
            </span>
          </li>
        ))}
      </ul>
      {chips.length > 1 && (
        <button
          type="button"
          className={styles.clearAllButton}
          onClick={onClearAllFilters}
        >
          Clear all
        </button>
      )}
    </div>
  );
};

export default ActiveFilterBar;
