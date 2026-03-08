import type {
  NightHistoryEntry,
  NightSummaryLine,
  PlayerSeat,
  CharacterDef,
} from '@/types/index.ts';

/**
 * Compute a summary of completed vs total sub-actions for a night history entry,
 * and whether any notes were recorded.
 */
export function getNightSummary(entry: NightHistoryEntry): {
  totalSubActions: number;
  completedSubActions: number;
  hasNotes: boolean;
} {
  let totalSubActions = 0;
  let completedSubActions = 0;
  let hasNotes = false;

  for (const states of Object.values(entry.subActionStates)) {
    totalSubActions += states.length;
    completedSubActions += states.filter(Boolean).length;
  }

  for (const note of Object.values(entry.notes)) {
    if (note.trim().length > 0) {
      hasNotes = true;
      break;
    }
  }

  return { totalSubActions, completedSubActions, hasNotes };
}

/**
 * Merge partial updates into an existing `NightHistoryEntry`.
 *
 * Shallow-merges `subActionStates`, `notes`, and `selections` from `updates`
 * into the existing entry. Fields not present in `updates` are left unchanged.
 * The `dayNumber`, `isFirstNight`, and `completedAt` fields are never modified.
 */
export function mergeNightHistoryEntry(
  existing: NightHistoryEntry,
  updates: Partial<Pick<NightHistoryEntry, 'subActionStates' | 'notes' | 'selections'>>,
): NightHistoryEntry {
  return {
    ...existing,
    subActionStates: updates.subActionStates
      ? { ...existing.subActionStates, ...updates.subActionStates }
      : existing.subActionStates,
    notes: updates.notes ? { ...existing.notes, ...updates.notes } : existing.notes,
    selections: updates.selections
      ? { ...(existing.selections ?? {}), ...updates.selections }
      : existing.selections,
  };
}

/**
 * Find a night history entry by `dayNumber` and `isFirstNight`.
 *
 * Returns the index of the matching entry, or `-1` if not found.
 */
export function findNightHistoryIndex(
  history: NightHistoryEntry[],
  dayNumber: number,
  isFirstNight: boolean,
): number {
  return history.findIndex((e) => e.dayNumber === dayNumber && e.isFirstNight === isFirstNight);
}

// ──────────────────────────────────────────────
// Structural entry IDs that should be excluded from summaries
// ──────────────────────────────────────────────

const STRUCTURAL_IDS = new Set(['dusk', 'dawn', 'minioninfo', 'demoninfo']);

/**
 * Format a selection value into a human-readable string.
 * Handles both single strings and arrays.
 */
function formatSelectionValue(value: string | string[]): string {
  if (Array.isArray(value)) {
    const filtered = value.filter((v) => v !== '');
    if (filtered.length === 0) return '';
    return filtered.join(' & ');
  }
  return value;
}

/**
 * Generate concise actionable summary lines from a night history entry.
 *
 * For each character that recorded choices (selections), produces a
 * one-line summary describing the key action. Skips structural entries
 * (Dusk, Dawn, Minion/Demon info) and characters with no selections.
 *
 * @param nightEntry - The completed night history entry.
 * @param players - Current player list (for player→character mapping).
 * @param getCharacter - Lookup function for character definitions.
 * @returns Array of summary lines, one per actionable character.
 */
export function generateActionableNightSummary(
  nightEntry: NightHistoryEntry,
  players: PlayerSeat[],
  getCharacter: (id: string) => CharacterDef | undefined,
): NightSummaryLine[] {
  const lines: NightSummaryLine[] = [];
  const selections = nightEntry.selections ?? {};

  for (const [characterId, selectionValue] of Object.entries(selections)) {
    // Skip structural entries
    if (STRUCTURAL_IDS.has(characterId)) continue;

    // Skip empty selections
    const formatted = formatSelectionValue(selectionValue);
    if (!formatted) continue;

    const charDef = getCharacter(characterId);
    const characterName = charDef?.name ?? characterId;
    const player = players.find((p) => p.characterId === characterId);
    const playerName = player?.playerName;

    // Determine action description based on character type
    let action: string;
    if (charDef?.type === 'Demon') {
      action = `→ ${formatted} (killed)`;
    } else if (characterId === 'poisoner') {
      action = `→ ${formatted} (poisoned)`;
    } else {
      action = `→ ${formatted}`;
    }

    lines.push({ characterName, playerName, action });
  }

  return lines;
}
