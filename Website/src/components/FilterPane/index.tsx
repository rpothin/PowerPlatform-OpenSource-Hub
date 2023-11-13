// Importing necessary libraries and components
import React, { useState } from 'react';
import { Stack, Text, Checkbox, DefaultButton, useTheme } from '@fluentui/react';
import styles from './styles.module.css';

// Function to count the number of items where the 'hasGoodFirstIssues' property is true
function countGoodFirstIssues(items: { hasGoodFirstIssues?: boolean }[]): number {
  return items.filter(item => item.hasGoodFirstIssues).length;
}

// Function to count the number of items where the 'hasHelpWantedIssues' property is true
function countHelpWantedIssues(items: { hasHelpWantedIssues?: boolean }[]): number {
  return items.filter(item => item.hasHelpWantedIssues).length;
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

  const sortedTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([topic]) => topic);

  return sortedTopics;
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

// Defining the FilterPane component
const FilterPane = ({ items, onGoodFirstIssueChange, onHelpWanteIssueChange, onTopicsChange, onLanguagesChange }) => {
  // Defining state variables
  const [showAllTopics, setShowAllTopics] = useState(false);
  const [showAllLanguages, setShowAllLanguages] = useState(false);
  const [hasGoodFirstIssueChecked, setHasGoodFirstIssue] = useState(false);
  const [hasHelpWantedIssueChecked, setHasHelpWantedIssue] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  // Using Fluent UI's useTheme hook to get the current theme
  const theme = useTheme();
  const isDarkTheme = theme.palette.themePrimary === '#ffffff'; // Adjust this condition based on your theme configuration

  // Extracting topics and languages from items
  const topics = extractDistinctTopics(items);
  const languages = extractDistinctLanguages(items);

  // Counts
  const goodFirstIssueCount = countGoodFirstIssues(items);
  const helpWantedIssueCount = countHelpWantedIssues(items);

  // Determining which topics and languages to display
  const displayedTopics = showAllTopics ? topics : topics.slice(0, 10);
  const displayedLanguages = showAllLanguages ? languages : languages.slice(0, 10);

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
      >
        Help Required
      </Text>
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
  </div>
  );
};

// Exporting the FilterPane component
export default FilterPane;