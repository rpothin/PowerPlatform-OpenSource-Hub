// Importing necessary libraries and components
import React, { useState } from 'react';
import { Stack, Text, DefaultButton, useTheme, Icon } from '@fluentui/react';
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionToggleEventHandler,
  Checkbox,
} from "@fluentui/react-components";
import type { CheckboxProps } from "@fluentui/react-components";
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
  const [showContributionOpportunitiesFilter, setShowContributionOpportunitiesFilter] = useState(true);
  const [showTopicsFilter, setShowTopicsFilter] = useState(false);
  const [showLanguagesFilter, setShowLanguagesFilter] = useState(false);
  const [showLicensesFilter, setShowLicensesFilter] = useState(false);
  const [showOwnersFilter, setShowOwnersFilter] = useState(false);
  const [checkboxStates, setCheckboxStates] = useState({});
  const [hasGoodFirstIssueChecked, setHasGoodFirstIssue] = React.useState<CheckboxProps["checked"]>(false);
  const [hasHelpWantedIssueChecked, setHasHelpWantedIssue] = React.useState<CheckboxProps["checked"]>(false);
  const [hasCodeOfConductChecked, setHasCodeOfConduct] = React.useState<CheckboxProps["checked"]>(false);
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
  const handleGoodFirstIssueChange = (checked: CheckboxProps["checked"]) => {
    setHasGoodFirstIssue(checked);
    onGoodFirstIssueChange(checked);
  };

  // Function to handle help wanted issue change
  const handleHelpWantedIssueChange = (checked: CheckboxProps["checked"]) => {
    setHasHelpWantedIssue(checked);
    onHelpWanteIssueChange(checked);
  };

  // Function to handle code of conduct change
  const handleCodeOfConductChange = (checked: CheckboxProps["checked"]) => {
    setHasCodeOfConduct(checked);
    onCodeOfConductChange(checked);
  };

  // Function to handle topic change
  const handleTopicChange = (topic: string, checked: CheckboxProps["checked"]) => {
    const newSelectedTopics = checked
      ? [...selectedTopics, topic]
      : selectedTopics.filter(t => t !== topic);
    setSelectedTopics(newSelectedTopics);
    onTopicsChange(newSelectedTopics);
  };

  // Function to handle language change
  const handleLanguageChange = (language: string, checked: CheckboxProps["checked"]) => {
    const newSelectedLanguages = checked
      ? [...selectedLanguages, language]
      : selectedLanguages.filter(l => l !== language);
    setSelectedLanguages(newSelectedLanguages);
    onLanguagesChange(newSelectedLanguages); // You need to pass this function as a prop to FilterPane
  };

  const handleLicenseChange = (license: string, checked: CheckboxProps["checked"]) => {
    const newSelectedLicenses = checked
      ? [...selectedLicenses, license]
      : selectedLicenses.filter(l => l !== license);
    setSelectedLicenses(newSelectedLicenses);
    onLicensesChange(newSelectedLicenses); // You need to pass this function as a prop to FilterPane
  };

  const handleOwnerChange = (owner: string, checked: CheckboxProps["checked"]) => {
    const newSelectedOwners = checked
      ? [...selectedOwners, owner]
      : selectedOwners.filter(o => o !== owner);
    setSelectedOwners(newSelectedOwners);
    onOwnersChange(newSelectedOwners); // You need to pass this function as a prop to FilterPane
  };

  // Rendering the FilterPane component
  return(
    <Accordion
      defaultOpenItems="1"
      multiple
      collapsible
      style={{
        width: '350px',
        minWidth: '350px',
      }}
    >
      <AccordionItem value="1">
        <AccordionHeader style={{ marginBottom: '10px' }} size="large" expandIconPosition="end">Contribution Opportunities</AccordionHeader>
        <AccordionPanel>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Checkbox 
              label={"Has good first issue (" + goodFirstIssueCount +  ")"}
              checked={checkboxStates['goodFirstIssue'] || false} 
              onChange={(e, data) => {
                handleGoodFirstIssueChange(data.checked);
                setCheckboxStates(prevState => ({...prevState, 'goodFirstIssue': data.checked}));
              }}
            />
            <Checkbox 
            label={"Has help wanted issue (" + helpWantedIssueCount + ")"} 
            checked={checkboxStates['helpWantedIssue'] || false}
            onChange={(e, data) => {
              handleHelpWantedIssueChange(data.checked);
              setCheckboxStates(prevState => ({...prevState, 'helpWantedIssue': data.checked}));
            }}
          />
          <Checkbox 
            label={"Has code of conduct (" + codeOfConductCount +  ")"} 
            checked={checkboxStates['codeOfConduct'] || false}
            onChange={(e, data) => {
              handleCodeOfConductChange(data.checked);
              setCheckboxStates(prevState => ({...prevState, 'codeOfConduct': data.checked}));
            }}
          />
          </div>
        </AccordionPanel>
      </AccordionItem>
      <AccordionItem value="2">
        <AccordionHeader style={{ marginTop: '10px', marginBottom: '10px' }} size="large" expandIconPosition="end">Topics</AccordionHeader>
        <AccordionPanel>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Stack tokens={{ childrenGap: 10 }}>
                <Stack>
                  {displayedTopics.map((topic, index) => (
                    <Checkbox 
                      key={index} 
                      label={topic + " (" + countItemsWithTopic(items, topic) + ")"} 
                      checked={checkboxStates[topic] || false}
                      onChange={(e, data) => {
                        handleTopicChange(topic, data.checked);
                        setCheckboxStates(prevState => ({...prevState, [topic]: data.checked}));
                      }}
                    />
                  ))}
                </Stack>
                {topics.length > 10 && (
                  <DefaultButton onClick={() => setShowAllTopics(!showAllTopics)}>
                    {showAllTopics ? 'View Less' : 'View All'}
                  </DefaultButton>
                )}
              </Stack>
            </div>
        </AccordionPanel>
      </AccordionItem>
      <AccordionItem value="3">
        <AccordionHeader style={{ marginTop: '10px', marginBottom: '10px' }} size="large" expandIconPosition="end">Languages</AccordionHeader>
        <AccordionPanel>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Stack tokens={{ childrenGap: 10 }}>
              <Stack>
                {displayedLanguages.map((language, index) => (
                  <Checkbox 
                    key={index} 
                    label={language + " (" + countItemsWithLanguage(items, language) + ")"} 
                    checked={checkboxStates[language] || false}
                    onChange={(e, data) => {
                      handleLanguageChange(language, data.checked);
                      setCheckboxStates(prevState => ({...prevState, [language]: data.checked}));
                    }}
                  />
                ))}
              </Stack>
              {languages.length > 10 && (
                <DefaultButton onClick={() => setShowAllLanguages(!showAllLanguages)}>
                  {showAllLanguages ? 'View Less' : 'View All'}
                </DefaultButton>
              )}
            </Stack>
          </div>
        </AccordionPanel>
      </AccordionItem>
      <AccordionItem value="4">
        <AccordionHeader style={{ marginTop: '10px', marginBottom: '10px' }} size="large" expandIconPosition="end">Licenses</AccordionHeader>
        <AccordionPanel>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Stack tokens={{ childrenGap: 10 }}>
              <Stack>
                {displayedLicenses.map((license, index) => (
                  <Checkbox 
                    key={index} 
                    label={license + " (" + countItemsWithLicense(items, license) + ")"} 
                    checked={checkboxStates[license] || false}
                    onChange={(e, data) => {
                      handleLicenseChange(license, data.checked);
                      setCheckboxStates(prevState => ({...prevState, [license]: data.checked}));
                    }}
                  />
                ))}
              </Stack>
              {licenses.length > 10 && (
                <DefaultButton onClick={() => setShowAllLicenses(!showAllLicenses)}>
                  {showAllLicenses ? 'View Less' : 'View All'}
                </DefaultButton>
              )}
            </Stack>
          </div>
        </AccordionPanel>
      </AccordionItem>
      <AccordionItem value="5">
        <AccordionHeader style={{ marginTop: '10px', marginBottom: '10px' }} size="large" expandIconPosition="end">Owners</AccordionHeader>
        <AccordionPanel>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Stack tokens={{ childrenGap: 10 }}>
              <Stack>
                {displayedOwners.map((owner, index) => (
                  <Checkbox 
                    key={index} 
                    label={owner + " (" + countItemsWithOwner(items, owner) + ")"} 
                    checked={checkboxStates[owner] || false}
                    onChange={(e, data) => {
                      handleOwnerChange(owner, data.checked);
                      setCheckboxStates(prevState => ({...prevState, [owner]: data.checked}));
                    }}
                  />
                ))}
              </Stack>
              {owners.length > 10 && (
                <DefaultButton onClick={() => setShowAllOwners(!showAllOwners)}>
                  {showAllOwners ? 'View Less' : 'View All'}
                </DefaultButton>
              )}
            </Stack>
          </div>
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
};

// Exporting the FilterPane component
export default FilterPane;