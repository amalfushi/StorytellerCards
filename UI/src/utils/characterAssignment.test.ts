import { describe, it, expect } from 'vitest';
import {
  apparentCharacterIdAfterAssignment,
  countCharacterCopies,
  filterPlayerAssignableCharacters,
  isCharacterUnavailableForAssignment,
  randomlyAssignCharacters,
} from './characterAssignment';
import type { CharacterDef, Participant, PlayerGameState, PlayerId } from '@/types/index';
import { Alignment } from '@/types/index';
import type { Distribution } from '@/data/playerCountRules';

function makeChar(id: string, type: CharacterDef['type']): CharacterDef {
  return {
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    type,
    defaultAlignment: type === 'Minion' || type === 'Demon' ? Alignment.Evil : Alignment.Good,
    abilityShort: `${id} ability`,
    firstNight: null,
    otherNights: null,
    icon: { placeholder: '#000' },
    reminders: [],
  };
}

function makeParticipant(index: number, isTraveller = false): Participant {
  return { playerId: `player-${index}`, isTraveller };
}

function makeState(overrides: Partial<PlayerGameState> = {}): PlayerGameState {
  return {
    characterId: '',
    alive: true,
    ghostVoteUsed: false,
    visibleAlignment: Alignment.Unknown,
    actualAlignment: Alignment.Unknown,
    startingAlignment: Alignment.Unknown,
    activeReminders: [],
    tokens: [],
    ...overrides,
  };
}

function makePlayerState(participants: Participant[]): Record<PlayerId, PlayerGameState> {
  return Object.fromEntries(participants.map((participant) => [participant.playerId, makeState()]));
}

function assignedStates(state: Record<PlayerId, PlayerGameState>): PlayerGameState[] {
  return Object.values(state).filter((player) => player.characterId !== '');
}

function makePool(): CharacterDef[] {
  return [
    ...Array.from({ length: 10 }, (_, i) => makeChar(`townsfolk${i + 1}`, 'Townsfolk')),
    ...Array.from({ length: 4 }, (_, i) => makeChar(`outsider${i + 1}`, 'Outsider')),
    ...Array.from({ length: 4 }, (_, i) => makeChar(`minion${i + 1}`, 'Minion')),
    ...Array.from({ length: 3 }, (_, i) => makeChar(`demon${i + 1}`, 'Demon')),
  ];
}

function assign(
  participants: Participant[],
  pool: CharacterDef[],
  distribution: Distribution,
): Record<PlayerId, PlayerGameState> {
  return randomlyAssignCharacters(participants, makePlayerState(participants), pool, distribution);
}

describe('filterPlayerAssignableCharacters', () => {
  it('excludes Travellers, Fabled, and Loric setup powers from player assignment pools', () => {
    const characters = [
      makeChar('noble', 'Townsfolk'),
      makeChar('imp', 'Demon'),
      makeChar('harlot', 'Traveller'),
      makeChar('angel', 'Fabled'),
      makeChar('stormcatcher', 'Loric'),
    ];

    expect(filterPlayerAssignableCharacters(characters).map((character) => character.id)).toEqual([
      'noble',
      'imp',
    ]);
  });

  describe('character assignment copy limits', () => {
    const participants = [makeParticipant(1), makeParticipant(2)];
    const playerState = {
      'player-1': makeState(),
      'player-2': makeState({ characterId: 'imp' }),
    };

    it('blocks a unique character already assigned to another participant', () => {
      const counts = countCharacterCopies([makeChar('imp', 'Demon')]);
      expect(
        isCharacterUnavailableForAssignment('imp', 'player-1', participants, playerState, counts),
      ).toBe(true);
    });

    it('allows the current assignment and available duplicate copies', () => {
      const counts = countCharacterCopies([makeChar('imp', 'Demon'), makeChar('imp', 'Demon')]);
      expect(
        isCharacterUnavailableForAssignment('imp', 'player-2', participants, playerState, counts),
      ).toBe(false);
      expect(
        isCharacterUnavailableForAssignment('imp', 'player-1', participants, playerState, counts),
      ).toBe(false);
    });
  });

  describe('apparentCharacterIdAfterAssignment', () => {
    it('preserves an apparent identity for concealment roles', () => {
      expect(apparentCharacterIdAfterAssignment('washerwoman', 'drunk')).toBe('washerwoman');
      expect(apparentCharacterIdAfterAssignment('empath', 'marionette')).toBe('empath');
    });

    it('clears stale apparent identity when clearing or changing to a normal role', () => {
      expect(apparentCharacterIdAfterAssignment('washerwoman', '')).toBe('');
      expect(apparentCharacterIdAfterAssignment('washerwoman', 'imp')).toBe('');
    });
  });
});

describe('randomlyAssignCharacters', () => {
  const pool = makePool();

  it('assigns correct counts for a 5-player distribution', () => {
    const distribution: Distribution = { townsfolk: 3, outsiders: 0, minions: 1, demons: 1 };
    const participants = Array.from({ length: 5 }, (_, i) => makeParticipant(i + 1));

    const result = assign(participants, pool, distribution);
    const assignedChars = assignedStates(result).map(
      (player) => pool.find((c) => c.id === player.characterId)!,
    );

    expect(assignedChars.filter((c) => c.type === 'Townsfolk')).toHaveLength(3);
    expect(assignedChars.filter((c) => c.type === 'Outsider')).toHaveLength(0);
    expect(assignedChars.filter((c) => c.type === 'Minion')).toHaveLength(1);
    expect(assignedChars.filter((c) => c.type === 'Demon')).toHaveLength(1);
  });

  it('assigns correct counts for a 10-player distribution', () => {
    const distribution: Distribution = { townsfolk: 7, outsiders: 0, minions: 2, demons: 1 };
    const participants = Array.from({ length: 10 }, (_, i) => makeParticipant(i + 1));

    const result = assign(participants, pool, distribution);
    const assignedChars = assignedStates(result).map(
      (player) => pool.find((c) => c.id === player.characterId)!,
    );

    expect(assignedChars.filter((c) => c.type === 'Townsfolk')).toHaveLength(7);
    expect(assignedChars.filter((c) => c.type === 'Minion')).toHaveLength(2);
    expect(assignedChars.filter((c) => c.type === 'Demon')).toHaveLength(1);
  });

  it('only assigns characters from the provided script', () => {
    const distribution: Distribution = { townsfolk: 3, outsiders: 1, minions: 1, demons: 1 };
    const participants = Array.from({ length: 6 }, (_, i) => makeParticipant(i + 1));
    const poolIds = new Set(pool.map((c) => c.id));

    for (const state of assignedStates(assign(participants, pool, distribution))) {
      expect(poolIds.has(state.characterId)).toBe(true);
    }
  });

  it('does not assign a character more than once', () => {
    const distribution: Distribution = { townsfolk: 5, outsiders: 2, minions: 1, demons: 1 };
    const participants = Array.from({ length: 9 }, (_, i) => makeParticipant(i + 1));

    const charIds = assignedStates(assign(participants, pool, distribution)).map(
      (p) => p.characterId,
    );

    expect(new Set(charIds).size).toBe(charIds.length);
  });

  it('returns state for the same player ids without mutating unrelated identity data', () => {
    const distribution: Distribution = { townsfolk: 3, outsiders: 0, minions: 1, demons: 1 };
    const participants = Array.from({ length: 5 }, (_, i) => makeParticipant(i + 1));

    const result = assign(participants, pool, distribution);

    expect(Object.keys(result)).toEqual(participants.map((participant) => participant.playerId));
    expect(assignedStates(result)).toHaveLength(5);
  });

  it('sets alignment to Evil for Minions and Demons', () => {
    const distribution: Distribution = { townsfolk: 3, outsiders: 0, minions: 1, demons: 1 };
    const participants = Array.from({ length: 5 }, (_, i) => makeParticipant(i + 1));

    for (const state of assignedStates(assign(participants, pool, distribution))) {
      const character = pool.find((c) => c.id === state.characterId)!;
      if (character.type === 'Minion' || character.type === 'Demon') {
        expect(state.actualAlignment).toBe(Alignment.Evil);
        expect(state.startingAlignment).toBe(Alignment.Evil);
      }
    }
  });

  it('sets alignment to Good for Townsfolk and Outsiders', () => {
    const distribution: Distribution = { townsfolk: 3, outsiders: 1, minions: 1, demons: 1 };
    const participants = Array.from({ length: 6 }, (_, i) => makeParticipant(i + 1));

    for (const state of assignedStates(assign(participants, pool, distribution))) {
      const character = pool.find((c) => c.id === state.characterId)!;
      if (character.type === 'Townsfolk' || character.type === 'Outsider') {
        expect(state.actualAlignment).toBe(Alignment.Good);
        expect(state.startingAlignment).toBe(Alignment.Good);
      }
    }
  });

  it('resets visible alignment and apparent character for assigned players', () => {
    const distribution: Distribution = { townsfolk: 3, outsiders: 0, minions: 1, demons: 1 };
    const participants = Array.from({ length: 5 }, (_, i) => makeParticipant(i + 1));
    const initialState = makePlayerState(participants);
    initialState['player-1'] = makeState({
      visibleAlignment: Alignment.Good,
      apparentCharacterId: 'drunk',
    });

    const result = randomlyAssignCharacters(participants, initialState, pool, distribution);

    for (const state of assignedStates(result)) {
      expect(state.visibleAlignment).toBe(Alignment.Unknown);
      expect(state.apparentCharacterId).toBe('');
    }
  });

  it('handles minimum players', () => {
    const distribution: Distribution = { townsfolk: 3, outsiders: 0, minions: 1, demons: 1 };
    const participants = Array.from({ length: 5 }, (_, i) => makeParticipant(i + 1));

    expect(assignedStates(assign(participants, pool, distribution))).toHaveLength(5);
  });

  it('handles maximum players', () => {
    const distribution: Distribution = { townsfolk: 9, outsiders: 2, minions: 3, demons: 1 };
    const participants = Array.from({ length: 15 }, (_, i) => makeParticipant(i + 1));

    expect(assignedStates(assign(participants, pool, distribution))).toHaveLength(15);
  });

  it('assigns best-effort and leaves players unassigned when pool lacks Townsfolk', () => {
    const smallPool = [makeChar('townsfolk1', 'Townsfolk'), makeChar('demon1', 'Demon')];
    const distribution: Distribution = { townsfolk: 3, outsiders: 0, minions: 0, demons: 1 };
    const participants = Array.from({ length: 4 }, (_, i) => makeParticipant(i + 1));

    const result = assign(participants, smallPool, distribution);
    const assigned = assignedStates(result);
    expect(assigned.length).toBe(2);
    expect(assigned.map((p) => p.characterId).sort()).toEqual(['demon1', 'townsfolk1']);
  });

  it('assigns best-effort and leaves players unassigned when pool lacks Outsiders', () => {
    const smallPool = [makeChar('townsfolk1', 'Townsfolk'), makeChar('demon1', 'Demon')];
    const distribution: Distribution = { townsfolk: 1, outsiders: 2, minions: 0, demons: 1 };
    const participants = Array.from({ length: 4 }, (_, i) => makeParticipant(i + 1));

    const result = assign(participants, smallPool, distribution);
    const assigned = assignedStates(result);
    expect(assigned.length).toBe(2);
  });

  it('assigns best-effort and leaves players unassigned when pool lacks Minions', () => {
    const smallPool = [makeChar('townsfolk1', 'Townsfolk'), makeChar('demon1', 'Demon')];
    const distribution: Distribution = { townsfolk: 1, outsiders: 0, minions: 2, demons: 1 };
    const participants = Array.from({ length: 4 }, (_, i) => makeParticipant(i + 1));

    const result = assign(participants, smallPool, distribution);
    const assigned = assignedStates(result);
    expect(assigned.length).toBe(2);
  });

  it('assigns best-effort and leaves players unassigned when pool lacks Demons', () => {
    const smallPool = [makeChar('townsfolk1', 'Townsfolk')];
    const distribution: Distribution = { townsfolk: 1, outsiders: 0, minions: 0, demons: 1 };
    const participants = Array.from({ length: 2 }, (_, i) => makeParticipant(i + 1));

    const result = assign(participants, smallPool, distribution);
    const assigned = assignedStates(result);
    expect(assigned.length).toBe(1);
    expect(assigned[0].characterId).toBe('townsfolk1');
  });

  it('produces valid distributions across multiple random runs', () => {
    const distribution: Distribution = { townsfolk: 3, outsiders: 1, minions: 1, demons: 1 };
    const participants = Array.from({ length: 6 }, (_, i) => makeParticipant(i + 1));
    const poolIds = new Set(pool.map((c) => c.id));

    for (let run = 0; run < 10; run += 1) {
      const charIds = assignedStates(assign(participants, pool, distribution)).map(
        (p) => p.characterId,
      );
      const assignedChars = charIds.map((id) => pool.find((c) => c.id === id)!);

      expect(new Set(charIds).size).toBe(charIds.length);
      charIds.forEach((id) => expect(poolIds.has(id)).toBe(true));
      expect(assignedChars.filter((c) => c.type === 'Townsfolk')).toHaveLength(3);
      expect(assignedChars.filter((c) => c.type === 'Outsider')).toHaveLength(1);
      expect(assignedChars.filter((c) => c.type === 'Minion')).toHaveLength(1);
      expect(assignedChars.filter((c) => c.type === 'Demon')).toHaveLength(1);
    }
  });

  it('skips traveller participants during assignment', () => {
    const distribution: Distribution = { townsfolk: 3, outsiders: 0, minions: 1, demons: 1 };
    const participants = [
      makeParticipant(1),
      makeParticipant(2),
      makeParticipant(3, true),
      makeParticipant(4),
      makeParticipant(5),
      makeParticipant(6),
    ];

    const result = assign(participants, pool, distribution);

    expect(result['player-3'].characterId).toBe('');
    expect(assignedStates(result)).toHaveLength(5);
  });
});
