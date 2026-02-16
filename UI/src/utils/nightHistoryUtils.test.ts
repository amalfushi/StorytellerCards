import { describe, it, expect } from 'vitest';
import { getNightSummary } from './nightHistoryUtils';
import type { NightHistoryEntry } from '../types/index';

function makeEntry(
  subActionStates: Record<string, boolean[]>,
  notes: Record<string, string> = {},
): NightHistoryEntry {
  return {
    dayNumber: 1,
    isFirstNight: true,
    completedAt: '2025-01-01T00:00:00Z',
    subActionStates,
    notes,
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
