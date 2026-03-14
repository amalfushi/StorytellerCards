import { test, expect } from '@playwright/test';

test('placeholder — game lifecycle', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Storyteller/);
});
