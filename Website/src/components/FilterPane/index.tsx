// Importing necessary libraries and components
import React, { useState } from 'react';
import { Stack, Text, Checkbox, DefaultButton, useTheme } from '@fluentui/react';
import styles from './styles.module.css';

// Function to extract distinct topics from items
function extractDistinctTopics(items: { topics?: string[] }[]): string[] {
  const topicsSet = new Set<string>();
  items.forEach(item => {
    if (item.topics) {
      item.topics.forEach(topic => topicsSet.add(topic));
    }
  });
  return Array.from(topicsSet).sort();
}

// Function to extract distinct languages from items
function extractDistinctLanguages(items: { language?: string }[]): string[] {
  const languagesSet = new Set<string>();
  items.forEach(item => {
    if (item.language) {
      languagesSet.add(item.language);
    }
  });
  return Array.from(languagesSet).sort();
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
      <Text variant="large" style={{ color: isDarkTheme ? 'rgb(173, 173, 173)' : 'inherit' }}>Help Required</Text>
      <Checkbox 
        label="Has good first issue" 
        onChange={(e, checked) => handleGoodFirstIssueChange(checked)}
      />
      <Checkbox 
        label="Has help wanted issue" 
        onChange={(e, checked) => handleHelpWantedIssueChange(checked)}
      />
      <Text variant="large" style={{ color: isDarkTheme ? 'rgb(173, 173, 173)' : 'inherit' }}>Topics</Text>
      <Stack tokens={{ childrenGap: 10 }}>
        <Stack>
          {displayedTopics.map((topic, index) => (
            <Checkbox 
              key={index} 
              label={topic} 
              onChange={(e, checked) => handleTopicChange(topic, checked)}
            />
          ))}
        </Stack>
        {topics.length > 10 && (
          <DefaultButton onClick={() => setShowAllTopics(!showAllTopics)}>
            {showAllTopics ? 'Display Less' : 'Display More'}
          </DefaultButton>
        )}
      </Stack>
      <Text variant="large" style={{ color: isDarkTheme ? 'rgb(173, 173, 173)' : 'inherit' }}>Languages</Text>
      <Stack tokens={{ childrenGap: 10 }}>
        <Stack>
          {displayedLanguages.map((language, index) => (
            <Checkbox 
              key={index} 
              label={language} 
              onChange={(e, checked) => handleLanguageChange(language, checked)} 
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