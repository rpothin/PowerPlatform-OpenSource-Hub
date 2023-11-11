// Importing necessary libraries and components
import clsx from 'clsx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import React, { useState, useEffect } from "react";
import { SearchBox } from "@fluentui/react/lib/SearchBox";
import { initializeIcons } from "@fluentui/react/lib/Icons";
import { FluentProvider } from '@fluentui/react-provider';

import styles from './index.module.css';

// Importing data from a JSON file
import data from '../../../Data/GitHubRepositoriesDetails.json';
import Gallery from '../components//Gallery';
import FilterPane from '../components/FilterPane';

// Initializing Fluent UI icons
initializeIcons();

// Defining the Repository interface
interface Repository {
    fullName: string;
    description: string;
    stargazerCount: number;
    topics: string[];
    language: string;
    hasGoodFirstIssues?: boolean;
    hasHelpWantedIssues?: boolean;
    // Add more properties as needed
}

// Function to escape special characters
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

// Defining the HomePage component
const HomePage = () => {
  const {siteConfig} = useDocusaurusContext();
  // Defining state variables
  const [searchText, setSearchText] = useState('');
  const [items, setItems] = useState<Repository[]>([]);
  const [hasGoodFirstIssueChecked, setHasGoodFirstIssue] = useState(false);
  const [hasHelpWantedIssueChecked, setHasHelpWantedIssue] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  // Function to handle search text change
  const handleSearchChange = (event) => {
    setSearchText(event.target.value);
  };

  // useEffect hook to filter items based on search text
  useEffect(() => {
    const sanitizedSearchText = escapeRegExp(searchText.toLowerCase());
  
    if (searchText === '') {
      setItems(data);
    } else {
      const filteredItems = data.filter(item => item.fullName.toLowerCase().includes(sanitizedSearchText)); // filter items based on search text
      setItems(filteredItems);
    }
  }, [searchText]);

  // Rendering the HomePage component
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="Description will go into a meta tag in <head />">
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
        <FluentProvider>
          <div className={styles.filterPaneAndGallery} >
            <FilterPane 
              items={items}
              onGoodFirstIssueChange={setHasGoodFirstIssue}
              onHelpWanteIssueChange={setHasHelpWantedIssue}
              onTopicsChange={setSelectedTopics}
              onLanguagesChange={setSelectedLanguages}
            />
            <Gallery
              items={items}
              hasGoodFirstIssueChecked={hasGoodFirstIssueChecked}
              hasHelpWantedIssueChecked={hasHelpWantedIssueChecked}
              selectedTopics={selectedTopics}
              selectedLanguages={selectedLanguages}
            />
          </div>
        </FluentProvider>
      </main>
    </Layout>
  );
}

// Exporting the HomePage component
export default HomePage;