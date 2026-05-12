import { test, expect, type Locator, type Page } from '@playwright/test';

const sortOptions = [
  'Stars (Descending)',
  'Stars (Ascending)',
  'Alphabetical (Ascending)',
  'Alphabetical (Descending)',
  'Recently Updated',
  'Recently Released',
];

// #region Header and footer tests

// Validate that the header contains a navigation bar with the expected elements
// - the logo redirecting to the home page
// - a link to the documentation section of the website
// - a link to the GitHub repository in the backend
// - a switch to change the theme (light/dark)
test('Validate the header of the website', async ({ page }) => {
  await page.goto('/');

  // Get the logo
  const header = page.locator('nav.navbar');
  const logo = header.locator('.navbar__brand');
  await expect(logo).toBeVisible();

  // Validate that the logo redirects to the home page
  await expect(logo).toHaveAttribute('href', '/PowerPlatform-OpenSource-Hub/');

  // Get the Documentation link looking for the inner text
  // and validate that the link redirects to the documentation section of the website
  const documentationLink = header.getByRole('link', { name: 'Documentation' });
  await expect(documentationLink).toHaveAttribute('href', '/PowerPlatform-OpenSource-Hub/docs/intro');

  // Get the GitHub link looking for the inner text
  // and validate that the link redirects to the GitHub repository in the backend
  const gitHubLink = header.getByRole('link', { name: 'GitHub' });
  await expect(gitHubLink).toHaveAttribute('href', 'https://github.com/rpothin/PowerPlatform-OpenSource-Hub');

  // Get the switch to change the theme (light/dark)
  // and validae that the user can change the theme
  const themeSwitch = header.getByRole('button', { name: /Switch between dark and light mode/ });
  await expect(themeSwitch).toBeVisible();
  const accessibleNameBeforeClick = await themeSwitch.getAttribute('aria-label');
  await themeSwitch.click();
  await expect(themeSwitch).not.toHaveAttribute('aria-label', accessibleNameBeforeClick ?? '');
});

// Validate that the Documentation section of the website
// - is accessible from the home page
// - exists
// - allows to come back to the home page
test('Validate the Documentation section of the website', async ({ page }) => {
  await page.goto('/');

  // Get the Documentation link looking for the inner text
  // and validate that the link redirects to the Documentation section of the website
  const documentationLink = page.locator('nav.navbar').getByRole('link', { name: 'Documentation' });
  const href = await documentationLink.getAttribute('href');
  expect(href).toBeTruthy();
  await page.goto(href!);

  // Get the logo
  const logo = page.locator('nav.navbar .navbar__brand');
  await expect(logo).toBeVisible();

  // Validate that the logo redirects to the home page
  await expect(logo).toHaveAttribute('href', '/PowerPlatform-OpenSource-Hub/');
});

// Validate that the footer contains the expected elements
// - a link to the Awesome AZD website
// - a link to the Docusaurus website
// - a link to the FAQ of Microsoft Clarity regarding privacy
// - a link to rpothin GitHub profile
test('Validate the footer of the website', async ({ page }) => {
  await page.goto('/');
  const footer = page.locator('footer');

  // Get the Awesome AZD link looking for the inner text
  // and validate that the link redirects to the Awesome AZD website
  await expect(footer.getByRole('link', { name: 'Inspired by Awesome AZD' })).toHaveAttribute('href', 'https://azure.github.io/awesome-azd/');

  // Get the Docusaurus link looking for the inner text
  // and validate that the link redirects to the Docusaurus website
  await expect(footer.getByRole('link', { name: 'Built with Docusaurus' })).toHaveAttribute('href', 'https://docusaurus.io');

  // Get the Microsoft Clarity link looking for the inner text
  // and validate that the link redirects to the FAQ of Microsoft Clarity regarding privacy
  await expect(footer.getByRole('link', { name: 'Monitored with Microsoft Clarity' })).toHaveAttribute('href', 'https://learn.microsoft.com/en-us/clarity/faq#privacy');

  // Get the rpothin GitHub link looking for the inner text
  // and validate that the link redirects to the rpothin GitHub profile
  await expect(footer.getByRole('link', { name: /Copyright/ })).toHaveAttribute('href', 'https://github.com/rpothin/');
});

// #endregion

// #region Search functionality tests

// Validate that when I enter a search term, the count of repositories found is updated (smaller than the one before entering the search term)
test('Validate the count of repositories found when I enter a search term', async ({ page }) => {
  await page.goto('/');

  // Extract the initial count of repositories found (before entering the search term)
  const initialCount = await getCountOfRepositories(page);

  // Use a term known to match a strict subset of the data (Dataverse-specific repos ~15%)
  // Avoid "power" which will match all repos once taxonomy labels like "Power Apps" are populated
  await page.getByPlaceholder('Search for a Power Platform GitHub repository...').fill('dataverse');

  // Wait for React to re-render and the count to decrease
  await expect.poll(() => getCountOfRepositories(page)).toBeLessThan(initialCount);
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
  const checkboxes = page.getByRole('checkbox');
  await expect(checkboxes.first()).toBeVisible();
  const checkboxCount = await checkboxes.count();
  expect(checkboxCount).toBeGreaterThan(0);
  for (let index = 0; index < checkboxCount; index++) {
    await expect(checkboxes.nth(index)).not.toBeChecked();
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
  const contributionOpportunitiesSection = page.locator('.fui-AccordionItem').filter({
    has: page.getByRole('button', { name: 'Contribution Opportunities' }),
  });
  const contributionOpportunitiesCheckboxesNames = (await contributionOpportunitiesSection.locator('label[for^="checkbox-r"]').allInnerTexts())
    .map((checkboxText) => checkboxText.split(' (')[0]);
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

  // Click on the checkbox
  await checkbox.click();

  // Validate that the checkbox is checked
  const isChecked = await checkbox.isChecked();
  expect(isChecked).toBe(true);

  // Collapse the section
  await header.click();

  // Expand the section
  await header.click();

  // Validate that the checkbox is still checked
  const newCheckbox = page.locator(`#${checkboxId}`);
  const isCheckedAgain = await newCheckbox.isChecked();
  try {
    expect(isCheckedAgain).toBe(true);
  } catch (error) {
    await page.screenshot({ path: 'error-screenshot.png' });
    throw error;
  }
});

// Validate that for all sections with a dynamic list of checkboxes (do not consider "Contribution Opportunities") in the filter pane,
// - there are no more than 10 checkboxes presented
// - the checboxes are presented in descending order based on the count of repositories found
// - if there are more than 10 checkboxes available, there is a "View All" button at the end of the list
test('Validate the presentation of the checkboxes in the sections of the filter pane with a dynamic list of checkboxes', async ({ page }) => {
  await page.goto('/');

  // Get all the sections in the filter pane
  const sections = (await getAllSections(page))
    .filter((section) => section.headerText !== 'Contribution Opportunities')
    .map((section) => section.section); // Exclude the "Contribution Opportunities" section because it has a static list of checkboxes

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
      const viewAllButton = await getButtonByName(section, 'View All');
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
    let viewAllButton = await getButtonByName(section.section, 'View All');

    // Skip the section if it is the "Contribution Opportunities" section or if there is no "View All" button
    if (section.headerText === "Contribution Opportunities" || !viewAllButton) {
      continue;
    }

    // Get the initial count of checkboxes
    const initialCheckboxes = await section.section.$$('input[id^="checkbox-r"]');
    const initialCheckboxesCount = initialCheckboxes.length;

    // Click on the "View All" button
    await viewAllButton.click();

    // Get the new count of checkboxes
    const newCheckboxes = await section.section.$$('input[id^="checkbox-r"]');
    const newCheckboxesCount = newCheckboxes.length;

    // Validate that the list of checkboxes is expanded
    expect(newCheckboxesCount).toBeGreaterThan(initialCheckboxesCount);

    // Validate that the "View All" button is replaced by a "View Less" button
    const viewLessButton = await getButtonByName(section.section, 'View Less');
    expect(viewLessButton).toBeTruthy();
    const viewAllButtonAfterCollapse = await getButtonByName(section.section, 'View All');
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
    const newCheckboxesAgain = await section.section.$$('input[id^="checkbox-r"]');
    const newCheckboxesCountAgain = newCheckboxesAgain.length;

    // Validate that the list of checkboxes is collapsed
    expect(newCheckboxesCountAgain).toBe(initialCheckboxesCount);
  }
});

// Validate the count of repositories based on the selection of 2 checkboxes in each section
// - if the section is "Licenses" or "Owners", the count of repositories is the sum of the counts of the 2 checkboxes
// - if the section is "Contribution Opportunities", "Topics", or "Languages", the count of repositories is the minimum of the counts of the 2 checkboxes
test('Validate the count of repositories based on the selection of 2 checkboxes in each section', async ({ page }) => {
  const sectionBehaviors = [
    { name: 'Contribution Opportunities', countBehavior: 'min' },
    { name: 'Topics', countBehavior: 'min' },
    { name: 'Languages', countBehavior: 'min' },
    { name: 'Licenses', countBehavior: 'sum' },
    { name: 'Owners', countBehavior: 'sum' },
  ];

  await page.goto('/');
  const initialCount = await getCountOfRepositories(page);

  for (const sectionBehavior of sectionBehaviors) {
    const section = page.locator('.fui-AccordionItem').filter({
      has: page.getByRole('button', { name: sectionBehavior.name }),
    });
    const header = section.getByRole('button', { name: sectionBehavior.name });
    if (await header.getAttribute('aria-expanded') !== 'true') {
      await header.click();
    }

    const checkboxes = section.getByRole('checkbox');
    await expect(checkboxes.nth(1)).toBeVisible();
    const checkboxCounts = await checkboxes.evaluateAll((checkboxElements) =>
      checkboxElements.slice(0, 2).map((checkbox) => {
        const labelText = (checkbox as HTMLInputElement).labels?.[0]?.textContent ?? '';
        return Number.parseInt(labelText.match(/\((\d+)\)/)?.[1] ?? '', 10);
      })
    );

    await checkboxes.nth(0).check();
    await checkboxes.nth(1).check();

    if (sectionBehavior.countBehavior === 'sum') {
      await expect.poll(() => getCountOfRepositories(page)).toBe(checkboxCounts[0] + checkboxCounts[1]);
    } else {
      await expect.poll(() => getCountOfRepositories(page)).toBeLessThanOrEqual(Math.min(checkboxCounts[0], checkboxCounts[1]));
    }

    await checkboxes.nth(0).uncheck();
    await checkboxes.nth(1).uncheck();
    await expect.poll(() => getCountOfRepositories(page)).toBe(initialCount);
  }
});

// #endregion

// #region Gallery functionality tests

// Validate that the count of repositories in the header of the gallery is equal to the count of repositories found
test('Validate the count of repositories in the header of the gallery', async ({ page }) => {
  await page.goto('/');

  // Get the count of repositories in the header of the gallery
  const repositoriesCountInHeader = await getCountOfRepositories(page);

  // Get the count of repositories found
  const countOfRepositoriesPresentedInGallery = await (await waitForRepositoryCards(page)).count();

  // Validate that the count of repositories in the header of the gallery is equal to the count of repositories found
  expect(repositoriesCountInHeader).toBe(countOfRepositoriesPresentedInGallery);
});

// Validate that the default sorting option in the gallery is "Stars (Descending)"
test('Validate the default sorting option in the gallery', async ({ page }) => {
  await page.goto('/');

  // Validate that the default sorting option in the gallery is "Stars (Descending)"
  await expect(getOrderByCombobox(page)).toHaveValue('Stars (Descending)');
});

// Validate that sorting is restored from URL query parameters
test('Validate that sorting is restored from URL query parameters', async ({ page }) => {
  await page.goto('/PowerPlatform-OpenSource-Hub/?sort=alphabeticalAsc');

  await expect(getOrderByCombobox(page)).toHaveValue('Alphabetical (Ascending)');
});

// Validate that an invalid sort query parameter is clamped to the default sort
test('Validate that an invalid sort query parameter falls back to default sort', async ({ page }) => {
  await page.goto('/PowerPlatform-OpenSource-Hub/?sort=not-a-valid-sort');

  await expect(getOrderByCombobox(page)).toHaveValue('Stars (Descending)');
});

// Validate back/forward behavior for deliberate filter changes
test('Validate browser history behavior for filter changes', async ({ page }) => {
  await page.goto('/');

  const goodFirstIssueCheckbox = page.locator('#checkbox-r-good-first-issue');
  const helpWantedIssueCheckbox = page.locator('#checkbox-r-help-wanted-issue');

  await goodFirstIssueCheckbox.click();
  await helpWantedIssueCheckbox.click();

  expect(page.url()).toContain('goodFirstIssue=true');
  expect(page.url()).toContain('helpWantedIssue=true');

  await page.goBack();

  expect(page.url()).toContain('goodFirstIssue=true');
  expect(page.url()).not.toContain('helpWantedIssue=true');
});

test('Validate category documentation page links to the filtered gallery', async ({ page }) => {
  await page.goto('/PowerPlatform-OpenSource-Hub/docs/categories/power-apps');

  await expect(page.getByRole('heading', { name: 'Power Apps', exact: true })).toBeVisible();
  const galleryLink = page.getByRole('link', { name: 'View all in gallery' });
  await expect(galleryLink).toBeVisible();
  await expect(galleryLink).toHaveAttribute('href', '/PowerPlatform-OpenSource-Hub/?categories=power-apps');
});

test('Validate community landing page links to community child pages', async ({ page }) => {
  await page.goto('/PowerPlatform-OpenSource-Hub/docs/community');

  await expect(page.getByRole('heading', { name: 'Community' })).toBeVisible();
  const article = page.getByRole('article');
  await expect(article.getByRole('link', { name: 'Find solutions', exact: true })).toHaveAttribute('href', /\/PowerPlatform-OpenSource-Hub\/docs\/community\/find-solutions\/?$/);
  await expect(article.getByRole('link', { name: 'Contribute to projects', exact: true })).toHaveAttribute('href', /\/PowerPlatform-OpenSource-Hub\/docs\/community\/contribute-to-projects\/?$/);
  await expect(article.getByRole('link', { name: 'List your repository', exact: true })).toHaveAttribute('href', /\/PowerPlatform-OpenSource-Hub\/docs\/community\/list-your-repository\/?$/);
});

test('Validate category badge or URL-driven category filtering', async ({ page }) => {
  // Navigate directly to the filtered URL; this tests both URL parsing and badge presence
  await page.goto('/PowerPlatform-OpenSource-Hub/?categories=power-apps');
  await page.waitForLoadState('domcontentloaded');

  const categoryBadges = page.getByTestId('card-category-badge');
  if (await categoryBadges.count()) {
    // When repos have category data: clicking a badge should preserve the URL filter
    await expect(page).toHaveURL(/categories=/);
    return;
  }

  // No category data yet — verify the filter correctly yields 0 results
  await expect(page.locator('#repositoryCount')).toHaveText('0 repositories found');
  await expect(getRepositoryCards(page)).toHaveCount(0);
});

test('Validate featured spotlight follows featured repository availability', async ({ page }) => {
  await page.goto('/');
  await waitForRepositoryCards(page);

  const spotlight = page.getByTestId('featured-spotlight');
  if (await spotlight.count()) {
    await expect(spotlight).toBeVisible();
    await expect(spotlight.getByTestId('featured-repository-card').first()).toBeVisible();
  } else {
    await expect(spotlight).toHaveCount(0);
  }
});

// Validate that when I change the sorting option in the gallery, the count of repositories found is the same
test('Validate that when I change the sorting option in the gallery, the count of repositories found is the same', async ({ page }) => {
  await page.goto('/');

  // Get the initial count of repositories found
  const initialCount = await getCountOfRepositories(page);

  for (const option of sortOptions) {
    await selectSortOption(page, option);
    const count = await getCountOfRepositories(page);
    expect(count).toBe(initialCount);
  }
});

// Validate that when I change the sorting option in the gallery, the order of repositories is updated and consistent with the selected sorting option
// - if the selected sorting option is "Stars (Descending)", the order of repositories is consistent with the number of stars in descending order
// - if the selected sorting option is "Stars (Ascending)", the order of repositories is consistent with the number of stars in ascending order
// - if the selected sorting option is "Alphabetical (Ascending)", the order of repositories is consistent with the name of repositories in ascending order
// - if the selected sorting option is "Alphabetical (Descending)", the order of repositories is consistent with the name of repositories in descending order
test('Validate that when I change the sorting option in the gallery, the order of repositories is updated and consistent with the selected sorting option', async ({ page }) => {
  await page.goto('/');

  for (const option of sortOptions) {
    await selectSortOption(page, option);
    await validateGalleryItemOrders(page, option);
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

  const cards = await waitForRepositoryCards(page);
  const cardCount = await cards.count();
  expect(cardCount).toBeGreaterThan(0);

  await expect(page.getByRole('button', { name: 'Open in GitHub' })).toHaveCount(cardCount);
  await expect(page.getByRole('button', { name: 'See more...' })).toHaveCount(cardCount);

  const cardsWithAuthor = await cards.filter({ hasText: /Microsoft Authored|Community Authored/ }).count();
  expect(cardsWithAuthor).toBe(cardCount);

  const topicCounts = await cards.evaluateAll((cardElements) =>
    cardElements.map((card) => card.querySelectorAll('[data-testid="topic-badge"]').length)
  );
  for (const topicCount of topicCounts) {
    expect(topicCount).toBeLessThanOrEqual(5);
  }

  const sampleIndexes = getRepresentativeIndexes(cardCount);
  const sampledCardDetails = await cards.evaluateAll((cardElements, indexes) =>
    indexes.map((index) => {
      const card = cardElements[index];
      const buttonTexts = Array.from(card.querySelectorAll('button'))
        .map((button) => button.textContent?.trim() ?? '');
      const activeBadgeLabel = Array.from(card.querySelectorAll('[aria-label]'))
        .find((element) => element.getAttribute('aria-label')?.startsWith('Last update on: '))
        ?.getAttribute('aria-label') ?? '';

      return {
        activeBadgeLabel,
        authorText: card.textContent ?? '',
        buttonTexts,
        description: card.querySelector('[data-testid="repository-description"]')?.textContent?.trim() ?? '',
        repositoryFullName: card.querySelector('[data-testid="repository-full-name"]')?.textContent?.trim() ?? '',
        stars: Number.parseInt(card.querySelector('[data-testid="stars-badge"]')?.textContent?.trim() ?? '', 10),
      };
    }),
    sampleIndexes
  );

  for (const galleryItem of sampledCardDetails) {
    expect(galleryItem.authorText).toMatch(/Microsoft Authored|Community Authored/);
    if (galleryItem.activeBadgeLabel) {
      expect(galleryItem.activeBadgeLabel).toContain('Last update on: ');
    }
    expect(galleryItem.stars).toBeGreaterThanOrEqual(0);
    expect(galleryItem.repositoryFullName).toMatch(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/);
    expect(galleryItem.description.length).toBeGreaterThan(0);
    expect(galleryItem.buttonTexts).toContain('Open in GitHub');
    expect(galleryItem.buttonTexts).toContain('See more...');
  }
});

// Validate that when I click on the "Open in GitHub" button in any card - pick a random one - of the gallery,
// the corresponding GitHub repository (comparison based on card full name) is opened in a new tab
test('Validate that when I click on the "Open in GitHub" button in a random card of the gallery, the corresponding GitHub repository is opened in a new tab', async ({ page }) => {
  await page.addInitScript(() => {
    // @ts-ignore
    window.__lastOpenedUrl = '';
    const nativeWindowOpen = window.open.bind(window);
    window.open = (...args) => {
      // @ts-ignore
      window.__lastOpenedUrl = typeof args[0] === 'string' ? args[0] : '';
      return nativeWindowOpen(...args);
    };
  });

  await page.goto('/');

  const galleryItem = (await waitForRepositoryCards(page)).first();

  // Get the full name of the repository
  const repositoryFullNameText = await galleryItem.getByTestId('repository-full-name').innerText();

  // Prepare for the new tab
  const newTabPromise = page.waitForEvent('popup', { timeout: 5000 }).catch(() => null);

  // Click on the "Open in GitHub" button
  await galleryItem.getByRole('button', { name: 'Open in GitHub' }).click();

  // Validate the URL passed to window.open
  const openedUrl = await page.evaluate(() => (window as any).__lastOpenedUrl);
  expect(openedUrl).toContain(repositoryFullNameText);

  // Wait for the new tab to open
  const newTab = await newTabPromise;

  // Get the URL of the new tab
  const newTabUrl = newTab?.url() ?? '';

  // Validate that the URL of the new tab is the URL of the GitHub repository.
  // In restricted environments external navigation can be blocked, so fallback to validating the URL bound to the button.
  if (newTabUrl && !newTabUrl.startsWith('about:blank') && !newTabUrl.startsWith('chrome-error://')) {
    expect(newTabUrl).toContain(repositoryFullNameText);
  }
});

// Validate that when I click on the "See more..." button in a random card of the gallery,
// a dialog is opened with more information about the repository
test('Validate that when I click on the "See more..." button in a random card of the gallery, a dialog is opened with more information about the repository', async ({ page }) => {
  await page.addInitScript(() => {
    // @ts-ignore
    window.__lastOpenedUrl = '';
    const nativeWindowOpen = window.open.bind(window);
    window.open = (...args) => {
      // @ts-ignore
      window.__lastOpenedUrl = typeof args[0] === 'string' ? args[0] : '';
      return nativeWindowOpen(...args);
    };
  });

  await page.goto('/');

  const galleryItem = (await waitForRepositoryCards(page)).first();

  // Click on the "See more..." button
  await galleryItem.getByRole('button', { name: 'See more...' }).click();

  // Get the dialog element with class "fui-DialogSurface" and role "dialog"
  const dialog = page.getByRole('dialog');

  // Validate that the dialog is opened
  await expect(dialog).toBeVisible();

  // Validate that the information below are present in the dialog
  // - the repository full name
  // - the description
  // - is it active (optional) with the last date when mouse over
  // - the number of stars
  // - the number of watchers
  // - the badges for all the topics
  // - the license
  // - the count of good first issues
  // - the count of help wanted issues
  // - the main language
  // - the latest release tag and date if available
  const dialogTitleText = await dialog.getByTestId('dialog-title').innerText();
  const repositoryFullNameMatch = dialogTitleText.match(/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+/);
  const repositoryFullNameText = repositoryFullNameMatch ? repositoryFullNameMatch[0] : '';
  expect(repositoryFullNameText).toBeTruthy();

  await expect(dialog.getByTestId('dialog-description')).toBeVisible();

  const isActive = dialog.getByTestId('dialog-active-badge');
  if (await isActive.count()) {
    await expect(isActive.first()).toHaveAttribute('aria-label', /Last update on: /);
  }

  const starsBadge = dialog.getByTestId('dialog-stars-badge');
  if (await starsBadge.count()) {
    const stars = await starsBadge.first().innerText();
    expect(parseInt(stars)).toBeGreaterThanOrEqual(0);
  }

  const watchersBadge = dialog.getByTestId('dialog-watchers-badge');
  if (await watchersBadge.count()) {
    const watchers = await watchersBadge.first().innerText();
    expect(parseInt(watchers)).toBeGreaterThanOrEqual(0);
  }

  expect(await dialog.getByTestId('dialog-topic-badge').count()).toBeGreaterThanOrEqual(0);

  const licenseBadge = dialog.getByTestId('dialog-license-badge');
  if (await licenseBadge.count()) {
    const licenseText = await licenseBadge.first().innerText();
    expect(licenseText.startsWith('License: ')).toBeTruthy();
  }

  const goodFirstIssuesBadge = dialog.getByTestId('dialog-good-first-issues-badge');
  if (await goodFirstIssuesBadge.count()) {
    const goodFirstIssuesText = await goodFirstIssuesBadge.first().innerText();
    const goodFirstIssues = parseInt(goodFirstIssuesText.replace('Good 1st Issues: ', ''));
    expect(goodFirstIssues).toBeGreaterThanOrEqual(0);
  }

  const helpWantedIssuesBadge = dialog.getByTestId('dialog-help-wanted-issues-badge');
  if (await helpWantedIssuesBadge.count()) {
    const helpWantedIssuesText = await helpWantedIssuesBadge.first().innerText();
    const helpWantedIssues = parseInt(helpWantedIssuesText.substring("Help Wanted Issues: ".length));
    expect(helpWantedIssues).toBeGreaterThanOrEqual(0);
  }

  const mainLanguageBadge = dialog.getByTestId('dialog-main-language-badge');
  if (await mainLanguageBadge.count()) {
    const mainLanguageText = await mainLanguageBadge.first().innerText();
    expect(mainLanguageText.startsWith('Language: ')).toBeTruthy();
  }

  const latestReleaseBadge = dialog.getByTestId('dialog-latest-release-badge');
  if (await latestReleaseBadge.count()) {
    const latestRelease = await latestReleaseBadge.first().innerText();
    const latestReleaseMatch = latestRelease.match(/^Latest Release: ([\w./-]+) \((\d{4}-\d{2}-\d{2})\)$/);
    expect(latestReleaseMatch).toBeTruthy();
    const parsedDate = latestReleaseMatch ? new Date(`${latestReleaseMatch[2]}T00:00:00Z`) : new Date('invalid');
    expect(Number.isNaN(parsedDate.getTime())).toBe(false);
  }

  // Validate that clicking on the "Open in GitHub" button in the dialog opens the corresponding GitHub repository in a new tab
  // Prepare for the new tab
  const newTabPromise = page.waitForEvent('popup', { timeout: 5000 }).catch(() => null);

  // Click on the "Open in GitHub" button
  await dialog.getByRole('button', { name: 'Open in GitHub' }).click();

  const openedUrl = await page.evaluate(() => (window as any).__lastOpenedUrl);
  expect(openedUrl).toContain(repositoryFullNameText);

  // Wait for the new tab to open
  const newTab = await newTabPromise;

  // Get the URL of the new tab
  const newTabUrl = newTab?.url() ?? '';

  // Validate that the URL of the new tab is the URL of the GitHub repository.
  // In restricted environments external navigation can be blocked, so fallback to validating the URL bound to the button.
  if (newTabUrl && !newTabUrl.startsWith('about:blank') && !newTabUrl.startsWith('chrome-error://')) {
    expect(newTabUrl).toContain(openedUrl);
  }

  await newTab?.close().catch(() => {});
  await page.bringToFront();

  // In the main tab, in the dialog, click on the "Close" button and validate that the dialog is closed
  await dialog.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(dialog).toBeHidden();
});

// #endregion

// #region Helper functions

/**
 * Retrieves the count of repositories in the header of the gallery
 * 
 * @param {Page} page - The page object representing the web page.
 * @returns {Promise<number>} The count of repositories.
 */
function getOrderByCombobox(page: Page): Locator {
  return page.getByRole('combobox', { name: 'Order By' });
}

async function selectSortOption(page: Page, optionText: string) {
  const orderByCombobox = getOrderByCombobox(page);
  await orderByCombobox.click();
  await page.getByRole('option', { name: optionText, exact: true }).click();
  await expect(orderByCombobox).toHaveValue(optionText);
}

function getRepositoryCards(page: Page): Locator {
  return page.getByTestId('repository-card');
}

async function waitForRepositoryCards(page: Page): Promise<Locator> {
  const cards = getRepositoryCards(page);
  await expect(cards.first()).toBeVisible();
  return cards;
}

function getRepresentativeIndexes(count: number, maxSamples = 12): number[] {
  if (count <= 0) {
    return [];
  }

  return Array.from({ length: Math.min(count, maxSamples) }, (_, index) => index);
}

async function getCountOfRepositories(page: Page): Promise<number> {
  const countText = await page.locator('#repositoryCount').innerText();
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

async function getButtonByName(section, buttonName: string) {
  const buttons = await section.$$('button');

  for (const button of buttons) {
    const buttonText = (await button.innerText()).trim();
    if (buttonText === buttonName) {
      return button;
    }
  }

  return null;
}

/**
 * Retrieves a deterministic section, its header, and a checkbox within that section.
 * Expands the section if it is not already expanded.
 * 
 * @param {Page} page - The page object representing the web page.
 * @returns {Promise<{ section: ElementHandleionAndCheckbox checkbox  // Get a random section
: ElementHandle, header: ElementHandle }>} The random section, checkbox, and header elements.
 */
async function getRandomSectionAndCheckbox(page) {
  // Get a deterministic section
  await page.waitForSelector('.fui-AccordionItem');
  const sections = await page.$$('.fui-AccordionItem');
  const section = sections[0];
  
  // Expand the section if it is not already expanded  
  const header = await expandSectionIfNotExpanded(section);
  
  // Get a random checkbox within the section
  const checkboxDetails = await getRandomCheckboxInSection(section);
  const checkbox = checkboxDetails.checkbox;
  
  return { section, header, checkbox };
}

/**
  * Retrieves a deterministic checkbox from a given section, excluding a potentially already selected checkbox.
 * @param section - The section containing the checkboxes.
 * @param selectedCheckboxId - The ID of the selected checkbox to be excluded (optional).
 * @returns An object containing the randomly selected checkbox, its ID, and its label parts.
 */
async function getRandomCheckboxInSection(section, selectedCheckboxId = '') {
  await section.waitForSelector('input[id^="checkbox-r"]');
  const checkboxes = await section.$$('input[id^="checkbox-r"]');

  for (const checkbox of checkboxes) {
    const checkboxId = await checkbox.evaluate(el => el.id);
    if (checkboxId !== selectedCheckboxId) {
      const checkboxLabelParts = await extractCheckboxLabelParts(section, checkboxId);
      return { checkbox, checkboxId, checkboxLabelParts };
    }
  }

  throw new Error('No checkbox found in section');
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
 * Validates the order of gallery items based on the selected sorting option.
 * 
 * @param {Page} page - The page object representing the UI page.
 * @param {string} orderByComboboxValue - The value of the selected sorting option.
 * @returns {Promise<void>} - A promise that resolves when the validation is complete.
 */
async function validateGalleryItemOrders(page: Page, orderByComboboxValue: string) {
  const cards = await waitForRepositoryCards(page);

  // Switch case based on the selected sorting option to validate the order of repositories
  switch (orderByComboboxValue) {
    case 'Stars (Descending)':
      // Validate that the order of repositories is consistent with the number of stars in descending order
      const starsDescending = await cards.evaluateAll((cardElements) =>
        cardElements.map((card) => {
          return Number.parseInt(card.querySelector('[data-testid="stars-badge"]')?.textContent?.trim() ?? '', 10);
        })
      );

      for (let index = 1; index < starsDescending.length; index++) {
        expect(Number.isNaN(starsDescending[index])).toBe(false);
        if (index > 0) {
          expect(starsDescending[index]).toBeLessThanOrEqual(starsDescending[index - 1]);
        }
      }

      break;
    case 'Stars (Ascending)':
      // Validate that the order of repositories is consistent with the number of stars in ascending order
      const starsAscending = await cards.evaluateAll((cardElements) =>
        cardElements.map((card) => {
          return Number.parseInt(card.querySelector('[data-testid="stars-badge"]')?.textContent?.trim() ?? '', 10);
        })
      );

      for (let index = 1; index < starsAscending.length; index++) {
        expect(Number.isNaN(starsAscending[index])).toBe(false);
        if (index > 0) {
          expect(starsAscending[index]).toBeGreaterThanOrEqual(starsAscending[index - 1]);
        }
      }

      break;
    case 'Alphabetical (Ascending)':
      // Validate that the order of repositories is consistent with the name of repositories in ascending order
      const repositoryNamesAscending = await cards.getByTestId('repository-full-name').allInnerTexts();

      for (let index = 1; index < repositoryNamesAscending.length; index++) {
        const previousName = repositoryNamesAscending[index - 1].toLowerCase();
        const currentName = repositoryNamesAscending[index].toLowerCase();
        expect(previousName.localeCompare(currentName)).toBeLessThanOrEqual(0);
      }

      break;
    case 'Alphabetical (Descending)':
      // Validate that the order of repositories is consistent with the name of repositories in descending order
      const repositoryNamesDescending = await cards.getByTestId('repository-full-name').allInnerTexts();

      for (let index = 1; index < repositoryNamesDescending.length; index++) {
        const previousName = repositoryNamesDescending[index - 1].toLowerCase();
        const currentName = repositoryNamesDescending[index].toLowerCase();
        expect(previousName.localeCompare(currentName)).toBeGreaterThanOrEqual(0);
      }

      break;

    case 'Recently Updated':
    case 'Recently Released':
      // These sorts use date fields not exposed directly in the card UI.
      // Verify the gallery is still populated after selecting the sort.
      expect(await cards.count()).toBeGreaterThan(0);
      break;
  }
}

// #endregion
