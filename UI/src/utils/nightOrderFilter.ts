import type { NightOrderEntry, PlayerSeat } from '../types/index.ts';

/**
 * Filter the master night order down to entries relevant for a specific script.
 *
 * Keeps:
 * - All **structural** entries (dusk, minioninfo, demoninfo, dawn).
 * - All **character** entries whose {@link NightOrderEntry.id} appears in
 *   `scriptCharacterIds`.
 *
 * When `players` is provided the filter is further narrowed to only characters
 * that are actually **assigned to a player** in the current game. Characters
 * that exist on the script but are not assigned to any seat are excluded.
 *
 * The returned array preserves the original ordering.
 *
 * @param nightOrder          Full master night order array (first night or other
 *                            nights – caller picks the right one).
 * @param scriptCharacterIds  Character IDs on the active script.
 * @param _isFirstNight       Reserved for future use (e.g. toggling structural
 *                            entries). Currently ignored — pass either value.
 * @param players             Optional player seat array. When supplied, only
 *                            characters assigned to a player are kept.
 * @returns Filtered night order entries in their original sequence.
 */
export function filterNightOrder(
  nightOrder: NightOrderEntry[],
  scriptCharacterIds: string[],
  _isFirstNight: boolean,
  players?: PlayerSeat[],
): NightOrderEntry[] {
  const scriptIdSet = new Set(scriptCharacterIds);

  // When players are provided, build a set of assigned character IDs
  const assignedIdSet: Set<string> | null = players
    ? new Set(players.map((p) => p.characterId).filter(Boolean))
    : null;

  return nightOrder.filter((entry) => {
    if (entry.type === 'structural') {
      return true;
    }
    // Must be on the script
    if (!scriptIdSet.has(entry.id)) {
      return false;
    }
    // When players provided, must also be assigned to a player
    if (assignedIdSet) {
      return assignedIdSet.has(entry.id);
    }
    return true;
  });
}
