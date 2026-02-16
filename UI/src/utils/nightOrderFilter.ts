import type { NightOrderEntry } from '../types/index.ts';

/**
 * Filter the master night order down to entries relevant for a specific script.
 *
 * Keeps:
 * - All **structural** entries (dusk, minioninfo, demoninfo, dawn).
 * - All **character** entries whose {@link NightOrderEntry.id} appears in
 *   `scriptCharacterIds`.
 *
 * The returned array preserves the original ordering.
 *
 * @param nightOrder      Full master night order array (first night or other
 *                        nights – caller picks the right one).
 * @param scriptCharacterIds  Character IDs on the active script.
 * @param _isFirstNight   Reserved for future use (e.g. toggling structural
 *                        entries). Currently ignored — pass either value.
 * @returns Filtered night order entries in their original sequence.
 */
export function filterNightOrder(
  nightOrder: NightOrderEntry[],
  scriptCharacterIds: string[],
  _isFirstNight: boolean,
): NightOrderEntry[] {
  const idSet = new Set(scriptCharacterIds);

  return nightOrder.filter((entry) => {
    if (entry.type === 'structural') {
      return true;
    }
    return idSet.has(entry.id);
  });
}
