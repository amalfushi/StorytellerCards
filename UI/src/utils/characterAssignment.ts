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

  if (townsfolk.length < distribution.townsfolk) {
    throw new Error(
      `Not enough Townsfolk: need ${distribution.townsfolk}, have ${townsfolk.length}`,
    );
  }
  if (outsiders.length < distribution.outsiders) {
    throw new Error(
      `Not enough Outsiders: need ${distribution.outsiders}, have ${outsiders.length}`,
    );
  }
  if (minions.length < distribution.minions) {
    throw new Error(`Not enough Minions: need ${distribution.minions}, have ${minions.length}`);
  }
  if (demons.length < distribution.demons) {
    throw new Error(`Not enough Demons: need ${distribution.demons}, have ${demons.length}`);
  }

  const selected: CharacterDef[] = [
    ...shuffle([...townsfolk]).slice(0, distribution.townsfolk),
    ...shuffle([...outsiders]).slice(0, distribution.outsiders),
    ...shuffle([...minions]).slice(0, distribution.minions),
    ...shuffle([...demons]).slice(0, distribution.demons),
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
