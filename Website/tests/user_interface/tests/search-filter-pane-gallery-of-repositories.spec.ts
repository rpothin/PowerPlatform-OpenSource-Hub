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
test('Validate the "View All" and "View Less" buttons in the filter pane in a relevant section', async ({ page }) => {
  await page.goto('/');

  let { section, header, checkbox } = await getRandomSectionAndCheckbox(page);
  let viewAllButton = await section.$('button:has-text("View All")');

  while (header === "Contribution Opportunities" || !viewAllButton) { // Exclude the "Contribution Opportunities" section because it has a static list of checkboxes
    // Get a new random section and checkbox
    ({ section, header, checkbox } = await getRandomSectionAndCheckbox(page));

    // Get the "View All" button
    viewAllButton = await section.$('button:has-text("View All")');
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

  // Validate that the checboxes are still presented in descending order based on the count of repositories found
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
});

// Validate that when you check 2 random checkboxes in 2 random sections in the filter pane,
// the count of repositories found is less or equal than the smallest count in the labels of the 2 checkboxes
test('Validate that when you check 2 random checkboxes in 2 random sections in the filter pane, the count of repositories found is less or equal than the smallest count in the labels of the 2 checkboxes', async ({ page }) => {
  await page.goto('/');

  // Get the first random section and checkbox
  const { section: section1, checkbox: checkbox1 } = await getRandomSectionAndCheckbox(page);
  const checkboxId1 = await checkbox1.evaluate(el => el.id);
  const checkboxLabelParts1 = await extractCheckboxLabelParts(page, checkboxId1);
  const count1 = checkboxLabelParts1.count;

  // Get the second random section and checkbox
  let { section: section2, checkbox: checkbox2 } = await getRandomSectionAndCheckbox(page);

  while (section2 === section1) {
    // Get a new random section and checkbox
    ({ section: section2, checkbox: checkbox2 } = await getRandomSectionAndCheckbox(page));
  }

  const checkboxId2 = await checkbox2.evaluate(el => el.id);
  const checkboxLabelParts2 = await extractCheckboxLabelParts(page, checkboxId2);
  const count2 = checkboxLabelParts2.count;

  // Click on the first checkbox
  await checkbox1.click();

  // Click on the second checkbox
  await checkbox2.click();

  // Extract the count of repositories found (after checking the checkboxes)
  const count = await getCountOfRepositories(page);

  // Validate that the count of repositories found is less or equal than the smallest count in the labels of the 2 checkboxes
  expect(count).toBeLessThanOrEqual(Math.min(count1, count2));
});

// #endregion

// #region Gallery functionality tests

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
/*test('Validate that when I change the sorting option in the gallery, the count of repositories found is the same', async ({ page }) => {
  await page.goto('/');

  // Get the input element with id "orderByCombobox"
  await page.waitForSelector('#orderByCombobox');
  const orderByCombobox = await page.$('#orderByCombobox');

  // Get the combo box options
  const options = await getComboboxOptions(page, orderByCombobox);

  // Get the initial count of repositories found
  const initialCount = await getCountOfRepositories(page);

  // Get the value of the "orderByCombobox" input element
  const value = await orderByCombobox.inputValue();

  // Take a screenshot of the page before changing the sorting option
  await page.screenshot({ path: 'before-changing-sorting-option.png' });

  // Randomly select a different option than the selected one
  const selectedIndex = options.indexOf(value);
  let randomIndex = Math.floor(Math.random() * options.length);

  while (randomIndex === selectedIndex) {
    randomIndex = Math.floor(Math.random() * options.length);
  }

  let randomOption = options[randomIndex];

  console.log('Selected option:', value);
  console.log('Random option:', randomOption);

  selectComboboxOption(page, orderByCombobox, randomOption);

  // Take a screenshot of the page after changing the sorting option
  await page.screenshot({ path: 'after-changing-sorting-option.png' });

  // Extract the count of repositories found (after changing the sorting option)
  const count = await getCountOfRepositories(page);

  // Validate that the count of repositories found is the same
  expect(count).toBe(initialCount);
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
 * Retrieves a random section, its header, and a checkbox within that section.
 * Expands the section if it is not already expanded.
 * 
 * @param {Page} page - The page object representing the web page.
 * @returns {Promise<{ section: ElementHandle, checkbox: ElementHandle, header: ElementHandle }>} The random section, checkbox, and header elements.
 */
async function getRandomSectionAndCheckbox(page) {
  // Get a random section
  await page.waitForSelector('.fui-AccordionItem');
  const sections = await page.$$('.fui-AccordionItem');
  const randomIndex = Math.floor(Math.random() * sections.length);
  const section = sections[randomIndex];
  
  // Expand the section if it is not already expanded  
  const header = await expandSectionIfNotExpanded(section);

  console.log('Random section selected:', (await header.evaluate(el => el.textContent)).trim());
  
  // Get a random checkbox within the section
  const checkboxes = await section.$$('input[id^="checkbox-r"]');
  const randomCheckboxIndex = Math.floor(Math.random() * checkboxes.length);
  const checkbox = checkboxes[randomCheckboxIndex];
  
  return { section, header, checkbox };
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
 * Retrieves the options from a combobox element.
 * 
 * @param {Page} page - The page object representing the browser page.
 * @param {Combobox} combobox - The combobox element to retrieve options from.
 * @returns {Promise<string[]>} - A promise that resolves to an array of options.
 */
async function getComboboxOptions(page, combobox) {
  let options = [];
  let inputValue = '';
  let activeDescendant = '';
  
  // Click on the combobox to focus it
  await combobox.click();
  await combobox.focus();

  // While the aria-activedescendant attribute stop changin,
  // - press the "ArrowUp" key
  // - get the value of the aria-activedescendant attribute, if it is equal to the previous value stop the loop
  // - select the option with the value of the aria-activedescendant attribute
  // - press the "Enter" key
  // - add the combobox input value to the list of options
  // - repeat the steps
  let previousActiveDescendant = '';
  let bottomReached = false;
  while (!bottomReached) {
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    activeDescendant = await combobox.evaluate(el => el.getAttribute('aria-activedescendant'));
    await page.keyboard.press('Enter');

    if (activeDescendant === previousActiveDescendant) {
      bottomReached = true;
    } else {
      inputValue = await combobox.inputValue();
      options.push(inputValue);
      previousActiveDescendant = activeDescendant;
    }
  }

  // Do the same steps but with the "ArrowDown" key
  previousActiveDescendant = '';
  let topReached = false;
  while (!topReached) {
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    activeDescendant = await combobox.evaluate(el => el.getAttribute('aria-activedescendant'));
    await page.keyboard.press('Enter');
    
    if (activeDescendant === previousActiveDescendant) {
      topReached = true;
    } else {
      inputValue = await combobox.inputValue();
      options.push(inputValue);
      previousActiveDescendant = activeDescendant;
    }
  }

  return options;
}

/**
 * Selects an option from a combobox.
 * @param {Page} page - The page object.
 * @param {ElementHandle} combobox - The combobox element.
 * @param {string} option - The option to select.
 * @returns {Promise<void>} - A promise that resolves when the option is selected.
 */
async function selectComboboxOption(page, combobox, option) {
  // Click on the combobox to focus it
  await combobox.click();
  await combobox.focus();
  
  await page.keyboard.type(option);
  await page.keyboard.press('Enter');
}

// #endregion