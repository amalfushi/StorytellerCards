import { describe, it, expect } from 'vitest';
import {
  getAdjacentSeats,
  areSeatsAdjacent,
  areSeatsInLine,
  getSeatingWarnings,
  getMarionetteValidSeats,
} from '@/utils/seatingConstraints.ts';
import type { PlayerSeat } from '@/types/index.ts';
import { Alignment } from '@/types/index.ts';

// ── Helpers ──

function makeSeat(overrides: Partial<PlayerSeat> = {}): PlayerSeat {
  return {
    seat: 1,
    playerName: 'Player',
    characterId: '',
    alive: true,
    ghostVoteUsed: false,
    visibleAlignment: Alignment.Unknown,
    actualAlignment: Alignment.Unknown,
    startingAlignment: Alignment.Unknown,
    activeReminders: [],
    isTraveller: false,
    tokens: [],
    ...overrides,
  };
}

function makePlayers(count: number, assignments?: Record<number, string>): PlayerSeat[] {
  return Array.from({ length: count }, (_, i) =>
    makeSeat({
      seat: i + 1,
      playerName: `P${i + 1}`,
      characterId: assignments?.[i + 1] ?? '',
    }),
  );
}

// ── Tests ──

describe('getAdjacentSeats', () => {
  it('returns neighbors for middle seat', () => {
    expect(getAdjacentSeats(3, 5)).toEqual([2, 4]);
  });

  it('wraps around for seat 1', () => {
    expect(getAdjacentSeats(1, 5)).toEqual([5, 2]);
  });

  it('wraps around for last seat', () => {
    expect(getAdjacentSeats(5, 5)).toEqual([4, 1]);
  });

  it('handles single seat', () => {
    expect(getAdjacentSeats(1, 1)).toEqual([1, 1]);
  });
});

describe('areSeatsAdjacent', () => {
  it('returns true for adjacent seats', () => {
    expect(areSeatsAdjacent(1, 2, 5)).toBe(true);
    expect(areSeatsAdjacent(2, 1, 5)).toBe(true);
  });

  it('returns true for wrapping adjacency', () => {
    expect(areSeatsAdjacent(1, 5, 5)).toBe(true);
    expect(areSeatsAdjacent(5, 1, 5)).toBe(true);
  });

  it('returns false for non-adjacent seats', () => {
    expect(areSeatsAdjacent(1, 3, 5)).toBe(false);
    expect(areSeatsAdjacent(2, 4, 5)).toBe(false);
  });
});

describe('areSeatsInLine', () => {
  it('single seat is always in line', () => {
    expect(areSeatsInLine([3], 5)).toBe(true);
  });

  it('two adjacent seats are in line', () => {
    expect(areSeatsInLine([2, 3], 5)).toBe(true);
  });

  it('three consecutive seats are in line', () => {
    expect(areSeatsInLine([2, 3, 4], 8)).toBe(true);
  });

  it('non-consecutive seats are not in line', () => {
    expect(areSeatsInLine([1, 3, 5], 8)).toBe(false);
  });

  it('wrapping consecutive seats are in line', () => {
    expect(areSeatsInLine([7, 8, 1], 8)).toBe(true);
  });

  it('all seats filled is always in line', () => {
    expect(areSeatsInLine([1, 2, 3, 4, 5], 5)).toBe(true);
  });

  it('empty array is in line', () => {
    expect(areSeatsInLine([], 5)).toBe(true);
  });
});

describe('getSeatingWarnings', () => {
  it('returns empty array when no special characters', () => {
    const players = makePlayers(5);
    expect(getSeatingWarnings(players)).toHaveLength(0);
  });

  it('warns when Marionette is not adjacent to Demon', () => {
    const players = makePlayers(5, {
      1: 'imp',
      3: 'marionette', // seat 3 is NOT adjacent to seat 1 in a 5-seat circle
      4: 'washerwoman',
    });
    const warnings = getSeatingWarnings(players);
    const marionetteWarning = warnings.find((w) => w.characterId === 'marionette');
    expect(marionetteWarning).toBeDefined();
    expect(marionetteWarning!.message).toContain('Marionette');
    expect(marionetteWarning!.message).toContain('Demon');
  });

  it('no warning when Marionette IS adjacent to Demon', () => {
    const players = makePlayers(5, {
      1: 'imp',
      2: 'marionette', // seat 2 is adjacent to seat 1
    });
    const warnings = getSeatingWarnings(players);
    const marionetteWarning = warnings.find((w) => w.characterId === 'marionette');
    expect(marionetteWarning).toBeUndefined();
  });

  it('no warning when Marionette is not in play', () => {
    const players = makePlayers(5, {
      1: 'imp',
      2: 'poisoner',
    });
    expect(getSeatingWarnings(players)).toHaveLength(0);
  });

  it('warns when Lord of Typhon evil characters are not in a line', () => {
    const players = makePlayers(8, {
      1: 'lordoftyphon',
      3: 'poisoner', // seats 1, 3, 5 are not in a line
      5: 'baron',
    });
    const warnings = getSeatingWarnings(players);
    const typhonWarning = warnings.find((w) => w.characterId === 'lordoftyphon');
    expect(typhonWarning).toBeDefined();
    expect(typhonWarning!.message).toContain('continuous line');
  });

  it('no warning when Lord of Typhon evil characters ARE in a line', () => {
    const players = makePlayers(8, {
      3: 'poisoner',
      4: 'lordoftyphon',
      5: 'baron',
    });
    const warnings = getSeatingWarnings(players);
    // Should not have a "not in line" warning
    const lineWarning = warnings.find(
      (w) => w.characterId === 'lordoftyphon' && w.message.includes('continuous line'),
    );
    expect(lineWarning).toBeUndefined();
  });

  it('excludes travellers from constraint checks', () => {
    const players = [
      makeSeat({ seat: 1, characterId: 'imp' }),
      makeSeat({ seat: 2, characterId: 'marionette' }),
      makeSeat({ seat: 3, characterId: 'washerwoman' }),
      makeSeat({ seat: 4, characterId: 'spiritofivory', isTraveller: true }),
    ];
    // Marionette (seat 2) is adjacent to Imp (seat 1) — no warning
    const warnings = getSeatingWarnings(players);
    expect(warnings.filter((w) => w.characterId === 'marionette')).toHaveLength(0);
  });
});

describe('getMarionetteValidSeats', () => {
  it('returns empty when no demons assigned', () => {
    const players = makePlayers(5);
    expect(getMarionetteValidSeats(players)).toEqual([]);
  });

  it('returns adjacent seats when demon is assigned', () => {
    const players = makePlayers(5, { 3: 'imp' });
    const valid = getMarionetteValidSeats(players);
    expect(valid).toContain(2);
    expect(valid).toContain(4);
  });

  it('wraps around for demon at seat 1', () => {
    const players = makePlayers(5, { 1: 'imp' });
    const valid = getMarionetteValidSeats(players);
    expect(valid).toContain(5);
    expect(valid).toContain(2);
  });

  it('excludes seats already occupied by evil characters', () => {
    const players = makePlayers(5, { 3: 'imp', 4: 'poisoner' });
    const valid = getMarionetteValidSeats(players);
    // seat 4 is adjacent but already has a minion
    expect(valid).not.toContain(4);
    expect(valid).toContain(2);
  });
});
