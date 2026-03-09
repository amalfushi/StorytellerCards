/**
 * Seating constraint utilities for character assignment.
 *
 * Provides advisory-only warnings for seating constraints such as
 * Marionette adjacency and Lord of Typhon evil-line requirements.
 * These never block assignment — they guide the Storyteller.
 */

import type { PlayerSeat } from '@/types/index.ts';
import { getCharacter } from '@/data/characters/index.ts';

// ── Types ──

export interface SeatingWarning {
  characterId: string;
  characterName: string;
  message: string;
  /** Affected seat numbers for highlighting. */
  seats: number[];
}

// ── Adjacency helpers ──

/**
 * Get seat numbers adjacent to a given seat in a circular arrangement.
 * Seats are 1-indexed and wrap around.
 */
export function getAdjacentSeats(seat: number, totalSeats: number): [number, number] {
  if (totalSeats <= 1) return [seat, seat];
  const prev = seat === 1 ? totalSeats : seat - 1;
  const next = seat === totalSeats ? 1 : seat + 1;
  return [prev, next];
}

/**
 * Check if two seats are adjacent in a circular arrangement.
 */
export function areSeatsAdjacent(seat1: number, seat2: number, totalSeats: number): boolean {
  const [prev, next] = getAdjacentSeats(seat1, totalSeats);
  return seat2 === prev || seat2 === next;
}

/**
 * Check if a set of seats forms a continuous line in a circular arrangement.
 * A "line" means all seats are consecutive (wrapping allowed).
 */
export function areSeatsInLine(seats: number[], totalSeats: number): boolean {
  if (seats.length <= 1) return true;
  if (seats.length >= totalSeats) return true;

  const sorted = [...seats].sort((a, b) => a - b);

  // Check for continuous sequence (possibly wrapping)
  // Try each seat as the "start" of the line
  for (let startIdx = 0; startIdx < sorted.length; startIdx++) {
    let continuous = true;
    for (let i = 1; i < sorted.length; i++) {
      const prevSeat = sorted[(startIdx + i - 1) % sorted.length];
      const currSeat = sorted[(startIdx + i) % sorted.length];
      const expectedNext = prevSeat === totalSeats ? 1 : prevSeat + 1;
      if (currSeat !== expectedNext) {
        continuous = false;
        break;
      }
    }
    if (continuous) return true;
  }

  return false;
}

// ── Constraint checks ──

/**
 * Check Marionette adjacency constraint.
 * Marionette must sit next to the Demon.
 */
function checkMarionetteConstraint(players: PlayerSeat[]): SeatingWarning[] {
  const warnings: SeatingWarning[] = [];
  const nonTravellers = players.filter((p) => !p.isTraveller);
  const totalSeats = nonTravellers.length;

  const marionetteSeat = nonTravellers.find((p) => p.characterId === 'marionette');
  if (!marionetteSeat) return warnings;

  // Find all demon seats
  const demonSeats = nonTravellers.filter((p) => {
    const charDef = getCharacter(p.characterId);
    return charDef?.type === 'Demon';
  });

  if (demonSeats.length === 0) return warnings;

  // Check if Marionette is adjacent to any demon
  const isAdjacent = demonSeats.some((d) =>
    areSeatsAdjacent(marionetteSeat.seat, d.seat, totalSeats),
  );

  if (!isAdjacent) {
    warnings.push({
      characterId: 'marionette',
      characterName: getCharacter('marionette')?.name ?? 'Marionette',
      message: 'Marionette should sit next to a Demon',
      seats: [marionetteSeat.seat, ...demonSeats.map((d) => d.seat)],
    });
  }

  return warnings;
}

/**
 * Check Lord of Typhon evil-line constraint.
 * All evil characters should form a continuous line with the Demon in the middle.
 */
function checkLordOfTyphonConstraint(players: PlayerSeat[]): SeatingWarning[] {
  const warnings: SeatingWarning[] = [];
  const nonTravellers = players.filter((p) => !p.isTraveller);
  const totalSeats = nonTravellers.length;

  const typhonSeat = nonTravellers.find((p) => p.characterId === 'lordoftyphon');
  if (!typhonSeat) return warnings;

  // Find all evil seats
  const evilSeats = nonTravellers.filter((p) => {
    const charDef = getCharacter(p.characterId);
    return charDef?.type === 'Demon' || charDef?.type === 'Minion';
  });

  if (evilSeats.length <= 1) return warnings;

  const evilSeatNumbers = evilSeats.map((p) => p.seat);

  // Check if evil seats form a continuous line
  if (!areSeatsInLine(evilSeatNumbers, totalSeats)) {
    warnings.push({
      characterId: 'lordoftyphon',
      characterName: getCharacter('lordoftyphon')?.name ?? 'Lord of Typhon',
      message: 'Evil characters should form a continuous line with the Demon in the middle',
      seats: evilSeatNumbers,
    });
    return warnings;
  }

  // Check if Lord of Typhon is in the middle of the evil line
  if (evilSeats.length >= 3) {
    const sorted = [...evilSeatNumbers].sort((a, b) => a - b);
    const typhonIndex = sorted.indexOf(typhonSeat.seat);
    const isMiddle = typhonIndex > 0 && typhonIndex < sorted.length - 1;

    // Handle wrapping — if the line wraps, the "middle" concept changes
    if (!isMiddle && evilSeats.length >= 3) {
      warnings.push({
        characterId: 'lordoftyphon',
        characterName: getCharacter('lordoftyphon')?.name ?? 'Lord of Typhon',
        message: 'Lord of Typhon should be in the middle of the evil line',
        seats: evilSeatNumbers,
      });
    }
  }

  return warnings;
}

// ── Public API ──

/**
 * Get advisory seating constraint warnings for the current player assignments.
 * Returns an empty array if no constraints are violated.
 * All warnings are advisory — they never block assignment.
 */
export function getSeatingWarnings(players: PlayerSeat[]): SeatingWarning[] {
  return [...checkMarionetteConstraint(players), ...checkLordOfTyphonConstraint(players)];
}

/**
 * Get seats that are valid for Marionette placement (adjacent to any Demon).
 * Returns empty array if no Demons are assigned yet.
 */
export function getMarionetteValidSeats(players: PlayerSeat[]): number[] {
  const nonTravellers = players.filter((p) => !p.isTraveller);
  const totalSeats = nonTravellers.length;

  const demonSeats = nonTravellers.filter((p) => {
    const charDef = getCharacter(p.characterId);
    return charDef?.type === 'Demon';
  });

  if (demonSeats.length === 0) return [];

  const validSeats = new Set<number>();
  for (const demon of demonSeats) {
    const [prev, next] = getAdjacentSeats(demon.seat, totalSeats);
    validSeats.add(prev);
    validSeats.add(next);
  }

  // Remove seats that already have an evil character assigned
  for (const seat of validSeats) {
    const player = nonTravellers.find((p) => p.seat === seat);
    if (player) {
      const charDef = getCharacter(player.characterId);
      if (charDef?.type === 'Demon' || charDef?.type === 'Minion') {
        validSeats.delete(seat);
      }
    }
  }

  return [...validSeats].sort((a, b) => a - b);
}
