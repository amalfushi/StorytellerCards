import type { PlayerSeat, CharacterDef } from '@/types/index.ts';
import { Alignment } from '@/types/index.ts';
import type { Distribution } from '@/data/playerCountRules.ts';

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

/**
 * Determines alignment from character type.
 */
function alignmentForType(type: string): 'Good' | 'Evil' {
  if (type === 'Minion' || type === 'Demon') return Alignment.Evil;
  return Alignment.Good;
}

/**
 * Randomly assign characters to players based on the script's character pool
 * and the given distribution.
 *
 * - Picks the right number of each type from the script's character pool
 * - Shuffles and assigns to players randomly
 * - Sets starting alignment based on character type
 *
 * @throws {Error} if there aren't enough characters in the pool
 */
export function randomlyAssignCharacters(
  players: PlayerSeat[],
  scriptCharacters: CharacterDef[],
  distribution: Distribution,
): PlayerSeat[] {
  const townsfolk = scriptCharacters.filter((c) => c.type === 'Townsfolk');
  const outsiders = scriptCharacters.filter((c) => c.type === 'Outsider');
  const minions = scriptCharacters.filter((c) => c.type === 'Minion');
  const demons = scriptCharacters.filter((c) => c.type === 'Demon');

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

  // Pick random characters of each type
  const selected: CharacterDef[] = [
    ...shuffle([...townsfolk]).slice(0, distribution.townsfolk),
    ...shuffle([...outsiders]).slice(0, distribution.outsiders),
    ...shuffle([...minions]).slice(0, distribution.minions),
    ...shuffle([...demons]).slice(0, distribution.demons),
  ];

  // Shuffle the full selection so types are randomly distributed among players
  shuffle(selected);

  // Assign to non-traveller players
  const nonTravellers = players.filter((p) => !p.isTraveller);

  return players.map((p) => {
    if (p.isTraveller) return p;

    const idx = nonTravellers.indexOf(p);
    if (idx < 0 || idx >= selected.length) return p;

    const char = selected[idx];
    const alignment = alignmentForType(char.type);
    return {
      ...p,
      characterId: char.id,
      actualAlignment: alignment,
      startingAlignment: alignment,
      visibleAlignment: Alignment.Unknown,
    };
  });
}
