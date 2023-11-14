// Importing necessary libraries and components
import React, { useState } from 'react';
import { Stack, Text, Checkbox, DefaultButton, useTheme, Icon } from '@fluentui/react';
import styles from './styles.module.css';

// Function to count the number of items where the 'hasGoodFirstIssues' property is true
function countGoodFirstIssues(items: { hasGoodFirstIssues?: boolean }[]): number {
  return items.filter(item => item.hasGoodFirstIssues).length;
}

// Function to count the number of items where the 'hasHelpWantedIssues' property is true
function countHelpWantedIssues(items: { hasHelpWantedIssues?: boolean }[]): number {
  return items.filter(item => item.hasHelpWantedIssues).length;
}

// Function to count the number of items where the 'codeOfConduct' property is not null and 'codeOfConduct.name' is not null
function countCodeOfConduct(items: { codeOfConduct?: { name?: string } }[]): number {
  return items.filter(item => item.codeOfConduct && item.codeOfConduct.name).length;
}

// Function to extract distinct topics from items ordered by count of items with that topic
function extractDistinctTopics(items: { topics?: string[] }[]): string[] {
  const topicCounts: { [topic: string]: number } = {};
  items.forEach(item => {
    if (item.topics) {
      item.topics.forEach(topic => {
        if (!topicCounts[topic]) {
          topicCounts[topic] = 0;
        }
        topicCounts[topic]++;
      });
    }
  });

  const filteredTopics = Object.entries(topicCounts)
    .filter(([_, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .map(([topic]) => topic);

  return filteredTopics;
}

// Function to count the number of items with a specified topic
function countItemsWithTopic(items: { topics?: string[] }[], topic: string): number {
  return items.filter(item => item.topics && item.topics.includes(topic)).length;
}

// Function to extract distinct languages from items ordered by count of items with that language
function extractDistinctLanguages(items: { language?: string }[]): string[] {
  const languageCounts: { [language: string]: number } = {};
  items.forEach(item => {
    if (item.language) {
      if (!languageCounts[item.language]) {
        languageCounts[item.language] = 0;
      }
      languageCounts[item.language]++;
    }
  });

  const sortedLanguages = Object.entries(languageCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([language]) => language);

  return sortedLanguages;
}

// Function to count the number of items with a specified language
function countItemsWithLanguage(items: { language?: string }[], language: string): number {
  return items.filter(item => item.language === language).length;
}

// Function to extract distinct licenses from items ordered by count of items with that license
function extractDistinctLicenses(items: { license?: { name?: string } }[]): string[] {
  const licenseCounts: { [license: string]: number } = {};
  items.forEach(item => {
    if (item.license && item.license.name) {
      if (!licenseCounts[item.license.name]) {
        licenseCounts[item.license.name] = 0;
      }
      licenseCounts[item.license.name]++;
    }
  });

  const sortedLicenses = Object.entries(licenseCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([license]) => license);

  return sortedLicenses;
}

// Function to count the number of items with a specified license
function countItemsWithLicense(items: { license?: { name?: string } }[], license: string): number {
  return items.filter(item => item.license && item.license.name === license).length;
}

// Function to extract distinct owners from items ordered by count of items with that owner
function extractDistinctOwners(items: { owner?: { login?: string } }[]): string[] {
  const ownerCounts: { [owner: string]: number } = {};
  items.forEach(item => {
    if (item.owner && item.owner.login) {
      if (!ownerCounts[item.owner.login]) {
        ownerCounts[item.owner.login] = 0;
      }
      ownerCounts[item.owner.login]++;
    }
  });

  const sortedOwners = Object.entries(ownerCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([owner]) => owner);

  return sortedOwners;
}

// Function to count the number of items with a specified owner
function countItemsWithOwner(items: { owner?: { login?: string } }[], owner: string): number {
  return items.filter(item => item.owner && item.owner.login === owner).length;
}

// Defining the FilterPane component
const FilterPane = ({ items, onGoodFirstIssueChange, onHelpWanteIssueChange, onCodeOfConductChange, onTopicsChange, onLanguagesChange, onLicensesChange, onOwnersChange }) => {
  // Defining state variables
  const [showContributionOpportunitiesFilter, setShowContributionOpportunitiesFilter] = useState(false);
  const [hasGoodFirstIssueChecked, setHasGoodFirstIssue] = useState(false);
  const [hasHelpWantedIssueChecked, setHasHelpWantedIssue] = useState(false);
  const [hasCodeOfConductChecked, setHasCodeOfConduct] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [showAllTopics, setShowAllTopics] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [showAllLanguages, setShowAllLanguages] = useState(false);
  const [selectedLicenses, setSelectedLicenses] = useState<string[]>([]);
  const [showAllLicenses, setShowAllLicenses] = useState(false);
  const [selectedOwners, setSelectedOwners] = useState<string[]>([]);
  const [showAllOwners, setShowAllOwners] = useState(false);
  const filterSectionLabels = ["Contribution Opportunities", "Topics", "Languages", "Licenses", "Owners", "Test to be sure it will work with a long label"];

  // Find the maximum length of the filter section labels
  const filterSectionLabelMaxLength = Math.max(...filterSectionLabels.map(label => label.length));

  // Using Fluent UI's useTheme hook to get the current theme
  const theme = useTheme();
  const isDarkTheme = theme.palette.themePrimary === '#ffffff'; // Adjust this condition based on your theme configuration

  // Extracting information from items
  const topics = extractDistinctTopics(items);
  const languages = extractDistinctLanguages(items);
  const licenses = extractDistinctLicenses(items);
  const owners = extractDistinctOwners(items);

  // Counts
  const goodFirstIssueCount = countGoodFirstIssues(items);
  const helpWantedIssueCount = countHelpWantedIssues(items);
  const codeOfConductCount = countCodeOfConduct(items);

  // Determining which information to display
  const displayedTopics = showAllTopics ? topics : topics.slice(0, 10);
  const displayedLanguages = showAllLanguages ? languages : languages.slice(0, 10);
  const displayedLicenses = showAllLicenses ? licenses : licenses.slice(0, 10);
  const displayedOwners = showAllOwners ? owners : owners.slice(0, 10);

  // Function to handle good first issue change
  const handleGoodFirstIssueChange = (checked: boolean) => {
  setHasGoodFirstIssue(checked);
  onGoodFirstIssueChange(checked);
  };

  // Function to handle help wanted issue change
  const handleHelpWantedIssueChange = (checked: boolean) => {
  setHasHelpWantedIssue(checked);
  onHelpWanteIssueChange(checked);
  };

  // Function to handle code of conduct change
  const handleCodeOfConductChange = (checked: boolean) => {
    setHasCodeOfConduct(checked);
    onCodeOfConductChange(checked);
  };

  // Function to handle topic change
  const handleTopicChange = (topic: string, checked: boolean) => {
  const newSelectedTopics = checked
    ? [...selectedTopics, topic]
    : selectedTopics.filter(t => t !== topic);
  setSelectedTopics(newSelectedTopics);
  onTopicsChange(newSelectedTopics);
  };

  // Function to handle language change
  const handleLanguageChange = (language: string, checked: boolean) => {
  const newSelectedLanguages = checked
    ? [...selectedLanguages, language]
    : selectedLanguages.filter(l => l !== language);
  setSelectedLanguages(newSelectedLanguages);
  onLanguagesChange(newSelectedLanguages);
  };

  const handleLicenseChange = (license: string, checked: boolean) => {
    const newSelectedLicenses = checked
      ? [...selectedLicenses, license]
      : selectedLicenses.filter(l => l !== license);
    setSelectedLicenses(newSelectedLicenses);
    onLicensesChange(newSelectedLicenses); // You need to pass this function as a prop to FilterPane
  };

  const handleOwnerChange = (owner: string, checked: boolean) => {
    const newSelectedOwners = checked
      ? [...selectedOwners, owner]
      : selectedOwners.filter(o => o !== owner);
    setSelectedOwners(newSelectedOwners);
    onOwnersChange(newSelectedOwners); // You need to pass this function as a prop to FilterPane
  };

  // Rendering the FilterPane component
  return (
  <div className={styles.filterPane}> 
    <Stack className="filter-pane" tokens={{ childrenGap: 10 }}>
      <Text 
        variant="large" 
        style={{ 
          color: isDarkTheme ? 'rgb(173, 173, 173)' : 'inherit', 
          marginBottom: '15px' 
        }}
        onClick={() => setShowContributionOpportunitiesFilter(!showContributionOpportunitiesFilter)}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', width: `${filterSectionLabelMaxLength}ch` }}>
            <span>Contribution Opportunities</span>
            <Icon iconName={showContributionOpportunitiesFilter ? 'ChevronUp' : 'ChevronDown'} />
        </div>
      </Text>
      {showContributionOpportunitiesFilter && (
      <>
          <Checkbox 
            label={"Has good first issue (" + goodFirstIssueCount +  ")"} 
            onChange={(e, checked) => handleGoodFirstIssueChange(checked)}
            styles={{ 
              root: {
                selectors: {
                  ':hover .ms-Checkbox-checkbox': {
                    borderColor: isDarkTheme ? 'rgb(173, 173, 173)' : 'inherit',
                  },
                  ':hover .ms-Checkbox-text': {
                    color: isDarkTheme ? 'rgb(173, 173, 173)' : 'inherit',
                  },
                },
              },
              checkbox: { 
                borderColor: isDarkTheme ? 'rgb(173, 173, 173)' : 'inherit' 
              },
              text: { 
                color: isDarkTheme ? 'rgb(173, 173, 173)' : 'inherit' 
              },
            }}
          />
          <Checkbox 
            label={"Has help wanted issue (" + helpWantedIssueCount + ")"} 
            onChange={(e, checked) => handleHelpWantedIssueChange(checked)}
            styles={{ 
              root: {
                selectors: {
                  ':hover .ms-Checkbox-checkbox': {
                    borderColor: isDarkTheme ? 'rgb(173, 173, 173)' : 'inherit',
                  },
                  ':hover .ms-Checkbox-text': {
                    color: isDarkTheme ? 'rgb(173, 173, 173)' : 'inherit',
                  },
                },
              },
              checkbox: { 
                borderColor: isDarkTheme ? 'rgb(173, 173, 173)' : 'inherit' 
              },
              text: { 
                color: isDarkTheme ? 'rgb(173, 173, 173)' : 'inherit' 
              },
            }}
          />
          <Checkbox 
            label={"Has code of conduct (" + codeOfConductCount +  ")"} 
            onChange={(e, checked) => handleCodeOfConductChange(checked)}
            styles={{ 
              root: {
                selectors: {
                  ':hover .ms-Checkbox-checkbox': {
                    borderColor: isDarkTheme ? 'rgb(173, 173, 173)' : 'inherit',
                  },
                  ':hover .ms-Checkbox-text': {
                    color: isDarkTheme ? 'rgb(173, 173, 173)' : 'inherit',
                  },
                },
              },
              checkbox: { 
                borderColor: isDarkTheme ? 'rgb(173, 173, 173)' : 'inherit' 
              },
              text: { 
                color: isDarkTheme ? 'rgb(173, 173, 173)' : 'inherit' 
              },
            }}
          />
          </>
      )}
      <Text 
        variant="large" 
        style={{ 
          color: isDarkTheme ? 'rgb(173, 173, 173)' : 'inherit', 
          marginTop: '20px', 
          marginBottom: '15px' 
        }}
      >
        Topics
      </Text>
      <Stack tokens={{ childrenGap: 10 }}>
        <Stack>
          {displayedTopics.map((topic, index) => (
            <Checkbox 
              key={index} 
              label={topic + " (" + countItemsWithTopic(items, topic) + ")"} 
              onChange={(e, checked) => handleTopicChange(topic, checked)}
              styles={{ 
                root: {
                  selectors: {
                    ':hover .ms-Checkbox-checkbox': {
                      borderColor: isDarkTheme ? 'rgb(173, 173, 173)' : 'inherit',
                    },
                    ':hover .ms-Checkbox-text': {
                      color: isDarkTheme ? 'rgb(173, 173, 173)' : 'inherit',
                    },
                  },
                  marginBottom: '10px',
                },
                checkbox: { 
                  borderColor: isDarkTheme ? 'rgb(173, 173, 173)' : 'inherit' 
                },
                text: { 
                  color: isDarkTheme ? 'rgb(173, 173, 173)' : 'inherit' 
                },
              }}
            />
          ))}
        </Stack>
        {topics.length > 10 && (
          <DefaultButton onClick={() => setShowAllTopics(!showAllTopics)}>
            {showAllTopics ? 'Display Less' : 'Display More'}
          </DefaultButton>
        )}
      </Stack>
      <Text 
        variant="large" 
        style={{ 
          color: isDarkTheme ? 'rgb(173, 173, 173)' : 'inherit', 
          marginTop: '20px', 
          marginBottom: '15px' 
        }}
      >
        Languages
      </Text>
      <Stack tokens={{ childrenGap: 10 }}>
        <Stack>
          {displayedLanguages.map((language, index) => (
            <Checkbox 
              key={index} 
              label={language + " (" + countItemsWithLanguage(items, language) + ")"} 
              onChange={(e, checked) => handleLanguageChange(language, checked)}
              styles={{ 
                root: {
                  selectors: {
                    ':hover .ms-Checkbox-checkbox': {
                      borderColor: isDarkTheme ? 'rgb(173, 173, 173)' : 'inherit',
                    },
                    ':hover .ms-Checkbox-text': {
                      color: isDarkTheme ? 'rgb(173, 173, 173)' : 'inherit',
                    },
                  },
                  marginBottom: '10px',
                },
                checkbox: { 
                  borderColor: isDarkTheme ? 'rgb(173, 173, 173)' : 'inherit' 
                },
                text: { 
                  color: isDarkTheme ? 'rgb(173, 173, 173)' : 'inherit' 
                },
              }}
            />
          ))}
        </Stack>
        {languages.length > 10 && (
          <DefaultButton onClick={() => setShowAllLanguages(!showAllLanguages)}>
            {showAllLanguages ? 'Display Less' : 'Display More'}
          </DefaultButton>
        )}
      </Stack>
    </Stack>
    <Text 
      variant="large" 
      style={{ 
        color: isDarkTheme ? 'rgb(173, 173, 173)' : 'inherit', 
        marginTop: '20px', 
        marginBottom: '15px' 
      }}
    >
      Licenses
    </Text>
    <Stack tokens={{ childrenGap: 10 }}>
      <Stack>
        {displayedLicenses.map((license, index) => (
          <Checkbox 
            key={index} 
            label={license + " (" + countItemsWithLicense(items, license) + ")"} 
            onChange={(e, checked) => handleLicenseChange(license, checked)}
            styles={{ 
              root: {
                selectors: {
                  ':hover .ms-Checkbox-checkbox': {
                    borderColor: isDarkTheme ? 'rgb(173, 173, 173)' : 'inherit',
                  },
                  ':hover .ms-Checkbox-text': {
                    color: isDarkTheme ? 'rgb(173, 173, 173)' : 'inherit',
                  },
                },
                marginBottom: '10px',
              },
              checkbox: { 
                borderColor: isDarkTheme ? 'rgb(173, 173, 173)' : 'inherit' 
              },
              text: { 
                color: isDarkTheme ? 'rgb(173, 173, 173)' : 'inherit' 
              },
            }}
          />
        ))}
      </Stack>
      {licenses.length > 10 && (
        <DefaultButton onClick={() => setShowAllLicenses(!showAllLicenses)}>
          {showAllLicenses ? 'Display Less' : 'Display More'}
        </DefaultButton>
      )}
    </Stack>
    <Text 
      variant="large" 
      style={{ 
        color: isDarkTheme ? 'rgb(173, 173, 173)' : 'inherit', 
        marginTop: '20px', 
        marginBottom: '15px' 
      }}
    >
      Owners
    </Text>
    <Stack tokens={{ childrenGap: 10 }}>
      <Stack>
        {displayedOwners.map((owner, index) => (
          <Checkbox 
            key={index} 
            label={owner + " (" + countItemsWithOwner(items, owner) + ")"} 
            onChange={(e, checked) => handleOwnerChange(owner, checked)}
            styles={{ 
              root: {
                selectors: {
                  ':hover .ms-Checkbox-checkbox': {
                    borderColor: isDarkTheme ? 'rgb(173, 173, 173)' : 'inherit',
                  },
                  ':hover .ms-Checkbox-text': {
                    color: isDarkTheme ? 'rgb(173, 173, 173)' : 'inherit',
                  },
                },
                marginBottom: '10px',
              },
              checkbox: { 
                borderColor: isDarkTheme ? 'rgb(173, 173, 173)' : 'inherit' 
              },
              text: { 
                color: isDarkTheme ? 'rgb(173, 173, 173)' : 'inherit' 
              },
            }}
          />
        ))}
      </Stack>
      {owners.length > 10 && (
        <DefaultButton onClick={() => setShowAllOwners(!showAllOwners)}>
          {showAllOwners ? 'Display Less' : 'Display More'}
        </DefaultButton>
      )}
    </Stack>
  </div>
  );
};

// Exporting the FilterPane component
export default FilterPane;