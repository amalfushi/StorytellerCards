import type { NightSubAction } from '@/types/index.ts';

/**
 * Determines which sub-action indices are "actionable" and get checkboxes.
 *
 * - Index 0 (first sub-action) is ALWAYS actionable (gets checkbox)
 * - Any item with `isConditional: true` is actionable (gets checkbox)
 * - All other items are children (NO checkbox, displayed indented)
 */
export function computeActionableIndices(subActions: NightSubAction[]): Set<number> {
  const actionable = new Set<number>();
  for (let i = 0; i < subActions.length; i++) {
    if (i === 0 || subActions[i].isConditional) {
      actionable.add(i);
    }
  }
  return actionable;
}
