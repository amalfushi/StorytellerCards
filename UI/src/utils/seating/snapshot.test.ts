import { describe, expect, it } from 'vitest';

import type { Slot, SlotId } from '@/types/index.ts';
import { initialParticipantsFromSlots, snapshotTemplateSlots } from './snapshot.ts';

const seat = (id: string, playerId: string | null = null): Slot => ({
  kind: 'seat',
  id,
  playerId,
});
const spacer = (id: string): Slot => ({ kind: 'spacer', id });
const storyteller = (id: string): Slot => ({ kind: 'storyteller', id });

describe('snapshotTemplateSlots', () => {
  it('clones each template slot with a fresh id, preserving kind and playerId', () => {
    const template: Slot[] = [seat('t1', 'p1'), spacer('t2'), storyteller('t3')];
    const slotIdMap: Record<SlotId, SlotId> = { t1: 'g1', t2: 'g2', t3: 'g3' };
    expect(snapshotTemplateSlots(template, slotIdMap)).toEqual([
      seat('g1', 'p1'),
      spacer('g2'),
      storyteller('g3'),
    ]);
  });

  it('throws when a template slot id is missing from the map', () => {
    const template: Slot[] = [seat('t1')];
    expect(() => snapshotTemplateSlots(template, {})).toThrow(/missing fresh id/);
  });

  it('returns an empty array for an empty template', () => {
    expect(snapshotTemplateSlots([], {})).toEqual([]);
  });
});

describe('initialParticipantsFromSlots', () => {
  it('lists each seated player exactly once as a non-traveller', () => {
    const slots: Slot[] = [seat('s1', 'p1'), spacer('sp'), seat('s2'), seat('s3', 'p3')];
    expect(initialParticipantsFromSlots(slots)).toEqual([
      { playerId: 'p1', isTraveller: false },
      { playerId: 'p3', isTraveller: false },
    ]);
  });

  it('returns an empty list when nobody is seated', () => {
    const slots: Slot[] = [seat('s1'), spacer('sp')];
    expect(initialParticipantsFromSlots(slots)).toEqual([]);
  });
});
