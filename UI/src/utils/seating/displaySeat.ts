/**
 * Display-seat-number derivation.
 *
 * Spacers and storyteller markers do not count toward the visible seat number.
 * A layout like `[seat, spacer, seat, storyteller, seat]` renders as `1, _, 2, ST, 3`.
 */

import type { Slot, SlotId } from '../../types/index.ts';

/**
 * Map every `seat` slot to its 1-based display number, skipping spacer/storyteller
 * kinds. Non-seat slot ids do not appear in the returned map.
 */
export function buildDisplaySeatNumberMap(slots: Slot[]): Map<SlotId, number> {
  const out = new Map<SlotId, number>();
  let n = 0;
  for (const s of slots) {
    if (s.kind === 'seat') {
      n += 1;
      out.set(s.id, n);
    }
  }
  return out;
}

/** Convenience: display number for a single slotId, or null when not a seat. */
export function displaySeatNumber(slots: Slot[], slotId: SlotId): number | null {
  const map = buildDisplaySeatNumberMap(slots);
  const n = map.get(slotId);
  return n ?? null;
}

/** Total count of `seat` kind slots (== max display number). */
export function seatCount(slots: Slot[]): number {
  let n = 0;
  for (const s of slots) if (s.kind === 'seat') n += 1;
  return n;
}
