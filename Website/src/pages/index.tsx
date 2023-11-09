import clsx from 'clsx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import React, { useState, useEffect } from "react";
import { SearchBox } from "@fluentui/react/lib/SearchBox";
import { initializeIcons } from "@fluentui/react/lib/Icons";
import { FluentProvider } from '@fluentui/react-provider';

import styles from './index.module.css';

import data from '../../../Data/GitHubRepositoriesDetails.json';
import Gallery from '../components//Gallery';
import FilterPane from '../components/FilterPane';

initializeIcons();

interface Repository {
    fullName: string;
    description: string;
    stargazerCount: number;
    topics: string[];
    language: string;
    hasGoodFirstIssue: boolean;
    hasHelpWantedIssue: boolean;
    // Add more properties as needed
}

// Function to escape special characters
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

const HomePage = () => {
  const {siteConfig} = useDocusaurusContext();
  const [searchText, setSearchText] = useState('');
  const [items, setItems] = useState<Repository[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  const handleSearchChange = (event) => {
    setSearchText(event.target.value);
  };

  useEffect(() => {
    const sanitizedSearchText = escapeRegExp(searchText);

    if (searchText === '') {
      setItems(data.slice(0, 20)); // Keep only the first 20 items for tests
    } else {
      const filteredItems = data.filter(item => item.fullName.includes(sanitizedSearchText)); // filter items based on search text
      setItems(filteredItems);
    }
  }, [searchText]);

  return (
    <Layout
      title={`Hello from ${siteConfig.title}`}
      description="Description will go into a meta tag in <head />">
      <header className={clsx('hero hero--primary', styles.heroBanner)}>
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
          <Heading as="h1" className="hero__title">
            {siteConfig.title}
          </Heading>
          <p className="hero__subtitle">{siteConfig.tagline}</p>
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
              onTopicsChange={setSelectedTopics}
              onLanguagesChange={setSelectedLanguages}
            />
            <Gallery
              items={items}
              selectedTopics={selectedTopics}
              selectedLanguages={selectedLanguages}
            />
          </div>
        </FluentProvider>
      </main>
    </Layout>
  );
}

export default HomePage;