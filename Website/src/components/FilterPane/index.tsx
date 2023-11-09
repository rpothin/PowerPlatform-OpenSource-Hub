import React, { useState } from 'react';
import { Stack, Text, Checkbox, DefaultButton } from '@fluentui/react';
import styles from './styles.module.css';

function extractDistinctTopics(items: { topics?: string[] }[]): string[] {
    const topicsSet = new Set<string>();
    items.forEach(item => {
        if (item.topics) {
            item.topics.forEach(topic => topicsSet.add(topic));
        }
    });
    return Array.from(topicsSet).sort();
}

function extractDistinctLanguages(items: { language?: string }[]): string[] {
    const languagesSet = new Set<string>();
    items.forEach(item => {
        if (item.language) {
            languagesSet.add(item.language);
        }
    });
    return Array.from(languagesSet).sort();
}

const FilterPane = ({ items, onTopicsChange, onLanguagesChange }) => {
  const [showAllTopics, setShowAllTopics] = useState(false);
  const [showAllLanguages, setShowAllLanguages] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  const topics = extractDistinctTopics(items);
  const languages = extractDistinctLanguages(items);

  const displayedTopics = showAllTopics ? topics : topics.slice(0, 10);
  const displayedLanguages = showAllLanguages ? languages : languages.slice(0, 10);

  const handleTopicChange = (topic: string, checked: boolean) => {
    const newSelectedTopics = checked
      ? [...selectedTopics, topic]
      : selectedTopics.filter(t => t !== topic);
    setSelectedTopics(newSelectedTopics);
    onTopicsChange(newSelectedTopics);
  };

  const handleLanguageChange = (language: string, checked: boolean) => {
    const newSelectedLanguages = checked
      ? [...selectedLanguages, language]
      : selectedLanguages.filter(l => l !== language);
    setSelectedLanguages(newSelectedLanguages);
    onLanguagesChange(newSelectedLanguages);
  };

  return (
    <div className={styles.filterPane}>
        <Stack className="filter-pane" tokens={{ childrenGap: 10 }}>
            <Text variant="large">Help Required</Text>
            <Checkbox label="Has good first issue" />
            <Checkbox label="Has help wanted issue" />
            <Text variant="large">Topics</Text>
            <Stack tokens={{ childrenGap: 10 }}>
            <Stack>
                {displayedTopics.map((topic, index) => (
                <Checkbox key={index} label={topic} onChange={(e, checked) => handleTopicChange(topic, checked)} />
                ))}
            </Stack>
            {topics.length > 10 && (
                <DefaultButton onClick={() => setShowAllTopics(!showAllTopics)}>
                {showAllTopics ? 'Display Less' : 'Display More'}
                </DefaultButton>
            )}
            </Stack>
            <Text variant="large">Languages</Text>
            <Stack tokens={{ childrenGap: 10 }}>
            <Stack>
                {displayedLanguages.map((language, index) => (
                <Checkbox key={index} label={language} onChange={(e, checked) => handleLanguageChange(language, checked)} />
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

export default FilterPane;