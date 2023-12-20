// Importing necessary libraries and components
// React library
import * as React from 'react';
import { useState } from 'react';

// Fluent UI libraries
import { Stack, DefaultButton, useTheme } from '@fluentui/react';
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Checkbox,
} from "@fluentui/react-components";
import type { CheckboxProps } from "@fluentui/react-components";

// Local files
import { countItemsByProperty, extractDistinctProperties } from '../../utils/filterPaneUtils';

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
  const topics = extractDistinctProperties(items, 'topics');
  const languages = extractDistinctProperties(items, 'language');
  const licenses = extractDistinctProperties(items, 'license.name');
  const owners = extractDistinctProperties(items, 'owner.login');

  // Counts
  const goodFirstIssueCount = countItemsByProperty(items, 'hasGoodFirstIssues', true);
  const helpWantedIssueCount = countItemsByProperty(items, 'hasHelpWantedIssues', true);
  const codeOfConductCount = countItemsByProperty(items, 'codeOfConduct', 'NotNull');

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
                      label={topic + " (" + countItemsByProperty(items, 'topics', topic) + ")"}
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
                    label={language + " (" + countItemsByProperty(items, 'language', language) + ")"} 
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
                    label={license + " (" + countItemsByProperty(items, 'license.name', license) + ")"} 
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
                    label={owner + " (" + countItemsByProperty(items, 'owner.login', owner) + ")"} 
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