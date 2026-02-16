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
