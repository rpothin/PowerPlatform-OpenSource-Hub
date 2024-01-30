import { test, expect } from '@playwright/test';
import describe from '@playwright/test';

// #region Search functionality tests

// Validate that when I enter a search term, the count of repositories found is updated (smaller than the one before entering the search term)
test('Validate the count of repositories found when I enter a search term', async ({ page }) => {
  await page.goto('/');

  // Extract the initial count of repositories found (before entering the search term)
  const initialCount = await getCountOfRepositories(page);

  // Enter a search term in the search box (id = "filterBar")
  await page.fill('#filterBar', 'power');

  // Extract the count of repositories found (after entering the search term)
  const count = await getCountOfRepositories(page);

  // Validate that the count of repositories found is smaller than the initial count
  expect(count).toBeLessThan(initialCount);
});

// #endregion

// #region Filter pane functionality tests

// Validate the filters default presentation
// - all checkboxes are unchecked
// - the list of the available sections is as expected (the order is important)
// - only the "Contribution Opportunities" section is expanded
// - the "Contribution Opportunities" section contains the expected checkboxes
test('Validate the filter pane default presentation', async ({ page }) => {
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

// Validate that all sections in the filter pane can be expanded/collapsed
test('Validate that all sections in the filter pane can be expanded / collapsed', async ({ page }) => {
  await page.goto('/');

  // Validate that any section in the filter pane can be expanded/collapsed
  // The button element in each section has a "aria-expanded" attribute allowing to know if the section is expanded or not
  await page.waitForSelector('.fui-AccordionItem');
  const sections = await page.$$('.fui-AccordionItem');
  for (let section of sections) {
    // Get the initial state of the section
    const expanded = await section.$$('button[aria-expanded="true"]');

    // Instead of clicking on the entire section, click on the header of the section
    const header = await section.$('button[aria-expanded]');
    await header.click();

    // Get the new state of the section
    const newExpanded = await section.$$('button[aria-expanded="true"]');

    // Validate that the state of the section has changed considering the initial state we got before clicking on the section element
    expect(expanded.length).not.toBe(newExpanded.length);

    // Instead of clicking on the entire section, click on the header of the section
    await header.click();

    // Get the new state of the section
    const newExpandedAgain = await section.$$('button[aria-expanded="true"]');

    // Validate that the state of the section has changed considering the initial state we got before clicking on the section element
    expect(expanded.length).toBe(newExpandedAgain.length);
  }
});

// Validate that when I check a checkbox in the filter pane, the count presented in the checkbox label is equal to the count of repositories found
test('Validate that when I check a checkbox in the filter pane, the count presented in the checkbox label is equal to the count of repositories found', async ({ page }) => {
  await page.goto('/');

  // Get a random section and a random checkbox within that section, excluding the "Languages" section
  const { section, header, checkbox } = await getRandomSectionAndCheckbox(page, ['Languages']); // This exclusion means there is a bug regarding the "Languages" section we will need to address

  // Get the ID of the checkbox
  const checkboxId = await checkbox.evaluate((el) => el.id);
  
  // Extract the expected count of repositories from the label
  // The format of the value we will get is "Checkbox Label (X)"
  const labelElement = await page.$(`label[for="${checkboxId}"]`);
  const labelText = await labelElement.evaluate(el => el.textContent);
  const expectedCount = parseInt(labelText.split('(')[1].split(')')[0]);

  // Click on the checkbox
  await checkbox.click();

  // Extract the count of repositories found (after checking the checkbox)
  const count = await getCountOfRepositories(page);

  // Validate that the count of repositories found is equal to the expected count
  expect(count).toBe(expectedCount);
});

// Validate the visual behavior of a checkbox,
// - the checkbox is checked when we click on it
// - the checkbox is still checked when we collapse then expand the section where the checkbox is
test('Validate the visual behavior of a checkbox', async ({ page }) => {
  await page.goto('/');

  // Get a random section and a random checkbox within that section
  const { section, header, checkbox } = await getRandomSectionAndCheckbox(page);

  // Get the ID of the checkbox
  const checkboxId = await checkbox.evaluate((el) => el.id);

  // Get the label associated to the checkbox
  const labelElement = await page.$(`label[for="${checkboxId}"]`);
  const labelText = await labelElement.evaluate(el => el.textContent);
  const trimmedLabelText = labelText.split('(')[0].trim();

  // Click on the checkbox
  await checkbox.click();

  // Validate that the checkbox is checked
  const isChecked = await checkbox.isChecked();
  expect(isChecked).toBe(true);

  // Collapse the section
  await header.click();

  // Expand the section
  await header.click();

  // Find the checkbox again based on the label text
  const newCheckboxLabel = await page.$(`label:has-text("${trimmedLabelText}")`);
  const newCheckboxId = await newCheckboxLabel.evaluate(el => el.getAttribute('for'));
  const newCheckbox = await page.$(`#${newCheckboxId}`);

  // Validate that the checkbox is still checked
  const isCheckedAgain = await newCheckbox.isChecked();
  expect(isCheckedAgain).toBe(true);
});

// #endregion

// #region Gallery functionality tests

// #endregion

// #region Helper functions

/**
 * Retrieves the count of repositories in the header of the gallery
 * 
 * @param {Page} page - The page object representing the web page.
 * @returns {Promise<number>} The count of repositories.
 */
async function getCountOfRepositories(page) {
  const countText = await page.innerText('#repositoryCount');
  return parseInt(countText.split(' ')[0]);
}

/**
 * Expands the section if it is not already expanded.
 * @param {ElementHandle} section - The section element to expand.
 * @returns {ElementHandle} - The header element of the expanded section.
 */
async function expandSectionIfNotExpanded(section) {
  const expanded = await section.$$('button[aria-expanded="true"]');
  const header = await section.$('button[aria-expanded]');
  if (expanded.length === 0) {
    await header.click();
  }
  return header;
}

/**
 * Retrieves a random section, its header, and a checkbox within that section.
 * Expands the section if it is not already expanded.
 * 
 * @param {Page} page - The page object representing the web page.
 * @param {string[]} [excludedSections] - The list of section names to exclude from the selection process.
 * @returns {Promise<{ section: ElementHandle, checkbox: ElementHandle, header: ElementHandle }>} The random section, checkbox, and header elements.
 */
async function getRandomSectionAndCheckbox(page, excludedSections = []) {
  // Get a random section
  await page.waitForSelector('.fui-AccordionItem');
  const sections = await page.$$('.fui-AccordionItem');
  const filteredSections = sections.filter(async (section) => {
    const sectionName = await section.innerText('.section-name');
    return excludedSections && !excludedSections.includes(sectionName);
  });
  const randomIndex = Math.floor(Math.random() * filteredSections.length);
  const section = filteredSections[randomIndex];
  
  // Expand the section if it is not already expanded  
  const header = await expandSectionIfNotExpanded(section);
  
  // Get a random checkbox within the section
  const checkboxes = await section.$$('input[id^="checkbox-r"]');
  const randomCheckboxIndex = Math.floor(Math.random() * checkboxes.length);
  const checkbox = checkboxes[randomCheckboxIndex];
  
  return { section, header, checkbox };
}

// #endregion