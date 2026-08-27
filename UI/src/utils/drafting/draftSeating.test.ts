import { describe, expect, it } from 'vitest';
import type { Slot } from '@/types/index.ts';
import { getCharacter } from '@/data/characters/index.ts';
import {
  randomizeConstrainedDraftSeating,
  randomizeDraftSeating,
} from '@/utils/drafting/draftSeating.ts';

describe('randomizeDraftSeating', () => {
  it('randomizes drafted players while preserving special slots and travellers', () => {
    const slots: Slot[] = [
      { kind: 'storyteller', id: 'st' },
      { kind: 'seat', id: 's1', playerId: 'p1' },
      { kind: 'spacer', id: 'gap' },
      { kind: 'seat', id: 's2', playerId: 'traveller' },
      { kind: 'seat', id: 's3', playerId: 'p2' },
    ];

    expect(randomizeDraftSeating(slots, ['p1', 'p2'], () => 0)).toEqual([
      { kind: 'storyteller', id: 'st' },
      { kind: 'seat', id: 's1', playerId: 'p2' },
      { kind: 'spacer', id: 'gap' },
      { kind: 'seat', id: 's2', playerId: 'traveller' },
      { kind: 'seat', id: 's3', playerId: 'p1' },
    ]);
  });

  it('searches for a random order that satisfies hidden seating constraints', () => {
    const playerIds = ['marionette-player', 'demon-player', 'good-1', 'good-2', 'good-3'];
    const slots: Slot[] = playerIds.map((playerId, index) => ({
      kind: 'seat',
      id: `s${index + 1}`,
      playerId,
    }));
    const characterIdByPlayer = {
      'marionette-player': 'marionette',
      'demon-player': 'imp',
      'good-1': 'washerwoman',
      'good-2': 'chef',
      'good-3': 'empath',
    };
    const characters = Object.values(characterIdByPlayer)
      .map((characterId) => getCharacter(characterId))
      .filter((character) => character !== undefined);
    let roll = 1;
    const random = () => {
      roll = (roll * 17 + 23) % 97;
      return roll / 97;
    };

    const result = randomizeConstrainedDraftSeating(
      slots,
      playerIds,
      characterIdByPlayer,
      characters,
      random,
    );

    expect(result.constraintsSatisfied).toBe(true);
    const order = result.slots
      .filter((slot): slot is Extract<Slot, { kind: 'seat' }> => slot.kind === 'seat')
      .map((slot) => slot.playerId);
    const marionetteIndex = order.indexOf('marionette-player');
    const neighbors = [
      order[(marionetteIndex + order.length - 1) % order.length],
      order[(marionetteIndex + 1) % order.length],
    ];
    expect(neighbors).toContain('demon-player');
  });

  it('places Lord of Typhon in either middle seat of an even evil line', () => {
    const characterIdByPlayer = {
      typhon: 'lordoftyphon',
      minion1: 'poisoner',
      minion2: 'baron',
      minion3: 'scarletwoman',
      good1: 'washerwoman',
      good2: 'chef',
      good3: 'empath',
    };
    const playerIds = Object.keys(characterIdByPlayer);
    const slots: Slot[] = playerIds.map((playerId, index) => ({
      kind: 'seat',
      id: `s${index + 1}`,
      playerId,
    }));
    const characters = Object.values(characterIdByPlayer)
      .map((characterId) => getCharacter(characterId))
      .filter((character) => character !== undefined);
    let roll = 7;
    const random = () => {
      roll = (roll * 31 + 11) % 101;
      return roll / 101;
    };

    const result = randomizeConstrainedDraftSeating(
      slots,
      playerIds,
      characterIdByPlayer,
      characters,
      random,
    );

    expect(result.constraintsSatisfied).toBe(true);
  });

  it('places No Dashii between two Townsfolk', () => {
    const characterIdByPlayer = {
      demon: 'nodashii',
      minion: 'poisoner',
      good1: 'washerwoman',
      good2: 'chef',
      good3: 'empath',
    };
    const playerIds = Object.keys(characterIdByPlayer);
    const slots: Slot[] = playerIds.map((playerId, index) => ({
      kind: 'seat',
      id: `s${index + 1}`,
      playerId,
    }));
    const characters = Object.values(characterIdByPlayer)
      .map((characterId) => getCharacter(characterId))
      .filter((character) => character !== undefined);
    let roll = 13;
    const random = () => {
      roll = (roll * 19 + 5) % 103;
      return roll / 103;
    };

    const result = randomizeConstrainedDraftSeating(
      slots,
      playerIds,
      characterIdByPlayer,
      characters,
      random,
    );

    expect(result.constraintsSatisfied).toBe(true);
  });
});
