/**
 * Seating constraint utilities for character assignment.
 *
 * Provides advisory-only warnings for seating constraints such as
 * Marionette adjacency and Lord of Typhon evil-line requirements.
 * These never block assignment — they guide the Storyteller.
 */

import type { PlayerGameState, PlayerId, Slot } from '@/types/index.ts';
import { CharacterType } from '@/types/index.ts';
import { getCharacter } from '@/data/characters/index.ts';
import { buildDisplaySeatNumberMap } from '@/utils/seating/index.ts';

export interface SeatingWarning {
  characterId: string;
  characterName: string;
  message: string;
  /** Affected seat numbers for highlighting. */
  seats: number[];
}

interface SeatedAssignment {
  playerId: PlayerId;
  seat: number;
  state: PlayerGameState;
}

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

/** Check if two seats are adjacent in a circular arrangement. */
export function areSeatsAdjacent(seat1: number, seat2: number, totalSeats: number): boolean {
  const [prev, next] = getAdjacentSeats(seat1, totalSeats);
  return seat2 === prev || seat2 === next;
}

/** Check if a set of seats forms a continuous line in a circular arrangement. */
export function areSeatsInLine(seats: number[], totalSeats: number): boolean {
  if (seats.length <= 1) return true;
  if (seats.length >= totalSeats) return true;

  const sorted = [...seats].sort((a, b) => a - b);

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

function buildSeatedAssignments(
  slots: Slot[],
  playerState: Record<PlayerId, PlayerGameState>,
): SeatedAssignment[] {
  const displayMap = buildDisplaySeatNumberMap(slots);
  const assignments: SeatedAssignment[] = [];
  for (const slot of slots) {
    if (slot.kind !== 'seat' || !slot.playerId) continue;
    const state = playerState[slot.playerId];
    const seat = displayMap.get(slot.id);
    if (!state || seat === undefined) continue;
    assignments.push({ playerId: slot.playerId, seat, state });
  }
  return assignments;
}

function checkMarionetteConstraint(assignments: SeatedAssignment[]): SeatingWarning[] {
  const warnings: SeatingWarning[] = [];
  const totalSeats = assignments.length;
  const marionetteSeat = assignments.find((p) => p.state.characterId === 'marionette');
  if (!marionetteSeat) return warnings;

  const demonSeats = assignments.filter((p) => {
    const charDef = getCharacter(p.state.characterId);
    return charDef?.type === CharacterType.Demon;
  });

  if (demonSeats.length === 0) return warnings;

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

function checkLordOfTyphonConstraint(assignments: SeatedAssignment[]): SeatingWarning[] {
  const warnings: SeatingWarning[] = [];
  const totalSeats = assignments.length;
  const typhonSeat = assignments.find((p) => p.state.characterId === 'lordoftyphon');
  if (!typhonSeat) return warnings;

  const evilSeats = assignments.filter((p) => {
    const charDef = getCharacter(p.state.characterId);
    return charDef?.type === CharacterType.Demon || charDef?.type === CharacterType.Minion;
  });

  if (evilSeats.length <= 1) return warnings;

  const evilSeatNumbers = evilSeats.map((p) => p.seat);
  if (!areSeatsInLine(evilSeatNumbers, totalSeats)) {
    warnings.push({
      characterId: 'lordoftyphon',
      characterName: getCharacter('lordoftyphon')?.name ?? 'Lord of Typhon',
      message: 'Evil characters should form a continuous line with the Demon in the middle',
      seats: evilSeatNumbers,
    });
    return warnings;
  }

  if (evilSeats.length >= 3) {
    const evilSeatSet = new Set(evilSeatNumbers);
    const isMiddle = Array.from({ length: totalSeats }, (_, start) =>
      Array.from(
        { length: evilSeatNumbers.length },
        (_, offset) => ((start + offset) % totalSeats) + 1,
      ),
    ).some((line) => {
      const middleIndexes =
        line.length % 2 === 0
          ? [line.length / 2 - 1, line.length / 2]
          : [Math.floor(line.length / 2)];
      return (
        line.every((seat) => evilSeatSet.has(seat)) &&
        middleIndexes.some((index) => line[index] === typhonSeat.seat)
      );
    });

    if (!isMiddle) {
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

function checkNoDashiiConstraint(assignments: SeatedAssignment[]): SeatingWarning[] {
  const noDashiiSeat = assignments.find(
    (assignment) => assignment.state.characterId === 'nodashii',
  );
  if (!noDashiiSeat || assignments.length < 2) return [];
  const [previousSeat, nextSeat] = getAdjacentSeats(noDashiiSeat.seat, assignments.length);
  const neighbors = assignments.filter(
    (assignment) => assignment.seat === previousSeat || assignment.seat === nextSeat,
  );
  const neighborsAreTownsfolk =
    neighbors.length === 2 &&
    neighbors.every(
      (assignment) => getCharacter(assignment.state.characterId)?.type === CharacterType.Townsfolk,
    );
  if (neighborsAreTownsfolk) return [];

  return [
    {
      characterId: 'nodashii',
      characterName: getCharacter('nodashii')?.name ?? 'No Dashii',
      message: 'No Dashii should sit between two Townsfolk',
      seats: [noDashiiSeat.seat, previousSeat, nextSeat],
    },
  ];
}

/** Get advisory seating constraint warnings for the current player assignments. */
export function getSeatingWarnings(
  slots: Slot[],
  playerState: Record<PlayerId, PlayerGameState>,
): SeatingWarning[] {
  const assignments = buildSeatedAssignments(slots, playerState);
  return [
    ...checkMarionetteConstraint(assignments),
    ...checkLordOfTyphonConstraint(assignments),
    ...checkNoDashiiConstraint(assignments),
  ];
}

/** Get seats that are valid for Marionette placement (adjacent to any Demon). */
export function getMarionetteValidSeats(
  slots: Slot[],
  playerState: Record<PlayerId, PlayerGameState>,
): number[] {
  const assignments = buildSeatedAssignments(slots, playerState);
  const totalSeats = assignments.length;
  const demonSeats = assignments.filter((p) => {
    const charDef = getCharacter(p.state.characterId);
    return charDef?.type === CharacterType.Demon;
  });

  if (demonSeats.length === 0) return [];

  const validSeats = new Set<number>();
  for (const demon of demonSeats) {
    const [prev, next] = getAdjacentSeats(demon.seat, totalSeats);
    validSeats.add(prev);
    validSeats.add(next);
  }

  for (const seat of validSeats) {
    const assignment = assignments.find((p) => p.seat === seat);
    if (assignment) {
      const charDef = getCharacter(assignment.state.characterId);
      if (charDef?.type === CharacterType.Demon || charDef?.type === CharacterType.Minion) {
        validSeats.delete(seat);
      }
    }
  }

  return [...validSeats].sort((a, b) => a - b);
}
