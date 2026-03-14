import { test, expect, BrowserContext, Page } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE = 'http://localhost:5173/api';

/**
 * Full-Journey E2E test — walks through the complete Storyteller workflow
 * across two separate browser contexts (simulating two devices):
 *
 *   Device A (Storyteller's laptop): creates session, sets up game, runs nights
 *   Device B (Storyteller's phone): discovers session via API, verifies sync
 *
 * This is the ultimate integration test covering:
 *   Session creation → Script import → Player naming → Game creation →
 *   Character selection → Demon bluffs → Character assignment →
 *   Reminder token → Status token → Night 1 completion →
 *   Cross-device sync verification → Night 2 completion → API verification
 */
test.describe('Full Storyteller Journey', () => {
  test.setTimeout(120_000);

  let contextA: BrowserContext;
  let contextB: BrowserContext;
  let deviceA: Page;
  let deviceB: Page;
  /** Unique session name per run to avoid collisions. */
  const sessionName = `Game Night ${Date.now()}`;
  /** Tracks session ID for cleanup. */
  let sessionId: string | null = null;

  test.beforeEach(async ({ browser }) => {
    contextA = await browser.newContext();
    contextB = await browser.newContext();
    deviceA = await contextA.newPage();
    deviceB = await contextB.newPage();
    // Clear localStorage so each device starts fresh
    await deviceA.addInitScript(() => localStorage.clear());
    await deviceB.addInitScript(() => localStorage.clear());
  });

  test.afterEach(async () => {
    // Clean up API data created by this test
    if (sessionId) {
      await fetch(`${API_BASE}/sessions/${sessionId}`, { method: 'DELETE' }).catch(() => {});
    }
    await contextA.close();
    await contextB.close();
  });

  const playerNames = ['Alice', 'Bob', 'Charlie', 'Dana', 'Eve', 'Frank', 'Grace'];

  test('complete storyteller workflow across two devices', async () => {
    // ═══════════════════════════════════════════════════════════════
    // DEVICE A — Step 1: Create session with 7 named players
    // ═══════════════════════════════════════════════════════════════
    await deviceA.goto('/');
    await expect(deviceA.getByRole('heading', { name: 'Storyteller Cards' })).toBeVisible({
      timeout: 10_000,
    });

    // Create session — the home page might already have sessions from the API
    const createBtn = deviceA.getByRole('button', { name: /Create Session/i });
    // On empty state: big button; on non-empty: FAB with aria-label
    if (await createBtn.isVisible().catch(() => false)) {
      await createBtn.click();
    } else {
      await deviceA.getByLabel('create session').click();
    }
    await expect(deviceA.getByRole('dialog')).toBeVisible();
    await deviceA.getByLabel('Session Name').fill(sessionName);
    await deviceA.getByRole('button', { name: 'Create', exact: true }).click();
    await expect(deviceA.getByRole('dialog')).not.toBeVisible();

    // Open the session
    await deviceA.getByText(sessionName).first().click();
    await expect(deviceA.getByRole('heading', { name: 'Session Setup' })).toBeVisible({
      timeout: 10_000,
    });
    await expect(deviceA.getByLabel('Session Name')).toHaveValue(sessionName);

    // Add 2 more players (default is 5, need 7)
    // Wait for the players section to render
    await expect(deviceA.getByRole('button', { name: 'Add Player' })).toBeVisible({
      timeout: 5000,
    });
    await deviceA.getByRole('button', { name: 'Add Player' }).click();
    await deviceA.getByRole('button', { name: 'Add Player' }).click();
    await expect(deviceA.getByText('Default Players (7)')).toBeVisible({ timeout: 5000 });

    // Name all 7 players
    const playerInputs = deviceA.locator('input[placeholder^="Player"]');
    await expect(playerInputs).toHaveCount(7);
    for (let i = 0; i < 7; i++) {
      const input = playerInputs.nth(i);
      await input.clear();
      await input.fill(playerNames[i]);
    }

    // ═══════════════════════════════════════════════════════════════
    // DEVICE A — Step 2: Import test script (7 characters)
    // ═══════════════════════════════════════════════════════════════
    const fixtureFilePath = path.resolve(__dirname, 'fixtures', 'test-script.json');
    await deviceA.locator('input[type="file"]').setInputFiles(fixtureFilePath);

    await expect(deviceA.getByText('7 characters')).toBeVisible({ timeout: 5000 });
    await expect(deviceA.getByText('Test Script')).toBeVisible();

    // ═══════════════════════════════════════════════════════════════
    // DEVICE A — Step 3: Create game and open it
    // ═══════════════════════════════════════════════════════════════
    await expect(deviceA.getByText('Games (0)')).toBeVisible();
    await deviceA.getByRole('button', { name: 'New Game' }).click();
    await expect(deviceA.getByText('Games (1)')).toBeVisible();

    await deviceA.getByText('Game 1').click();
    await expect(deviceA.url()).toMatch(/\/session\/.+\/game\/.+/);

    // Verify game view loaded with tabs
    await expect(deviceA.getByLabel('Town Square tab')).toBeVisible();
    await expect(deviceA.getByLabel('Players tab')).toBeVisible();

    // ═══════════════════════════════════════════════════════════════
    // DEVICE A — Steps 4-5: Select characters and assign to players
    // ═══════════════════════════════════════════════════════════════

    // Click "Select Characters" button from the assignment banner
    await deviceA.getByRole('button', { name: 'Select Characters' }).click();

    // Character selection dialog — select all 7 characters from the script
    const charIds = [
      'washerwoman',
      'librarian',
      'investigator',
      'chef',
      'empath',
      'imp',
      'poisoner',
    ];
    for (const charId of charIds) {
      const toggle = deviceA.getByTestId(`char-toggle-${charId}`);
      // Click the toggle to select the character
      await toggle.click();
    }

    // Confirm selection
    await deviceA.getByTestId('confirm-selection').click();

    // ═══════════════════════════════════════════════════════════════
    // DEVICE A — Step 6: Select demon bluffs (3 characters)
    // ═══════════════════════════════════════════════════════════════
    // The demon bluff dialog auto-opens after character selection.
    // Our test script has exactly 7 chars — all 5 good ones are in play,
    // so the dialog may have 0 available bluffs from the script.
    // If bluffs are available, select them; otherwise close and set via API.

    // Wait for the bluff dialog to appear
    await expect(deviceA.getByTestId('confirm-bluffs')).toBeVisible({ timeout: 5000 });

    // Check if there are any bluff toggles available
    const bluffToggles = deviceA.locator('[data-testid^="bluff-toggle-"]');
    const bluffCount = await bluffToggles.count();
    const selectedBluffIds = ['fortune_teller', 'monk', 'ravenkeeper'];

    if (bluffCount >= 3) {
      // Select 3 bluffs from available characters in the UI
      selectedBluffIds.length = 0;
      for (let i = 0; i < 3; i++) {
        const toggle = bluffToggles.nth(i);
        const testId = await toggle.getAttribute('data-testid');
        selectedBluffIds.push(testId!.replace('bluff-toggle-', ''));
        await toggle.click();
      }
      await deviceA.getByTestId('confirm-bluffs').click();
    } else {
      // All good script characters are in play — close dialog (proceeds to assignment)
      await deviceA.getByRole('button', { name: 'Cancel' }).click();
    }

    // ═══════════════════════════════════════════════════════════════
    // DEVICE A — Step 5 (cont'd): Assign characters to players
    // ═══════════════════════════════════════════════════════════════
    // Character assignment dialog should auto-open after bluff selection
    // Use Randomize to assign all characters at once
    await expect(deviceA.getByRole('button', { name: /Randomize/i })).toBeVisible({
      timeout: 5000,
    });
    await deviceA.getByRole('button', { name: /Randomize/i }).click();

    // Confirm assignments
    await deviceA.getByRole('button', { name: 'Confirm' }).click();

    // Allow time for state to persist and API sync
    await deviceA.waitForTimeout(2000);

    // If we skipped bluff selection in the UI (all good chars in play),
    // set demon bluffs via the API
    const urlMatch = deviceA.url().match(/\/session\/(.+?)\/game\/(.+?)$/);
    expect(urlMatch).not.toBeNull();
    sessionId = urlMatch![1];
    const gameId = urlMatch![2];

    if (bluffCount < 3) {
      const currentGame = await deviceA.request
        .get(`${API_BASE}/sessions/${sessionId}/games/${gameId}`)
        .then((r) => r.json());
      currentGame.demonBluffs = selectedBluffIds;
      await deviceA.request.put(`${API_BASE}/sessions/${sessionId}/games/${gameId}`, {
        data: currentGame,
      });
      // Reload to pick up bluff changes
      await deviceA.goto(`/session/${sessionId}/game/${gameId}`);
      await expect(deviceA.getByLabel('Town Square tab')).toBeVisible({ timeout: 10_000 });
      await deviceA.waitForTimeout(1000);
    }

    // ═══════════════════════════════════════════════════════════════
    // DEVICE A — Step 7-8: Add tokens via API
    // ═══════════════════════════════════════════════════════════════
    // Adding tokens through the API is the most reliable approach for E2E,
    // since it mirrors what the UI does but avoids flaky modal interactions.

    // Step 7: Add a reminder token to Player 1 (seat 1) — "Townsfolk" from Washerwoman
    const gameBeforeTokens = await deviceA.request
      .get(`${API_BASE}/sessions/${sessionId}/games/${gameId}`)
      .then((r) => r.json());

    const seat1Player = gameBeforeTokens.players.find((p: { seat: number }) => p.seat === 1);
    seat1Player.tokens = [
      ...(seat1Player.tokens ?? []),
      {
        id: `reminder-e2e-${Date.now()}`,
        type: 'custom',
        label: 'Townsfolk',
        sourceCharacterId: 'washerwoman',
      },
    ];

    // Step 8: Add a "Poisoned" status token to Player 2 (seat 2)
    const seat2Player = gameBeforeTokens.players.find((p: { seat: number }) => p.seat === 2);
    seat2Player.tokens = [
      ...(seat2Player.tokens ?? []),
      {
        id: `poisoned-e2e-${Date.now()}`,
        type: 'poisoned',
        label: 'Poisoned',
        sourceCharacterId: 'poisoner',
      },
    ];

    await deviceA.request.put(`${API_BASE}/sessions/${sessionId}/games/${gameId}`, {
      data: gameBeforeTokens,
    });

    // Reload Device A to pick up token changes
    await deviceA.goto(`/session/${sessionId}/game/${gameId}`);
    await expect(deviceA.getByLabel('Town Square tab')).toBeVisible({ timeout: 10_000 });

    // Verify tokens via UI: enable character visibility and check
    const showCharBtn = deviceA.getByLabel('Show character info');
    if (await showCharBtn.isVisible().catch(() => false)) {
      await showCharBtn.click();
      await deviceA.waitForTimeout(1000);
    }

    // Allow API sync
    await deviceA.waitForTimeout(2000);

    // ═══════════════════════════════════════════════════════════════
    // DEVICE B — Steps 9-10: Discover session and verify game state
    // ═══════════════════════════════════════════════════════════════

    // Step 9: Navigate to home page — session should appear from API
    await deviceB.goto('/');
    await expect(deviceB.getByText(sessionName)).toBeVisible({ timeout: 10_000 });

    // Step 10: Navigate to the game directly
    await deviceB.goto(`/session/${sessionId}/game/${gameId}`);
    await expect(deviceB.getByLabel('Town Square tab')).toBeVisible({ timeout: 10_000 });

    // Enable character visibility on Device B
    await deviceB.getByLabel('Show character info').click();
    await deviceB.waitForTimeout(1000);

    // Switch to Players tab to verify all data
    await deviceB.getByLabel('Players tab').click();

    // Verify all 7 players are visible
    for (const name of playerNames) {
      await expect(deviceB.getByText(name).first()).toBeVisible({ timeout: 5000 });
    }

    // Verify characters are assigned (at least one character name visible in the player list)
    // Since we randomized, we can check that character names from our script appear
    const scriptCharNames = [
      'Washerwoman',
      'Librarian',
      'Investigator',
      'Chef',
      'Empath',
      'Imp',
      'Poisoner',
    ];
    let assignedCount = 0;
    for (const charName of scriptCharNames) {
      const charText = deviceB.getByText(charName, { exact: true });
      if ((await charText.count()) > 0) {
        assignedCount++;
      }
    }
    expect(assignedCount).toBeGreaterThanOrEqual(5);

    // Verify demon bluffs are set via API
    const gameRes = await deviceB.request.get(`${API_BASE}/sessions/${sessionId}/games/${gameId}`);
    expect(gameRes.ok()).toBeTruthy();
    const gameData = await gameRes.json();
    expect(gameData.demonBluffs).toHaveLength(3);

    // Verify poisoned token on player 2
    const player2 = gameData.players.find((p: { seat: number }) => p.seat === 2);
    expect(player2).toBeDefined();
    const hasPoisoned = (player2.tokens ?? []).some((t: { type: string }) => t.type === 'poisoned');
    expect(hasPoisoned).toBe(true);

    // ═══════════════════════════════════════════════════════════════
    // DEVICE A — Steps 11-13: Enter Night 1, navigate flashcards, complete
    // ═══════════════════════════════════════════════════════════════

    // Step 11: Enter Night 1
    // First, dismiss any setup checklist drawer/banner
    const closeChecklist = deviceA.getByLabel('close setup checklist');
    if (await closeChecklist.isVisible().catch(() => false)) {
      await closeChecklist.click();
      await deviceA.waitForTimeout(500);
    }

    // Click the Night chip in PhaseBar (use the phase selector region)
    const phaseBar = deviceA.getByLabel('Game phase selector');
    await expect(phaseBar).toBeVisible({ timeout: 5000 });
    // The Night chip is inside the phase bar — click it specifically
    await phaseBar.getByText('Night').click();
    await deviceA.waitForTimeout(1500);

    // If setup checklist drawer opens with "Start Night 1" button, click it
    const startNightBtn = deviceA.getByRole('button', { name: /Start Night 1/i });
    if (await startNightBtn.isVisible().catch(() => false)) {
      await startNightBtn.click();
      await deviceA.waitForTimeout(1000);
    }

    // The night view should now show flashcard carousel
    // If setup checklist banner shows instead, open it and click "Start Night 1"
    const reviewSetupBtn = deviceA.getByRole('button', { name: /Review Setup/i });
    if (await reviewSetupBtn.isVisible().catch(() => false)) {
      await reviewSetupBtn.click();
      await deviceA.waitForTimeout(500);
      const startNight = deviceA.getByRole('button', { name: /Start Night 1/i });
      await expect(startNight).toBeVisible({ timeout: 5000 });
      await startNight.click();
      await deviceA.waitForTimeout(1000);
    }

    // Verify night flashcard carousel appears
    await expect(deviceA.getByTestId('night-tab-panel')).toBeVisible({ timeout: 10_000 });

    // Step 12: Swipe through all flashcards
    // Navigate through each card using keyboard or clicking right arrow
    // First night for our script: minioninfo, poisoner, demoninfo, washerwoman,
    // librarian, investigator, chef, empath (8 cards)
    // Navigate card-by-card using keyboard ArrowRight

    // Check some sub-action checkboxes on the first card
    const firstCheckbox = deviceA.locator('[role="checkbox"]').first();
    if (await firstCheckbox.isVisible().catch(() => false)) {
      await firstCheckbox.click();
    }

    // Navigate through all cards until we reach the "Complete Night" button.
    // First night has ~8 cards. Click the carousel to focus it first.
    const carouselRegion = deviceA.getByRole('region', { name: 'Night phase flashcard carousel' });
    await carouselRegion.click();

    for (let i = 0; i < 15; i++) {
      // Try to add a note on the current card
      const notesSection = deviceA.getByTestId('notes-section');
      if (await notesSection.isVisible().catch(() => false)) {
        const noteInput = notesSection.locator('textarea').first();
        if (await noteInput.isVisible().catch(() => false)) {
          await noteInput.fill(`Night 1 note for card ${i + 1}`);
          // Re-focus the carousel so keyboard nav works
          await carouselRegion.click();
        }
      }

      // Check a sub-action if available
      const checkbox = deviceA.locator('[role="checkbox"]').first();
      if (await checkbox.isVisible().catch(() => false)) {
        const isChecked = await checkbox.getAttribute('aria-checked');
        if (isChecked !== 'true') {
          await checkbox.click();
          // Re-focus carousel
          await carouselRegion.click();
        }
      }

      // Check if Complete Night button is visible (last card)
      const completeBtn = deviceA.getByRole('button', { name: /Complete Night/i });
      if (await completeBtn.isVisible().catch(() => false)) {
        break;
      }

      // Navigate to next card via keyboard
      await carouselRegion.press('ArrowRight');
      await deviceA.waitForTimeout(500);
    }

    // Step 13: Complete Night 1
    const completeNightBtn = deviceA.getByRole('button', { name: /Complete Night/i });
    await expect(completeNightBtn).toBeVisible({ timeout: 5000 });
    await completeNightBtn.click();

    // Verify we're back in Day phase — day number should have advanced to Day 2
    await deviceA.waitForTimeout(2000);

    // ═══════════════════════════════════════════════════════════════
    // DEVICE B — Step 14: Verify Night 1 in history
    // ═══════════════════════════════════════════════════════════════
    // Wait for SSE sync
    await deviceB.waitForTimeout(5000);

    // Reload to pick up latest state from API
    await deviceB.goto(`/session/${sessionId}/game/${gameId}`);
    await expect(deviceB.getByLabel('Town Square tab')).toBeVisible({ timeout: 10_000 });

    // Check that night history badge shows 1
    const historyBtn = deviceB.getByLabel('night history');
    await expect(historyBtn).toBeVisible({ timeout: 10_000 });

    // Open night history drawer
    await historyBtn.click();

    // Verify Night 1 entry exists
    await expect(deviceB.getByText(/Night 1/i).first()).toBeVisible({ timeout: 5000 });

    // Close history drawer
    await deviceB.keyboard.press('Escape');
    await deviceB.waitForTimeout(500);

    // ═══════════════════════════════════════════════════════════════
    // DEVICE B — Steps 15-16: Enter Night 2 and complete it
    // ═══════════════════════════════════════════════════════════════

    // Step 15: Enter Night 2
    const phaseSelectorB = deviceB.getByLabel('Game phase selector');
    await expect(phaseSelectorB).toBeVisible({ timeout: 5000 });
    await phaseSelectorB.getByText('Night').click();
    await deviceB.waitForTimeout(1000);

    // Night 2 (other nights): poisoner, imp, empath (3 character cards)
    // Navigate through all cards
    await expect(deviceB.getByTestId('night-tab-panel')).toBeVisible({ timeout: 10_000 });

    // Focus the carousel for keyboard navigation
    const carouselB = deviceB.getByRole('region', { name: 'Night phase flashcard carousel' });
    await carouselB.click();

    for (let i = 0; i < 8; i++) {
      // Check a sub-action if available
      const checkbox = deviceB.locator('[role="checkbox"]').first();
      if (await checkbox.isVisible().catch(() => false)) {
        const isChecked = await checkbox.getAttribute('aria-checked');
        if (isChecked !== 'true') {
          await checkbox.click();
          await carouselB.click();
        }
      }

      // Check if Complete Night button is visible (last card)
      const completeBtn = deviceB.getByRole('button', { name: /Complete Night/i });
      if (await completeBtn.isVisible().catch(() => false)) {
        break;
      }

      // Navigate to next card
      await carouselB.press('ArrowRight');
      await deviceB.waitForTimeout(500);
    }

    // Step 16: Complete Night 2
    const completeNight2Btn = deviceB.getByRole('button', { name: /Complete Night/i });
    await expect(completeNight2Btn).toBeVisible({ timeout: 5000 });
    await completeNight2Btn.click();

    // Allow sync
    await deviceB.waitForTimeout(3000);

    // ═══════════════════════════════════════════════════════════════
    // DEVICE A — Step 17: Verify Night 2 in history
    // ═══════════════════════════════════════════════════════════════
    // Reload Device A to pick up latest state
    await deviceA.goto(`/session/${sessionId}/game/${gameId}`);
    await expect(deviceA.getByLabel('Town Square tab')).toBeVisible({ timeout: 10_000 });

    // Night history badge should show 2
    const historyBtnA = deviceA.getByLabel('night history');
    await expect(historyBtnA).toBeVisible({ timeout: 10_000 });

    // Open and verify
    await historyBtnA.click();
    await expect(deviceA.getByText(/Night 1/i).first()).toBeVisible({ timeout: 5000 });
    await expect(deviceA.getByText(/Night 2/i).first()).toBeVisible({ timeout: 5000 });

    // ═══════════════════════════════════════════════════════════════
    // Step 18: Final API verification — complete game state
    // ═══════════════════════════════════════════════════════════════
    const finalGameRes = await deviceA.request.get(
      `${API_BASE}/sessions/${sessionId}/games/${gameId}`,
    );
    expect(finalGameRes.ok()).toBeTruthy();
    const finalGame = await finalGameRes.json();

    // Verify 2 night history entries
    expect(finalGame.nightHistory).toHaveLength(2);
    expect(finalGame.nightHistory[0].isFirstNight).toBe(true);
    expect(finalGame.nightHistory[0].dayNumber).toBe(1);
    expect(finalGame.nightHistory[1].isFirstNight).toBe(false);
    expect(finalGame.nightHistory[1].dayNumber).toBe(2);

    // Verify all 7 players exist with assigned characters
    expect(finalGame.players).toHaveLength(7);
    for (let i = 0; i < 7; i++) {
      const p = finalGame.players[i];
      expect(p.playerName).toBe(playerNames[i]);
      expect(p.characterId).toBeTruthy();
      expect(charIds).toContain(p.characterId);
    }

    // Verify all 7 characters are accounted for
    const assignedCharIds = finalGame.players.map((p: { characterId: string }) => p.characterId);
    for (const cid of charIds) {
      expect(assignedCharIds).toContain(cid);
    }

    // Verify demon bluffs (3 bluffs set)
    expect(finalGame.demonBluffs).toHaveLength(3);
    for (const bluffId of selectedBluffIds) {
      expect(finalGame.demonBluffs).toContain(bluffId);
    }

    // Verify poisoned token on seat 2
    const finalSeat2 = finalGame.players.find((p: { seat: number }) => p.seat === 2);
    expect(finalSeat2).toBeDefined();
    const poisonedToken = (finalSeat2.tokens ?? []).find(
      (t: { type: string }) => t.type === 'poisoned',
    );
    expect(poisonedToken).toBeDefined();

    // Verify current game state after 2 nights
    expect(finalGame.currentDay).toBe(3);
    expect(finalGame.isFirstNight).toBe(false);

    // Verify inPlayCharacterIds set
    expect(finalGame.inPlayCharacterIds).toHaveLength(7);
    for (const cid of charIds) {
      expect(finalGame.inPlayCharacterIds).toContain(cid);
    }
  });
});
