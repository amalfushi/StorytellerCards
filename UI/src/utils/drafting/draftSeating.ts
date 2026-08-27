import type { CharacterDef, PlayerId, Slot } from '@/types/index.ts';
import { CharacterType } from '@/types/index.ts';
import type { DraftRandomSource } from '@/utils/drafting/draftSession.ts';

export function randomizeDraftSeating(
  slots: readonly Slot[],
  draftPlayerIds: readonly PlayerId[],
  random: DraftRandomSource = Math.random,
): Slot[] {
  const draftPlayers = new Set(draftPlayerIds);
  const eligiblePlayers = slots
    .filter(
      (slot): slot is Extract<Slot, { kind: 'seat' }> =>
        slot.kind === 'seat' && slot.playerId !== null && draftPlayers.has(slot.playerId),
    )
    .map((slot) => slot.playerId as PlayerId);
  const shuffled = [...eligiblePlayers];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.min(index, Math.floor(Math.max(0, random()) * (index + 1)));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  let playerIndex = 0;
  return slots.map((slot) => {
    if (slot.kind !== 'seat' || !slot.playerId || !draftPlayers.has(slot.playerId)) return slot;
    const playerId = shuffled[playerIndex];
    playerIndex += 1;
    return { ...slot, playerId };
  });
}

export interface ConstrainedDraftSeatingResult {
  slots: Slot[];
  constraintsSatisfied: boolean;
}

function hasValidDraftSeating(
  slots: readonly Slot[],
  characterIdByPlayer: Readonly<Record<PlayerId, string>>,
  characterById: ReadonlyMap<string, CharacterDef>,
): boolean {
  const seatedPlayerIds = slots
    .filter(
      (slot): slot is Extract<Slot, { kind: 'seat' }> =>
        slot.kind === 'seat' && slot.playerId !== null && slot.playerId in characterIdByPlayer,
    )
    .map((slot) => slot.playerId as PlayerId);
  const totalSeats = seatedPlayerIds.length;
  if (totalSeats < 2) return true;

  const characterIdAt = (index: number) =>
    characterIdByPlayer[seatedPlayerIds[(index + totalSeats) % totalSeats]];
  const typeAt = (index: number) => characterById.get(characterIdAt(index))?.type;
  const marionetteIndex = seatedPlayerIds.findIndex(
    (playerId) => characterIdByPlayer[playerId] === 'marionette',
  );
  if (
    marionetteIndex >= 0 &&
    typeAt(marionetteIndex - 1) !== CharacterType.Demon &&
    typeAt(marionetteIndex + 1) !== CharacterType.Demon
  ) {
    return false;
  }

  const noDashiiIndex = seatedPlayerIds.findIndex(
    (playerId) => characterIdByPlayer[playerId] === 'nodashii',
  );
  if (
    noDashiiIndex >= 0 &&
    (typeAt(noDashiiIndex - 1) !== CharacterType.Townsfolk ||
      typeAt(noDashiiIndex + 1) !== CharacterType.Townsfolk)
  ) {
    return false;
  }

  const typhonIndex = seatedPlayerIds.findIndex(
    (playerId) => characterIdByPlayer[playerId] === 'lordoftyphon',
  );
  if (typhonIndex >= 0) {
    const evilIndexes = seatedPlayerIds
      .map((_, index) => index)
      .filter(
        (index) => typeAt(index) === CharacterType.Minion || typeAt(index) === CharacterType.Demon,
      );
    if (evilIndexes.length > 1) {
      const evilIndexSet = new Set(evilIndexes);
      const evilDistance = evilIndexes.length;
      const isValidLine = Array.from({ length: totalSeats }, (_, start) =>
        Array.from({ length: evilDistance }, (_, offset) => (start + offset) % totalSeats),
      ).some((line) => {
        const middleIndexes =
          line.length % 2 === 0
            ? [line.length / 2 - 1, line.length / 2]
            : [Math.floor(line.length / 2)];
        return (
          line.every((index) => evilIndexSet.has(index)) &&
          middleIndexes.some((index) => line[index] === typhonIndex)
        );
      });
      if (!isValidLine) return false;
    }
  }

  return true;
}

export function randomizeConstrainedDraftSeating(
  slots: readonly Slot[],
  draftPlayerIds: readonly PlayerId[],
  characterIdByPlayer: Readonly<Record<PlayerId, string>>,
  scriptCharacters: readonly CharacterDef[],
  random: DraftRandomSource = Math.random,
  maxAttempts = 2_000,
): ConstrainedDraftSeatingResult {
  const characterById = new Map(
    scriptCharacters.map((character) => [character.id, character] as const),
  );
  let randomized = randomizeDraftSeating(slots, draftPlayerIds, random);

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (hasValidDraftSeating(randomized, characterIdByPlayer, characterById)) {
      return { slots: randomized, constraintsSatisfied: true };
    }
    randomized = randomizeDraftSeating(slots, draftPlayerIds, random);
  }

  return { slots: randomized, constraintsSatisfied: false };
}
