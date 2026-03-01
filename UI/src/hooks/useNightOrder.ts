import { useMemo } from 'react';
import type { NightOrderEntry, NightOrderData, PlayerSeat } from '@/types/index.ts';
import nightOrderData from '@/data/nightOrder.json';
import { filterNightOrder } from '@/utils/nightOrderFilter.ts';

/**
 * Hook that loads the master night order, filters it to the active script's
 * characters, and returns the ordered entries for the chosen night type.
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
  const data = nightOrderData as NightOrderData;

  return useMemo(() => {
    const nightArray = isFirstNight ? data.firstNight : data.otherNights;
    return filterNightOrder(nightArray, scriptCharacterIds, isFirstNight, players);
  }, [data, scriptCharacterIds, isFirstNight, players]);
}
