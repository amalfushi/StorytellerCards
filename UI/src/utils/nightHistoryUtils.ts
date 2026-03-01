import type { NightHistoryEntry } from '@/types/index.ts';

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
