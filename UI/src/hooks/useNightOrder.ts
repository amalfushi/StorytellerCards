import { useMemo } from 'react';
import type { NightOrderEntry, PlayerSeat } from '@/types/index.ts';
import { allCharacters, buildNightOrder } from '@/data/characters/index.ts';
import { filterNightOrder } from '@/utils/nightOrderFilter.ts';

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
): NightOrderEntry[] {
  return useMemo(() => {
    const nightArray = buildNightOrder(allCharacters, isFirstNight);
    return filterNightOrder(nightArray, scriptCharacterIds, isFirstNight, players);
  }, [scriptCharacterIds, isFirstNight, players]);
}
