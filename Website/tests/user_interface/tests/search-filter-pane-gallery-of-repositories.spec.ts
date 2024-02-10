import { test, expect } from '@playwright/test';
import { Page } from 'playwright';

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
  const { section, header, checkbox } = await getRandomSectionAndCheckbox(page);

  // Get the ID of the checkbox
  const checkboxId = await checkbox.evaluate((el) => el.id);
  
  // Extract the expected count of repositories from the label
  const checkboxLabelParts = await extractCheckboxLabelParts(page, checkboxId);
  const expectedCount = checkboxLabelParts.count;

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
  const checkboxLabelParts = await extractCheckboxLabelParts(page, checkboxId);
  const trimmedLabelText = checkboxLabelParts.name;

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

// Validate that for all sections with a dynamic list of checkboxes (do not consider "Contribution Opportunities") in the filter pane,
// - there are no more than 10 checkboxes presented
// - the checboxes are presented in descending order based on the count of repositories found
// - if there are more than 10 checkboxes available, there is a "View All" button at the end of the list
test('Validate the presentation of the checkboxes in the sections of the filter pane with a dynamic list of checkboxes', async ({ page }) => {
  await page.goto('/');

  // Get all the sections in the filter pane
  await page.waitForSelector('.fui-AccordionItem');
  const sections = await page.$$('.fui-AccordionItem:not(:has-text("Contribution Opportunities"))'); // Exclude the "Contribution Opportunities" section because it has a static list of checkboxes

  // Validate that for all sections in the filter pane
  for (let section of sections) {
    // Expand the section if it is not already expanded
    const header = await expandSectionIfNotExpanded(section);

    // Get the checkboxes in the section
    const checkboxes = await section.$$('input[id^="checkbox-r"]');

    // Validate that there are no more than 10 checkboxes presented
    expect(checkboxes.length).toBeLessThanOrEqual(10);

    // Validate that the checboxes are presented in an order based on the count of repositories found
    let previousCount = null;
    let previousCheckboxLabelName = '';
    for (let checkbox of checkboxes) {
      const checkboxId = await checkbox.evaluate(el => el.id);
      const checkboxLabelParts = await extractCheckboxLabelParts(page, checkboxId);
      const count = checkboxLabelParts.count;
      if (previousCount !== null) { // Skip the first checkbox
        expect(count).toBeLessThanOrEqual(previousCount);
      }
      previousCount = count;
    }

    // If there are more than 10 checkboxes available, validate that there is a "View All" button at the end of the list
    if (checkboxes.length > 10) {
      const viewAllButton = await section.$('button:has-text("View All")');
      expect(viewAllButton).toBeTruthy();
    }
  }
});

// Validate that for any section with a dynamic list of checkboxes (do not consider "Contribution Opportunities") in the filter pane where there is a "View All" button,
// - when I click on the "View All" button, the list of checkboxes is expanded
// - the "View All" button is replaced by a "View Less" button
// - all the checkboxes are presented (new count of checkboxes is greater than the initial count)
// - the checboxes are still presented in descending order based on the count of repositories found
// - when I click on the "View Less" button, the list of checkboxes is collapsed (new count of checkboxes is equal to the initial count)
test('Validate the "View All" and "View Less" buttons in the filter pane in all relevant sections', async ({ page }) => {
  await page.goto('/');

  // Get all sections
  const sections = await getAllSections(page);

  // Iterate through each section
  for (let section of sections) {
    // Get the "View All" button
    let viewAllButton = await section.section.$('button:has-text("View All")');

    // Skip the section if it is the "Contribution Opportunities" section or if there is no "View All" button
    if (section.headerText === "Contribution Opportunities" || !viewAllButton) {
      continue;
    }

    // Get the initial count of checkboxes
    const initialCheckboxes = await section.$$('input[id^="checkbox-r"]');
    const initialCheckboxesCount = initialCheckboxes.length;

    // Click on the "View All" button
    await viewAllButton.click();

    // Get the new count of checkboxes
    const newCheckboxes = await section.$$('input[id^="checkbox-r"]');
    const newCheckboxesCount = newCheckboxes.length;

    // Validate that the list of checkboxes is expanded
    expect(newCheckboxesCount).toBeGreaterThan(initialCheckboxesCount);

    // Validate that the "View All" button is replaced by a "View Less" button
    const viewLessButton = await section.$('button:has-text("View Less")');
    expect(viewLessButton).toBeTruthy();
    const viewAllButtonAfterCollapse = await section.$('button:has-text("View All")');
    expect(viewAllButtonAfterCollapse).toBeFalsy();

    // Validate that the checkboxes are still presented in descending order based on the count of repositories found
    let previousCount = null;
    for (let checkbox of newCheckboxes) {
      const checkboxId = await checkbox.evaluate(el => el.id);
      const checkboxLabelParts = await extractCheckboxLabelParts(page, checkboxId);
      const count = checkboxLabelParts.count;
      if (previousCount !== null) { // Skip the first checkbox
        expect(count).toBeLessThanOrEqual(previousCount);
      }
      previousCount = count;
    }

    // Click on the "View Less" button
    await viewLessButton.click();

    // Get the new count of checkboxes
    const newCheckboxesAgain = await section.$$('input[id^="checkbox-r"]');
    const newCheckboxesCountAgain = newCheckboxesAgain.length;

    // Validate that the list of checkboxes is collapsed
    expect(newCheckboxesCountAgain).toBe(initialCheckboxesCount);
  }
});

// Validate the count of repositories based on the selection of 2 checkboxes in each section
// - if the section is "Licenses" or "Owners", the count of repositories is the sum of the counts of the 2 checkboxes
// - if the section is "Contribution Opportunities", "Topics", or "Languages", the count of repositories is the minimum of the counts of the 2 checkboxes
test('Validate the count of repositories based on the selection of 2 checkboxes in each section', async ({ page }) => {
  // Define some variables to handle different behaviors based on section
  const sectionsWithSumBehavior = ["Licenses", "Owners"];
  const sectionsWithMinBehavior = ["Contribution Opportunities", "Topics", "Languages"];

  await page.goto('/');

  // Get all sections
  const sections = await getAllSections(page);

  for (const section of sections) {
    const sectionElement = section.section;

    // Expand the section if it is not already expanded
    const header = await expandSectionIfNotExpanded(sectionElement);

    // Get the first random checkbox in the section
    const checkbox1 = await getRandomCheckboxInSection(sectionElement);
    const checkboxLabelParts1 = checkbox1.checkboxLabelParts;
    const count1 = checkboxLabelParts1.count;

    // Get the second random checkbox in the same section, excluding the first checkbox
    const checkbox2 = await getRandomCheckboxInSection(sectionElement, checkbox1.checkboxId);
    const checkboxLabelParts2 = checkbox2.checkboxLabelParts;
    const count2 = checkboxLabelParts2.count;

    // Click on the first checkbox
    await checkbox1.checkbox.click();

    // Click on the second checkbox
    await checkbox2.checkbox.click();

    // Extract the count of repositories found (after checking the checkboxes)
    const count = await getCountOfRepositories(page);

    // Validate checkbox behavior based on section
    const sumCounts = count1 + count2;
    const minCounts = Math.min(count1, count2);

    if (sectionsWithSumBehavior.includes(section.headerText)) {
      expect(count).toEqual(sumCounts);
    } else if (sectionsWithMinBehavior.includes(section.headerText)) {
      expect(count).toBeLessThanOrEqual(minCounts);
    } else {
      throw new Error('There is no behavior defined for the following section: ' + section.headerText);
    }

    // Uncheck the checkboxes before moving to the next section
    await checkbox1.checkbox.click();
    await checkbox2.checkbox.click();
  }
});

// #endregion

// #region Gallery functionality tests

// Validate that the count of repositories in the header of the gallery is equal to the count of repositories found
test('Validate the count of repositories in the header of the gallery', async ({ page }) => {
  await page.goto('/');

  // Get the count of repositories in the header of the gallery
  const repositoriesCountInHeader = await getCountOfRepositories(page);

  // Get all the elements with class "galleryItem_vxLB"
  const galleryItems = await page.$$('.galleryItem_vxLB');

  // Get the count of repositories found
  const countOfRepositoriesPresentedInGallery = galleryItems.length;

  // Validate that the count of repositories in the header of the gallery is equal to the count of repositories found
  expect(repositoriesCountInHeader).toBe(countOfRepositoriesPresentedInGallery);
});

// Validate that the default sorting option in the gallery is "Stars (Descending)"
test('Validate the default sorting option in the gallery', async ({ page }) => {
  await page.goto('/');

  // Get the input element with id "orderByCombobox"
  await page.waitForSelector('#orderByCombobox');
  const orderByCombobox = await page.$('#orderByCombobox');

  // Get the value of the "orderByCombobox" input element
  const value = await orderByCombobox.inputValue();

  // Validate that the default sorting option in the gallery is "Stars (Descending)"
  expect(value).toBe('Stars (Descending)');
});

// Validate that when I change the sorting option in the gallery, the count of repositories found is the same
test('Validate that when I change the sorting option in the gallery, the count of repositories found is the same', async ({ page }) => {
  await page.goto('/');

  // Get the initial count of repositories found
  const initialCount = await getCountOfRepositories(page);

  // Get the input element with id "orderByCombobox"
  await page.waitForSelector('#orderByCombobox');
  const orderByCombobox = await page.$('#orderByCombobox');
  
  // Click on the combobox to focus it
  await orderByCombobox.click();
  await orderByCombobox.focus();

  let activeDescendant = '';
  let previousActiveDescendant = '';
  let topReached = false;
  while (!topReached) {
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    activeDescendant = await orderByCombobox.evaluate(el => el.getAttribute('aria-activedescendant'));
    await page.keyboard.press('Enter');

    if (activeDescendant === previousActiveDescendant) {
      topReached = true;
    } else {
      // Validate that the count of repositories found is the same
      const count = await getCountOfRepositories(page);
      expect(count).toBe(initialCount);

      previousActiveDescendant = activeDescendant;
    }
  }

  previousActiveDescendant = '';
  let bottomReached = false;
  while (!bottomReached) {
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    activeDescendant = await orderByCombobox.evaluate(el => el.getAttribute('aria-activedescendant'));
    await page.keyboard.press('Enter');
    
    if (activeDescendant === previousActiveDescendant) {
      bottomReached = true;
    } else {
      // Validate that the count of repositories found is the same
      const count = await getCountOfRepositories(page);
      expect(count).toBe(initialCount);

      previousActiveDescendant = activeDescendant;
    }
  }
});

// Validate that when I change the sorting option in the gallery, the order of repositories is updated and consistent with the selected sorting option
// - if the selected sorting option is "Stars (Descending)", the order of repositories is consistent with the number of stars in descending order
// - if the selected sorting option is "Stars (Ascending)", the order of repositories is consistent with the number of stars in ascending order
// - if the selected sorting option is "Alphabetical (Ascending)", the order of repositories is consistent with the name of repositories in ascending order
// - if the selected sorting option is "Alphabetical (Descending)", the order of repositories is consistent with the name of repositories in descending order
test('Validate that when I change the sorting option in the gallery, the order of repositories is updated and consistent with the selected sorting option', async ({ page }) => {
  await page.goto('/');

  // Get the input element with id "orderByCombobox"
  await page.waitForSelector('#orderByCombobox');
  const orderByCombobox = await page.$('#orderByCombobox');
  
  // Click on the combobox to focus it
  await orderByCombobox.click();
  await orderByCombobox.focus();

  let activeDescendant = '';
  let inputValue = '';
  let previousActiveDescendant = '';
  let topReached = false;
  while (!topReached) {
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    activeDescendant = await orderByCombobox.evaluate(el => el.getAttribute('aria-activedescendant'));
    await page.keyboard.press('Enter');

    // Get the name of the current sorting option
    inputValue = await orderByCombobox.inputValue();

    if (activeDescendant === previousActiveDescendant) {
      topReached = true;
    } else {
      // Validate the order of repositories based on the selected sorting option
      await validateGalleryItemOrders(page, inputValue);

      previousActiveDescendant = activeDescendant;
    }
  }

  previousActiveDescendant = '';
  let bottomReached = false;
  while (!bottomReached) {
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    activeDescendant = await orderByCombobox.evaluate(el => el.getAttribute('aria-activedescendant'));
    await page.keyboard.press('Enter');
    
    // Get the name of the current sorting option
    inputValue = await orderByCombobox.inputValue();

    if (activeDescendant === previousActiveDescendant) {
      bottomReached = true;
    } else {
      // Validate the order of repositories based on the selected sorting option
      await validateGalleryItemOrders(page, inputValue);

      previousActiveDescendant = activeDescendant;
    }
  }
});

// Validate that all the cards in the gallery contains the expected information
// - is Microsoft or Community authored
// - is it active (optional) with the last date when mouse over
// - the number of stars
// - the repository full name (owner and name)
// - the description
// - maximum 5 topics
// - an "Open in GitHub" button
// - an "See more..." button
test('Validate the information presented in the cards of the gallery', async ({ page }) => {
  await page.goto('/');

  // Get all the elements with class "galleryItem_vxLB"
  await page.waitForSelector('.galleryItem_vxLB');
  const galleryItems = await page.$$('.galleryItem_vxLB');

  for (let galleryItem of galleryItems) {
    const isMicrosoftAuthored = await galleryItem.$('span:has-text("Microsoft Authored")');
    const isCommunityAuthored = await galleryItem.$('span:has-text("Community Authored")');
    const isMicrosoftOrCommunityAuthored = isMicrosoftAuthored || isCommunityAuthored;
    expect(isMicrosoftOrCommunityAuthored).toBeTruthy();
    // Validate span text is either "Microsoft Authored" or "Community Authored"
    if (isMicrosoftOrCommunityAuthored) {
      const text = await isMicrosoftOrCommunityAuthored.innerText();
      expect(text).toMatch(/Microsoft Authored|Community Authored/);
    }

    // Get "Active" badge details - id = "activeBadge"
    // "aria-label" attribute value of the div element like "Last update on: ${date}"
    const isActive = await galleryItem.$('#activeBadge');
    const lastUpdateOn = await isActive?.evaluate(el => el.getAttribute('aria-label'));
    if (isActive) {
      expect(lastUpdateOn).toContain('Last update on: ');
    }

    const starsBadge = await galleryItem.$('#starsBadge');
    // If found (not always the case, but I don't know why...), validate that the number of stars is a positive integer
    if (starsBadge) {
      const stars = await starsBadge.innerText();
      expect(parseInt(stars)).toBeGreaterThanOrEqual(0);
    }

    const repositoryFullName = await galleryItem.$('.fui-Subtitle1');
    expect(repositoryFullName).toBeTruthy();

    const description = await galleryItem.$('.fui-Text');
    expect(description).toBeTruthy();

    const topics = await galleryItem.$$('#topicBadge');
    expect(topics.length).toBeLessThanOrEqual(5);

    const openInGitHubButton = await galleryItem.$('#openInGitHubButton');
    expect(openInGitHubButton).toBeTruthy();
    const openInGitHubButtonText = await openInGitHubButton.innerText();
    expect(openInGitHubButtonText).toBe('Open in GitHub');

    const seeMoreButton = await galleryItem.$('#seeMoreButton');
    expect(seeMoreButton).toBeTruthy();
    const seeMoreButtonText = await seeMoreButton.innerText();
    expect(seeMoreButtonText).toBe('See more...');
  }
});

// Validate that when I click on the "Open in GitHub" button in any card - pick a random one - of the gallery,
// the corresponding GitHub repository (comparison based on card full name) is opened in a new tab
/*test('Validate that when I click on the "Open in GitHub" button in a random card of the gallery, the corresponding GitHub repository is opened in a new tab', async ({ page }) => {
  await page.goto('/');

  // Get all the elements with class "galleryItem_vxLB"
  await page.waitForSelector('.galleryItem_vxLB');
  const galleryItems = await page.$$('.galleryItem_vxLB');

  // Get a random gallery item
  const randomIndex = Math.floor(Math.random() * galleryItems.length);
  const randomGalleryItem = galleryItems[randomIndex];

  // Get the full name of the repository
  const repositoryFullName = await randomGalleryItem.$('.fui-Subtitle1');
  const repositoryFullNameText = await repositoryFullName.innerText();

  // Prepare for the new tab
  const newTabPromise = new Promise<Page>(resolve => page.once('popup', resolve));

  // Click on the "Open in GitHub" button
  const openInGitHubButton = await randomGalleryItem.$('#openInGitHubButton');
  await openInGitHubButton.click();

  // Wait for the new tab to open
  const newTab = await newTabPromise;
  await newTab.waitForLoadState('networkidle');

  // Get the URL of the new tab
  const newTabUrl = newTab.url();

  // Validate that the URL of the new tab is the URL of the GitHub repository
  expect(newTabUrl).toContain(repositoryFullNameText);
});*/

// Validate that when I click on the "See more..." button in a random card of the gallery,
// a dialog is opened with more information about the repository
/*test('Validate that when I click on the "See more..." button in a random card of the gallery, a dialog is opened with more information about the repository', async ({ page }) => {
  await page.goto('/');

  // Get all the elements with class "galleryItem_vxLB"
  await page.waitForSelector('.galleryItem_vxLB');
  const galleryItems = await page.$$('.galleryItem_vxLB');

  // Get a random gallery item
  const randomIndex = Math.floor(Math.random() * galleryItems.length);
  const randomGalleryItem = galleryItems[randomIndex];

  // Click on the "See more..." button
  const seeMoreButton = await randomGalleryItem.$('#seeMoreButton');
  await seeMoreButton.click();

  // Get the dialog element with class "fui-DialogSurface" and role "dialog"
  await page.waitForSelector('.fui-DialogSurface[role="dialog"]');
  const dialog = await page.$('.fui-DialogSurface[role="dialog"]');

  // Validate that the dialog is opened
  expect(dialog).toBeTruthy();
});*/

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
 * Retrieves all sections from the page.
 * @param {Page} page - The page object representing the web page.
 * @returns {Promise<Array<{ section: ElementHandle, headerText: string }>>} - A promise that resolves to an array of objects containing the section element and its header text.
 */
async function getAllSections(page) {
  await page.waitForSelector('.fui-AccordionItem');
  const sections = await page.$$('.fui-AccordionItem');

  const result = [];
  for (let section of sections) {
    const header = await section.$('button');
    const headerText = await header.evaluate(el => el.textContent);
    result.push({ section, headerText });
  }

  return result;
}

/**
 * Retrieves random section, its header, and a checkbox within that section.
 * Expands random sect if it is not already ex anded a checkbox within that section.
 * Expands the section if it is not already expanded.
 * 
 * @param {Page} page - The page object representing the web page.
 * @returns {Promise<{ section: ElementHandleionAndCheckbox checkbox  // Get a random section
: ElementHandle, header: ElementHandle }>} The random section, checkbox, and header elements.
 */
async function getRandomSectionAndCheckbox(page) {
  // Get a random section
  await page.waitForSelector('.fui-AccordionItem');
  const sections = await page.$$('.fui-AccordionItem');
  const randomIndex = Math.floor(Math.random() * sections.length);
  const section = sections[randomIndex];
  
  // Expand the section if it is not already expanded  
  const header = await expandSectionIfNotExpanded(section);
  
  // Get a random checkbox within the section
  const checkboxDetails = await getRandomCheckboxInSection(section);
  const checkbox = checkboxDetails.checkbox;
  
  return { section, header, checkbox };
}

/**
 * Retrieves a random checkbox from a given section, excluding a potentially already selected checkbox.
 * @param section - The section containing the checkboxes.
 * @param selectedCheckboxId - The ID of the selected checkbox to be excluded (optional).
 * @returns An object containing the randomly selected checkbox, its ID, and its label parts.
 */
async function getRandomCheckboxInSection(section, selectedCheckboxId = '') {
  let checkbox = null;
  let checkboxId = '';
  let randomCheckboxIndex = -1;
  
  await section.waitForSelector('input[id^="checkbox-r"]');
  const checkboxes = await section.$$('input[id^="checkbox-r"]');

  while (!checkboxId) {
    randomCheckboxIndex = Math.floor(Math.random() * checkboxes.length);
    checkbox = checkboxes[randomCheckboxIndex];
    checkboxId = await checkbox.evaluate(el => el.id);

    if (selectedCheckboxId !== '' && checkboxId === selectedCheckboxId) {
      checkboxId = '';
    }
  }

  const checkboxLabelParts = await extractCheckboxLabelParts(section, checkboxId);
  
  return { checkbox, checkboxId, checkboxLabelParts };
}

/**
 * Retrieves the name and count from a checkbox label text.
 * 
 * @param {Page} page - The page object representing the web page.
 * @param {string} checkboxId - The ID of the checkbox.
 * @returns {Object} An object with the extracted name and count.
 */
async function extractCheckboxLabelParts(page, checkboxId) {  
  const labelElement = await page.$(`label[for="${checkboxId}"]`);
  const labelText = await labelElement.evaluate(el => el.textContent);
  const parts = labelText.split('(');
  const name = parts[0].trim();
  const count = parseInt(parts[1].split(')')[0]);
  return { name, count };
}

/**
 * Compares two strings and returns a comparison result.
 * @param s1 The first string to compare.
 * @param s2 The second string to compare.
 * @returns A string indicating the comparison result.
 */
function compareStrings(s1: string, s2: string): string {
  const lowerS1 = s1.toLowerCase();
  const lowerS2 = s2.toLowerCase();

  if (lowerS1 < lowerS2) {
    return `${s1} comes before ${s2}`;
  } else if (lowerS1 > lowerS2) {
    return `${s1} comes after ${s2}`;
  } else {
    return "Both strings are equal";
  }
}

/**
 * Validates the order of gallery items based on the selected sorting option.
 * 
 * @param {Page} page - The page object representing the UI page.
 * @param {string} orderByComboboxValue - The value of the selected sorting option.
 * @returns {Promise<void>} - A promise that resolves when the validation is complete.
 */
async function validateGalleryItemOrders(page, orderByComboboxValue) {
  // Switch case based on the selected sorting option to validate the order of repositories
  switch (orderByComboboxValue) {
    case 'Stars (Descending)':
      // Validate that the order of repositories is consistent with the number of stars in descending order
      const starsBadgesDescending = await page.$$('#starsBadge');

      let previousStars = null;
      for (let badge of starsBadgesDescending) {
        const stars = await badge.innerText();
        if (previousStars !== null) { // Skip the first badge
          expect(parseInt(stars)).toBeLessThanOrEqual(previousStars);
        }
        previousStars = parseInt(stars);
      }

      break;
    case 'Stars (Ascending)':
      // Validate that the order of repositories is consistent with the number of stars in ascending order
      const starsBadgesAscending = await page.$$('#starsBadge');

      let previousStarsAscending = null;
      for (let badge of starsBadgesAscending) {
        const stars = await badge.innerText();
        if (previousStarsAscending !== null) { // Skip the first badge
          expect(parseInt(stars)).toBeGreaterThanOrEqual(previousStarsAscending);
        }
        previousStarsAscending = parseInt(stars);
      }

      break;
    case 'Alphabetical (Ascending)':
      // Validate that the order of repositories is consistent with the name of repositories in ascending order
      const repositoryNamesAscending = await page.$$('.fui-Subtitle1');

      let previousNameAscending = '';
      for (let name of repositoryNamesAscending) {
        const currentName = await name.innerText();
        if (previousNameAscending !== '') { // Skip the first name
          expect(compareStrings(previousNameAscending, currentName)).toBe(`${previousNameAscending} comes before ${currentName}`);
        }
        previousNameAscending = currentName;
      }

      break;
    case 'Alphabetical (Descending)':
      // Validate that the order of repositories is consistent with the name of repositories in descending order
      const repositoryNamesDescending = await page.$$('.fui-Subtitle1');

      let previousNameDescending = '';
      for (let name of repositoryNamesDescending) {
        const currentName = await name.innerText();
        if (previousNameDescending !== '') { // Skip the first name
          expect(compareStrings(previousNameDescending, currentName)).toBe(`${previousNameDescending} comes after ${currentName}`);
        }
        previousNameDescending = currentName;
      }

      break;
  }
}

// #endregion