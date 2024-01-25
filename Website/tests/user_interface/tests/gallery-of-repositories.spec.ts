import { test, expect } from '@playwright/test';
import exp from 'constants';

// Validate that when I enter a search term, the count of repositories found is updated (smaller than the one before entering the search term)
test('Validate that when I enter a search term, the count of repositories found is updated (smaller than the one before entering the search term)', async ({ page }) => {
  await page.goto('/');

  // Extract the initial count of repositories found (before entering the search term) from the element with "repositoryCount" id
  // The format of the value we will get is "X repositories found"
  const initialCountText = await page.innerText('#repositoryCount');
  // Extract the number from the initial count text
  const initialCount = parseInt(initialCountText.split(' ')[0]);

  // Enter a search term in the search box (id = "filterBar")
  await page.fill('#filterBar', 'power');

  // Extract the count of repositories found (after entering the search term) from the element with "repositoryCount" id
  // The format of the value we will get is "X repositories found"
  const countText = await page.innerText('#repositoryCount');
  // Extract the number from the count text
  const count = parseInt(countText.split(' ')[0]);

  // Validate that the count of repositories found is smaller than the initial count
  expect(count).toBeLessThan(initialCount);
});

// Validate the filters default presentation
// - all checkboxes are unchecked
// - the list of the available sections is as expected (the order is important)
// - only the "Contribution Opportunities" section is expanded
// - the "Contribution Opportunities" section contains the expected checkboxes
test('Validate the filters default presentation', async ({ page }) => {
  await page.goto('/');

  // Array of the expected sections (the order is important)
  const expectedSections = [
    'Contribution Opportunities',
    'Topics',
    'Languages',
    'Licenses',
    'Owners'
  ];

  // Array of the expected checkboxes for the "Contribution Opportunities" section
  const expectedContributionOpportunitiesCheckboxes = [
    'Has good first issue',
    'Has help wanted issue',
    'Has code of conduct'
  ];

  // Validate that all checkboxes are unchecked
  await page.waitForSelector('input[type="checkbox"]');
  const checkboxes = await page.$$('input[type="checkbox"]');
  for (const checkbox of checkboxes) {
    const isChecked = await checkbox.isChecked();
    expect(isChecked).toBe(false);
  }
  
  // Validate that the list of the available sections is as expected (the order is important)
  // Each section is a div element with "fui-AccordionItem" class
  const sections = await page.$$('.fui-AccordionItem');
  // The name of the section is the text of a button element under the div element with "fui-AccordionItem" class
  const sectionNames = await Promise.all(sections.map(async (section) => {
    const button = await section.$('button');
    return button.innerText();
  }));
  expect(sectionNames).toEqual(expectedSections);

  // Validate that only the "Contribution Opportunities" section is expanded
  // The button element in each section has a "aria-expanded" attribute allowing to know if the section is expanded or not
  let expandedSections = [];
  let nonExpandedSections = [];

  for (let section of sections) {
    const expanded = await section.$$('button[aria-expanded="true"]');
    expandedSections = expandedSections.concat(expanded);

    const nonExpanded = await section.$$('button[aria-expanded="false"]');
    nonExpandedSections = nonExpandedSections.concat(nonExpanded);
  }

  expect(expandedSections.length).toBe(1);
  const expandedSectionName = await expandedSections[0].innerText();
  expect(expandedSectionName).toBe(expectedSections[0]);

  expect(nonExpandedSections.length).toBe(4);
  const nonExpandedSectionNames = await Promise.all(nonExpandedSections.map(async (section) => {
    return section.innerText();
  }));
  expect(nonExpandedSectionNames).toEqual(expectedSections.slice(1));

  // Validate that the "Contribution Opportunities" section contains the expected checkboxes
  // The checkboxes to validate are under the div element with "fui-AccordionItem" class where there is a button with inner text equal to "Contribution Opportunities"
  // The labels associated to the checboxes are label elements with a for attribute value like "checkbox-r..."
  const contributionOpportunitiesSection = await page.$('div.fui-AccordionItem:has(button:has-text("Contribution Opportunities"))');
  const contributionOpportunitiesCheckboxes = await contributionOpportunitiesSection.$$('label[for^="checkbox-r"]');
  const contributionOpportunitiesCheckboxesNames = await Promise.all(contributionOpportunitiesCheckboxes.map(async (checkbox) => {
    const checkboxText = await checkbox.innerText();
    return checkboxText.split(' (')[0]; // Extract the checkbox name without the count
  }));
  expect(contributionOpportunitiesCheckboxesNames).toEqual(expectedContributionOpportunitiesCheckboxes);
});

// Validate that when I check the "Has good first issue" checkbox, the count presented in the checkbox label is equal to the count of repositories found
test('Validate that when I check the "Has good first issue" checkbox, the count presented in the checkbox label is equal to the count of repositories found', async ({ page }) => {
  await page.goto('/');

  // Click on the checkbox with "checkbox-r1" id
  await page.click('#checkbox-r1');

  // Extract the expected count of repositories from the label of the checkbox with "checkbox-r1" id
  // The label we are looking for is an element of type "label" with "for" attribute equal to "checkbox-r1"
  // The format of the value we will get is "Has good first issue (X)"
  const expectedCountText = await page.innerText('label[for="checkbox-r1"]');
  // Extract the number from the expected count text
  const expectedCount = parseInt(expectedCountText.split('(')[1].split(')')[0]);

  // Extract the count of repositories found (after checking the checkbox) from the element with "repositoryCount" id
  // The format of the value we will get is "X repositories found"
  const countText = await page.innerText('#repositoryCount');
  // Extract the number from the count text
  const count = parseInt(countText.split(' ')[0]);

  // Validate that the count of repositories found is equal to the expected count
  expect(count).toBe(expectedCount);
});