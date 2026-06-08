import { describe, it, expect } from 'vitest';
import { playgroundReducer } from './reducer.ts';
import { initialPgSession, type PgSession } from './types.ts';

const P1 = 'player-1';
const P2 = 'player-2';
const P3 = 'player-3';
const S1 = 'slot-1';
const S2 = 'slot-2';
const S3 = 'slot-3';
const G1 = 'game-1';
const G2 = 'game-2';

function withPlayers(...ids: string[]): PgSession {
  return ids.reduce(
    (s, id) => playgroundReducer(s, { type: 'ADD_PLAYER', playerId: id, name: id.toUpperCase() }),
    initialPgSession,
  );
}

function withThreeSeats(state: PgSession = initialPgSession): PgSession {
  return [S1, S2, S3].reduce(
    (s, id) => playgroundReducer(s, { type: 'ADD_TEMPLATE_SEAT', slotId: id }),
    state,
  );
}

describe('playgroundReducer — players', () => {
  it('adds, renames, and removes players', () => {
    let s = playgroundReducer(initialPgSession, { type: 'ADD_PLAYER', playerId: P1, name: 'Ada' });
    s = playgroundReducer(s, { type: 'ADD_PLAYER', playerId: P2, name: 'Bea' });
    expect(s.players).toEqual([
      { id: P1, name: 'Ada' },
      { id: P2, name: 'Bea' },
    ]);

    s = playgroundReducer(s, { type: 'RENAME_PLAYER', playerId: P1, name: 'Alice' });
    expect(s.players.find((p) => p.id === P1)?.name).toBe('Alice');

    s = playgroundReducer(s, { type: 'REMOVE_PLAYER', playerId: P1 });
    expect(s.players.map((p) => p.id)).toEqual([P2]);
  });

  it('ignores duplicate ADD_PLAYER ids', () => {
    let s = playgroundReducer(initialPgSession, { type: 'ADD_PLAYER', playerId: P1, name: 'Ada' });
    s = playgroundReducer(s, { type: 'ADD_PLAYER', playerId: P1, name: 'Other' });
    expect(s.players).toHaveLength(1);
    expect(s.players[0]?.name).toBe('Ada');
  });

  it('removing a player clears them from template, game slots, participants, characters', () => {
    let s = withPlayers(P1, P2);
    s = withThreeSeats(s);
    s = playgroundReducer(s, { type: 'ASSIGN_TEMPLATE_SEAT', slotId: S1, playerId: P1 });
    s = playgroundReducer(s, {
      type: 'CREATE_GAME',
      gameId: G1,
      name: 'G1',
      slotIdMap: { [S1]: 'gs1', [S2]: 'gs2', [S3]: 'gs3' },
    });
    s = playgroundReducer(s, {
      type: 'ASSIGN_CHARACTER',
      gameId: G1,
      playerId: P1,
      characterId: 'imp',
    });

    s = playgroundReducer(s, { type: 'REMOVE_PLAYER', playerId: P1 });

    const tplSeat = s.template.slots[0];
    expect(tplSeat?.kind === 'seat' && tplSeat.playerId).toBeNull();
    const g = s.games[0]!;
    expect(g.participants.find((p) => p.playerId === P1)).toBeUndefined();
    const gSeat = g.slots[0];
    expect(gSeat?.kind === 'seat' && gSeat.playerId).toBeNull();
    expect(g.characterAssignments[P1]).toBeUndefined();
  });
});

describe('playgroundReducer — template slots', () => {
  it('adds seats and spacers in order', () => {
    let s = playgroundReducer(initialPgSession, { type: 'ADD_TEMPLATE_SEAT', slotId: S1 });
    s = playgroundReducer(s, { type: 'ADD_TEMPLATE_SPACER', slotId: S2 });
    s = playgroundReducer(s, { type: 'ADD_TEMPLATE_SEAT', slotId: S3 });
    expect(s.template.slots.map((x) => x.kind)).toEqual(['seat', 'spacer', 'seat']);
  });

  it('removes a slot', () => {
    let s = withThreeSeats();
    s = playgroundReducer(s, { type: 'REMOVE_TEMPLATE_SLOT', slotId: S2 });
    expect(s.template.slots.map((x) => x.id)).toEqual([S1, S3]);
  });

  it('moves a slot to a new index', () => {
    let s = withThreeSeats();
    s = playgroundReducer(s, { type: 'MOVE_TEMPLATE_SLOT', slotId: S1, toIndex: 2 });
    expect(s.template.slots.map((x) => x.id)).toEqual([S2, S3, S1]);
  });

  it('MOVE clamps out-of-range targets', () => {
    let s = withThreeSeats();
    s = playgroundReducer(s, { type: 'MOVE_TEMPLATE_SLOT', slotId: S3, toIndex: -5 });
    expect(s.template.slots[0]?.id).toBe(S3);
  });

  it('ASSIGN_TEMPLATE_SEAT clears the player from a prior seat', () => {
    let s = withPlayers(P1);
    s = withThreeSeats(s);
    s = playgroundReducer(s, { type: 'ASSIGN_TEMPLATE_SEAT', slotId: S1, playerId: P1 });
    s = playgroundReducer(s, { type: 'ASSIGN_TEMPLATE_SEAT', slotId: S3, playerId: P1 });
    const seat1 = s.template.slots[0];
    const seat3 = s.template.slots[2];
    expect(seat1?.kind === 'seat' && seat1.playerId).toBeNull();
    expect(seat3?.kind === 'seat' && seat3.playerId).toBe(P1);
  });

  it('ADD_TEMPLATE_SEAT with gameSlotIds also appends a seat to listed games', () => {
    let s = withThreeSeats();
    s = playgroundReducer(s, {
      type: 'CREATE_GAME',
      gameId: G1,
      name: 'G1',
      slotIdMap: { [S1]: 'a1', [S2]: 'a2', [S3]: 'a3' },
    });
    s = playgroundReducer(s, {
      type: 'CREATE_GAME',
      gameId: G2,
      name: 'G2',
      slotIdMap: { [S1]: 'b1', [S2]: 'b2', [S3]: 'b3' },
    });
    s = playgroundReducer(s, {
      type: 'ADD_TEMPLATE_SEAT',
      slotId: 'tnew',
      gameSlotIds: { [G1]: 'gnew1', [G2]: 'gnew2' },
    });
    expect(s.template.slots.at(-1)?.id).toBe('tnew');
    expect(s.games[0]!.slots.at(-1)?.id).toBe('gnew1');
    expect(s.games[1]!.slots.at(-1)?.id).toBe('gnew2');
  });

  it('ADD_TEMPLATE_SPACER with gameSlotIds appends a spacer only to listed games', () => {
    let s = withThreeSeats();
    s = playgroundReducer(s, {
      type: 'CREATE_GAME',
      gameId: G1,
      name: 'G1',
      slotIdMap: { [S1]: 'a1', [S2]: 'a2', [S3]: 'a3' },
    });
    s = playgroundReducer(s, {
      type: 'CREATE_GAME',
      gameId: G2,
      name: 'G2',
      slotIdMap: { [S1]: 'b1', [S2]: 'b2', [S3]: 'b3' },
    });
    s = playgroundReducer(s, {
      type: 'ADD_TEMPLATE_SPACER',
      slotId: 'tsp',
      gameSlotIds: { [G1]: 'gsp1' },
    });
    expect(s.template.slots.at(-1)).toMatchObject({ kind: 'spacer', id: 'tsp' });
    expect(s.games[0]!.slots.at(-1)).toMatchObject({ kind: 'spacer', id: 'gsp1' });
    expect(s.games[1]!.slots.at(-1)?.id).toBe('b3');
  });

  it('ADD_TEMPLATE_SEAT without gameSlotIds leaves games untouched', () => {
    let s = withThreeSeats();
    s = playgroundReducer(s, {
      type: 'CREATE_GAME',
      gameId: G1,
      name: 'G1',
      slotIdMap: { [S1]: 'a1', [S2]: 'a2', [S3]: 'a3' },
    });
    s = playgroundReducer(s, { type: 'ADD_TEMPLATE_SEAT', slotId: 'tnew' });
    expect(s.template.slots).toHaveLength(4);
    expect(s.games[0]!.slots).toHaveLength(3);
  });
});

describe('playgroundReducer — games', () => {
  it('CREATE_GAME snapshots template slots and seeds participants from seated players', () => {
    let s = withPlayers(P1, P2);
    s = withThreeSeats(s);
    s = playgroundReducer(s, { type: 'ASSIGN_TEMPLATE_SEAT', slotId: S1, playerId: P1 });
    s = playgroundReducer(s, { type: 'ASSIGN_TEMPLATE_SEAT', slotId: S3, playerId: P2 });
    s = playgroundReducer(s, {
      type: 'CREATE_GAME',
      gameId: G1,
      name: 'Game 1',
      slotIdMap: { [S1]: 'gs1', [S2]: 'gs2', [S3]: 'gs3' },
    });

    const g = s.games[0]!;
    expect(g.slots.map((x) => x.id)).toEqual(['gs1', 'gs2', 'gs3']);
    expect(g.participants.map((p) => p.playerId).sort()).toEqual([P1, P2].sort());
    expect(s.activeGameId).toBe(G1);
  });

  it('removing the active game promotes the next game (or null)', () => {
    let s = withPlayers(P1);
    s = withThreeSeats(s);
    s = playgroundReducer(s, {
      type: 'CREATE_GAME',
      gameId: G1,
      name: 'G1',
      slotIdMap: { [S1]: 'a1', [S2]: 'a2', [S3]: 'a3' },
    });
    s = playgroundReducer(s, {
      type: 'CREATE_GAME',
      gameId: G2,
      name: 'G2',
      slotIdMap: { [S1]: 'b1', [S2]: 'b2', [S3]: 'b3' },
    });
    expect(s.activeGameId).toBe(G1);
    s = playgroundReducer(s, { type: 'REMOVE_GAME', gameId: G1 });
    expect(s.activeGameId).toBe(G2);
    s = playgroundReducer(s, { type: 'REMOVE_GAME', gameId: G2 });
    expect(s.activeGameId).toBeNull();
  });
});

describe('playgroundReducer — ASSIGN_GAME_SEAT propagation', () => {
  function setup(): PgSession {
    let s = withPlayers(P1, P2);
    s = withThreeSeats(s);
    s = playgroundReducer(s, {
      type: 'CREATE_GAME',
      gameId: G1,
      name: 'G1',
      slotIdMap: { [S1]: 'g1s1', [S2]: 'g1s2', [S3]: 'g1s3' },
    });
    s = playgroundReducer(s, {
      type: 'CREATE_GAME',
      gameId: G2,
      name: 'G2',
      slotIdMap: { [S1]: 'g2s1', [S2]: 'g2s2', [S3]: 'g2s3' },
    });
    return s;
  }

  it('default propagates to template + other games (same index)', () => {
    let s = setup();
    s = playgroundReducer(s, {
      type: 'ASSIGN_GAME_SEAT',
      gameId: G1,
      slotId: 'g1s1',
      playerId: P1,
    });

    const tpl = s.template.slots[0];
    expect(tpl?.kind === 'seat' && tpl.playerId).toBe(P1);

    const g1seat = s.games.find((g) => g.id === G1)?.slots[0];
    const g2seat = s.games.find((g) => g.id === G2)?.slots[0];
    expect(g1seat?.kind === 'seat' && g1seat.playerId).toBe(P1);
    expect(g2seat?.kind === 'seat' && g2seat.playerId).toBe(P1);
  });

  it('per-action propagation override (toTemplate=false, toOtherGames=false) is local', () => {
    let s = setup();
    s = playgroundReducer(s, {
      type: 'ASSIGN_GAME_SEAT',
      gameId: G1,
      slotId: 'g1s1',
      playerId: P1,
      propagation: { toTemplate: false, toOtherGames: false },
    });

    const tpl = s.template.slots[0];
    expect(tpl?.kind === 'seat' && tpl.playerId).toBeNull();
    const g2seat = s.games.find((g) => g.id === G2)?.slots[0];
    expect(g2seat?.kind === 'seat' && g2seat.playerId).toBeNull();
    const g1seat = s.games.find((g) => g.id === G1)?.slots[0];
    expect(g1seat?.kind === 'seat' && g1seat.playerId).toBe(P1);
  });

  it('assigning a seat auto-adds the player as a participant in the active game', () => {
    let s = setup();
    expect(s.games.find((g) => g.id === G1)?.participants).toEqual([]);
    s = playgroundReducer(s, {
      type: 'ASSIGN_GAME_SEAT',
      gameId: G1,
      slotId: 'g1s2',
      playerId: P2,
    });
    expect(s.games.find((g) => g.id === G1)?.participants.map((p) => p.playerId)).toEqual([P2]);
  });

  it('clears a player from prior seat in the same game on reseat', () => {
    let s = setup();
    s = playgroundReducer(s, {
      type: 'ASSIGN_GAME_SEAT',
      gameId: G1,
      slotId: 'g1s1',
      playerId: P1,
      propagation: { toTemplate: false, toOtherGames: false },
    });
    s = playgroundReducer(s, {
      type: 'ASSIGN_GAME_SEAT',
      gameId: G1,
      slotId: 'g1s3',
      playerId: P1,
      propagation: { toTemplate: false, toOtherGames: false },
    });
    const g1 = s.games.find((g) => g.id === G1)!;
    expect(g1.slots[0]?.kind === 'seat' && g1.slots[0].playerId).toBeNull();
    expect(g1.slots[2]?.kind === 'seat' && g1.slots[2].playerId).toBe(P1);
  });
});

describe('playgroundReducer — participants & characters', () => {
  function gameSetup(): PgSession {
    let s = withPlayers(P1, P2, P3);
    s = withThreeSeats(s);
    s = playgroundReducer(s, {
      type: 'CREATE_GAME',
      gameId: G1,
      name: 'G1',
      slotIdMap: { [S1]: 'g1s1', [S2]: 'g1s2', [S3]: 'g1s3' },
    });
    return s;
  }

  it('adds and removes participants; traveller flag', () => {
    let s = gameSetup();
    s = playgroundReducer(s, { type: 'ADD_PARTICIPANT', gameId: G1, playerId: P1 });
    s = playgroundReducer(s, {
      type: 'ADD_PARTICIPANT',
      gameId: G1,
      playerId: P2,
      isTraveller: true,
    });
    let g = s.games[0]!;
    expect(g.participants).toEqual([
      { playerId: P1, isTraveller: false },
      { playerId: P2, isTraveller: true },
    ]);

    s = playgroundReducer(s, {
      type: 'SET_PARTICIPANT_TRAVELLER',
      gameId: G1,
      playerId: P1,
      isTraveller: true,
    });
    g = s.games[0]!;
    expect(g.participants.find((p) => p.playerId === P1)?.isTraveller).toBe(true);

    s = playgroundReducer(s, { type: 'REMOVE_PARTICIPANT', gameId: G1, playerId: P1 });
    g = s.games[0]!;
    expect(g.participants.map((p) => p.playerId)).toEqual([P2]);
  });

  it('SET_PLAYER_COUNT_OVERRIDE accepts numbers and null', () => {
    let s = gameSetup();
    s = playgroundReducer(s, { type: 'SET_PLAYER_COUNT_OVERRIDE', gameId: G1, count: 9 });
    expect(s.games[0]?.playerCountOverride).toBe(9);
    s = playgroundReducer(s, { type: 'SET_PLAYER_COUNT_OVERRIDE', gameId: G1, count: null });
    expect(s.games[0]?.playerCountOverride).toBeNull();
  });

  it('ASSIGN_CHARACTER sets and clears', () => {
    let s = gameSetup();
    s = playgroundReducer(s, {
      type: 'ASSIGN_CHARACTER',
      gameId: G1,
      playerId: P1,
      characterId: 'imp',
    });
    expect(s.games[0]?.characterAssignments[P1]).toBe('imp');
    s = playgroundReducer(s, {
      type: 'ASSIGN_CHARACTER',
      gameId: G1,
      playerId: P1,
      characterId: null,
    });
    expect(s.games[0]?.characterAssignments[P1]).toBeUndefined();
  });
});

describe('playgroundReducer — preferences', () => {
  it('SET_PROPAGATION_DEFAULT merges partial updates', () => {
    let s = playgroundReducer(initialPgSession, {
      type: 'SET_PROPAGATION_DEFAULT',
      pref: { toTemplate: false },
    });
    expect(s.propagationDefault).toEqual({ toTemplate: false, toOtherGames: true });
    s = playgroundReducer(s, {
      type: 'SET_PROPAGATION_DEFAULT',
      pref: { toOtherGames: false },
    });
    expect(s.propagationDefault).toEqual({ toTemplate: false, toOtherGames: false });
  });
});

describe('playgroundReducer — round-1 feedback additions', () => {
  it('ADD_TEMPLATE_STORYTELLER appends a storyteller slot to template', () => {
    const s = playgroundReducer(initialPgSession, {
      type: 'ADD_TEMPLATE_STORYTELLER',
      slotId: 'st1',
    });
    expect(s.template.slots).toEqual([{ kind: 'storyteller', id: 'st1' }]);
  });

  it('ADD_TEMPLATE_STORYTELLER with gameSlotIds appends to specified games', () => {
    let s = withThreeSeats(withPlayers(P1));
    s = playgroundReducer(s, {
      type: 'CREATE_GAME',
      gameId: G1,
      name: 'G1',
      slotIdMap: { [S1]: 'g1s1', [S2]: 'g1s2', [S3]: 'g1s3' },
    });
    s = playgroundReducer(s, {
      type: 'ADD_TEMPLATE_STORYTELLER',
      slotId: 'st1',
      gameSlotIds: { [G1]: 'g1st1' },
    });
    expect(s.template.slots.at(-1)).toEqual({ kind: 'storyteller', id: 'st1' });
    const g1 = s.games.find((g) => g.id === G1)!;
    expect(g1.slots.at(-1)).toEqual({ kind: 'storyteller', id: 'g1st1' });
  });

  it('CREATE_GAME snapshots storyteller slots from template', () => {
    let s = playgroundReducer(initialPgSession, {
      type: 'ADD_TEMPLATE_SEAT',
      slotId: S1,
    });
    s = playgroundReducer(s, { type: 'ADD_TEMPLATE_STORYTELLER', slotId: 'st1' });
    s = playgroundReducer(s, {
      type: 'CREATE_GAME',
      gameId: G1,
      name: 'G1',
      slotIdMap: { [S1]: 'g1s1', st1: 'g1st1' },
    });
    expect(s.games[0]!.slots).toEqual([
      { kind: 'seat', id: 'g1s1', playerId: null },
      { kind: 'storyteller', id: 'g1st1' },
    ]);
  });

  it('MOVE_GAME_SLOT reorders within a single game when propagation disabled', () => {
    let s = withThreeSeats();
    s = playgroundReducer(s, {
      type: 'CREATE_GAME',
      gameId: G1,
      name: 'G1',
      slotIdMap: { [S1]: 'g1s1', [S2]: 'g1s2', [S3]: 'g1s3' },
    });
    s = playgroundReducer(s, {
      type: 'CREATE_GAME',
      gameId: G2,
      name: 'G2',
      slotIdMap: { [S1]: 'g2s1', [S2]: 'g2s2', [S3]: 'g2s3' },
    });
    s = playgroundReducer(s, {
      type: 'MOVE_GAME_SLOT',
      gameId: G1,
      slotId: 'g1s1',
      toIndex: 2,
      propagation: { toTemplate: false, toOtherGames: false },
    });
    expect(s.games.find((g) => g.id === G1)!.slots.map((x) => x.id)).toEqual([
      'g1s2',
      'g1s3',
      'g1s1',
    ]);
    // G2 untouched
    expect(s.games.find((g) => g.id === G2)!.slots.map((x) => x.id)).toEqual([
      'g2s1',
      'g2s2',
      'g2s3',
    ]);
    // Template untouched
    expect(s.template.slots.map((x) => x.id)).toEqual([S1, S2, S3]);
  });

  describe('MOVE_GAME_SLOT propagation', () => {
    function setupTwoGames(): PgSession {
      let s = withThreeSeats();
      s = playgroundReducer(s, {
        type: 'CREATE_GAME',
        gameId: G1,
        name: 'G1',
        slotIdMap: { [S1]: 'g1s1', [S2]: 'g1s2', [S3]: 'g1s3' },
      });
      s = playgroundReducer(s, {
        type: 'CREATE_GAME',
        gameId: G2,
        name: 'G2',
        slotIdMap: { [S1]: 'g2s1', [S2]: 'g2s2', [S3]: 'g2s3' },
      });
      return s;
    }

    it('propagates to template at same toIndex when toTemplate true', () => {
      let s = setupTwoGames();
      s = playgroundReducer(s, {
        type: 'MOVE_GAME_SLOT',
        gameId: G1,
        slotId: 'g1s1',
        toIndex: 2,
        propagation: { toTemplate: true, toOtherGames: false },
      });
      expect(s.template.slots.map((x) => x.id)).toEqual([S2, S3, S1]);
      // G2 untouched
      expect(s.games.find((g) => g.id === G2)!.slots.map((x) => x.id)).toEqual([
        'g2s1',
        'g2s2',
        'g2s3',
      ]);
    });

    it('propagates to other games at same toIndex when toOtherGames true', () => {
      let s = setupTwoGames();
      s = playgroundReducer(s, {
        type: 'MOVE_GAME_SLOT',
        gameId: G1,
        slotId: 'g1s1',
        toIndex: 2,
        propagation: { toTemplate: false, toOtherGames: true },
      });
      expect(s.games.find((g) => g.id === G2)!.slots.map((x) => x.id)).toEqual([
        'g2s2',
        'g2s3',
        'g2s1',
      ]);
      // Template untouched
      expect(s.template.slots.map((x) => x.id)).toEqual([S1, S2, S3]);
    });

    it('uses sticky propagationDefault when propagation omitted (both true by default)', () => {
      let s = setupTwoGames();
      s = playgroundReducer(s, {
        type: 'MOVE_GAME_SLOT',
        gameId: G1,
        slotId: 'g1s1',
        toIndex: 2,
      });
      expect(s.template.slots.map((x) => x.id)).toEqual([S2, S3, S1]);
      expect(s.games.find((g) => g.id === G2)!.slots.map((x) => x.id)).toEqual([
        'g2s2',
        'g2s3',
        'g2s1',
      ]);
    });
  });

  describe('REMOVE_GAME_SLOT propagation', () => {
    function setupTwoGames(): PgSession {
      let s = withThreeSeats(withPlayers(P1, P2, P3));
      s = playgroundReducer(s, {
        type: 'CREATE_GAME',
        gameId: G1,
        name: 'G1',
        slotIdMap: { [S1]: 'g1s1', [S2]: 'g1s2', [S3]: 'g1s3' },
      });
      s = playgroundReducer(s, {
        type: 'CREATE_GAME',
        gameId: G2,
        name: 'G2',
        slotIdMap: { [S1]: 'g2s1', [S2]: 'g2s2', [S3]: 'g2s3' },
      });
      return s;
    }

    it('removes only from the target game when both flags false', () => {
      let s = setupTwoGames();
      s = playgroundReducer(s, {
        type: 'REMOVE_GAME_SLOT',
        gameId: G1,
        slotId: 'g1s2',
        propagation: { toTemplate: false, toOtherGames: false },
      });
      expect(s.games.find((g) => g.id === G1)!.slots.map((x) => x.id)).toEqual(['g1s1', 'g1s3']);
      expect(s.games.find((g) => g.id === G2)!.slots.map((x) => x.id)).toEqual([
        'g2s1',
        'g2s2',
        'g2s3',
      ]);
      expect(s.template.slots.map((x) => x.id)).toEqual([S1, S2, S3]);
    });

    it('removes from template at same index when toTemplate=true', () => {
      let s = setupTwoGames();
      s = playgroundReducer(s, {
        type: 'REMOVE_GAME_SLOT',
        gameId: G1,
        slotId: 'g1s2',
        propagation: { toTemplate: true, toOtherGames: false },
      });
      expect(s.template.slots.map((x) => x.id)).toEqual([S1, S3]);
      expect(s.games.find((g) => g.id === G2)!.slots.map((x) => x.id)).toEqual([
        'g2s1',
        'g2s2',
        'g2s3',
      ]);
    });

    it('removes from other games at same index when toOtherGames=true', () => {
      let s = setupTwoGames();
      s = playgroundReducer(s, {
        type: 'REMOVE_GAME_SLOT',
        gameId: G1,
        slotId: 'g1s2',
        propagation: { toTemplate: false, toOtherGames: true },
      });
      expect(s.template.slots.map((x) => x.id)).toEqual([S1, S2, S3]);
      expect(s.games.find((g) => g.id === G2)!.slots.map((x) => x.id)).toEqual(['g2s1', 'g2s3']);
    });

    it('removes everywhere when both flags true', () => {
      let s = setupTwoGames();
      s = playgroundReducer(s, {
        type: 'REMOVE_GAME_SLOT',
        gameId: G1,
        slotId: 'g1s2',
        propagation: { toTemplate: true, toOtherGames: true },
      });
      expect(s.template.slots.map((x) => x.id)).toEqual([S1, S3]);
      expect(s.games.find((g) => g.id === G1)!.slots.map((x) => x.id)).toEqual(['g1s1', 'g1s3']);
      expect(s.games.find((g) => g.id === G2)!.slots.map((x) => x.id)).toEqual(['g2s1', 'g2s3']);
    });

    it('uses sticky propagationDefault when propagation omitted', () => {
      let s = setupTwoGames();
      s = playgroundReducer(s, {
        type: 'SET_PROPAGATION_DEFAULT',
        pref: { toTemplate: false, toOtherGames: false },
      });
      s = playgroundReducer(s, { type: 'REMOVE_GAME_SLOT', gameId: G1, slotId: 'g1s2' });
      expect(s.template.slots.map((x) => x.id)).toEqual([S1, S2, S3]);
      expect(s.games.find((g) => g.id === G2)!.slots).toHaveLength(3);
      expect(s.games.find((g) => g.id === G1)!.slots).toHaveLength(2);
    });
  });
});
