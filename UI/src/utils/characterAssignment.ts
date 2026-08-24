/**
 * Character assignment utilities.
 */

import type { CharacterDef, Participant, PlayerGameState, PlayerId } from '@/types/index.ts';
import { Alignment, CharacterType } from '@/types/index.ts';
import type { Distribution } from '@/data/playerCountRules.ts';

/** Characters that can be assigned to seats as player characters. */
export function isPlayerAssignableCharacter(character: Pick<CharacterDef, 'type'>): boolean {
  return (
    character.type !== CharacterType.Traveller &&
    character.type !== CharacterType.Fabled &&
    character.type !== CharacterType.Loric
  );
}

/** Filter a character list down to assignable player characters. */
export function filterPlayerAssignableCharacters<T extends Pick<CharacterDef, 'type'>>(
  characters: T[],
): T[] {
  return characters.filter(isPlayerAssignableCharacter);
}

/**
 * Characters that can be selected via the in-game character dropdown.
 * Includes Travellers (so late arrivals can be converted) but excludes
 * Fabled and Loric which are meta/special types not assigned to a seat directly.
 */
export function isCharacterDropdownOption(character: Pick<CharacterDef, 'type'>): boolean {
  return character.type !== CharacterType.Fabled && character.type !== CharacterType.Loric;
}

/** Filter a character list to options exposed in the player character dropdown. */
export function filterCharacterDropdownOptions<T extends Pick<CharacterDef, 'type'>>(
  characters: T[],
): T[] {
  return characters.filter(isCharacterDropdownOption);
}

const CONCEALMENT_CHARACTER_IDS = new Set(['marionette', 'drunk']);

/**
 * Preserve the apparent identity only while assigning a concealment role.
 * Clearing the role or changing to any normal character removes stale secret
 * identity state.
 */
export function apparentCharacterIdAfterAssignment(
  currentApparentCharacterId: string | undefined,
  nextCharacterId: string,
): string {
  return CONCEALMENT_CHARACTER_IDS.has(nextCharacterId) ? (currentApparentCharacterId ?? '') : '';
}

/** Count how many copies of each character are available in an assignment pool. */
export function countCharacterCopies(
  characters: ReadonlyArray<Pick<CharacterDef, 'id'>>,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const character of characters) {
    counts.set(character.id, (counts.get(character.id) ?? 0) + 1);
  }
  return counts;
}

/**
 * Check whether assigning a character would exceed the pool's available copy
 * count. The target player's current character remains selectable as a no-op.
 */
export function isCharacterUnavailableForAssignment(
  characterId: string,
  targetPlayerId: PlayerId,
  participants: Participant[],
  playerState: Record<PlayerId, PlayerGameState>,
  availableCounts: ReadonlyMap<string, number>,
  unlimitedCharacterIds: ReadonlySet<string> = new Set(),
): boolean {
  if (playerState[targetPlayerId]?.characterId === characterId) return false;
  if (unlimitedCharacterIds.has(characterId)) return false;

  const assignedCount = participants.reduce(
    (count, participant) =>
      playerState[participant.playerId]?.characterId === characterId ? count + 1 : count,
    0,
  );
  return assignedCount >= (availableCounts.get(characterId) ?? 0);
}

/**
 * Shuffles an array in-place using the Fisher-Yates algorithm.
 * Returns the same array reference for chaining.
 */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function alignmentForType(type: CharacterDef['type']): Alignment {
  if (type === CharacterType.Minion || type === CharacterType.Demon) return Alignment.Evil;
  return Alignment.Good;
}

/**
 * Randomly assign characters to game participants based on the script pool and distribution.
 */
export function randomlyAssignCharacters(
  participants: Participant[],
  playerState: Record<PlayerId, PlayerGameState>,
  scriptCharacters: CharacterDef[],
  distribution: Distribution,
): Record<PlayerId, PlayerGameState> {
  const assignableCharacters = filterPlayerAssignableCharacters(scriptCharacters);
  const townsfolk = assignableCharacters.filter((c) => c.type === CharacterType.Townsfolk);
  const outsiders = assignableCharacters.filter((c) => c.type === CharacterType.Outsider);
  const minions = assignableCharacters.filter((c) => c.type === CharacterType.Minion);
  const demons = assignableCharacters.filter((c) => c.type === CharacterType.Demon);

  const tfCount = Math.min(distribution.townsfolk, townsfolk.length);
  const oCount = Math.min(distribution.outsiders, outsiders.length);
  const mCount = Math.min(distribution.minions, minions.length);
  const dCount = Math.min(distribution.demons, demons.length);

  const selected: CharacterDef[] = [
    ...shuffle([...townsfolk]).slice(0, tfCount),
    ...shuffle([...outsiders]).slice(0, oCount),
    ...shuffle([...minions]).slice(0, mCount),
    ...shuffle([...demons]).slice(0, dCount),
  ];

  shuffle(selected);

  const nextState: Record<PlayerId, PlayerGameState> = { ...playerState };
  const nonTravellers = participants.filter((participant) => !participant.isTraveller);

  nonTravellers.forEach((participant, index) => {
    const current = playerState[participant.playerId];
    const character = selected[index];
    if (!current || !character) return;
    const alignment = alignmentForType(character.type);
    nextState[participant.playerId] = {
      ...current,
      characterId: character.id,
      actualAlignment: alignment,
      startingAlignment: alignment,
      visibleAlignment: Alignment.Unknown,
      apparentCharacterId: '',
    };
  });

  return nextState;
}
