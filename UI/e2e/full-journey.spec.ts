import { test, expect, BrowserContext, Page } from '@playwright/test';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const API = 'http://localhost:5173/api';

interface TestIds {
  sessionId: string;
  gameId: string;
}

function makeSeat(
  seat: number,
  playerName: string,
  characterId: string,
  alignment: 'Good' | 'Evil' = 'Good',
): Record<string, unknown> {
  return {
    seat,
    playerName,
    characterId,
    alive: true,
    ghostVoteUsed: false,
    visibleAlignment: alignment,
    actualAlignment: alignment,
    startingAlignment: alignment,
    activeReminders: [],
    isTraveller: false,
    tokens: [],
  };
}

/**
 * Seed a session + game via the API with 5 players and Trouble Brewing characters.
 * This gives us enough players for meaningful bidirectional edits.
 */
async function seedSessionAndGame(): Promise<TestIds> {
  const sessionId = `journey-${Date.now()}`;
  const gameId = `journey-game-${Date.now()}`;
  const now = new Date().toISOString();

  const session = {
    id: sessionId,
    name: 'Full Journey Test',
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
      makeSeat(3, 'Charlie', 'empath'),
      makeSeat(4, 'Diana', 'chef'),
      makeSeat(5, 'Eve', 'imp', 'Evil'),
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

async function fetchGame(sessionId: string, gameId: string) {
  const res = await fetch(`${API}/sessions/${sessionId}/games/${gameId}`);
  if (!res.ok) throw new Error(`fetchGame failed: ${res.status}`);
  return res.json();
}

async function putGame(sessionId: string, gameId: string, game: Record<string, unknown>) {
  const res = await fetch(`${API}/sessions/${sessionId}/games/${gameId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(game),
  });
  if (!res.ok) throw new Error(`putGame failed: ${res.status}`);
  return res.json();
}

async function cleanup(sessionId: string) {
  await fetch(`${API}/sessions/${sessionId}`, { method: 'DELETE' }).catch(() => {});
}

/** Wait for a device's localStorage game data to match a predicate. */
async function waitForLocalGame(page: Page, gameId: string, predicate: string, timeout = 15_000) {
  await page.waitForFunction(
    ([gid, pred]: [string, string]) => {
      const raw = localStorage.getItem(`storyteller-game-${gid}`);
      if (!raw) return false;
      const g = JSON.parse(raw);
      const fn = new Function('g', `return ${pred}`);
      return fn(g);
    },
    [gameId, predicate] as [string, string],
    { timeout, polling: 500 },
  );
}

/* ------------------------------------------------------------------ */
/*  Full Journey — Bidirectional Editing                               */
/* ------------------------------------------------------------------ */

test.describe('Full Journey — Bidirectional Sync', () => {
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

  test('both devices make edits throughout a multi-night journey', async () => {
    test.setTimeout(180_000);
    const { sessionId, gameId } = ids;
    const gameUrl = `/session/${sessionId}/game/${gameId}`;

    /* ================================================================
     * PHASE 1: Both devices load the game and establish SSE
     * ================================================================ */
    await pageA.goto(gameUrl);
    await pageB.goto(gameUrl);

    // Both devices should see all 5 players
    for (const page of [pageA, pageB]) {
      await expect(page.getByText('Alice')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByText('Bob')).toBeVisible();
      await expect(page.getByText('Charlie')).toBeVisible();
      await expect(page.getByText('Diana')).toBeVisible();
      await expect(page.getByText('Eve')).toBeVisible();
    }

    // Allow SSE connections to establish past the 3s self-echo cooldown
    await pageA.waitForTimeout(4_000);
    await pageB.waitForTimeout(500);

    /* ================================================================
     * PHASE 2: Device B adds a reminder token → Device A verifies
     * ================================================================ */
    let game = await fetchGame(sessionId, gameId);
    const reminderTokenId = `washerwoman-townsfolk-${Date.now()}`;

    // Device B adds a "Townsfolk" reminder (from Washerwoman) to Bob (seat 2)
    game.players = game.players.map((p: { seat: number; activeReminders: string[] }) =>
      p.seat === 2 ? { ...p, activeReminders: [...p.activeReminders, reminderTokenId] } : p,
    );
    await putGame(sessionId, gameId, game);

    // Device A verifies the reminder appeared in its localStorage
    await waitForLocalGame(
      pageA,
      gameId,
      `g.players.find(p => p.seat === 2)?.activeReminders?.length > 0`,
    );

    // Cross-check via API
    const afterReminder = await fetchGame(sessionId, gameId);
    const bobAfterReminder = afterReminder.players.find((p: { seat: number }) => p.seat === 2);
    expect(bobAfterReminder.activeReminders).toContain(reminderTokenId);

    /* ================================================================
     * PHASE 3: Device A completes Night 1
     * ================================================================ */
    // Device A enters Night phase via API
    game = await fetchGame(sessionId, gameId);
    const night1Entry = {
      dayNumber: 1,
      isFirstNight: true,
      completedAt: new Date().toISOString(),
      subActionStates: {
        washerwoman: [true, true],
        librarian: [true, true],
        empath: [true],
        chef: [true],
        imp: [true],
      },
      notes: { washerwoman: 'Showed Alice and Bob' },
      selections: {},
    };
    await putGame(sessionId, gameId, {
      ...game,
      nightHistory: [night1Entry],
      isFirstNight: false,
      currentDay: 2,
      currentPhase: 'Day',
    });

    // Verify both devices see Day 2
    for (const page of [pageA, pageB]) {
      await page.waitForFunction(() => document.body.innerText.includes('Day 2'), {
        timeout: 15_000,
        polling: 500,
      });
    }

    /* ================================================================
     * PHASE 4: Device B kills a player + adds a status token
     *          → Device A verifies both changes
     * ================================================================ */

    // Wait for SSE to settle after Night 1 completion
    await pageB.waitForTimeout(4_000);

    // Device B: Kill Diana (seat 4) — mark as dead
    game = await fetchGame(sessionId, gameId);
    game.players = game.players.map((p: { seat: number }) =>
      p.seat === 4 ? { ...p, alive: false } : p,
    );
    await putGame(sessionId, gameId, game);

    // Device A verifies Diana is dead (💀 appears in Town Square)
    await pageA.waitForFunction(() => document.body.innerText.includes('💀'), {
      timeout: 15_000,
      polling: 500,
    });

    // Device B: Add a "drunk" status token to Charlie (seat 3)
    game = await fetchGame(sessionId, gameId);
    game.players = game.players.map((p: { seat: number; tokens?: Record<string, unknown>[] }) =>
      p.seat === 3
        ? {
            ...p,
            tokens: [
              ...(p.tokens ?? []),
              {
                id: `token-drunk-${Date.now()}`,
                type: 'drunk',
                label: 'Drunk',
                sourceCharacterId: 'empath',
              },
            ],
          }
        : p,
    );
    await putGame(sessionId, gameId, game);

    // Device A verifies Charlie has the drunk token via localStorage
    await waitForLocalGame(
      pageA,
      gameId,
      `g.players.find(p => p.seat === 3)?.tokens?.some(t => t.type === 'drunk')`,
    );

    // Cross-check both changes in API
    const afterPhase4 = await fetchGame(sessionId, gameId);
    expect(afterPhase4.players.find((p: { seat: number }) => p.seat === 4).alive).toBe(false);
    expect(afterPhase4.players.find((p: { seat: number }) => p.seat === 3).tokens).toHaveLength(1);
    expect(afterPhase4.players.find((p: { seat: number }) => p.seat === 3).tokens[0].type).toBe(
      'drunk',
    );

    /* ================================================================
     * PHASE 5: Device A adds a poisoned token to Eve → Device B verifies
     * ================================================================ */
    game = await fetchGame(sessionId, gameId);
    game.players = game.players.map((p: { seat: number; tokens?: Record<string, unknown>[] }) =>
      p.seat === 5
        ? {
            ...p,
            tokens: [
              ...(p.tokens ?? []),
              {
                id: `token-poisoned-${Date.now()}`,
                type: 'poisoned',
                label: 'Poisoned',
                sourceCharacterId: 'poisoner',
              },
            ],
          }
        : p,
    );
    await putGame(sessionId, gameId, game);

    // Device B verifies Eve has the poisoned token
    await waitForLocalGame(
      pageB,
      gameId,
      `g.players.find(p => p.seat === 5)?.tokens?.some(t => t.type === 'poisoned')`,
    );

    /* ================================================================
     * PHASE 6: Device B completes Night 2 with notes
     * ================================================================ */
    await pageB.waitForTimeout(4_000);

    game = await fetchGame(sessionId, gameId);
    const night2Entry = {
      dayNumber: 2,
      isFirstNight: false,
      completedAt: new Date().toISOString(),
      subActionStates: {
        empath: [true],
        imp: [true],
      },
      notes: { imp: 'Eve attacked Alice', empath: 'Charlie got 0' },
      selections: {},
    };
    await putGame(sessionId, gameId, {
      ...game,
      nightHistory: [...(game.nightHistory ?? []), night2Entry],
      currentDay: 3,
      currentPhase: 'Day',
    });

    // Device A verifies Night 2 history synced
    await waitForLocalGame(pageA, gameId, `g.nightHistory?.length === 2 && g.currentDay === 3`);

    // Verify notes are preserved
    const afterNight2 = await fetchGame(sessionId, gameId);
    expect(afterNight2.nightHistory).toHaveLength(2);
    expect(afterNight2.nightHistory[1].notes.imp).toBe('Eve attacked Alice');
    expect(afterNight2.nightHistory[1].notes.empath).toBe('Charlie got 0');
    expect(afterNight2.currentDay).toBe(3);

    /* ================================================================
     * PHASE 7: Device B swaps a player's character → Device A verifies
     * ================================================================ */
    game = await fetchGame(sessionId, gameId);

    // Device B: Swap Charlie's character from empath to fortuneteller
    game.players = game.players.map((p: { seat: number }) =>
      p.seat === 3 ? { ...p, characterId: 'fortuneteller' } : p,
    );
    await putGame(sessionId, gameId, game);

    // Device A verifies the character change
    await waitForLocalGame(
      pageA,
      gameId,
      `g.players.find(p => p.seat === 3)?.characterId === 'fortuneteller'`,
    );

    // Cross-check via API
    const afterSwap = await fetchGame(sessionId, gameId);
    expect(afterSwap.players.find((p: { seat: number }) => p.seat === 3).characterId).toBe(
      'fortuneteller',
    );

    /* ================================================================
     * PHASE 8: Device A kills another player → Device B verifies
     * ================================================================ */
    game = await fetchGame(sessionId, gameId);

    // Device A: Kill Alice (seat 1) — the Imp's Night 2 kill
    game.players = game.players.map((p: { seat: number }) =>
      p.seat === 1 ? { ...p, alive: false } : p,
    );
    await putGame(sessionId, gameId, game);

    // Device B verifies two dead players now visible
    await pageB.waitForFunction(() => (document.body.innerText.match(/💀/g) ?? []).length >= 2, {
      timeout: 15_000,
      polling: 500,
    });

    /* ================================================================
     * PHASE 9: Device B completes Night 3 with extensive notes
     *          → Device A verifies
     * ================================================================ */
    await pageB.waitForTimeout(4_000);

    game = await fetchGame(sessionId, gameId);
    const night3Entry = {
      dayNumber: 3,
      isFirstNight: false,
      completedAt: new Date().toISOString(),
      subActionStates: {
        fortuneteller: [true],
        imp: [true],
      },
      notes: {
        imp: 'Eve starpass to Bob — Eve dies, Bob becomes Imp',
        fortuneteller: 'Charlie chose Alice and Bob — got NO',
      },
      selections: {},
    };
    await putGame(sessionId, gameId, {
      ...game,
      nightHistory: [...(game.nightHistory ?? []), night3Entry],
      currentDay: 4,
      currentPhase: 'Day',
    });

    // Device A verifies Night 3 history synced including notes
    await waitForLocalGame(pageA, gameId, `g.nightHistory?.length === 3 && g.currentDay === 4`);

    // Verify the full night history is intact on both devices
    const finalGame = await fetchGame(sessionId, gameId);
    expect(finalGame.nightHistory).toHaveLength(3);
    expect(finalGame.nightHistory[0].dayNumber).toBe(1);
    expect(finalGame.nightHistory[0].isFirstNight).toBe(true);
    expect(finalGame.nightHistory[1].dayNumber).toBe(2);
    expect(finalGame.nightHistory[2].dayNumber).toBe(3);
    expect(finalGame.nightHistory[2].notes.imp).toBe(
      'Eve starpass to Bob — Eve dies, Bob becomes Imp',
    );

    // Device B also sees the final state
    await waitForLocalGame(pageB, gameId, `g.nightHistory?.length === 3 && g.currentDay === 4`);

    /* ================================================================
     * PHASE 10: Final consistency check — both devices match API
     * ================================================================ */
    for (const [label, page] of [
      ['Device A', pageA],
      ['Device B', pageB],
    ] as const) {
      const localGame = await page.evaluate((gid: string) => {
        const raw = localStorage.getItem(`storyteller-game-${gid}`);
        return raw ? JSON.parse(raw) : null;
      }, gameId);

      expect(localGame, `${label} should have game in localStorage`).not.toBeNull();
      expect(localGame.currentDay, `${label} currentDay`).toBe(finalGame.currentDay);
      expect(localGame.nightHistory.length, `${label} nightHistory count`).toBe(
        finalGame.nightHistory.length,
      );

      // Verify player states match
      const localAlice = localGame.players.find((p: { seat: number }) => p.seat === 1);
      expect(localAlice.alive, `${label} Alice dead`).toBe(false);

      const localDiana = localGame.players.find((p: { seat: number }) => p.seat === 4);
      expect(localDiana.alive, `${label} Diana dead`).toBe(false);

      const localCharlie = localGame.players.find((p: { seat: number }) => p.seat === 3);
      expect(localCharlie.characterId, `${label} Charlie swapped`).toBe('fortuneteller');
    }
  });
});
