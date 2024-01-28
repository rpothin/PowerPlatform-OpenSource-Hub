import { test, expect } from '@playwright/test';
import describe from '@playwright/test';

// #region Search functionality tests

// Validate that when I enter a search term, the count of repositories found is updated (smaller than the one before entering the search term)
test('Validate the count of repositories found behavios when I enter a search term', async ({ page }) => {
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
  const sections = await page.$$('.fui-AccordionItem');
  for (let section of sections) {
    // Get the initial state of the section
    const expanded = await section.$$('button[aria-expanded="true"]');

    // Click on the section element
    await section.click();

    // Get the new state of the section
    const newExpanded = await section.$$('button[aria-expanded="true"]');

    // Validate that the state of the section has changed considering the initial state we got before clicking on the section element
    expect(expanded.length).not.toBe(newExpanded.length);

    // Click on the section element
    await section.click();

    // Get the new state of the section
    const newExpandedAgain = await section.$$('button[aria-expanded="true"]');

    // Validate that the state of the section has changed considering the initial state we got before clicking on the section element
    expect(expanded.length).toBe(newExpandedAgain.length);
  }
});

// Validate that when I check a checkbox in the filter pane, the count presented in the checkbox label is equal to the count of repositories found
test('Validate that when I check a checkbox in the filter pane, the count presented in the checkbox label is equal to the count of repositories found', async ({ page }) => {
  await page.goto('/');

  // Get all the checkboxes in the filter pane
  await page.waitForSelector('input[id^="checkbox-r"]');
  const checkboxes = await page.$$eval('input[id^="checkbox-r"]', (elements) => elements.map((element) => element.id));

  // Randomly select a checkbox
  const randomIndex = Math.floor(Math.random() * checkboxes.length);
  const checkbox = checkboxes[randomIndex];
  
  // Extract the expected count of repositories from the label
  // The format of the value we will get is "Checkbox Label (X)"
  const expectedCountText = await page.innerText('label[for="' + checkbox + '"]');
  const expectedCount = parseInt(expectedCountText.split('(')[1].split(')')[0]);

  // Click on the checkbox
  await page.click('#' + checkbox);

  // Extract the count of repositories found (after checking the checkbox) from the element with "repositoryCount" id
  // The format of the value we will get is "X repositories found"
  const countText = await page.innerText('#repositoryCount');
  const count = parseInt(countText.split(' ')[0]);

  // Validate that the count of repositories found is equal to the expected count
  expect(count).toBe(expectedCount);
});

// Validate the visual behavior of a checkbox,
// - the checkbox is checked when we click on it
// - the checkbox is still checked when we collapse then expand the section where the checkbox is
/*test('Validate the visual behavior of a checkbox', async ({ page }) => {
  await page.goto('/');

  // Get all the checkboxes in the filter pane
  await page.waitForSelector('input[id^="checkbox-r"]');
  const checkboxes = await page.$$eval('input[id^="checkbox-r"]', (elements) => elements.map((element) => element.id));

  // Randomly select a checkbox
  const randomIndex = Math.floor(Math.random() * checkboxes.length);
  const checkbox = checkboxes[randomIndex];

  console.log('checkbox: ' + checkbox);

  // Click on the checkbox
  await page.click('#' + checkbox);

  // Validate that the checkbox is checked
  const isChecked = await page.isChecked('#' + checkbox);
  expect(isChecked).toBe(true);

  // Collapse then expand the section where the checkbox is
  // The management of the section is done by clicking on the header of the section - a div element with "fui-AccordionHeader" class under the div element with "fui-AccordionItem" class
  // The checkbox is an input item under a span under a div under a div with "fui-AccordionPanel" class under the div element with "fui-AccordionItem" class
  let checkboxElement = await page.$('#' + checkbox);
  const sectionHeader = await checkboxElement.evaluate((checkbox) => {
    // Traverse up the DOM tree to find the associated section header
    let parent = checkbox.parentElement;
    while (parent && !parent.classList.contains('fui-AccordionItem')) {
      parent = parent.parentElement;
    }
    if (parent) {
      return parent.querySelector('.fui-AccordionHeader').textContent;
    }
    return null;
  });
  
  console.log('sectionHeader: ' + sectionHeader);
  
  // Collapse the section
  await page.click('div.fui-AccordionItem:has(button:has-text("' + sectionHeader + '")) button');

  // Expand the section
  await page.click('div.fui-AccordionItem:has(button:has-text("' + sectionHeader + '")) button');

  await page.waitForSelector('#' + checkbox, { state: 'visible' });
  checkboxElement = await page.$('#' + checkbox);
  await checkboxElement.scrollIntoViewIfNeeded();

  // Validate that the checkbox is still checked
  const isStillChecked = await page.isChecked('#' + checkbox);
  expect(isStillChecked).toBe(true);
});*/

// #endregion

// #region Gallery functionality tests

// #endregion