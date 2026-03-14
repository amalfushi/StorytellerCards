import { test, expect } from '@playwright/test';

test('placeholder — cross-device sync', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/');
  await expect(page).toHaveTitle(/Storyteller/);
  await context.close();
});
