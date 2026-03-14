import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Game Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before page scripts run, and block API session fetch
    // so remote data doesn't pollute local-only tests.
    await page.addInitScript(() => localStorage.clear());
    await page.route('**/api/sessions', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      }
      return route.continue();
    });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Storyteller Cards' })).toBeVisible();
  });

  /** Helper: create a session from the home page and open it in session setup. */
  async function createAndOpenSession(page: import('@playwright/test').Page, name: string) {
    const createBtn = page.getByRole('button', { name: /Create Session/i });
    // On empty state: big button; on non-empty: FAB with aria-label
    if (await createBtn.isVisible().catch(() => false)) {
      await createBtn.click();
    } else {
      await page.getByLabel('create session').click();
    }
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByLabel('Session Name').fill(name);
    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Session card appears on home page — click its name to navigate
    await page.getByText(name).first().click();
    await expect(page.getByRole('heading', { name: 'Session Setup' })).toBeVisible();
  }

  test('create session → import script → add players → create game → verify game view', async ({
    page,
  }) => {
    // ── Step 1: Home page loads with empty state ──
    await expect(page.getByText('No sessions yet')).toBeVisible();

    // ── Step 2: Create a new session and open it ──
    await createAndOpenSession(page, 'E2E Test Session');
    await expect(page.url()).toMatch(/\/session\/.+/);
    await expect(page.getByLabel('Session Name')).toHaveValue('E2E Test Session');

    // ── Step 3: Import test script ──
    const fixtureFilePath = path.resolve(__dirname, 'fixtures', 'test-script.json');
    await page.locator('input[type="file"]').setInputFiles(fixtureFilePath);

    await expect(page.getByText('7 characters')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Test Script')).toBeVisible();

    // ── Step 4: Add players (need 7 for the 7-char script; default is 5) ──
    await expect(page.getByText('Default Players (5)')).toBeVisible();

    await page.getByRole('button', { name: 'Add Player' }).click();
    await expect(page.getByText('Default Players (6)')).toBeVisible();

    await page.getByRole('button', { name: 'Add Player' }).click();
    await expect(page.getByText('Default Players (7)')).toBeVisible();

    // ── Step 5: Create a new game ──
    await expect(page.getByText('Games (0)')).toBeVisible();
    await page.getByRole('button', { name: 'New Game' }).click();
    await expect(page.getByText('Games (1)')).toBeVisible();
    await expect(page.getByText('Game 1')).toBeVisible();

    // ── Step 6: Open the game ──
    await page.getByText('Game 1').click();
    await expect(page.url()).toMatch(/\/session\/.+\/game\/.+/);

    // ── Step 7: Verify game view loads with correct tabs ──
    await expect(page.getByLabel('Town Square tab')).toBeVisible();
    await expect(page.getByLabel('Players tab')).toBeVisible();
    await expect(page.getByLabel('Script reference tab')).toBeVisible();
    await expect(page.getByLabel('Night Order tab')).toBeVisible();

    await expect(page.getByText('E2E Test Session')).toBeVisible();

    // ── Step 8: Verify player count in the game ──
    await page.getByLabel('Players tab').click();

    for (let i = 1; i <= 7; i++) {
      await expect(page.getByText(`Player ${i}`)).toBeVisible();
    }

    // ── Step 9: Navigate back and verify state ──
    await page.getByRole('button', { name: 'back to session' }).click();
    await expect(page.getByRole('heading', { name: 'Session Setup' })).toBeVisible();
    await expect(page.getByText('Games (1)')).toBeVisible();
    await expect(page.getByText('Game 1')).toBeVisible();

    // ── Step 10: Verify data persisted to localStorage ──
    const sessionData = await page.evaluate(() => {
      const raw = localStorage.getItem('storyteller-sessions');
      return raw ? JSON.parse(raw) : null;
    });

    expect(sessionData).not.toBeNull();
    expect(sessionData.sessions).toHaveLength(1);
    expect(sessionData.sessions[0].name).toBe('E2E Test Session');
    expect(sessionData.sessions[0].gameIds).toHaveLength(1);
    expect(sessionData.sessions[0].defaultPlayers).toHaveLength(7);

    const gameId = sessionData.sessions[0].gameIds[0];
    const gameData = await page.evaluate((gId: string) => {
      const raw = localStorage.getItem(`storyteller-game-${gId}`);
      return raw ? JSON.parse(raw) : null;
    }, gameId);

    expect(gameData).not.toBeNull();
    expect(gameData.players).toHaveLength(7);
    expect(gameData.currentDay).toBe(1);
  });

  test('verify API sync persists session data', async ({ page, request }) => {
    // This test needs real API access — remove the route intercept
    await page.unrouteAll({ behavior: 'ignoreErrors' });

    let apiAvailable = false;
    try {
      const health = await request.get('http://localhost:3001/health');
      apiAvailable = health.ok();
    } catch {
      // API not running
    }
    test.skip(!apiAvailable, 'API server not running — skipping sync verification');

    // Reload without route interception
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Storyteller Cards' })).toBeVisible();

    await createAndOpenSession(page, 'API Sync Test');

    // Give time for API sync
    await page.waitForTimeout(2000);

    const apiSessions = await request.get('http://localhost:3001/api/sessions');
    expect(apiSessions.ok()).toBeTruthy();

    const sessions = await apiSessions.json();
    const syncedSession = sessions.find((s: { name: string }) => s.name === 'API Sync Test');
    expect(syncedSession).toBeDefined();
  });

  test('session appears on home page after creation', async ({ page }) => {
    await expect(page.getByText('No sessions yet')).toBeVisible();

    await page.getByRole('button', { name: 'Create Session' }).click();
    await page.getByLabel('Session Name').fill('Home Page Test');
    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Session card visible on home page with correct info
    await expect(page.getByText('Home Page Test').first()).toBeVisible();
    await expect(page.getByText('0 games')).toBeVisible();
  });

  test('delete game from session setup', async ({ page }) => {
    await createAndOpenSession(page, 'Delete Game Test');

    await page.getByRole('button', { name: 'New Game' }).click();
    await expect(page.getByText('Games (1)')).toBeVisible();

    // Delete the game
    await page.getByRole('button', { name: 'delete game 1' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByTestId('confirm-delete-game').click();

    await expect(page.getByText('Games (0)')).toBeVisible();
    await expect(page.getByText('No games yet')).toBeVisible();
  });
});
