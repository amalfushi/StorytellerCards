import { describe, it, expect } from 'vitest';
import {
  getNightSummary,
  mergeNightHistoryEntry,
  findNightHistoryIndex,
} from './nightHistoryUtils';
import type { NightHistoryEntry } from '../types/index';

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
