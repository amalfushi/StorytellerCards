import { useMemo } from 'react';
import type { CharacterDef, NightOrderEntry, PlayerSeat } from '@/types/index.ts';
import { allCharacters, buildNightOrder } from '@/data/characters/index.ts';
import { filterNightOrder } from '@/utils/nightOrderFilter.ts';

const EMPTY_ACTIVE_SETUP_POWERS: string[] = [];

/**
 * Hook that builds the night order from character definitions, filters it to
 * the active script's characters, and returns the ordered entries for the
 * chosen night type.
 *
 * When `players` is provided the result is further narrowed to only characters
 * that are actually assigned to a player seat in the current game.
 *
 * Memoised so filtering only re-runs when inputs change.
 */
export function useNightOrder(
  scriptCharacterIds: string[],
  isFirstNight: boolean,
  players?: PlayerSeat[],
  activeLoric: string[] = EMPTY_ACTIVE_SETUP_POWERS,
  activeFabled: string[] = EMPTY_ACTIVE_SETUP_POWERS,
): NightOrderEntry[] {
  return useMemo(() => {
    const nightArray = buildNightOrder(allCharacters, isFirstNight);
    const filtered = filterNightOrder(
      nightArray,
      scriptCharacterIds,
      isFirstNight,
      players,
      activeLoric,
      activeFabled,
    );
    return injectGainedAbilityEntries(filtered, players ?? [], allCharacters, isFirstNight);
  }, [scriptCharacterIds, isFirstNight, players, activeLoric, activeFabled]);
}

export function injectGainedAbilityEntries(
  entries: NightOrderEntry[],
  players: PlayerSeat[],
  characters: CharacterDef[],
  isFirstNight: boolean,
): NightOrderEntry[] {
  const gainedEntries: NightOrderEntry[] = [];

  for (const player of players) {
    if (!player.gainedAbility) continue;
    const gainedCharacter = characters.find(
      (character) => character.id === player.gainedAbility?.characterId,
    );
    if (!gainedCharacter) continue;
    const action = isFirstNight ? gainedCharacter.firstNight : gainedCharacter.otherNights;
    if (!action) continue;
    gainedEntries.push({
      order: action.order,
      type: 'character',
      id: gainedCharacter.id,
      name: `⟁ ${gainedCharacter.name} (gained by seat ${player.gainedAbility.hostSeat})`,
      helpText: action.helpText,
      subActions: action.subActions,
      gainedAbilityHostSeat: player.gainedAbility.hostSeat,
      gainedAbilityBaseCharacterId: player.characterId,
    });
  }

  return [...entries, ...gainedEntries].sort((a, b) => a.order - b.order);
}
