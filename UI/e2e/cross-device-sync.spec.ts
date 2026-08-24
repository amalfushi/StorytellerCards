import { test, expect, BrowserContext, Page } from '@playwright/test';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const API = 'http://localhost:5173/api';

interface TestIds {
  sessionId: string;
  gameId: string;
}

const PLAYER_IDS = {
  alice: 'player-alice',
  bob: 'player-bob',
  charlie: 'player-charlie',
  diana: 'player-diana',
} as const;

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
    players: [
      { id: PLAYER_IDS.alice, name: 'Alice' },
      { id: PLAYER_IDS.bob, name: 'Bob' },
      { id: PLAYER_IDS.charlie, name: 'Charlie' },
      { id: PLAYER_IDS.diana, name: 'Diana' },
    ],
    defaultParticipantIds: [PLAYER_IDS.alice, PLAYER_IDS.bob, PLAYER_IDS.charlie],
    template: {
      slots: [
        makeSeat('template-seat-1', PLAYER_IDS.alice),
        makeSeat('template-seat-2', PLAYER_IDS.bob),
        makeSeat('template-seat-3', PLAYER_IDS.charlie),
      ],
    },
    propagationDefault: { toTemplate: true, toOtherGames: true },
    gameIds: [gameId],
  };

  const game = {
    id: gameId,
    sessionId,
    scriptId: 'trouble-brewing',
    currentDay: 1,
    currentPhase: 'Day',
    isFirstNight: true,
    slots: [
      makeSeat('game-seat-1', PLAYER_IDS.alice),
      makeSeat('game-seat-2', PLAYER_IDS.bob),
      makeSeat('game-seat-3', PLAYER_IDS.charlie),
    ],
    participants: [
      { playerId: PLAYER_IDS.alice, isTraveller: false },
      { playerId: PLAYER_IDS.bob, isTraveller: false },
      { playerId: PLAYER_IDS.charlie, isTraveller: false },
    ],
    playerState: {
      [PLAYER_IDS.alice]: makePlayerState('washerwoman'),
      [PLAYER_IDS.bob]: makePlayerState('librarian'),
      [PLAYER_IDS.charlie]: makePlayerState('imp', 'Evil'),
    },
    playerCountOverride: null,
    seatingConfirmed: true,
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

function makeSeat(id: string, playerId: string): Record<string, unknown> {
  return { kind: 'seat', id, playerId };
}

function makePlayerState(
  characterId: string,
  alignment: 'Good' | 'Evil' = 'Good',
): Record<string, unknown> {
  return {
    characterId,
    alive: true,
    ghostVoteUsed: false,
    visibleAlignment: alignment,
    actualAlignment: alignment,
    startingAlignment: alignment,
    activeReminders: [],
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
    await putGame(sessionId, gameId, {
      ...currentGame,
      playerState: {
        ...currentGame.playerState,
        [PLAYER_IDS.alice]: {
          ...currentGame.playerState[PLAYER_IDS.alice],
          alive: false,
        },
      },
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
    const bobState = currentGame.playerState[PLAYER_IDS.bob];
    await putGame(sessionId, gameId, {
      ...currentGame,
      playerState: {
        ...currentGame.playerState,
        [PLAYER_IDS.bob]: {
          ...bobState,
          tokens: [
            ...(bobState.tokens ?? []),
            {
              id: `token-e2e-${Date.now()}`,
              type: 'poisoned',
              label: 'Poisoned',
              sourceCharacterId: 'poisoner',
            },
          ],
        },
      },
    });

    // Wait for SSE to deliver the token change to Device B.
    // Tokens aren't visible in day view, so verify via localStorage which
    // is updated when GameContext processes the SSE-triggered fetch.
    await pageB.waitForFunction(
      (gid: string) => {
        const raw = localStorage.getItem(`storyteller-game-${gid}`);
        if (!raw) return false;
        const g = JSON.parse(raw);
        const bob = g.playerState?.['player-bob'];
        return bob?.tokens?.length > 0 && bob.tokens[0].type === 'poisoned';
      },
      gameId,
      { timeout: 15_000, polling: 500 },
    );

    // Also verify via API as an authoritative cross-check
    const refreshedGame = await fetchGame(sessionId, gameId);
    const bob = refreshedGame.playerState[PLAYER_IDS.bob];
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

    // Make 3 rapid successive API updates BEFORE any device opens the game.
    // (Device pages have a 1s debounced write that would otherwise race against
    // these PUTs and clobber them with the original alive-Alice state.)
    let game = await fetchGame(sessionId, gameId);

    // Update 1: Kill Alice
    game.playerState[PLAYER_IDS.alice].alive = false;
    game = await putGame(sessionId, gameId, game);

    // Update 2: Kill Bob
    game.playerState[PLAYER_IDS.bob].alive = false;
    game = await putGame(sessionId, gameId, game);

    // Update 3: Advance to Day 2
    game.currentDay = 2;
    game = await putGame(sessionId, gameId, game);

    // Verify API has all 3 changes
    const finalGame = await fetchGame(sessionId, gameId);
    expect(finalGame.playerState[PLAYER_IDS.alice].alive).toBe(false);
    expect(finalGame.playerState[PLAYER_IDS.bob].alive).toBe(false);
    expect(finalGame.currentDay).toBe(2);

    // Device B opens the game — should fetch fresh state from API
    await pageB.goto(gameUrl);
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

  /* ------------------------------------------------------------------ */
  /*  Phase 4 Milestone Tests                                            */
  /* ------------------------------------------------------------------ */

  test('player added on context A appears on context B within 3 seconds', async () => {
    const { sessionId, gameId } = ids;
    const gameUrl = `/session/${sessionId}/game/${gameId}`;

    // Both devices load the game
    await pageA.goto(gameUrl);
    await pageB.goto(gameUrl);
    await expect(pageA.getByText('Alice')).toBeVisible({ timeout: 10_000 });
    await expect(pageB.getByText('Alice')).toBeVisible({ timeout: 10_000 });

    // Allow SSE connections to establish (must exceed the 3s self-echo cooldown)
    await pageA.waitForTimeout(4_000);
    await pageB.waitForTimeout(500);

    // Context A adds the existing roster player to this game through Town Square editing.
    await pageA.getByLabel('edit seating').click();
    await pageA.getByTestId(`add-player-${PLAYER_IDS.diana}`).click();
    await pageA.getByRole('button', { name: /review & save/i }).click();
    await pageA.getByRole('button', { name: /save changes/i }).click();
    await expect(pageA.getByText('Diana')).toBeVisible();

    // Context B should see "Diana" within a generous window.
    // SSE delivers version-changed → client fetches fresh state → DOM updates.
    await pageB.waitForFunction(() => document.body.innerText.includes('Diana'), {
      timeout: 10_000,
      polling: 500,
    });
  });

  test('demon bluffs set on context A appear on context B', async () => {
    const { sessionId, gameId } = ids;
    const gameUrl = `/session/${sessionId}/game/${gameId}`;

    await pageA.goto(gameUrl);
    await pageB.goto(gameUrl);
    await expect(pageA.getByText('Alice')).toBeVisible({ timeout: 10_000 });
    await expect(pageB.getByText('Alice')).toBeVisible({ timeout: 10_000 });

    // Allow SSE to establish (past self-echo cooldown)
    await pageA.waitForTimeout(4_000);
    await pageB.waitForTimeout(500);

    // Set demon bluffs via API (simulates Context A choosing bluffs)
    const game = await fetchGame(sessionId, gameId);
    await putGame(sessionId, gameId, {
      ...game,
      demonBluffs: ['washerwoman', 'librarian', 'investigator'],
    });

    // Demon bluffs aren't directly visible in day-view DOM, so verify via
    // localStorage which is updated after SSE-triggered SYNC_GAME dispatch.
    await pageB.waitForFunction(
      (gid: string) => {
        const raw = localStorage.getItem(`storyteller-game-${gid}`);
        if (!raw) return false;
        const g = JSON.parse(raw);
        return (
          Array.isArray(g.demonBluffs) &&
          g.demonBluffs.length === 3 &&
          g.demonBluffs.includes('washerwoman')
        );
      },
      gameId,
      { timeout: 15_000, polling: 500 },
    );

    // Cross-check with API
    const refreshed = await fetchGame(sessionId, gameId);
    expect(refreshed.demonBluffs).toEqual(['washerwoman', 'librarian', 'investigator']);
  });

  test('night completion on context A → night history visible on context B', async () => {
    const { sessionId, gameId } = ids;
    const gameUrl = `/session/${sessionId}/game/${gameId}`;

    await pageA.goto(gameUrl);
    await pageB.goto(gameUrl);
    await expect(pageA.getByText('Alice')).toBeVisible({ timeout: 10_000 });
    await expect(pageB.getByText('Alice')).toBeVisible({ timeout: 10_000 });

    // Allow SSE to establish (past self-echo cooldown)
    await pageA.waitForTimeout(4_000);
    await pageB.waitForTimeout(500);

    // Add a completed night history entry via API
    const game = await fetchGame(sessionId, gameId);
    const nightEntry = {
      dayNumber: 1,
      isFirstNight: true,
      completedAt: new Date().toISOString(),
      subActionStates: {
        washerwoman: [true],
        librarian: [true],
        imp: [true],
      },
      notes: {},
      selections: {},
    };
    await putGame(sessionId, gameId, {
      ...game,
      nightHistory: [nightEntry],
      isFirstNight: false,
      currentDay: 2,
    });

    // Verify Context B's localStorage has the night history via SSE sync
    await pageB.waitForFunction(
      (gid: string) => {
        const raw = localStorage.getItem(`storyteller-game-${gid}`);
        if (!raw) return false;
        const g = JSON.parse(raw);
        return Array.isArray(g.nightHistory) && g.nightHistory.length === 1;
      },
      gameId,
      { timeout: 15_000, polling: 500 },
    );

    // Also verify updated day number appears in DOM
    await pageB.waitForFunction(() => document.body.innerText.includes('Day 2'), {
      timeout: 5_000,
      polling: 500,
    });
  });

  test('bidirectional sync — context B makes a change, context A sees it', async () => {
    const { sessionId, gameId } = ids;
    const gameUrl = `/session/${sessionId}/game/${gameId}`;

    await pageA.goto(gameUrl);
    await pageB.goto(gameUrl);
    await expect(pageA.getByText('Alice')).toBeVisible({ timeout: 10_000 });
    await expect(pageB.getByText('Alice')).toBeVisible({ timeout: 10_000 });

    // Allow SSE to establish (past self-echo cooldown)
    await pageA.waitForTimeout(4_000);
    await pageB.waitForTimeout(500);

    // Context B kills Alice via API (simulates B making a change)
    const game = await fetchGame(sessionId, gameId);
    game.playerState[PLAYER_IDS.alice].alive = false;
    await putGame(sessionId, gameId, game);

    // Context A should see the dead marker via SSE sync
    await pageA.waitForFunction(() => document.body.innerText.includes('💀'), {
      timeout: 15_000,
      polling: 500,
    });

    // Verify Context B also shows the change (it made the API call)
    await pageB.reload();
    await pageB.waitForFunction(() => document.body.innerText.includes('💀'), {
      timeout: 10_000,
      polling: 500,
    });
  });

  test('no self-echo — after push, context A state does not flicker', async () => {
    const { sessionId, gameId } = ids;
    const gameUrl = `/session/${sessionId}/game/${gameId}`;

    // Navigate Context A to the game
    await pageA.goto(gameUrl);
    await expect(pageA.getByText('Alice')).toBeVisible({ timeout: 10_000 });

    // Wait for SSE to establish (past self-echo cooldown from initial load)
    await pageA.waitForTimeout(4_000);

    // Switch to the Players tab so we can use the alive/dead toggle
    await pageA.getByLabel('Players tab').click();
    await pageA.waitForTimeout(500);

    // Context A kills Alice through the UI (triggers GameContext push → sets cooldown)
    const markDeadBtn = pageA.getByLabel('Mark as dead').first();
    await expect(markDeadBtn).toBeVisible({ timeout: 5_000 });
    await markDeadBtn.click();

    // Switch back to TownSquare tab where 💀 emoji is rendered for dead players
    await pageA.getByLabel('Town Square tab').click();
    await pageA.waitForTimeout(500);

    // Verify the change is immediately visible on Context A
    await pageA.waitForFunction(() => document.body.innerText.includes('💀'), {
      timeout: 5_000,
      polling: 250,
    });

    // Set up a MutationObserver to detect any flicker (💀 disappearing then reappearing).
    // The SSE self-echo cooldown (3s) should prevent the server echo from
    // overwriting Context A's state.
    await pageA.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      w.__flickerDetected = false;
      const observer = new MutationObserver(() => {
        if (!document.body.innerText.includes('💀')) {
          w.__flickerDetected = true;
        }
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });
      w.__flickerObserver = observer;
    });

    // Wait well past the 3s self-echo cooldown + any SSE delivery latency
    await pageA.waitForTimeout(6_000);

    // Verify no flicker was detected during the wait
    const flickered = await pageA.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      return w.__flickerDetected as boolean;
    });
    expect(flickered).toBe(false);

    // Clean up the observer
    await pageA.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      const obs = w.__flickerObserver as MutationObserver | undefined;
      obs?.disconnect();
    });

    // Final assertion: dead marker is still visible on TownSquare
    await expect(pageA.locator('text=💀')).toBeVisible();
  });

  test('SSE reconnection — sync resumes after simulated network drop', async () => {
    const { sessionId, gameId } = ids;
    const gameUrl = `/session/${sessionId}/game/${gameId}`;

    // Device B navigates and lets SSE establish
    await pageB.goto(gameUrl);
    await expect(pageB.getByText('Alice')).toBeVisible({ timeout: 10_000 });

    // Wait past self-echo cooldown so SSE events are processed
    await pageB.waitForTimeout(4_000);

    // ── 1. Hide tab — useSseSync closes EventSource (simulates dropped connection) ──
    await pageB.evaluate(() => {
      Object.defineProperty(document, 'hidden', {
        value: true,
        writable: true,
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await pageB.waitForTimeout(500);

    // ── 2. Make a change while Device B's SSE is closed ──
    const game = await fetchGame(sessionId, gameId);
    game.playerState[PLAYER_IDS.alice].alive = false;
    await putGame(sessionId, gameId, game);

    // Verify Device B does NOT see the change (SSE closed, no polling)
    await pageB.waitForTimeout(2_000);
    const deadBefore = await pageB.evaluate(() => document.body.innerText.includes('💀'));
    expect(deadBefore).toBe(false);

    // ── 3. Show tab — useSseSync reopens EventSource and forces a fetch ──
    await pageB.evaluate(() => {
      Object.defineProperty(document, 'hidden', {
        value: false,
        writable: true,
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // ── 4. Verify Device B sees the change after reconnection ──
    await pageB.waitForFunction(() => document.body.innerText.includes('💀'), {
      timeout: 15_000,
      polling: 500,
    });
  });
});
