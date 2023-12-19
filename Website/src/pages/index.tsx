// Importing necessary libraries and components
// Third-party libraries
import clsx from 'clsx';
import Fuse from 'fuse.js';
import * as React from 'react';
import { useState, useEffect } from 'react';
import { FluentProvider, webLightTheme, webDarkTheme } from '@fluentui/react-components';
import { SearchBox } from "@fluentui/react/lib/SearchBox";
import { initializeIcons } from "@fluentui/react/lib/Icons";
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useColorMode } from "@docusaurus/theme-common";
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

// Local files
import { Repository } from '../types/repository';
import { filterItemsBasedOnSearchInput } from '../utils/filterItemsBasedOnSearchInput';
import styles from './index.module.css';
import data from '../../../Data/GitHubRepositoriesDetails.json';
import Gallery from '../components/Gallery';
import FilterPane from '../components/FilterPane';

// Initializing Fluent UI icons
initializeIcons();

/**
 * The main component of the application.
 * Renders the homepage with search functionality, filter pane, and gallery.
 */
const App = () => {
  const { siteConfig } = useDocusaurusContext();
  const { colorMode } = useColorMode();
  const [loading, setLoading] = useState(true);

  // Defining state variables
  const [searchText, setSearchText] = useState('');
  const [items, setItems] = useState<Repository[]>([]);
  const [hasGoodFirstIssueChecked, setHasGoodFirstIssue] = useState(false);
  const [hasHelpWantedIssueChecked, setHasHelpWantedIssue] = useState(false);
  const [hasCodeOfConductChecked, setHasCodeOfConduct] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedLicenses, setSelectedLicenses] = useState<string[]>([]);
  const [selectedOwners, setSelectedOwners] = useState<string[]>([]);

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, []);
  
  // useEffect hook to filter items based on search text
  useEffect(() => {
    setItems(filterItemsBasedOnSearchInput(data, searchText));
  }, [searchText]);

  // Function to handle search text change
  const handleSearchChange = (event) => {
    setSearchText(event.target.value);
  };

  // Rendering the HomePage component
  return !loading ? (
      <FluentProvider theme={colorMode === 'dark' ? webDarkTheme : webLightTheme}>
        <header className={clsx('hero hero--primary', styles.heroBanner)}>
          <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
            <Heading as="h2" className="hero__title" style={{
                  background: 'linear-gradient(90deg, rgba(10,110,159,1.2) 0%, rgba(10,110,159,1.2) 0%, rgba(44,142,75,1.2) 100%)',
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}>
              {siteConfig.title}
            </Heading>
            <p className="hero__subtitle" style={{
                color: "#242424",
                padding: "10px 0 20px 0",
              }}>
              {siteConfig.tagline}
            </p>
            <SearchBox
              styles={{
                root: {
                  width: '100%',
                  border: "1px solid #D1D1D1",
                  height: "52px",
                  maxWidth: "740px",
                  borderRadius: "4px",
                },
                icon: {
                  fontSize: "24px",
                  paddingLeft: "10px",
                },
                field: {
                  paddingLeft: "20px",
                  fontSize: "18px",
                },
              }}
              id="filterBar"
              placeholder="Search for a Power Platform GitHub repository..."
              value={searchText}
              onChange={handleSearchChange}
            />
          </div>
        </header>
        <main>
            <div className={styles.filterPaneAndGallery} >
              <FilterPane 
                items={items}
                onGoodFirstIssueChange={setHasGoodFirstIssue}
                onHelpWanteIssueChange={setHasHelpWantedIssue}
                onCodeOfConductChange={setHasCodeOfConduct}
                onTopicsChange={setSelectedTopics}
                onLanguagesChange={setSelectedLanguages}
                onLicensesChange={setSelectedLicenses}
                onOwnersChange={setSelectedOwners}
              />
              <Gallery
                items={items}
                hasGoodFirstIssueChecked={hasGoodFirstIssueChecked}
                hasHelpWantedIssueChecked={hasHelpWantedIssueChecked}
                hasCodeOfConductChecked={hasCodeOfConductChecked}
                selectedTopics={selectedTopics}
                selectedLanguages={selectedLanguages}
                selectedLicenses={selectedLicenses}
                selectedOwners={selectedOwners}
              />
            </div>
        </main>
      </FluentProvider>
  ) : null;
}

/**
 * Renders the home page of the website.
 * @returns The JSX element representing the home page.
 */
export default function HomePage(): JSX.Element {
  const {siteConfig} = useDocusaurusContext();

  return (
    <Layout title={`${siteConfig.title}`} description="Power Platform Open-Source Hub">
      <App />
    </Layout>
  );
}