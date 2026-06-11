/**
 * Game-creation helper: snapshot a session template into fresh game slots.
 *
 * The original template slot ids must not be reused inside a game (otherwise
 * propagation cannot tell template slots from game slots when iterating).
 * Callers mint fresh ids and pass them via `slotIdMap` keyed by the original
 * template slot id.
 */

import type { Participant, Slot, SlotId } from '../../types/index.ts';
import { seatedPlayerIds } from './slots.ts';

/**
 * Returns a new slot array cloned from `templateSlots` where each slot's `id` is
 * looked up from `slotIdMap`. Missing mappings throw — callers must mint an id
 * for every template slot.
 */
export function snapshotTemplateSlots(
  templateSlots: Slot[],
  slotIdMap: Record<SlotId, SlotId>,
): Slot[] {
  return templateSlots.map((s) => {
    const fresh = slotIdMap[s.id];
    if (!fresh) {
      throw new Error(
        `snapshotTemplateSlots: missing fresh id in slotIdMap for template slot ${s.id}`,
      );
    }
    if (s.kind === 'seat') {
      return { kind: 'seat', id: fresh, playerId: s.playerId };
    }
    if (s.kind === 'spacer') {
      return { kind: 'spacer', id: fresh };
    }
    return { kind: 'storyteller', id: fresh };
  });
}

/**
 * Initial participants for a brand-new game = the players that are currently
 * seated in the template snapshot. Travellers default to false (storyteller can
 * flip per-participant afterward).
 */
export function initialParticipantsFromSlots(slots: Slot[]): Participant[] {
  return seatedPlayerIds(slots).map((playerId) => ({ playerId, isTraveller: false }));
}
