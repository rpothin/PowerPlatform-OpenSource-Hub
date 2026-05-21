import clsx from 'clsx';
import * as React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  FluentProvider,
  Input,
  webDarkTheme,
  webLightTheme,
} from '@fluentui/react-components';
import { Filter16Regular } from '@fluentui/react-icons';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useColorMode } from '@docusaurus/theme-common';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import { Repository } from '../types/repository';
import { filterItemsBasedOnSearchInput } from '../utils/filterItemsBasedOnSearchInput';
import {
  defaultUrlFilterState,
  parseFilterStateFromSearch,
  serializeFilterStateToSearch,
  UrlFilterState,
} from '../utils/filterUrlState';
import styles from './index.module.css';
import data from '../../../Data/GitHubRepositoriesDetails.json';
import Gallery from '../components/Gallery';
import FilterPane from '../components/FilterPane';

const App = () => {
  const { siteConfig } = useDocusaurusContext();
  const { colorMode } = useColorMode();
  const [isMobile, setIsMobile] = useState(false);
  const [isFilterPaneOpen, setIsFilterPaneOpen] = useState(false);
  const [isFilterStateInitialized, setIsFilterStateInitialized] = useState(false);
  const [filterState, setFilterState] = useState<UrlFilterState>(defaultUrlFilterState);
  const historyWriteModeRef = useRef<'replace' | 'push'>('replace');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleWindowResize = () => {
      setIsMobile(window.innerWidth <= 960);
    };

    handleWindowResize();
    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const applyUrlState = () => {
      historyWriteModeRef.current = 'replace';
      setFilterState(parseFilterStateFromSearch(window.location.search));
    };

    applyUrlState();
    setIsFilterStateInitialized(true);
    window.addEventListener('popstate', applyUrlState);

    return () => {
      window.removeEventListener('popstate', applyUrlState);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !isFilterStateInitialized) {
      return;
    }

    const nextSearch = serializeFilterStateToSearch(filterState);
    if (nextSearch !== window.location.search) {
      const nextUrl = `${window.location.pathname}${nextSearch}${window.location.hash}`;
      if (historyWriteModeRef.current === 'push') {
        window.history.pushState({}, '', nextUrl);
      } else {
        window.history.replaceState({}, '', nextUrl);
      }
    }
    historyWriteModeRef.current = 'replace';
  }, [filterState, isFilterStateInitialized]);

  const setFilterStateWithHistory = (
    updater: (previous: UrlFilterState) => UrlFilterState,
    historyMode: 'replace' | 'push' = 'push',
  ) => {
    historyWriteModeRef.current = historyMode;
    setFilterState((previous) => updater(previous));
  };

  const handleClearAllFilters = () => setFilterStateWithHistory(() => defaultUrlFilterState, 'push');

  const hasAnyActiveFilters = useMemo(
    () =>
      filterState.searchText.length > 0 ||
      filterState.hasGoodFirstIssueChecked ||
      filterState.hasHelpWantedIssueChecked ||
      filterState.hasCodeOfConductChecked ||
      filterState.selectedTopics.length > 0 ||
      filterState.selectedLanguages.length > 0 ||
      filterState.selectedLicenses.length > 0 ||
      filterState.selectedOwners.length > 0 ||
      filterState.selectedCategories.length > 0 ||
      filterState.selectedFocusAreas.length > 0 ||
      filterState.selectedAudiences.length > 0,
    [filterState],
  );

  const items = useMemo(
    () => filterItemsBasedOnSearchInput(data as Repository[], filterState.searchText),
    [filterState.searchText],
  );

  const filterPane = (
    <FilterPane
      items={items}
      isMobile={isMobile}
      hasGoodFirstIssueChecked={filterState.hasGoodFirstIssueChecked}
      hasHelpWantedIssueChecked={filterState.hasHelpWantedIssueChecked}
      hasCodeOfConductChecked={filterState.hasCodeOfConductChecked}
      selectedTopics={filterState.selectedTopics}
      selectedLanguages={filterState.selectedLanguages}
      selectedLicenses={filterState.selectedLicenses}
      selectedOwners={filterState.selectedOwners}
      selectedCategories={filterState.selectedCategories}
      selectedFocusAreas={filterState.selectedFocusAreas}
      selectedAudiences={filterState.selectedAudiences}
      onGoodFirstIssueChange={(value) => setFilterStateWithHistory((previous) => ({ ...previous, hasGoodFirstIssueChecked: value }))}
      onHelpWantedIssueChange={(value) => setFilterStateWithHistory((previous) => ({ ...previous, hasHelpWantedIssueChecked: value }))}
      onCodeOfConductChange={(value) => setFilterStateWithHistory((previous) => ({ ...previous, hasCodeOfConductChecked: value }))}
      onTopicsChange={(value) => setFilterStateWithHistory((previous) => ({ ...previous, selectedTopics: value }))}
      onLanguagesChange={(value) => setFilterStateWithHistory((previous) => ({ ...previous, selectedLanguages: value }))}
      onLicensesChange={(value) => setFilterStateWithHistory((previous) => ({ ...previous, selectedLicenses: value }))}
      onOwnersChange={(value) => setFilterStateWithHistory((previous) => ({ ...previous, selectedOwners: value }))}
      onCategoriesChange={(value) => setFilterStateWithHistory((previous) => ({ ...previous, selectedCategories: value }))}
      onFocusAreasChange={(value) => setFilterStateWithHistory((previous) => ({ ...previous, selectedFocusAreas: value }))}
      onAudiencesChange={(value) => setFilterStateWithHistory((previous) => ({ ...previous, selectedAudiences: value }))}
      onClearAllFilters={handleClearAllFilters}
      hasAnyActiveFilters={hasAnyActiveFilters}
    />
  );

  return (
    <FluentProvider theme={colorMode === 'dark' ? webDarkTheme : webLightTheme}>
      <header className={clsx('hero hero--primary', styles.heroBanner)}>
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
          <Heading as="h1" className={clsx('hero__title', styles.heroTitle)}>
            {siteConfig.title}
          </Heading>
          <p className={clsx('hero__subtitle', styles.heroSubtitle)} style={{ padding: '10px 0 20px 0' }}>
            {siteConfig.tagline}
          </p>
          <Input
            id="filterBar"
            type="search"
            size="large"
            placeholder="Search for a Power Platform GitHub repository..."
            aria-label="Search repositories"
            value={filterState.searchText}
            onChange={(_, data) => setFilterStateWithHistory((previous) => ({ ...previous, searchText: data.value }), 'replace')}
            style={{ width: '100%', maxWidth: '740px' }}
          />
        </div>
      </header>
      <main>
        <div className={styles.filterPaneAndGallery}>
          {isMobile ? (
            <>
              <div style={{ marginBottom: '12px', width: '100%' }}>
                <Button
                  id="openFiltersButton"
                  icon={<Filter16Regular />}
                  onClick={() => setIsFilterPaneOpen(true)}
                  style={{ minHeight: '44px' }}
                >
                  Filters
                </Button>
              </div>
              <Dialog
                open={isFilterPaneOpen}
                onOpenChange={(_, data) => {
                  setIsFilterPaneOpen(data.open);
                  if (!data.open) {
                    setTimeout(() => document.getElementById('openFiltersButton')?.focus(), 50);
                  }
                }}
              >
                <DialogSurface>
                  <DialogBody>
                    <DialogTitle>Filters</DialogTitle>
                    <DialogContent>{filterPane}</DialogContent>
                  </DialogBody>
                </DialogSurface>
              </Dialog>
            </>
          ) : (
            filterPane
          )}
          <Gallery
            items={items}
            hasGoodFirstIssueChecked={filterState.hasGoodFirstIssueChecked}
            hasHelpWantedIssueChecked={filterState.hasHelpWantedIssueChecked}
            hasCodeOfConductChecked={filterState.hasCodeOfConductChecked}
            selectedTopics={filterState.selectedTopics}
            selectedLanguages={filterState.selectedLanguages}
            selectedLicenses={filterState.selectedLicenses}
            selectedOwners={filterState.selectedOwners}
            selectedCategories={filterState.selectedCategories}
            selectedFocusAreas={filterState.selectedFocusAreas}
            selectedAudiences={filterState.selectedAudiences}
            sortBy={filterState.sortBy}
            onCategoriesChange={(value) => setFilterStateWithHistory((previous) => ({ ...previous, selectedCategories: value }))}
            onFocusAreasChange={(value) => setFilterStateWithHistory((previous) => ({ ...previous, selectedFocusAreas: value }))}
            onAudiencesChange={(value) => setFilterStateWithHistory((previous) => ({ ...previous, selectedAudiences: value }))}
            onTopicsChange={(value) => setFilterStateWithHistory((previous) => ({ ...previous, selectedTopics: value }))}
            onSortByChange={(value) => setFilterStateWithHistory((previous) => ({ ...previous, sortBy: value }))}
            onClearAllFilters={handleClearAllFilters}
          />
        </div>
      </main>
    </FluentProvider>
  );
};

export default function HomePage(): React.JSX.Element {
  const { siteConfig } = useDocusaurusContext();

  return (
    <Layout
      title="Discover Open-Source Power Platform Projects"
      description="Explore 200+ open-source projects for Microsoft Power Platform and Copilot Studio — Power Apps, Power Automate, Dataverse, and more. Searchable, filterable, and community-driven."
    >
      <App />
    </Layout>
  );
}
