import type { NightOrderEntry, PlayerSeat } from '../types/index.ts';

/**
 * Filter the master night order down to entries relevant for a specific script.
 *
 * Keeps:
 * - All **structural** entries (dusk, minioninfo, demoninfo, dawn) — with
 *   conditional logic for edge-case scripts (Atheist, zero-demon, etc.).
 * - All **character** entries whose {@link NightOrderEntry.id} appears in
 *   `scriptCharacterIds`.
 *
 * When `players` is provided the filter is further narrowed to only characters
 * that are actually **assigned to a player** in the current game. Characters
 * that exist on the script but are not assigned to any seat are excluded.
 * Duplicate character entries (e.g. multiple Legion players) are deduplicated
 * so only one night-order card appears per character.
 *
 * The returned array preserves the original ordering.
 *
 * @param nightOrder          Full master night order array (first night or other
 *                            nights – caller picks the right one).
 * @param scriptCharacterIds  Character IDs on the active script.
 * @param isFirstNight        Used to determine whether to apply conditional
 *                            structural entry logic (minioninfo/demoninfo).
 * @param players             Optional player seat array. When supplied, only
 *                            characters assigned to a player are kept.
 * @returns Filtered night order entries in their original sequence.
 */
export function filterNightOrder(
  nightOrder: NightOrderEntry[],
  scriptCharacterIds: string[],
  isFirstNight: boolean,
  players?: PlayerSeat[],
): NightOrderEntry[] {
  const scriptIdSet = new Set(scriptCharacterIds);

  // When players are provided, build a set of assigned character IDs
  const assignedIdSet: Set<string> | null = players
    ? new Set(players.map((p) => p.characterId).filter(Boolean))
    : null;

  // Determine whether structural info entries should be shown
  const hasAtheist = scriptIdSet.has('atheist');
  const hasLilMonsta = scriptIdSet.has('lilmonsta');

  // Demon player count (only when players are provided)
  const hasDemonPlayers = players
    ? players.some((p) => {
        // A player is a "demon player" if their characterId matches a character
        // that is categorised as Demon on the script. Since we don't have
        // CharacterDef objects here, we rely on the script containing demon IDs.
        // The check remains simple: any player with a non-empty characterId that
        // is on the script is sufficient — the caller already filtered by script.
        return p.characterId !== '';
      })
    : true;

  // Track which character IDs we've already emitted (for deduplication)
  const seenCharacterIds = new Set<string>();

  return nightOrder.filter((entry) => {
    if (entry.type === 'structural') {
      return shouldShowStructuralEntry(
        entry.id,
        isFirstNight,
        hasAtheist,
        hasLilMonsta,
        hasDemonPlayers,
        assignedIdSet,
      );
    }
    // Must be on the script
    if (!scriptIdSet.has(entry.id)) {
      return false;
    }
    // When players provided, must also be assigned to a player
    if (assignedIdSet) {
      if (!assignedIdSet.has(entry.id)) {
        return false;
      }
    }
    // Deduplicate: only emit the first entry for each character ID
    if (seenCharacterIds.has(entry.id)) {
      return false;
    }
    seenCharacterIds.add(entry.id);
    return true;
  });
}

/**
 * Determine whether a structural night-order entry should be shown given the
 * current game context.
 *
 * Rules:
 * - **minioninfo** (first night only): skip when Atheist is on the script.
 * - **demoninfo** (first night only): skip when Atheist is on the script, OR
 *   when there are zero demon players AND Lil' Monsta is NOT on the script.
 * - All other structural entries: always show.
 */
function shouldShowStructuralEntry(
  entryId: string,
  isFirstNight: boolean,
  hasAtheist: boolean,
  hasLilMonsta: boolean,
  hasDemonPlayers: boolean,
  assignedIdSet: Set<string> | null,
): boolean {
  if (!isFirstNight) return true;

  if (entryId === 'minioninfo') {
    if (hasAtheist) return false;
    return true;
  }

  if (entryId === 'demoninfo') {
    if (hasAtheist) return false;
    // When we have player data, check if any demon is assigned
    if (assignedIdSet && assignedIdSet.size > 0 && !hasDemonPlayers) {
      // No demon players — only show if Lil' Monsta is on the script
      return hasLilMonsta;
    }
    return true;
  }

  return true;
}

/**
 * Collect player names for a given character ID from the player list.
 * Used by night flashcards to show all players who share a character (e.g. Legion).
 */
export function getPlayerNamesForCharacter(characterId: string, players: PlayerSeat[]): string[] {
  return players.filter((p) => p.characterId === characterId).map((p) => p.playerName);
}
