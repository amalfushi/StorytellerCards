/**
 * Pure helpers for manipulating Slot arrays (template or game).
 *
 * Lifted from the M40 playground reducer (`UI/src/pages/playground/m40/reducer.ts`).
 * All ids are passed in by callers; no uuid minting here — keeps the helpers
 * deterministic for tests.
 */

import type { PlayerId, Slot, SlotId } from '../../types/index.ts';

/** Clear any `seat` slots that reference the given playerId; other kinds untouched. */
export function clearPlayerFromSlots(slots: Slot[], playerId: PlayerId): Slot[] {
  return slots.map((s) =>
    s.kind === 'seat' && s.playerId === playerId ? { ...s, playerId: null } : s,
  );
}

/**
 * Assign `playerId` to the seat slot identified by `slotId`. When assigning a real
 * player (non-null), any other seat in the collection currently holding that
 * player is cleared first — players occupy at most one seat in a single arrangement.
 */
export function setSeatPlayer(slots: Slot[], slotId: SlotId, playerId: PlayerId | null): Slot[] {
  let cleared = slots;
  if (playerId !== null) cleared = clearPlayerFromSlots(slots, playerId);
  return cleared.map((s) => (s.kind === 'seat' && s.id === slotId ? { ...s, playerId } : s));
}

/** Reorder a slot to `toIndex`, clamped to the array bounds. Returns input on no-op. */
export function moveSlot(slots: Slot[], slotId: SlotId, toIndex: number): Slot[] {
  const from = slots.findIndex((s) => s.id === slotId);
  if (from === -1) return slots;
  const clamped = Math.max(0, Math.min(toIndex, slots.length - 1));
  if (from === clamped) return slots;
  const next = slots.slice();
  const [moved] = next.splice(from, 1);
  next.splice(clamped, 0, moved);
  return next;
}

/** Find the slot currently holding `playerId`, or `null` when unseated. */
export function findSeatForPlayer(slots: Slot[], playerId: PlayerId): Slot | null {
  for (const s of slots) {
    if (s.kind === 'seat' && s.playerId === playerId) return s;
  }
  return null;
}

/** Player ids that are currently seated in this arrangement (in slot order). */
export function seatedPlayerIds(slots: Slot[]): PlayerId[] {
  const out: PlayerId[] = [];
  for (const s of slots) {
    if (s.kind === 'seat' && s.playerId !== null) out.push(s.playerId);
  }
  return out;
}

/** Filter slots down to seat kind only. */
export function seatSlotsOnly(slots: Slot[]): Extract<Slot, { kind: 'seat' }>[] {
  return slots.filter((s): s is Extract<Slot, { kind: 'seat' }> => s.kind === 'seat');
}
