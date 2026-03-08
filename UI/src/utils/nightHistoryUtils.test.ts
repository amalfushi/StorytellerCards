import { describe, it, expect } from 'vitest';
import {
  getNightSummary,
  mergeNightHistoryEntry,
  findNightHistoryIndex,
  generateActionableNightSummary,
} from './nightHistoryUtils';
import type { NightHistoryEntry, PlayerToken, PlayerSeat, CharacterDef } from '../types/index';
import { Alignment } from '../types/index';

function makeEntry(
  subActionStates: Record<string, boolean[]>,
  notes: Record<string, string> = {},
  overrides: Partial<NightHistoryEntry> = {},
): NightHistoryEntry {
  return {
    dayNumber: 1,
    isFirstNight: true,
    completedAt: '2025-01-01T00:00:00Z',
    subActionStates,
    notes,
    selections: {},
    ...overrides,
  };
}

function makeToken(id: string, type: PlayerToken['type'], label: string): PlayerToken {
  return { id, type, label };
}

describe('getNightSummary', () => {
  it('returns zeros for empty states', () => {
    const entry = makeEntry({});
    const summary = getNightSummary(entry);

    expect(summary.totalSubActions).toBe(0);
    expect(summary.completedSubActions).toBe(0);
    expect(summary.hasNotes).toBe(false);
  });

  it('counts some completed sub-actions correctly', () => {
    const entry = makeEntry({
      noble: [true, false, true],
      pixie: [false, false],
    });

    const summary = getNightSummary(entry);

    expect(summary.totalSubActions).toBe(5);
    expect(summary.completedSubActions).toBe(2);
    expect(summary.hasNotes).toBe(false);
  });

  it('counts all completed sub-actions', () => {
    const entry = makeEntry({
      noble: [true, true, true],
      pixie: [true, true],
    });

    const summary = getNightSummary(entry);

    expect(summary.totalSubActions).toBe(5);
    expect(summary.completedSubActions).toBe(5);
  });

  it('detects hasNotes when a note has non-empty text', () => {
    const entry = makeEntry({ noble: [true] }, { noble: 'Player chose the Imp' });

    const summary = getNightSummary(entry);
    expect(summary.hasNotes).toBe(true);
  });

  it('detects hasNotes as false when notes are only whitespace', () => {
    const entry = makeEntry({ noble: [true] }, { noble: '   ', pixie: '' });

    const summary = getNightSummary(entry);
    expect(summary.hasNotes).toBe(false);
  });

  it('handles multiple characters with mixed states and notes', () => {
    const entry = makeEntry(
      {
        noble: [true, false],
        pixie: [true, true, false],
        washerwoman: [false],
      },
      {
        noble: '',
        pixie: 'Chose the wrong player',
        washerwoman: '  ',
      },
    );

    const summary = getNightSummary(entry);

    expect(summary.totalSubActions).toBe(6);
    expect(summary.completedSubActions).toBe(3);
    expect(summary.hasNotes).toBe(true);
  });
});

describe('mergeNightHistoryEntry', () => {
  it('merges subActionStates into existing entry', () => {
    const existing = makeEntry({ noble: [true, false], pixie: [false, false] });
    const result = mergeNightHistoryEntry(existing, {
      subActionStates: { noble: [true, true] },
    });

    expect(result.subActionStates.noble).toEqual([true, true]);
    // pixie remains unchanged
    expect(result.subActionStates.pixie).toEqual([false, false]);
  });

  it('merges notes into existing entry', () => {
    const existing = makeEntry({ noble: [true] }, { noble: 'old note' });
    const result = mergeNightHistoryEntry(existing, {
      notes: { noble: 'updated note' },
    });

    expect(result.notes.noble).toBe('updated note');
  });

  it('merges selections into existing entry', () => {
    const existing = makeEntry({}, {}, { selections: { noble: 'player1' } });
    const result = mergeNightHistoryEntry(existing, {
      selections: { pixie: 'player2' },
    });

    expect(result.selections.noble).toBe('player1');
    expect(result.selections.pixie).toBe('player2');
  });

  it('does not modify dayNumber, isFirstNight, or completedAt', () => {
    const existing = makeEntry({ noble: [false] });
    const result = mergeNightHistoryEntry(existing, {
      subActionStates: { noble: [true] },
    });

    expect(result.dayNumber).toBe(1);
    expect(result.isFirstNight).toBe(true);
    expect(result.completedAt).toBe('2025-01-01T00:00:00Z');
  });

  it('returns unchanged entry when updates are empty', () => {
    const existing = makeEntry({ noble: [true, false] }, { noble: 'a note' });
    const result = mergeNightHistoryEntry(existing, {});

    expect(result.subActionStates).toEqual(existing.subActionStates);
    expect(result.notes).toEqual(existing.notes);
    expect(result.selections).toEqual(existing.selections);
  });

  it('handles merging all fields at once', () => {
    const existing = makeEntry(
      { noble: [false, false] },
      { noble: 'old' },
      { selections: { noble: 'player1' } },
    );
    const result = mergeNightHistoryEntry(existing, {
      subActionStates: { noble: [true, true] },
      notes: { noble: 'new' },
      selections: { noble: 'player2' },
    });

    expect(result.subActionStates.noble).toEqual([true, true]);
    expect(result.notes.noble).toBe('new');
    expect(result.selections.noble).toBe('player2');
  });
});

describe('findNightHistoryIndex', () => {
  const history: NightHistoryEntry[] = [
    makeEntry({}, {}, { dayNumber: 1, isFirstNight: true }),
    makeEntry({}, {}, { dayNumber: 2, isFirstNight: false }),
    makeEntry({}, {}, { dayNumber: 3, isFirstNight: false }),
  ];

  it('finds entry by dayNumber and isFirstNight', () => {
    expect(findNightHistoryIndex(history, 1, true)).toBe(0);
    expect(findNightHistoryIndex(history, 2, false)).toBe(1);
    expect(findNightHistoryIndex(history, 3, false)).toBe(2);
  });

  it('returns -1 when no match is found', () => {
    expect(findNightHistoryIndex(history, 4, false)).toBe(-1);
    expect(findNightHistoryIndex(history, 1, false)).toBe(-1);
  });

  it('returns -1 for empty history', () => {
    expect(findNightHistoryIndex([], 1, true)).toBe(-1);
  });
});

describe('NightHistoryEntry tokenSnapshot', () => {
  it('can store a tokenSnapshot on a history entry', () => {
    const tokens: PlayerToken[] = [
      makeToken('t1', 'drunk', 'Drunk'),
      makeToken('t2', 'poisoned', 'Poisoned'),
    ];
    const entry = makeEntry({ noble: [true, true] }, {}, { tokenSnapshot: { noble: tokens } });

    expect(entry.tokenSnapshot).toBeDefined();
    expect(entry.tokenSnapshot!.noble).toHaveLength(2);
    expect(entry.tokenSnapshot!.noble[0].label).toBe('Drunk');
    expect(entry.tokenSnapshot!.noble[1].type).toBe('poisoned');
  });

  it('preserves tokenSnapshot through mergeNightHistoryEntry', () => {
    const tokens: PlayerToken[] = [makeToken('t1', 'drunk', 'Drunk')];
    const existing = makeEntry({ noble: [false] }, {}, { tokenSnapshot: { noble: tokens } });
    const result = mergeNightHistoryEntry(existing, {
      subActionStates: { noble: [true] },
    });

    // tokenSnapshot should be preserved since merge spreads existing fields
    expect(result.tokenSnapshot).toBeDefined();
    expect(result.tokenSnapshot!.noble).toHaveLength(1);
    expect(result.tokenSnapshot!.noble[0].label).toBe('Drunk');
  });

  it('handles entry without tokenSnapshot (backward compatibility)', () => {
    const entry = makeEntry({ noble: [true] });

    expect(entry.tokenSnapshot).toBeUndefined();

    const summary = getNightSummary(entry);
    expect(summary.totalSubActions).toBe(1);
    expect(summary.completedSubActions).toBe(1);
  });

  it('stores tokens for multiple characters', () => {
    const entry = makeEntry(
      { noble: [true], imp: [true, false] },
      {},
      {
        tokenSnapshot: {
          noble: [makeToken('t1', 'drunk', 'Drunk')],
          imp: [makeToken('t2', 'poisoned', 'Poisoned'), makeToken('t3', 'custom', 'Spy info')],
        },
      },
    );

    expect(Object.keys(entry.tokenSnapshot!)).toHaveLength(2);
    expect(entry.tokenSnapshot!.noble).toHaveLength(1);
    expect(entry.tokenSnapshot!.imp).toHaveLength(2);
    expect(entry.tokenSnapshot!.imp[1].label).toBe('Spy info');
  });
});

// ──────────────────────────────────────────────
// generateActionableNightSummary
// ──────────────────────────────────────────────

describe('generateActionableNightSummary', () => {
  const makePlayerForSummary = (overrides: Partial<PlayerSeat> = {}): PlayerSeat => ({
    seat: 1,
    playerName: 'Alice',
    characterId: 'imp',
    alive: true,
    ghostVoteUsed: false,
    visibleAlignment: Alignment.Unknown,
    actualAlignment: Alignment.Evil,
    startingAlignment: Alignment.Evil,
    activeReminders: [],
    isTraveller: false,
    tokens: [],
    ...overrides,
  });

  const makeChar = (overrides: Partial<CharacterDef> = {}): CharacterDef => ({
    id: 'imp',
    name: 'Imp',
    type: 'Demon',
    defaultAlignment: Alignment.Evil,
    abilityShort: 'Kill a player each night.',
    firstNight: null,
    otherNights: null,
    reminders: [],
    ...overrides,
  });

  const impChar = makeChar({ id: 'imp', name: 'Imp', type: 'Demon' });
  const ftChar = makeChar({ id: 'fortuneteller', name: 'Fortune Teller', type: 'Townsfolk' });
  const poisonerChar = makeChar({ id: 'poisoner', name: 'Poisoner', type: 'Minion' });
  const nobleChar = makeChar({ id: 'noble', name: 'Noble', type: 'Townsfolk' });

  const charMap: Record<string, CharacterDef> = {
    imp: impChar,
    fortuneteller: ftChar,
    poisoner: poisonerChar,
    noble: nobleChar,
  };
  const getCharacter = (id: string) => charMap[id];

  const players: PlayerSeat[] = [
    makePlayerForSummary({ seat: 1, playerName: 'Alice', characterId: 'imp' }),
    makePlayerForSummary({ seat: 2, playerName: 'Bob', characterId: 'fortuneteller' }),
    makePlayerForSummary({ seat: 3, playerName: 'Charlie', characterId: 'poisoner' }),
    makePlayerForSummary({ seat: 4, playerName: 'Diana', characterId: 'noble' }),
  ];

  it('generates Demon kill summary with (killed) suffix', () => {
    const entry = makeEntry({ imp: [true] }, {}, { selections: { imp: 'Diana' } });
    const lines = generateActionableNightSummary(entry, players, getCharacter);

    expect(lines).toHaveLength(1);
    expect(lines[0].characterName).toBe('Imp');
    expect(lines[0].playerName).toBe('Alice');
    expect(lines[0].action).toBe('→ Diana (killed)');
  });

  it('generates Poisoner summary with (poisoned) suffix', () => {
    const entry = makeEntry({}, {}, { selections: { poisoner: 'Bob' } });
    const lines = generateActionableNightSummary(entry, players, getCharacter);

    expect(lines).toHaveLength(1);
    expect(lines[0].characterName).toBe('Poisoner');
    expect(lines[0].action).toBe('→ Bob (poisoned)');
  });

  it('generates Fortune Teller summary with joined player names', () => {
    const entry = makeEntry({}, {}, { selections: { fortuneteller: ['Alice', 'Diana'] } });
    const lines = generateActionableNightSummary(entry, players, getCharacter);

    expect(lines).toHaveLength(1);
    expect(lines[0].characterName).toBe('Fortune Teller');
    expect(lines[0].action).toBe('→ Alice & Diana');
  });

  it('generates generic summary for non-special characters', () => {
    const entry = makeEntry({}, {}, { selections: { noble: 'Alice' } });
    const lines = generateActionableNightSummary(entry, players, getCharacter);

    expect(lines).toHaveLength(1);
    expect(lines[0].characterName).toBe('Noble');
    expect(lines[0].action).toBe('→ Alice');
  });

  it('skips entries with no selections', () => {
    const entry = makeEntry({}, {}, { selections: {} });
    const lines = generateActionableNightSummary(entry, players, getCharacter);
    expect(lines).toHaveLength(0);
  });

  it('skips entries with empty string selections', () => {
    const entry = makeEntry({}, {}, { selections: { imp: '' } });
    const lines = generateActionableNightSummary(entry, players, getCharacter);
    expect(lines).toHaveLength(0);
  });

  it('skips entries with empty array selections', () => {
    const entry = makeEntry({}, {}, { selections: { fortuneteller: ['', ''] } });
    const lines = generateActionableNightSummary(entry, players, getCharacter);
    expect(lines).toHaveLength(0);
  });

  it('skips structural entries (dusk, dawn)', () => {
    const entry = makeEntry({}, {}, { selections: { dusk: 'some-value', dawn: 'other' } });
    const lines = generateActionableNightSummary(entry, players, getCharacter);
    expect(lines).toHaveLength(0);
  });

  it('skips minioninfo and demoninfo structural entries', () => {
    const entry = makeEntry({}, {}, { selections: { minioninfo: 'done', demoninfo: 'done' } });
    const lines = generateActionableNightSummary(entry, players, getCharacter);
    expect(lines).toHaveLength(0);
  });

  it('returns empty array for entry with no selections field', () => {
    const entry = makeEntry({});
    const lines = generateActionableNightSummary(entry, [], getCharacter);
    expect(lines).toHaveLength(0);
  });

  it('handles multiple selections in one night', () => {
    const entry = makeEntry(
      {},
      {},
      { selections: { imp: 'Diana', poisoner: 'Bob', fortuneteller: ['Alice', 'Charlie'] } },
    );
    const lines = generateActionableNightSummary(entry, players, getCharacter);

    expect(lines).toHaveLength(3);
    const names = lines.map((l) => l.characterName);
    expect(names).toContain('Imp');
    expect(names).toContain('Poisoner');
    expect(names).toContain('Fortune Teller');
  });

  it('handles unknown character gracefully (uses ID as name)', () => {
    const entry = makeEntry({}, {}, { selections: { unknownchar: 'Alice' } });
    const lines = generateActionableNightSummary(entry, players, getCharacter);

    expect(lines).toHaveLength(1);
    expect(lines[0].characterName).toBe('unknownchar');
    expect(lines[0].action).toBe('→ Alice');
  });

  it('includes playerName when player is found', () => {
    const entry = makeEntry({}, {}, { selections: { imp: 'Diana' } });
    const lines = generateActionableNightSummary(entry, players, getCharacter);
    expect(lines[0].playerName).toBe('Alice');
  });

  it('sets playerName undefined when player is not found', () => {
    const entry = makeEntry({}, {}, { selections: { imp: 'Diana' } });
    const lines = generateActionableNightSummary(entry, [], getCharacter);
    expect(lines[0].playerName).toBeUndefined();
  });
});
