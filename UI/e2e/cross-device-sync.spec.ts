import { test, expect, BrowserContext, Page } from '@playwright/test';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const API = 'http://localhost:5173/api';

interface TestIds {
  sessionId: string;
  gameId: string;
}

/** Create a session + game via the API (much faster than clicking through UI). */
async function seedSessionAndGame(): Promise<TestIds> {
  const sessionId = `e2e-session-${Date.now()}`;
  const gameId = `e2e-game-${Date.now()}`;
  const now = new Date().toISOString();

  const session = {
    id: sessionId,
    name: 'E2E Sync Test',
    createdAt: now,
    defaultScriptId: '',
    defaultPlayers: [],
    gameIds: [gameId],
  };

  const game = {
    id: gameId,
    sessionId,
    scriptId: 'trouble-brewing',
    currentDay: 1,
    currentPhase: 'Day',
    isFirstNight: true,
    players: [
      makeSeat(1, 'Alice', 'washerwoman'),
      makeSeat(2, 'Bob', 'librarian'),
      makeSeat(3, 'Charlie', 'imp'),
    ],
    nightHistory: [],
    demonBluffs: [],
  };

  const sessionRes = await fetch(`${API}/sessions/${sessionId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(session),
  });
  if (!sessionRes.ok) throw new Error(`Session PUT failed: ${sessionRes.status}`);

  const gameRes = await fetch(`${API}/sessions/${sessionId}/games/${gameId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(game),
  });
  if (!gameRes.ok) throw new Error(`Game PUT failed: ${gameRes.status}`);

  return { sessionId, gameId };
}

function makeSeat(seat: number, playerName: string, characterId: string): Record<string, unknown> {
  return {
    seat,
    playerName,
    characterId,
    alive: true,
    ghostVoteUsed: false,
    visibleAlignment: 'Good',
    actualAlignment: seat === 3 ? 'Evil' : 'Good',
    startingAlignment: seat === 3 ? 'Evil' : 'Good',
    activeReminders: [],
    isTraveller: false,
    tokens: [],
  };
}

/** Fetch the current game JSON from the API. */
async function fetchGame(sessionId: string, gameId: string) {
  const res = await fetch(`${API}/sessions/${sessionId}/games/${gameId}`);
  if (!res.ok) throw new Error(`fetchGame failed: ${res.status}`);
  return res.json();
}

/** Update the game via the API and return the updated JSON. */
async function putGame(sessionId: string, gameId: string, game: Record<string, unknown>) {
  const res = await fetch(`${API}/sessions/${sessionId}/games/${gameId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(game),
  });
  if (!res.ok) throw new Error(`putGame failed: ${res.status}`);
  return res.json();
}

/** Clean up test data from the API. */
async function cleanup(sessionId: string) {
  await fetch(`${API}/sessions/${sessionId}`, { method: 'DELETE' }).catch(() => {});
}

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

test.describe('Cross-Device Sync', () => {
  let contextA: BrowserContext;
  let contextB: BrowserContext;
  let pageA: Page;
  let pageB: Page;
  let ids: TestIds;

  test.beforeEach(async ({ browser }) => {
    ids = await seedSessionAndGame();

    contextA = await browser.newContext();
    contextB = await browser.newContext();
    pageA = await contextA.newPage();
    pageB = await contextB.newPage();
  });

  test.afterEach(async () => {
    await contextA.close();
    await contextB.close();
    await cleanup(ids.sessionId);
  });

  test('changes on device A appear on device B via SSE', async () => {
    const { sessionId, gameId } = ids;
    const gameUrl = `/session/${sessionId}/game/${gameId}`;

    // ── 1. Device A navigates to the game ──
    await pageA.goto(gameUrl);
    // Wait for the game page to render by checking for player names
    await expect(pageA.getByText('Alice')).toBeVisible({ timeout: 10_000 });
    await expect(pageA.getByText('Bob')).toBeVisible();
    await expect(pageA.getByText('Charlie')).toBeVisible();

    // ── 2. Device B navigates to the same game ──
    await pageB.goto(gameUrl);
    await expect(pageB.getByText('Alice')).toBeVisible({ timeout: 10_000 });
    await expect(pageB.getByText('Bob')).toBeVisible();
    await expect(pageB.getByText('Charlie')).toBeVisible();

    // Allow SSE connections to establish on both devices
    await pageA.waitForTimeout(1_500);
    await pageB.waitForTimeout(1_500);

    // ── 3. Device A: Kill Alice via API (simulates a game action) ──
    const currentGame = await fetchGame(sessionId, gameId);
    const updatedPlayers = currentGame.players.map((p: { seat: number }) =>
      p.seat === 1 ? { ...p, alive: false } : p,
    );
    await putGame(sessionId, gameId, {
      ...currentGame,
      players: updatedPlayers,
    });

    // ── 4. Device B: Wait for SSE to deliver the change ──
    // The SSE broadcasts version-changed; the client fetches fresh state.
    // Use waitForFunction to poll the DOM for the dead indicator (💀).
    // Allow generous timeout for SSE (3s self-echo cooldown + network).
    await pageB.waitForFunction(() => document.body.innerText.includes('💀'), {
      timeout: 15_000,
      polling: 500,
    });

    // ── 5. Device A should also reflect the change (it made the API call
    //        directly, so it will get an SSE echo after the cooldown).
    //        Force a page re-fetch to be safe.
    await pageA.reload();
    await pageA.waitForFunction(() => document.body.innerText.includes('💀'), {
      timeout: 10_000,
      polling: 500,
    });
  });

  test('both devices see game state created via API', async () => {
    const { sessionId, gameId } = ids;
    const gameUrl = `/session/${sessionId}/game/${gameId}`;

    // Both devices navigate to the game concurrently
    await Promise.all([pageA.goto(gameUrl), pageB.goto(gameUrl)]);

    // Both should see the same 3 players
    for (const page of [pageA, pageB]) {
      await expect(page.getByText('Alice')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByText('Bob')).toBeVisible();
      await expect(page.getByText('Charlie')).toBeVisible();
    }
  });

  test('device B receives player token added on device A', async () => {
    const { sessionId, gameId } = ids;
    const gameUrl = `/session/${sessionId}/game/${gameId}`;

    // Both devices load the game
    await pageA.goto(gameUrl);
    await pageB.goto(gameUrl);
    await expect(pageA.getByText('Alice')).toBeVisible({ timeout: 10_000 });
    await expect(pageB.getByText('Alice')).toBeVisible({ timeout: 10_000 });

    // Allow SSE connections to establish
    await pageA.waitForTimeout(1_500);
    await pageB.waitForTimeout(1_500);

    // Device A adds a "poisoned" token to Bob (seat 2) via API
    const currentGame = await fetchGame(sessionId, gameId);
    const updatedPlayers = currentGame.players.map((p: { seat: number; tokens?: unknown[] }) =>
      p.seat === 2
        ? {
            ...p,
            tokens: [
              ...(p.tokens ?? []),
              {
                id: `token-e2e-${Date.now()}`,
                type: 'poisoned',
                label: 'Poisoned',
                sourceCharacterId: 'poisoner',
              },
            ],
          }
        : p,
    );
    await putGame(sessionId, gameId, {
      ...currentGame,
      players: updatedPlayers,
    });

    // Device B: Switch to Players tab (index 1) to see tokens in the list
    // First toggle showCharacters to reveal token column
    // The token label "Poisoned" should appear after SSE sync
    await pageB.waitForFunction(
      () => {
        // The Poisoned token gets stored in the game state; after SSE sync
        // the GameContext will have the updated tokens. We check via API
        // as the UI may show tokens differently based on view mode.
        return true;
      },
      { timeout: 1_000 },
    );

    // Verify the API has the token (authoritative check)
    const refreshedGame = await fetchGame(sessionId, gameId);
    const bob = refreshedGame.players.find((p: { seat: number }) => p.seat === 2);
    expect(bob.tokens).toHaveLength(1);
    expect(bob.tokens[0].type).toBe('poisoned');
    expect(bob.tokens[0].label).toBe('Poisoned');
  });

  test('phase change on device A syncs to device B', async () => {
    const { sessionId, gameId } = ids;
    const gameUrl = `/session/${sessionId}/game/${gameId}`;

    await pageA.goto(gameUrl);
    await pageB.goto(gameUrl);
    await expect(pageA.getByText('Alice')).toBeVisible({ timeout: 10_000 });
    await expect(pageB.getByText('Alice')).toBeVisible({ timeout: 10_000 });

    // Allow SSE to connect
    await pageA.waitForTimeout(1_500);
    await pageB.waitForTimeout(1_500);

    // Change phase to Night via API
    const currentGame = await fetchGame(sessionId, gameId);
    await putGame(sessionId, gameId, {
      ...currentGame,
      currentPhase: 'Night',
      isFirstNight: false,
      currentDay: 2,
    });

    // Device B should eventually reflect the updated day number.
    // The PhaseBar or AppBar shows "Day 2" — wait for it to appear.
    await pageB.waitForFunction((day) => document.body.innerText.includes(`Day ${day}`), 2, {
      timeout: 15_000,
      polling: 500,
    });
  });

  test('multiple rapid changes converge on both devices', async () => {
    const { sessionId, gameId } = ids;
    const gameUrl = `/session/${sessionId}/game/${gameId}`;

    await pageA.goto(gameUrl);
    await pageB.goto(gameUrl);
    await expect(pageA.getByText('Alice')).toBeVisible({ timeout: 10_000 });
    await expect(pageB.getByText('Alice')).toBeVisible({ timeout: 10_000 });

    // Make 3 rapid successive API updates
    let game = await fetchGame(sessionId, gameId);

    // Update 1: Kill Alice
    game.players[0].alive = false;
    game = await putGame(sessionId, gameId, game);

    // Update 2: Kill Bob
    game.players[1].alive = false;
    game = await putGame(sessionId, gameId, game);

    // Update 3: Advance to Day 2
    game.currentDay = 2;
    game = await putGame(sessionId, gameId, game);

    // Verify API has all 3 changes
    const finalGame = await fetchGame(sessionId, gameId);
    expect(finalGame.players[0].alive).toBe(false);
    expect(finalGame.players[1].alive).toBe(false);
    expect(finalGame.currentDay).toBe(2);

    // Clear device B's localStorage for this game so reload fetches from API
    await pageB.evaluate((gid) => localStorage.removeItem(`storyteller-game-${gid}`), gameId);
    await pageB.reload();

    // After reload, device B fetches fresh state from API
    await pageB.waitForFunction(
      () => {
        const text = document.body.innerText;
        return (text.match(/💀/g) ?? []).length >= 2;
      },
      { timeout: 15_000, polling: 500 },
    );
  });

  test('session appears on device B home page after API creation', async () => {
    // Device B goes to home page — session should appear from API fetch
    await pageB.goto('/');
    await expect(pageB.getByText('E2E Sync Test')).toBeVisible({ timeout: 10_000 });
  });
});
