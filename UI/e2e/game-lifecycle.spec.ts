import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    // Block SSE event streams so API state from previous runs doesn't overwrite local state
    await page.route('**/api/sessions/*/events', (route) => {
      return route.abort();
    });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Storyteller Cards' })).toBeVisible();
  });

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

test.describe('Game Lifecycle - API Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    // Block SSE event streams so API state from previous runs doesn't overwrite local changes
    await page.route('**/api/sessions/*/events', (route) => route.abort());
    // Mock browser GET requests to /api/ endpoints to prevent stale API data from
    // overwriting local state. PUTs/DELETEs continue to flow for sync verification.
    // Test assertions use request.get('http://localhost:3001/...') which bypasses page routes.
    await page.route(/\/api\/sessions/, (route) => {
      if (route.request().method() === 'GET') {
        if (
          route
            .request()
            .url()
            .match(/\/api\/sessions\/?$/)
        ) {
          return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
        }
        return route.fulfill({ status: 404 });
      }
      return route.continue();
    });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Storyteller Cards' })).toBeVisible();
  });

  test('full lifecycle: session → game → characters → bluffs → night → API verification', async ({
    page,
    request,
  }) => {
    // Skip if API not running
    let apiAvailable = false;
    try {
      const health = await request.get('http://localhost:3001/health');
      apiAvailable = health.ok();
    } catch {
      // API not running
    }
    test.skip(!apiAvailable, 'API server not running — skipping lifecycle verification');
    test.setTimeout(120_000);

    // ── Step 1: Create session → verify session exists in API ──
    await createAndOpenSession(page, 'Lifecycle E2E');
    const sessionUrl = page.url();
    const sessionId = sessionUrl.match(/\/session\/([^/]+)/)?.[1] ?? '';
    expect(sessionId).toBeTruthy();

    await page.waitForTimeout(2500);

    const sessResp = await request.get(`http://localhost:3001/api/sessions/${sessionId}`);
    expect(sessResp.ok()).toBeTruthy();
    const apiSession = await sessResp.json();
    expect(apiSession.name).toBe('Lifecycle E2E');

    // Verify localStorage has the session (API may have leftover sessions, so find by name)
    const localSessions = await page.evaluate(() => {
      const raw = localStorage.getItem('storyteller-sessions');
      return raw ? JSON.parse(raw) : null;
    });
    expect(localSessions).not.toBeNull();
    const ourSession = localSessions.sessions.find(
      (s: { name: string }) => s.name === 'Lifecycle E2E',
    );
    expect(ourSession).toBeDefined();

    // ── Step 2: Import extended test script (10 characters) ──
    const scriptFilePath = path.resolve(__dirname, 'fixtures', 'test-script-extended.json');
    await page.locator('input[type="file"]').setInputFiles(scriptFilePath);
    await expect(page.getByText('10 characters')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Extended Test Script')).toBeVisible();

    // ── Step 3: Add players (need 7 for the game, default is 5) ──
    await page.getByRole('button', { name: 'Add Player' }).click();
    await expect(page.getByText('Default Players (6)')).toBeVisible();
    await page.getByRole('button', { name: 'Add Player' }).click();
    await expect(page.getByText('Default Players (7)')).toBeVisible();

    // ── Step 4: Create game ──
    await page.getByRole('button', { name: 'New Game' }).click();
    await expect(page.getByText('Games (1)')).toBeVisible({ timeout: 5000 });

    // ── Step 5: Open game → extract game ID from URL ──
    await page.getByText('Game 1').click();
    await expect(page.getByLabel('Town Square tab')).toBeVisible({ timeout: 5000 });
    const gameUrl = page.url();
    const gameIdMatch = gameUrl.match(/\/game\/([^/]+)/);
    expect(gameIdMatch).toBeTruthy();
    const gameId = gameIdMatch![1];

    // Wait for GameContext to sync game to API
    await page.waitForTimeout(2500);

    // Verify game exists in API with correct data
    const gameResp = await request.get(
      `http://localhost:3001/api/sessions/${sessionId}/games/${gameId}`,
    );
    expect(gameResp.ok()).toBeTruthy();
    const apiGame = await gameResp.json();
    expect(apiGame.players).toHaveLength(7);
    expect(apiGame.sessionId).toBe(sessionId);
    expect(apiGame.scriptId).toBeTruthy();

    // ── Step 6: Select in-play characters (7 of 10) ──
    const inPlayChars = [
      'washerwoman',
      'librarian',
      'investigator',
      'chef',
      'empath',
      'imp',
      'poisoner',
    ];
    await page.getByRole('button', { name: 'Select Characters' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    for (const charId of inPlayChars) {
      await page.getByTestId(`char-toggle-${charId}`).click();
    }
    await page.getByTestId('confirm-selection').click();

    // ── Step 7: Set demon bluffs (3 not-in-play Townsfolk) ──
    await expect(page.getByText('Select Demon Bluffs')).toBeVisible({ timeout: 5000 });

    const bluffChars = ['fortuneteller', 'undertaker', 'monk'];
    for (const charId of bluffChars) {
      await page.getByTestId(`bluff-toggle-${charId}`).click();
    }
    await page.getByTestId('confirm-bluffs').click();

    // ── Step 8: Assign characters via Randomize ──
    await expect(page.getByText('Assign Characters')).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: /Randomize/i }).click();
    await page.getByRole('button', { name: 'Confirm' }).click();

    // Wait for API sync after all setup actions
    await page.waitForTimeout(3000);

    // ── Step 9: Verify character assignments + bluffs in API ──
    const afterSetupResp = await request.get(
      `http://localhost:3001/api/sessions/${sessionId}/games/${gameId}`,
    );
    expect(afterSetupResp.ok()).toBeTruthy();
    const afterSetup = await afterSetupResp.json();

    // All players should have characters assigned
    expect(afterSetup.players.every((p: { characterId: string }) => p.characterId)).toBeTruthy();

    // Verify in-play character IDs
    expect(afterSetup.inPlayCharacterIds).toBeDefined();
    expect(afterSetup.inPlayCharacterIds).toHaveLength(7);
    for (const charId of inPlayChars) {
      expect(afterSetup.inPlayCharacterIds).toContain(charId);
    }

    // Verify demon bluffs
    expect(afterSetup.demonBluffs).toBeDefined();
    expect(afterSetup.demonBluffs).toHaveLength(3);
    for (const charId of bluffChars) {
      expect(afterSetup.demonBluffs).toContain(charId);
    }

    // ── Step 10: Verify localStorage and API match after setup ──
    const localGameAfterSetup = await page.evaluate((gId: string) => {
      const raw = localStorage.getItem(`storyteller-game-${gId}`);
      return raw ? JSON.parse(raw) : null;
    }, gameId);

    expect(localGameAfterSetup).not.toBeNull();
    expect(
      localGameAfterSetup.players.every((p: { characterId: string }) => p.characterId),
    ).toBeTruthy();
    expect(localGameAfterSetup.inPlayCharacterIds).toEqual(expect.arrayContaining(inPlayChars));
    expect(localGameAfterSetup.demonBluffs).toEqual(expect.arrayContaining(bluffChars));

    // ── Step 11: Enter Night 1 ──
    const phaseNav = page.getByRole('navigation', { name: 'Game phase selector' });
    await phaseNav.getByText('Night').click();
    await expect(page.getByTestId('night-tab-panel')).toBeVisible({ timeout: 5000 });

    // ── Step 12: Toggle a sub-action checkbox on the first card ──
    const firstCheckbox = page.getByRole('checkbox').first();
    await expect(firstCheckbox).toBeVisible({ timeout: 3000 });
    await firstCheckbox.click();

    // ── Step 13: Navigate to last card and complete Night 1 ──
    // Re-focus on the night panel for keyboard navigation (checkbox click may steal focus)
    await page.getByTestId('night-tab-panel').click();
    await page.waitForTimeout(300);

    // Use dynamic navigation — press ArrowRight until Complete Night button appears
    const completeBtn = page.getByRole('button', { name: /Complete Night/i });
    for (let i = 0; i < 20; i++) {
      if (await completeBtn.isVisible().catch(() => false)) break;
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(400);
    }

    await expect(completeBtn).toBeVisible({ timeout: 5000 });
    await completeBtn.click();

    // Should return to Day view
    await expect(page.getByTestId('night-tab-panel')).not.toBeVisible({ timeout: 5000 });

    // Wait for API sync
    await page.waitForTimeout(3000);

    // ── Step 14: Verify night history saved in API ──
    const afterNightResp = await request.get(
      `http://localhost:3001/api/sessions/${sessionId}/games/${gameId}`,
    );
    expect(afterNightResp.ok()).toBeTruthy();
    const afterNight = await afterNightResp.json();

    expect(afterNight.nightHistory).toHaveLength(1);
    expect(afterNight.nightHistory[0].dayNumber).toBe(1);
    expect(afterNight.nightHistory[0].isFirstNight).toBe(true);
    expect(afterNight.nightHistory[0].completedAt).toBeTruthy();
    expect(afterNight.nightHistory[0].subActionStates).toBeDefined();

    // Game should advance to Day 2
    expect(afterNight.currentDay).toBe(2);
    expect(afterNight.isFirstNight).toBe(false);
    expect(afterNight.currentPhase).toBe('Day');

    // ── Step 15: Verify localStorage matches API after night ──
    const localAfterNight = await page.evaluate((gId: string) => {
      const raw = localStorage.getItem(`storyteller-game-${gId}`);
      return raw ? JSON.parse(raw) : null;
    }, gameId);

    expect(localAfterNight.currentDay).toBe(afterNight.currentDay);
    expect(localAfterNight.nightHistory).toHaveLength(afterNight.nightHistory.length);
    expect(localAfterNight.isFirstNight).toBe(afterNight.isFirstNight);
    expect(localAfterNight.currentPhase).toBe(afterNight.currentPhase);

    // ── Step 16: Verify Night 2 entrance ──
    await phaseNav.getByText('Night').click();
    await expect(page.getByTestId('night-tab-panel')).toBeVisible({ timeout: 5000 });

    // Verify at least one night card is rendered with a checkbox
    await expect(page.getByRole('checkbox').first()).toBeVisible({ timeout: 5000 });
  });

  test('API state reflects game creation with script', async ({ page, request }) => {
    let apiAvailable = false;
    try {
      const health = await request.get('http://localhost:3001/health');
      apiAvailable = health.ok();
    } catch {
      // API not running
    }
    test.skip(!apiAvailable, 'API server not running — skipping API verification');

    // Create session, import script, create game
    await createAndOpenSession(page, 'Script API Test');
    const sessionId = page.url().match(/\/session\/([^/]+)/)?.[1] ?? '';

    const scriptFilePath = path.resolve(__dirname, 'fixtures', 'test-script.json');
    await page.locator('input[type="file"]').setInputFiles(scriptFilePath);
    await expect(page.getByText('7 characters')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'Add Player' }).click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: 'Add Player' }).click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: 'New Game' }).click();
    await expect(page.getByText('Games (1)')).toBeVisible({ timeout: 5000 });

    // Get script ID from localStorage
    const sessionData = await page.evaluate((sid: string) => {
      const raw = localStorage.getItem('storyteller-sessions');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed.sessions.find((s: { id: string }) => s.id === sid);
    }, sessionId);
    const scriptId: string = sessionData?.defaultScriptId ?? '';

    // Open the game (activates GameContext → triggers API sync)
    await page.getByText('Game 1').click();
    await expect(page.getByLabel('Town Square tab')).toBeVisible({ timeout: 5000 });
    const gameUrl = page.url();
    const gameId = gameUrl.match(/\/game\/([^/]+)/)?.[1] ?? '';
    expect(gameId).toBeTruthy();
    await page.waitForTimeout(2500);

    const gameResp = await request.get(
      `http://localhost:3001/api/sessions/${sessionId}/games/${gameId}`,
    );
    expect(gameResp.ok()).toBeTruthy();
    const game = await gameResp.json();
    expect(game.scriptId).toBe(scriptId);
    expect(game.players).toHaveLength(7);
    expect(game.currentDay).toBe(1);
    expect(game.isFirstNight).toBe(true);

    // Verify script was synced to API
    const scriptResp = await request.get(`http://localhost:3001/api/scripts/${scriptId}`);
    if (scriptResp.ok()) {
      const script = await scriptResp.json();
      expect(script.name).toBe('Test Script');
    }
  });

  test('localStorage and API consistency after multiple actions', async ({ page, request }) => {
    let apiAvailable = false;
    try {
      const health = await request.get('http://localhost:3001/health');
      apiAvailable = health.ok();
    } catch {
      // API not running
    }
    test.skip(!apiAvailable, 'API server not running — skipping consistency verification');

    await createAndOpenSession(page, 'Consistency Test');
    const sessionId = page.url().match(/\/session\/([^/]+)/)?.[1] ?? '';

    // Import script and create game — use explicit state waits between actions
    const scriptFilePath = path.resolve(__dirname, 'fixtures', 'test-script.json');
    await page.locator('input[type="file"]').setInputFiles(scriptFilePath);
    await expect(page.getByText('7 characters')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'Add Player' }).click();
    await expect(page.getByText('Default Players (6)')).toBeVisible({ timeout: 3000 });
    await page.getByRole('button', { name: 'Add Player' }).click();
    await expect(page.getByText('Default Players (7)')).toBeVisible({ timeout: 3000 });

    await page.getByRole('button', { name: 'New Game' }).click();
    await expect(page.getByText('Games (1)')).toBeVisible({ timeout: 5000 });

    // Open game (activates GameContext → triggers API sync)
    await page.getByText('Game 1').click();
    await expect(page.getByLabel('Town Square tab')).toBeVisible({ timeout: 5000 });
    const gameUrl = page.url();
    const gameId = gameUrl.match(/\/game\/([^/]+)/)?.[1] ?? '';
    expect(gameId).toBeTruthy();
    await page.waitForTimeout(2500);

    // Helper to compare localStorage and API game state
    async function verifyConsistency(label: string) {
      const localGame = await page.evaluate((gId: string) => {
        const raw = localStorage.getItem(`storyteller-game-${gId}`);
        return raw ? JSON.parse(raw) : null;
      }, gameId);

      const apiResp = await request.get(
        `http://localhost:3001/api/sessions/${sessionId}/games/${gameId}`,
      );
      expect(apiResp.ok(), `${label}: API should return game`).toBeTruthy();
      const apiGame = await apiResp.json();

      expect(localGame.currentDay, `${label}: currentDay`).toBe(apiGame.currentDay);
      expect(localGame.isFirstNight, `${label}: isFirstNight`).toBe(apiGame.isFirstNight);
      expect(localGame.currentPhase, `${label}: currentPhase`).toBe(apiGame.currentPhase);
      expect(localGame.players.length, `${label}: player count`).toBe(apiGame.players.length);
      expect(localGame.nightHistory.length, `${label}: nightHistory count`).toBe(
        apiGame.nightHistory.length,
      );
    }

    // Verify initial consistency (game is now open and synced)
    await verifyConsistency('after game creation');

    // Enter Night 1 directly (skip character assignment for this test)
    const phaseNav = page.getByRole('navigation', { name: 'Game phase selector' });
    await phaseNav.getByText('Night').click();
    await expect(page.getByTestId('night-tab-panel')).toBeVisible({ timeout: 5000 });

    // Navigate dynamically to last card and complete the night
    const completeBtn = page.getByRole('button', { name: /Complete Night/i });
    for (let i = 0; i < 20; i++) {
      if (await completeBtn.isVisible().catch(() => false)) break;
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(400);
    }

    if (await completeBtn.isVisible().catch(() => false)) {
      await completeBtn.click();
      await expect(page.getByTestId('night-tab-panel')).not.toBeVisible({ timeout: 5000 });
      await page.waitForTimeout(3000);
      await verifyConsistency('after night completion');
    }
  });
});
