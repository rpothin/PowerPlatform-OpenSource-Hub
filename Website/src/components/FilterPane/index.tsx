import * as React from 'react';
import { useState } from 'react';

import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Button,
  Checkbox,
  Input,
} from "@fluentui/react-components";
import type { CheckboxProps } from "@fluentui/react-components";

import { countItemsByProperty, extractDistinctProperties, formatFacetLabel } from '../../utils/filterPaneUtils';
import { Repository } from '../../types/repository';

type FilterPaneProps = {
  items: Repository[];
  isMobile?: boolean;
  hasGoodFirstIssueChecked: boolean;
  hasHelpWantedIssueChecked: boolean;
  hasCodeOfConductChecked: boolean;
  selectedTopics: string[];
  selectedLanguages: string[];
  selectedLicenses: string[];
  selectedOwners: string[];
  selectedCategories: string[];
  selectedFocusAreas: string[];
  selectedAudiences: string[];
  onGoodFirstIssueChange: (checked: boolean) => void;
  onHelpWantedIssueChange: (checked: boolean) => void;
  onCodeOfConductChange: (checked: boolean) => void;
  onTopicsChange: (values: string[]) => void;
  onLanguagesChange: (values: string[]) => void;
  onLicensesChange: (values: string[]) => void;
  onOwnersChange: (values: string[]) => void;
  onCategoriesChange: (values: string[]) => void;
  onFocusAreasChange: (values: string[]) => void;
  onAudiencesChange: (values: string[]) => void;
  onClearAllFilters?: () => void;
  hasAnyActiveFilters?: boolean;
};

const FilterPane = ({
  items,
  isMobile = false,
  hasGoodFirstIssueChecked,
  hasHelpWantedIssueChecked,
  hasCodeOfConductChecked,
  selectedTopics = [],
  selectedLanguages = [],
  selectedLicenses = [],
  selectedOwners = [],
  selectedCategories = [],
  selectedFocusAreas = [],
  selectedAudiences = [],
  onGoodFirstIssueChange,
  onHelpWantedIssueChange,
  onCodeOfConductChange,
  onTopicsChange,
  onLanguagesChange,
  onLicensesChange,
  onOwnersChange,
  onCategoriesChange,
  onFocusAreasChange,
  onAudiencesChange,
  onClearAllFilters,
  hasAnyActiveFilters = false,
}: FilterPaneProps) => {
  const [showAllTopics, setShowAllTopics] = useState(false);
  const [topicSearch, setTopicSearch] = useState('');
  const [showAllLanguages, setShowAllLanguages] = useState(false);
  const [showAllLicenses, setShowAllLicenses] = useState(false);
  const [showAllOwners, setShowAllOwners] = useState(false);
  const [ownerSearch, setOwnerSearch] = useState('');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllFocusAreas, setShowAllFocusAreas] = useState(false);
  const [showAllAudiences, setShowAllAudiences] = useState(false);

  const topics = extractDistinctProperties(items, 'topics');
  const languages = extractDistinctProperties(items, 'languages');
  const licenses = extractDistinctProperties(items, 'license.name');
  const owners = extractDistinctProperties(items, 'owner.login');
  const categories = extractDistinctProperties(items, 'category');
  const focusAreas = extractDistinctProperties(items, 'focusAreas');
  const audiences = extractDistinctProperties(items, 'audiences');

  const goodFirstIssueCount = countItemsByProperty(items, 'hasGoodFirstIssues', true);
  const helpWantedIssueCount = countItemsByProperty(items, 'hasHelpWantedIssues', true);
  const codeOfConductCount = countItemsByProperty(items, 'codeOfConduct', 'NotNull');

  const displayedTopics = showAllTopics ? topics : topics.slice(0, 10);
  const displayedLanguages = showAllLanguages ? languages : languages.slice(0, 10);
  const displayedLicenses = showAllLicenses ? licenses : licenses.slice(0, 10);
  const displayedOwners = showAllOwners ? owners : owners.slice(0, 10);
  const displayedCategories = showAllCategories ? categories : categories.slice(0, 10);
  const displayedFocusAreas = showAllFocusAreas ? focusAreas : focusAreas.slice(0, 10);
  const displayedAudiences = showAllAudiences ? audiences : audiences.slice(0, 10);

  const updateSelectedValues = (
    value: string,
    checked: CheckboxProps["checked"],
    selectedValues: string[],
    onChange: (values: string[]) => void,
  ) => {
    onChange(
      checked
      ? [...selectedValues, value]
      : selectedValues.filter(selectedValue => selectedValue !== value),
    );
  };

  const handleTopicChange = (topic: string, checked: CheckboxProps["checked"]) => {
    onTopicsChange(
      checked
      ? [...selectedTopics, topic]
      : selectedTopics.filter(t => t !== topic),
    );
  };

  const handleLanguageChange = (language: string, checked: CheckboxProps["checked"]) => {
    onLanguagesChange(
      checked
      ? [...selectedLanguages, language]
      : selectedLanguages.filter(l => l !== language),
    );
  };

  const handleLicenseChange = (license: string, checked: CheckboxProps["checked"]) => {
    onLicensesChange(
      checked
      ? [...selectedLicenses, license]
      : selectedLicenses.filter(l => l !== license),
    );
  };

  const handleOwnerChange = (owner: string, checked: CheckboxProps["checked"]) => {
    onOwnersChange(
      checked
      ? [...selectedOwners, owner]
      : selectedOwners.filter(o => o !== owner),
    );
  };

  const handleCategoryChange = (category: string, checked: CheckboxProps["checked"]) => {
    updateSelectedValues(category, checked, selectedCategories, onCategoriesChange);
  };

  const handleFocusAreaChange = (focusArea: string, checked: CheckboxProps["checked"]) => {
    updateSelectedValues(focusArea, checked, selectedFocusAreas, onFocusAreasChange);
  };

  const handleAudienceChange = (audience: string, checked: CheckboxProps["checked"]) => {
    updateSelectedValues(audience, checked, selectedAudiences, onAudiencesChange);
  };

  return (
    <Accordion
      defaultOpenItems="1"
      multiple
      collapsible
      style={{
        width: isMobile ? '100%' : '350px',
        minWidth: isMobile ? '100%' : '350px',
      }}
    >
      {hasAnyActiveFilters && onClearAllFilters && (
        <div style={{ padding: '8px 0', marginBottom: '8px', borderBottom: '1px solid var(--ifm-color-emphasis-300)' }}>
          <Button
            appearance="secondary"
            size="small"
            onClick={onClearAllFilters}
            style={{ width: '100%' }}
          >
            Clear all filters
          </Button>
        </div>
      )}
      <AccordionItem value="1">
        <AccordionHeader style={{ marginBottom: '10px' }} size="large" expandIconPosition="end">Repository Signals</AccordionHeader>
        <AccordionPanel>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }}>
              <Checkbox 
                id="checkbox-r-good-first-issue"
                label={"Has good first issue (" + goodFirstIssueCount +  ")"}
                checked={hasGoodFirstIssueChecked}
                onChange={(_, data) => onGoodFirstIssueChange(data.checked === true)}
              />
            </li>
            <li style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }}>
              <Checkbox 
                id="checkbox-r-help-wanted-issue"
                label={"Has help wanted issue (" + helpWantedIssueCount + ")"} 
                checked={hasHelpWantedIssueChecked}
                onChange={(_, data) => onHelpWantedIssueChange(data.checked === true)}
              />
            </li>
            <li style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }}>
              <Checkbox 
                id="checkbox-r-code-of-conduct"
                label={"Has code of conduct (" + codeOfConductCount +  ")"} 
                checked={hasCodeOfConductChecked}
                onChange={(_, data) => onCodeOfConductChange(data.checked === true)}
              />
            </li>
          </ul>
        </AccordionPanel>
      </AccordionItem>
      {categories.length > 0 && (
        <AccordionItem value="6">
          <AccordionHeader style={{ marginTop: '10px', marginBottom: '10px' }} size="large" expandIconPosition="end">Categories</AccordionHeader>
          <AccordionPanel>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', flexDirection: 'column', rowGap: '10px' }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {displayedCategories.map((category, index) => (
                    <li key={index} style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }}>
                      <Checkbox
                        id={`checkbox-r-category-${category.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                        label={formatFacetLabel(category) + " (" + countItemsByProperty(items, 'category', category) + ")"}
                        checked={selectedCategories.includes(category)}
                        onChange={(_, data) => handleCategoryChange(category, data.checked)}
                      />
                    </li>
                  ))}
                </ul>
                {categories.length > 10 && (
                  <Button appearance="secondary" onClick={() => setShowAllCategories(!showAllCategories)}>
                    {showAllCategories ? 'View Less' : 'View All'}
                  </Button>
                )}
              </div>
            </div>
          </AccordionPanel>
        </AccordionItem>
      )}
      {focusAreas.length > 0 && (
        <AccordionItem value="7">
          <AccordionHeader style={{ marginTop: '10px', marginBottom: '10px' }} size="large" expandIconPosition="end">Focus Areas</AccordionHeader>
          <AccordionPanel>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', flexDirection: 'column', rowGap: '10px' }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {displayedFocusAreas.map((focusArea, index) => (
                    <li key={index} style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }}>
                      <Checkbox
                        id={`checkbox-r-focus-area-${focusArea.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                        label={formatFacetLabel(focusArea) + " (" + countItemsByProperty(items, 'focusAreas', focusArea) + ")"}
                        checked={selectedFocusAreas.includes(focusArea)}
                        onChange={(_, data) => handleFocusAreaChange(focusArea, data.checked)}
                      />
                    </li>
                  ))}
                </ul>
                {focusAreas.length > 10 && (
                  <Button appearance="secondary" onClick={() => setShowAllFocusAreas(!showAllFocusAreas)}>
                    {showAllFocusAreas ? 'View Less' : 'View All'}
                  </Button>
                )}
              </div>
            </div>
          </AccordionPanel>
        </AccordionItem>
      )}
      {audiences.length > 0 && (
        <AccordionItem value="8">
          <AccordionHeader style={{ marginTop: '10px', marginBottom: '10px' }} size="large" expandIconPosition="end">Audiences</AccordionHeader>
          <AccordionPanel>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', flexDirection: 'column', rowGap: '10px' }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {displayedAudiences.map((audience, index) => (
                    <li key={index} style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }}>
                      <Checkbox
                        id={`checkbox-r-audience-${audience.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                        label={formatFacetLabel(audience) + " (" + countItemsByProperty(items, 'audiences', audience) + ")"}
                        checked={selectedAudiences.includes(audience)}
                        onChange={(_, data) => handleAudienceChange(audience, data.checked)}
                      />
                    </li>
                  ))}
                </ul>
                {audiences.length > 10 && (
                  <Button appearance="secondary" onClick={() => setShowAllAudiences(!showAllAudiences)}>
                    {showAllAudiences ? 'View Less' : 'View All'}
                  </Button>
                )}
              </div>
            </div>
          </AccordionPanel>
        </AccordionItem>
      )}
      <AccordionItem value="2">
        <AccordionHeader style={{ marginTop: '10px', marginBottom: '10px' }} size="large" expandIconPosition="end">Topics</AccordionHeader>
        <AccordionPanel>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', flexDirection: 'column', rowGap: '10px' }}>
                {showAllTopics ? (
                  <>
                    <Input
                      aria-label="Search topics"
                      placeholder="Search topics…"
                      value={topicSearch}
                      onChange={(_, data) => setTopicSearch(data.value)}
                      style={{ marginBottom: '8px', width: '100%' }}
                    />
                    <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {topics
                          .filter(t => t.toLowerCase().includes(topicSearch.toLowerCase()))
                          .map((topic, index) => (
                            <li key={index} style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }}>
                              <Checkbox 
                                id={`checkbox-r-topic-${topic.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                                label={topic + " (" + countItemsByProperty(items, 'topics', topic) + ")"}
                                checked={selectedTopics.includes(topic)}
                                onChange={(_, data) => handleTopicChange(topic, data.checked)}
                              />
                            </li>
                          ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {displayedTopics.map((topic, index) => (
                      <li key={index} style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }}>
                        <Checkbox 
                          id={`checkbox-r-topic-${topic.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                          label={topic + " (" + countItemsByProperty(items, 'topics', topic) + ")"}
                          checked={selectedTopics.includes(topic)}
                          onChange={(_, data) => handleTopicChange(topic, data.checked)}
                        />
                      </li>
                    ))}
                  </ul>
                )}
                {topics.length > 10 && (
                  <Button appearance="secondary" onClick={() => { setShowAllTopics(!showAllTopics); if (showAllTopics) setTopicSearch(''); }}>
                    {showAllTopics ? 'View Less' : 'View All'}
                  </Button>
                )}
              </div>
            </div>
        </AccordionPanel>
      </AccordionItem>
      <AccordionItem value="3">
        <AccordionHeader style={{ marginTop: '10px', marginBottom: '10px' }} size="large" expandIconPosition="end">Languages</AccordionHeader>
        <AccordionPanel>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', flexDirection: 'column', rowGap: '10px' }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {displayedLanguages.map((language, index) => (
                  <li key={index} style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }}>
                    <Checkbox 
                      id={`checkbox-r-language-${language.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                      label={language + " (" + countItemsByProperty(items, 'languages', language) + ")"} 
                      checked={selectedLanguages.includes(language)}
                      onChange={(_, data) => handleLanguageChange(language, data.checked)}
                    />
                  </li>
                ))}
              </ul>
              {languages.length > 10 && (
                <Button appearance="secondary" onClick={() => setShowAllLanguages(!showAllLanguages)}>
                  {showAllLanguages ? 'View Less' : 'View All'}
                </Button>
              )}
            </div>
          </div>
        </AccordionPanel>
      </AccordionItem>
      <AccordionItem value="4">
        <AccordionHeader style={{ marginTop: '10px', marginBottom: '10px' }} size="large" expandIconPosition="end">Licenses</AccordionHeader>
        <AccordionPanel>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', flexDirection: 'column', rowGap: '10px' }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {displayedLicenses.map((license, index) => (
                  <li key={index} style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }}>
                    <Checkbox 
                      id={`checkbox-r-license-${license.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                      label={license + " (" + countItemsByProperty(items, 'license.name', license) + ")"} 
                      checked={selectedLicenses.includes(license)}
                      onChange={(_, data) => handleLicenseChange(license, data.checked)}
                    />
                  </li>
                ))}
              </ul>
              {licenses.length > 10 && (
                <Button appearance="secondary" onClick={() => setShowAllLicenses(!showAllLicenses)}>
                  {showAllLicenses ? 'View Less' : 'View All'}
                </Button>
              )}
            </div>
          </div>
        </AccordionPanel>
      </AccordionItem>
      <AccordionItem value="5">
        <AccordionHeader style={{ marginTop: '10px', marginBottom: '10px' }} size="large" expandIconPosition="end">Owners</AccordionHeader>
        <AccordionPanel>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', flexDirection: 'column', rowGap: '10px' }}>
              {showAllOwners ? (
                <>
                  <Input
                    aria-label="Search owners"
                    placeholder="Search owners…"
                    value={ownerSearch}
                    onChange={(_, data) => setOwnerSearch(data.value)}
                    style={{ marginBottom: '8px', width: '100%' }}
                  />
                  <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {owners
                        .filter(o => o.toLowerCase().includes(ownerSearch.toLowerCase()))
                        .map((owner, index) => (
                          <li key={index} style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }}>
                            <Checkbox 
                              id={`checkbox-r-owner-${owner.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                              label={owner + " (" + countItemsByProperty(items, 'owner.login', owner) + ")"} 
                              checked={selectedOwners.includes(owner)}
                              onChange={(_, data) => handleOwnerChange(owner, data.checked)}
                            />
                          </li>
                        ))}
                    </ul>
                  </div>
                </>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {displayedOwners.map((owner, index) => (
                    <li key={index} style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }}>
                      <Checkbox 
                        id={`checkbox-r-owner-${owner.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                        label={owner + " (" + countItemsByProperty(items, 'owner.login', owner) + ")"} 
                        checked={selectedOwners.includes(owner)}
                        onChange={(_, data) => handleOwnerChange(owner, data.checked)}
                      />
                    </li>
                  ))}
                </ul>
              )}
              {owners.length > 10 && (
                <Button appearance="secondary" onClick={() => { setShowAllOwners(!showAllOwners); if (showAllOwners) setOwnerSearch(''); }}>
                  {showAllOwners ? 'View Less' : 'View All'}
                </Button>
              )}
            </div>
          </div>
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
};

export default FilterPane;
