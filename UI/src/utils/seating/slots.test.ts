import { describe, expect, it } from 'vitest';

import type { Participant, Player, Slot } from '@/types/index.ts';
import {
  clearPlayerFromSlots,
  findSeatForPlayer,
  hasGameStarted,
  moveSlot,
  seatedPlayerIds,
  seatSlotsOnly,
  setSeatPlayer,
  validateGameSeating,
} from './slots.ts';

const seat = (id: string, playerId: string | null = null): Slot => ({
  kind: 'seat',
  id,
  playerId,
});
const spacer = (id: string): Slot => ({ kind: 'spacer', id });
const storyteller = (id: string): Slot => ({ kind: 'storyteller', id });

describe('clearPlayerFromSlots', () => {
  it('clears the seat holding the given player', () => {
    const slots: Slot[] = [seat('s1', 'p1'), seat('s2', 'p2'), spacer('sp')];
    expect(clearPlayerFromSlots(slots, 'p1')).toEqual([
      seat('s1', null),
      seat('s2', 'p2'),
      spacer('sp'),
    ]);
  });

  it('is a no-op when the player is unseated', () => {
    const slots: Slot[] = [seat('s1', 'p1')];
    expect(clearPlayerFromSlots(slots, 'p2')).toEqual(slots);
  });

  it('leaves spacers and storyteller markers untouched', () => {
    const slots: Slot[] = [spacer('sp'), storyteller('st')];
    expect(clearPlayerFromSlots(slots, 'p1')).toEqual(slots);
  });
});

describe('setSeatPlayer', () => {
  it('assigns a player to the target seat', () => {
    const slots: Slot[] = [seat('s1'), seat('s2')];
    expect(setSeatPlayer(slots, 's2', 'p1')).toEqual([seat('s1'), seat('s2', 'p1')]);
  });

  it('clears prior occupancy when the same player is already seated elsewhere', () => {
    const slots: Slot[] = [seat('s1', 'p1'), seat('s2')];
    expect(setSeatPlayer(slots, 's2', 'p1')).toEqual([seat('s1', null), seat('s2', 'p1')]);
  });

  it('clears the target seat when playerId is null (does not touch others)', () => {
    const slots: Slot[] = [seat('s1', 'p1'), seat('s2', 'p2')];
    expect(setSeatPlayer(slots, 's2', null)).toEqual([seat('s1', 'p1'), seat('s2', null)]);
  });

  it('ignores non-seat slot ids silently', () => {
    const slots: Slot[] = [seat('s1'), spacer('sp')];
    expect(setSeatPlayer(slots, 'sp', 'p1')).toEqual(slots);
  });
});

describe('moveSlot', () => {
  it('moves a slot forward by index', () => {
    const slots: Slot[] = [seat('a'), seat('b'), seat('c')];
    expect(moveSlot(slots, 'a', 2).map((s) => s.id)).toEqual(['b', 'c', 'a']);
  });

  it('moves a slot backward by index', () => {
    const slots: Slot[] = [seat('a'), seat('b'), seat('c')];
    expect(moveSlot(slots, 'c', 0).map((s) => s.id)).toEqual(['c', 'a', 'b']);
  });

  it('clamps target index to bounds', () => {
    const slots: Slot[] = [seat('a'), seat('b'), seat('c')];
    expect(moveSlot(slots, 'a', 99).map((s) => s.id)).toEqual(['b', 'c', 'a']);
    expect(moveSlot(slots, 'c', -5).map((s) => s.id)).toEqual(['c', 'a', 'b']);
  });

  it('returns the same reference when slotId is missing', () => {
    const slots: Slot[] = [seat('a')];
    expect(moveSlot(slots, 'missing', 0)).toBe(slots);
  });

  it('returns the same reference when the move would be a no-op', () => {
    const slots: Slot[] = [seat('a'), seat('b')];
    expect(moveSlot(slots, 'a', 0)).toBe(slots);
  });
});

describe('findSeatForPlayer', () => {
  it('returns the seat holding the player', () => {
    const slots: Slot[] = [seat('s1', 'p1'), seat('s2', 'p2')];
    expect(findSeatForPlayer(slots, 'p2')).toEqual(seat('s2', 'p2'));
  });

  it('returns null when the player is unseated', () => {
    const slots: Slot[] = [seat('s1', null)];
    expect(findSeatForPlayer(slots, 'p1')).toBeNull();
  });
});

describe('seatedPlayerIds', () => {
  it('returns ids of seated players in slot order, skipping empties', () => {
    const slots: Slot[] = [
      seat('s1', 'p1'),
      spacer('sp'),
      seat('s2'),
      seat('s3', 'p3'),
      storyteller('st'),
    ];
    expect(seatedPlayerIds(slots)).toEqual(['p1', 'p3']);
  });
});

describe('seatSlotsOnly', () => {
  it('filters out spacers and storyteller markers', () => {
    const slots: Slot[] = [seat('s1'), spacer('sp'), seat('s2'), storyteller('st')];
    expect(seatSlotsOnly(slots).map((s) => s.id)).toEqual(['s1', 's2']);
  });
});

describe('hasGameStarted', () => {
  it('recognizes the first Night transition as live play', () => {
    expect(hasGameStarted({ currentPhase: 'Night', isFirstNight: true, nightHistory: [] })).toBe(
      true,
    );
  });

  it('keeps a completed first night classified as started after returning to Day', () => {
    expect(hasGameStarted({ currentPhase: 'Day', isFirstNight: false, nightHistory: [{}] })).toBe(
      true,
    );
  });

  it('returns false during pre-game Day setup', () => {
    expect(hasGameStarted({ currentPhase: 'Day', isFirstNight: true, nightHistory: [] })).toBe(
      false,
    );
  });
});

describe('validateGameSeating', () => {
  const roster: Player[] = [
    { id: 'p1', name: 'Alice' },
    { id: 'p2', name: 'Bob' },
    { id: 'p3', name: 'Carol' },
  ];
  const participants: Participant[] = [
    { playerId: 'p1', isTraveller: false },
    { playerId: 'p2', isTraveller: false },
  ];

  it('accepts fully seated participants while allowing empty seats and layout markers', () => {
    const result = validateGameSeating(
      [seat('s1', 'p1'), spacer('gap'), seat('s2', 'p2'), seat('s3'), storyteller('st')],
      participants,
      roster,
    );

    expect(result).toEqual({
      isValid: true,
      unseatedParticipantIds: [],
      duplicatePlayerIds: [],
      nonParticipantPlayerIds: [],
      missingRosterPlayerIds: [],
    });
  });

  it('reports unseated, duplicate, non-participant, and missing-roster players', () => {
    const result = validateGameSeating(
      [seat('s1', 'p1'), seat('s2', 'p1'), seat('s3', 'p3')],
      [...participants, { playerId: 'missing', isTraveller: false }],
      roster,
    );

    expect(result.isValid).toBe(false);
    expect(result.unseatedParticipantIds).toEqual(['p2', 'missing']);
    expect(result.duplicatePlayerIds).toEqual(['p1']);
    expect(result.nonParticipantPlayerIds).toEqual(['p3']);
    expect(result.missingRosterPlayerIds).toEqual(['missing']);
  });

  it('requires at least one participant before play starts', () => {
    expect(validateGameSeating([seat('s1')], [], roster).isValid).toBe(false);
  });
});
