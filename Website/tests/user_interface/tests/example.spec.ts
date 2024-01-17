import { test, expect } from '@playwright/test';

// Validate that the title of the website is "Power Platform Open-Source Hub"
// The class of the title is "hero__title"
test('Validate that the title of the website opened locally', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Power Platform Open-Source Hub/);
});