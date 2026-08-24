import { describe, expect, it } from 'vitest';
import { Alignment, type PlayerGameState } from '../../types/index.ts';
import { arePlayerStatesEqual, makeDefaultPlayerGameState } from './playerState.ts';

describe('player state helpers', () => {
  it('treats API-omitted empty optional fields as their local defaults', () => {
    const local = { player1: makeDefaultPlayerGameState() };
    const restored: Record<string, PlayerGameState> = {
      player1: {
        ...makeDefaultPlayerGameState(),
        tokens: undefined,
        apparentCharacterId: undefined,
        alignmentHistory: undefined,
      },
    };

    expect(arePlayerStatesEqual(local, restored)).toBe(true);
  });

  it('detects meaningful state changes regardless of player key order', () => {
    const first = makeDefaultPlayerGameState();
    const second = makeDefaultPlayerGameState();
    const original = { player2: second, player1: first };
    const reordered = { player1: first, player2: second };
    const changed = {
      player1: first,
      player2: { ...second, actualAlignment: Alignment.Evil },
    };

    expect(arePlayerStatesEqual(original, reordered)).toBe(true);
    expect(arePlayerStatesEqual(original, changed)).toBe(false);
  });
});
