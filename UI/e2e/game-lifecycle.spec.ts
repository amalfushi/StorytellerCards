import { test, expect } from '@playwright/test';
import type { APIRequestContext, Page } from '@playwright/test';
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

async function addRosterPlayer(page: Page, name: string, expectedCount: number) {
  await page.getByLabel('New player name').fill(name);
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByText(`Player Roster (${expectedCount})`)).toBeVisible();
  const defaultLineupSwitch = page.getByRole('switch', {
    name: `Include ${name} in new games`,
  });
  await expect(defaultLineupSwitch).toBeChecked();
}

async function assignSeat(page: Page, seatNumber: number, playerName: string) {
  const seat = page.getByLabel(`assign player to seat ${seatNumber}`);
  await seat.click();
  await page.getByRole('option', { name: playerName }).click();
  await expect(seat).toContainText(playerName);
}

async function saveTownSquareDraft(page: Page) {
  await page.getByRole('button', { name: /review & save/i }).click();
  await page.getByRole('button', { name: /save changes/i }).click();
  await expect(page.getByTestId('town-square-edit-mode')).not.toBeVisible();
}

async function readSession(page: Page, sessionId: string) {
  return page.evaluate((id) => {
    const raw = localStorage.getItem('storyteller-sessions');
    if (!raw) return null;
    const state = JSON.parse(raw);
    return state.sessions.find((session: { id: string }) => session.id === id) ?? null;
  }, sessionId);
}

async function readGame(page: Page, gameId: string) {
  return page.evaluate((id) => {
    const raw = localStorage.getItem(`storyteller-game-${id}`);
    return raw ? JSON.parse(raw) : null;
  }, gameId);
}

async function readApiGame(request: APIRequestContext, sessionId: string, gameId: string) {
  const response = await request.get(
    `http://localhost:3001/api/sessions/${sessionId}/games/${gameId}`,
  );
  return response.ok() ? response.json() : null;
}

function occupiedSeatOrder(
  game: {
    slots: Array<{ kind: string; playerId?: string | null }>;
  } | null,
): Array<string | null> {
  if (!game) return [];
  return game.slots.filter((slot) => slot.kind === 'seat').map((slot) => slot.playerId ?? null);
}

async function expectApiSeatOrder(
  request: APIRequestContext,
  sessionId: string,
  gameId: string,
  expected: Array<string | null>,
) {
  await expect
    .poll(
      async () => {
        const response = await request.get(
          `http://localhost:3001/api/sessions/${sessionId}/games/${gameId}`,
        );
        if (!response.ok()) return null;
        return occupiedSeatOrder(await response.json());
      },
      { timeout: 10_000 },
    )
    .toEqual(expected);
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
    await expect(page.getByText('Player Roster (5)')).toBeVisible();
    await addRosterPlayer(page, 'Player 6', 6);
    await addRosterPlayer(page, 'Player 7', 7);
    await page.getByRole('button', { name: /add seats for all players/i }).click();
    await assignSeat(page, 6, 'Player 6');
    await assignSeat(page, 7, 'Player 7');

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
    expect(sessionData.sessions[0].players).toHaveLength(7);

    const gameId = sessionData.sessions[0].gameIds[0];
    const gameData = await page.evaluate((gId: string) => {
      const raw = localStorage.getItem(`storyteller-game-${gId}`);
      return raw ? JSON.parse(raw) : null;
    }, gameId);

    expect(gameData).not.toBeNull();
    expect(gameData.participants).toHaveLength(7);
    expect(gameData.slots.filter((slot: { kind: string }) => slot.kind === 'seat')).toHaveLength(7);
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

  test('Town Square edit draft fixes invalid seating before the first Night', async ({ page }) => {
    await createAndOpenSession(page, 'Town Square Edit Test');
    await page.getByRole('button', { name: 'New Game' }).click();
    await page.getByText('Game 1').click();
    await expect(page.getByLabel('Town Square tab')).toBeVisible();

    await page.getByRole('button', { name: /edit seating/i }).click();
    await expect(page.getByText(/draft changes are not live until saved/i)).toBeVisible();

    await page.getByLabel('assign player to seat 1').click();
    await page.getByRole('option', { name: '(empty)' }).click();
    await page.getByRole('button', { name: /review & save/i }).click();
    await page.getByRole('button', { name: /save draft/i }).click();

    const phaseNav = page.getByRole('navigation', { name: 'Game phase selector' });
    await phaseNav.getByText('Night').click();
    await expect(page.getByTestId('town-square-edit-mode')).toBeVisible();
    await expect(page.getByText(/every game participant must be seated/i)).toBeVisible();

    await page.getByLabel('assign player to seat 1').click();
    await page.getByRole('option', { name: 'Player 1' }).click();
    await page.getByRole('button', { name: /review & save/i }).click();
    await page.getByRole('button', { name: /save changes/i }).click();

    await phaseNav.getByText('Night').click();
    await expect(page.getByRole('dialog')).toContainText('Confirm Game 1 seating');
    await page.getByRole('button', { name: /confirm & start night/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    const startedGame = await page.evaluate(() => {
      const sessions = JSON.parse(localStorage.getItem('storyteller-sessions') ?? '{}');
      const gameId = sessions.sessions?.[0]?.gameIds?.[0];
      return gameId
        ? JSON.parse(localStorage.getItem(`storyteller-game-${gameId}`) ?? 'null')
        : null;
    });
    expect(startedGame.seatingConfirmed).toBe(true);
    expect(startedGame.currentPhase).toBe('Night');
  });

  test('drafts through private handoff, mulligan, reload, and final assignment', async ({
    page,
  }) => {
    test.setTimeout(90_000);

    await createAndOpenSession(page, 'Character Draft Test');
    const fixtureFilePath = path.resolve(__dirname, 'fixtures', 'test-script.json');
    await page.locator('input[type="file"]').setInputFiles(fixtureFilePath);
    await expect(page.getByText('Test Script')).toBeVisible();

    await addRosterPlayer(page, 'Player 6', 6);
    await addRosterPlayer(page, 'Player 7', 7);
    await page.getByRole('button', { name: /add seats for all players/i }).click();
    await assignSeat(page, 6, 'Player 6');
    await assignSeat(page, 7, 'Player 7');

    await page.getByRole('button', { name: 'New Game' }).click();
    await page.getByText('Game 1', { exact: true }).click();
    await page.getByRole('button', { name: 'Select Characters', exact: true }).click();
    await page.getByRole('button', { name: 'Start character draft' }).click();
    await page.getByRole('button', { name: 'Generate draft' }).click();

    const firstPlayerBoard = page.getByTestId('game-draft-current-player');
    const firstPlayerText = await firstPlayerBoard.textContent();
    await expect(firstPlayerBoard).toContainText('Next:');

    await page.getByRole('button', { name: /Hand device to/ }).click();
    await page.getByTestId('draft-roll-options').click();
    await page.getByTestId('draft-mulligan').click();
    await page.getByTestId('confirm-draft-mulligan').click();
    await page.getByTestId('roll-draft-mulligan').click();
    await expect(page.getByTestId('game-draft-current-player')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('game-draft-current-player')).not.toHaveText(
      firstPlayerText ?? '',
    );

    await page.reload();
    await page.getByRole('button', { name: 'Select Characters', exact: true }).click();
    await page.getByRole('button', { name: 'Resume character draft' }).click();
    await expect(page.getByTestId('game-draft-current-player')).toBeVisible();

    for (let remainingDrafts = 0; remainingDrafts < 7; remainingDrafts += 1) {
      const handoffButton = page.getByRole('button', { name: /Hand device to/ });
      if (!(await handoffButton.isVisible())) break;
      await handoffButton.click();
      await page.getByTestId('draft-roll-options').click();
      await page.getByTestId('draft-choice-0').click();
    }

    await expect(page.getByText('Select Demon Bluffs')).toBeVisible();

    const gameData = await page.evaluate(() => {
      const gameKey = Object.keys(localStorage).find((key) => key.startsWith('storyteller-game-'));
      return gameKey ? JSON.parse(localStorage.getItem(gameKey) ?? 'null') : null;
    });
    expect(gameData).not.toBeNull();
    expect(gameData.characterDraft.status).toBe('complete');
    expect(gameData.characterDraft.entries).toHaveLength(7);
    expect(
      gameData.participants.every(
        (participant: { playerId: string }) =>
          gameData.playerState[participant.playerId]?.characterId,
      ),
    ).toBe(true);
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

  test('Option 3 seating flows preserve template, game scope, refresh, and Traveller state', async ({
    page,
    request,
  }, testInfo) => {
    test.setTimeout(180_000);

    const health = await request.get('http://localhost:3001/health');
    test.skip(!health.ok(), 'API server not running — skipping seating integration verification');

    await page.unrouteAll({ behavior: 'ignoreErrors' });
    await page.route('**/api/sessions/*/events', (route) => route.abort());
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');

    const sessionName = `Option 3 Seating ${Date.now()}`;
    let sessionId = '';

    try {
      // Create a session and deliberately change the session seating template.
      await createAndOpenSession(page, sessionName);
      sessionId = page.url().match(/\/session\/([^/]+)/)?.[1] ?? '';
      expect(sessionId).toBeTruthy();

      const initialSession = await readSession(page, sessionId);
      const playerIds = Object.fromEntries(
        initialSession.players.map((player: { id: string; name: string }) => [
          player.name,
          player.id,
        ]),
      ) as Record<string, string>;

      await assignSeat(page, 1, '(empty)');
      await assignSeat(page, 2, '(empty)');
      await assignSeat(page, 1, 'Player 2');
      await assignSeat(page, 2, 'Player 1');
      const sessionArrangement = [
        playerIds['Player 2'],
        playerIds['Player 1'],
        playerIds['Player 3'],
        playerIds['Player 4'],
        playerIds['Player 5'],
      ];
      await expect
        .poll(async () =>
          occupiedSeatOrder(await readSession(page, sessionId).then((session) => session.template)),
        )
        .toEqual(sessionArrangement);

      // Game 1 inherits the session template. Editing it with the default scope
      // updates the template that the next game will inherit.
      await page.getByRole('button', { name: 'New Game' }).click();
      await page.getByText('Game 1', { exact: true }).click();
      const game1Id = page.url().match(/\/game\/([^/]+)/)?.[1] ?? '';
      expect(game1Id).toBeTruthy();
      expect(occupiedSeatOrder(await readGame(page, game1Id))).toEqual(sessionArrangement);

      await page.getByRole('button', { name: /edit seating/i }).click();
      await assignSeat(page, 2, '(empty)');
      await assignSeat(page, 3, '(empty)');
      await assignSeat(page, 2, 'Player 3');
      await assignSeat(page, 3, 'Player 1');
      await saveTownSquareDraft(page);

      const game1Arrangement = [
        playerIds['Player 2'],
        playerIds['Player 3'],
        playerIds['Player 1'],
        playerIds['Player 4'],
        playerIds['Player 5'],
      ];
      expect(occupiedSeatOrder(await readGame(page, game1Id))).toEqual(game1Arrangement);
      await expect
        .poll(async () =>
          occupiedSeatOrder(await readSession(page, sessionId).then((session) => session.template)),
        )
        .toEqual(game1Arrangement);
      await expectApiSeatOrder(request, sessionId, game1Id, game1Arrangement);

      await page.getByRole('button', { name: 'back to session' }).click();
      await page.getByRole('button', { name: 'New Game' }).click();
      await expect(page.getByText('Game 2', { exact: true })).toBeVisible();
      await page.getByText('Game 2', { exact: true }).click();
      const game2Id = page.url().match(/\/game\/([^/]+)/)?.[1] ?? '';
      expect(game2Id).toBeTruthy();
      await expect
        .poll(async () => occupiedSeatOrder(await readGame(page, game2Id)))
        .toEqual(game1Arrangement);
      await page.getByRole('button', { name: 'back to session' }).click();

      // A session-level edit applied to all games replaces both unstarted layouts.
      await assignSeat(page, 1, '(empty)');
      await assignSeat(page, 2, '(empty)');
      await assignSeat(page, 1, 'Player 3');
      await assignSeat(page, 2, 'Player 2');
      const appliedArrangement = [
        playerIds['Player 3'],
        playerIds['Player 2'],
        playerIds['Player 1'],
        playerIds['Player 4'],
        playerIds['Player 5'],
      ];
      await page.getByRole('button', { name: /apply template to all games/i }).click();
      await expect
        .poll(async () => ({
          game1: occupiedSeatOrder(await readGame(page, game1Id)),
          game2: occupiedSeatOrder(await readGame(page, game2Id)),
        }))
        .toEqual({
          game1: appliedArrangement,
          game2: appliedArrangement,
        });
      await expectApiSeatOrder(request, sessionId, game1Id, appliedArrangement);
      await expectApiSeatOrder(request, sessionId, game2Id, appliedArrangement);

      // Game 2 can diverge without changing the session template or Game 1.
      await page.getByText('Game 2', { exact: true }).click();
      await page.getByRole('button', { name: /edit seating/i }).click();
      const updateTemplate = page.getByRole('switch', { name: /update session template/i });
      if (await updateTemplate.isChecked()) await updateTemplate.click();
      const updateOtherGames = page.getByRole('switch', { name: /update other games/i });
      if ((await updateOtherGames.isEnabled()) && (await updateOtherGames.isChecked())) {
        await updateOtherGames.click();
      }
      await assignSeat(page, 1, '(empty)');
      await assignSeat(page, 3, '(empty)');
      await assignSeat(page, 1, 'Player 1');
      await assignSeat(page, 3, 'Player 3');
      await saveTownSquareDraft(page);

      const game2Arrangement = [
        playerIds['Player 1'],
        playerIds['Player 2'],
        playerIds['Player 3'],
        playerIds['Player 4'],
        playerIds['Player 5'],
      ];
      await expect
        .poll(async () => ({
          game1: occupiedSeatOrder(await readGame(page, game1Id)),
          game2: occupiedSeatOrder(await readGame(page, game2Id)),
          template: occupiedSeatOrder(
            await readSession(page, sessionId).then((session) => session.template),
          ),
        }))
        .toEqual({
          game1: appliedArrangement,
          game2: game2Arrangement,
          template: appliedArrangement,
        });
      await expectApiSeatOrder(request, sessionId, game2Id, game2Arrangement);

      // Remove the local game snapshot so reload must restore the expected state
      // through the browser → API → Go persistence path.
      await page.evaluate((id) => localStorage.removeItem(`storyteller-game-${id}`), game2Id);
      await page.reload();
      await expect(page.getByLabel('Town Square tab')).toBeVisible({ timeout: 10_000 });
      await expect
        .poll(async () => occupiedSeatOrder(await readGame(page, game2Id)))
        .toEqual(game2Arrangement);

      // Add a roster player after both games exist, then use the explicit Option 3
      // action to add and mark that player as a Traveller in Game 2 only.
      await page.getByRole('button', { name: 'back to session' }).click();
      await addRosterPlayer(page, 'Traveller Terry', 6);
      await expect
        .poll(async () => {
          const session = await readSession(page, sessionId);
          return session?.players.some(
            (player: { name: string }) => player.name === 'Traveller Terry',
          );
        })
        .toBe(true);
      const sessionWithTraveller = await readSession(page, sessionId);
      const travellerId = sessionWithTraveller.players.find(
        (player: { name: string }) => player.name === 'Traveller Terry',
      ).id as string;

      await page.getByText('Game 2', { exact: true }).click();
      await page.getByRole('button', { name: /edit seating/i }).click();
      await page.getByRole('button', { name: /add traveller terry to game/i }).click();
      await page.getByTestId(`edit-player-${travellerId}`).click();
      await page.getByRole('switch', { name: 'Traveller', exact: true }).click({
        timeout: 5_000,
      });
      await page.getByRole('button', { name: 'Done', exact: true }).click();
      await saveTownSquareDraft(page);

      await expect
        .poll(async () => {
          const game1 = await readApiGame(request, sessionId, game1Id);
          const game2 = await readGame(page, game2Id);
          return {
            game1HasTraveller:
              game1?.participants.some(
                (participant: { playerId: string }) => participant.playerId === travellerId,
              ) ?? null,
            game2Participant:
              game2?.participants.find(
                (participant: { playerId: string }) => participant.playerId === travellerId,
              ) ?? null,
            game2HasTravellerSeat: occupiedSeatOrder(game2).includes(travellerId),
          };
        })
        .toEqual({
          game1HasTraveller: false,
          game2Participant: { playerId: travellerId, isTraveller: true },
          game2HasTravellerSeat: true,
        });

      await expect
        .poll(
          async () => {
            const response = await request.get(
              `http://localhost:3001/api/sessions/${sessionId}/games/${game2Id}`,
            );
            if (!response.ok()) return null;
            const game = await response.json();
            return game.participants.find(
              (participant: { playerId: string }) => participant.playerId === travellerId,
            );
          },
          { timeout: 10_000 },
        )
        .toEqual({ playerId: travellerId, isTraveller: true });

      await page.evaluate((id) => localStorage.removeItem(`storyteller-game-${id}`), game2Id);
      await page.reload();
      await expect(page.getByText('Traveller Terry', { exact: true }).first()).toBeVisible({
        timeout: 10_000,
      });
      const restoredGame2 = await readGame(page, game2Id);
      expect(restoredGame2.participants).toContainEqual({
        playerId: travellerId,
        isTraveller: true,
      });
    } finally {
      if (sessionId && testInfo.status !== 'timedOut') {
        const response = await request.delete(`http://localhost:3001/api/sessions/${sessionId}`);
        expect(response.ok()).toBeTruthy();
      }
    }
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
    await addRosterPlayer(page, 'Player 6', 6);
    await addRosterPlayer(page, 'Player 7', 7);
    await page.getByRole('button', { name: /add seats for all players/i }).click();
    await assignSeat(page, 6, 'Player 6');
    await assignSeat(page, 7, 'Player 7');

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
    expect(apiGame.participants).toHaveLength(7);
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
    await page.getByRole('button', { name: 'Select Characters', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Manual selection and assignment' }).click();

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
    await expect(page.getByRole('dialog', { name: 'Assign Characters' })).toBeVisible({
      timeout: 5000,
    });
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
    expect(
      afterSetup.participants.every(
        (participant: { playerId: string }) =>
          afterSetup.playerState[participant.playerId]?.characterId,
      ),
    ).toBeTruthy();

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
      localGameAfterSetup.participants.every(
        (participant: { playerId: string }) =>
          localGameAfterSetup.playerState[participant.playerId]?.characterId,
      ),
    ).toBeTruthy();
    expect(localGameAfterSetup.inPlayCharacterIds).toEqual(expect.arrayContaining(inPlayChars));
    expect(localGameAfterSetup.demonBluffs).toEqual(expect.arrayContaining(bluffChars));

    // ── Step 11: Enter Night 1 ──
    const phaseNav = page.getByRole('navigation', { name: 'Game phase selector' });
    await phaseNav.getByText('Night').click();
    await page.getByRole('button', { name: /confirm & start night/i }).click();
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

    await addRosterPlayer(page, 'Player 6', 6);
    await addRosterPlayer(page, 'Player 7', 7);
    await page.getByRole('button', { name: /add seats for all players/i }).click();
    await assignSeat(page, 6, 'Player 6');
    await assignSeat(page, 7, 'Player 7');
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
    expect(game.participants).toHaveLength(7);
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

    await addRosterPlayer(page, 'Player 6', 6);
    await addRosterPlayer(page, 'Player 7', 7);
    await page.getByRole('button', { name: /add seats for all players/i }).click();
    await assignSeat(page, 6, 'Player 6');
    await assignSeat(page, 7, 'Player 7');

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
      expect(localGame.participants.length, `${label}: participant count`).toBe(
        apiGame.participants.length,
      );
      expect(localGame.nightHistory.length, `${label}: nightHistory count`).toBe(
        apiGame.nightHistory.length,
      );
    }

    // Verify initial consistency (game is now open and synced)
    await verifyConsistency('after game creation');

    // Enter Night 1 directly (skip character assignment for this test)
    const phaseNav = page.getByRole('navigation', { name: 'Game phase selector' });
    await phaseNav.getByText('Night').click();
    await page.getByRole('button', { name: /confirm & start night/i }).click();
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
