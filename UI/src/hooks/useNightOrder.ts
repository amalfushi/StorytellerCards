import { useMemo } from 'react';
import type { NightOrderEntry, NightOrderData } from '@/types/index.ts';
import nightOrderData from '@/data/nightOrder.json';
import { filterNightOrder } from '@/utils/nightOrderFilter.ts';

/**
 * Hook that loads the master night order, filters it to the active script's
 * characters, and returns the ordered entries for the chosen night type.
 *
 * Memoised so filtering only re-runs when `scriptCharacterIds` or
 * `isFirstNight` change.
 */
export function useNightOrder(
  scriptCharacterIds: string[],
  isFirstNight: boolean,
): NightOrderEntry[] {
  const data = nightOrderData as NightOrderData;

  return useMemo(() => {
    const nightArray = isFirstNight ? data.firstNight : data.otherNights;
    return filterNightOrder(nightArray, scriptCharacterIds, isFirstNight);
  }, [data, scriptCharacterIds, isFirstNight]);
}
