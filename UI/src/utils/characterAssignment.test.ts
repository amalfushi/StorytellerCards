import { describe, it, expect } from 'vitest';
import { randomlyAssignCharacters } from './characterAssignment';
import type { CharacterDef, PlayerSeat } from '@/types/index';
import { Alignment } from '@/types/index';
import type { Distribution } from '@/data/playerCountRules';

// ── Factory helpers ──

/** Create a minimal CharacterDef. */
function makeChar(id: string, type: CharacterDef['type']): CharacterDef {
  return {
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    type,
    defaultAlignment: type === 'Minion' || type === 'Demon' ? 'Evil' : 'Good',
    abilityShort: `${id} ability`,
    firstNight: null,
    otherNights: null,
    icon: { placeholder: '#000' },
    reminders: [],
  };
}

/** Create a minimal PlayerSeat. */
function makePlayer(
  seat: number,
  opts: { isTraveller?: boolean; characterId?: string } = {},
): PlayerSeat {
  return {
    seat,
    playerName: `Player ${seat}`,
    characterId: opts.characterId ?? '',
    alive: true,
    ghostVoteUsed: false,
    visibleAlignment: Alignment.Unknown,
    actualAlignment: Alignment.Unknown,
    startingAlignment: Alignment.Unknown,
    activeReminders: [],
    isTraveller: opts.isTraveller ?? false,
    tokens: [],
  };
}

/** Create a standard pool of script characters for testing. */
function makePool(): CharacterDef[] {
  return [
    // Townsfolk (10)
    makeChar('townsfolk1', 'Townsfolk'),
    makeChar('townsfolk2', 'Townsfolk'),
    makeChar('townsfolk3', 'Townsfolk'),
    makeChar('townsfolk4', 'Townsfolk'),
    makeChar('townsfolk5', 'Townsfolk'),
    makeChar('townsfolk6', 'Townsfolk'),
    makeChar('townsfolk7', 'Townsfolk'),
    makeChar('townsfolk8', 'Townsfolk'),
    makeChar('townsfolk9', 'Townsfolk'),
    makeChar('townsfolk10', 'Townsfolk'),
    // Outsiders (4)
    makeChar('outsider1', 'Outsider'),
    makeChar('outsider2', 'Outsider'),
    makeChar('outsider3', 'Outsider'),
    makeChar('outsider4', 'Outsider'),
    // Minions (4)
    makeChar('minion1', 'Minion'),
    makeChar('minion2', 'Minion'),
    makeChar('minion3', 'Minion'),
    makeChar('minion4', 'Minion'),
    // Demons (3)
    makeChar('demon1', 'Demon'),
    makeChar('demon2', 'Demon'),
    makeChar('demon3', 'Demon'),
  ];
}

// ── Tests ──

describe('randomlyAssignCharacters', () => {
  const pool = makePool();

  describe('correct number of characters per type', () => {
    it('assigns correct counts for 5-player distribution', () => {
      const dist: Distribution = { townsfolk: 3, outsiders: 0, minions: 1, demons: 1 };
      const players = Array.from({ length: 5 }, (_, i) => makePlayer(i + 1));

      const result = randomlyAssignCharacters(players, pool, dist);
      const assigned = result.filter((p) => p.characterId !== '');

      expect(assigned).toHaveLength(5);

      const assignedChars = assigned.map((p) => pool.find((c) => c.id === p.characterId)!);
      const townsfolk = assignedChars.filter((c) => c.type === 'Townsfolk');
      const outsiders = assignedChars.filter((c) => c.type === 'Outsider');
      const minions = assignedChars.filter((c) => c.type === 'Minion');
      const demons = assignedChars.filter((c) => c.type === 'Demon');

      expect(townsfolk).toHaveLength(3);
      expect(outsiders).toHaveLength(0);
      expect(minions).toHaveLength(1);
      expect(demons).toHaveLength(1);
    });

    it('assigns correct counts for 10-player distribution', () => {
      const dist: Distribution = { townsfolk: 7, outsiders: 0, minions: 2, demons: 1 };
      const players = Array.from({ length: 10 }, (_, i) => makePlayer(i + 1));

      const result = randomlyAssignCharacters(players, pool, dist);
      const assigned = result.filter((p) => p.characterId !== '');

      expect(assigned).toHaveLength(10);

      const assignedChars = assigned.map((p) => pool.find((c) => c.id === p.characterId)!);
      const townsfolk = assignedChars.filter((c) => c.type === 'Townsfolk');
      const minions = assignedChars.filter((c) => c.type === 'Minion');
      const demons = assignedChars.filter((c) => c.type === 'Demon');

      expect(townsfolk).toHaveLength(7);
      expect(minions).toHaveLength(2);
      expect(demons).toHaveLength(1);
    });
  });

  it('all assigned characters come from the provided script', () => {
    const dist: Distribution = { townsfolk: 3, outsiders: 1, minions: 1, demons: 1 };
    const players = Array.from({ length: 6 }, (_, i) => makePlayer(i + 1));
    const poolIds = new Set(pool.map((c) => c.id));

    const result = randomlyAssignCharacters(players, pool, dist);

    result.forEach((p) => {
      if (p.characterId !== '') {
        expect(poolIds.has(p.characterId)).toBe(true);
      }
    });
  });

  it('no character is assigned more than once', () => {
    const dist: Distribution = { townsfolk: 5, outsiders: 2, minions: 1, demons: 1 };
    const players = Array.from({ length: 9 }, (_, i) => makePlayer(i + 1));

    const result = randomlyAssignCharacters(players, pool, dist);
    const charIds = result.map((p) => p.characterId).filter((id) => id !== '');
    const unique = new Set(charIds);

    expect(unique.size).toBe(charIds.length);
  });

  it('returns PlayerSeat[] with same length as input', () => {
    const dist: Distribution = { townsfolk: 3, outsiders: 0, minions: 1, demons: 1 };
    const players = Array.from({ length: 5 }, (_, i) => makePlayer(i + 1));

    const result = randomlyAssignCharacters(players, pool, dist);

    expect(result).toHaveLength(players.length);
    result.forEach((p) => {
      expect(p).toHaveProperty('seat');
      expect(p).toHaveProperty('playerName');
      expect(p).toHaveProperty('characterId');
      expect(p).toHaveProperty('alive');
    });
  });

  it('sets alignment to Evil for Minions and Demons', () => {
    const dist: Distribution = { townsfolk: 3, outsiders: 0, minions: 1, demons: 1 };
    const players = Array.from({ length: 5 }, (_, i) => makePlayer(i + 1));

    const result = randomlyAssignCharacters(players, pool, dist);

    result.forEach((p) => {
      if (p.characterId === '') return;
      const char = pool.find((c) => c.id === p.characterId)!;
      if (char.type === 'Minion' || char.type === 'Demon') {
        expect(p.actualAlignment).toBe(Alignment.Evil);
        expect(p.startingAlignment).toBe(Alignment.Evil);
      }
    });
  });

  it('sets alignment to Good for Townsfolk and Outsiders', () => {
    const dist: Distribution = { townsfolk: 3, outsiders: 1, minions: 1, demons: 1 };
    const players = Array.from({ length: 6 }, (_, i) => makePlayer(i + 1));

    const result = randomlyAssignCharacters(players, pool, dist);

    result.forEach((p) => {
      if (p.characterId === '') return;
      const char = pool.find((c) => c.id === p.characterId)!;
      if (char.type === 'Townsfolk' || char.type === 'Outsider') {
        expect(p.actualAlignment).toBe(Alignment.Good);
        expect(p.startingAlignment).toBe(Alignment.Good);
      }
    });
  });

  it('sets visibleAlignment to Unknown for all assigned players', () => {
    const dist: Distribution = { townsfolk: 3, outsiders: 0, minions: 1, demons: 1 };
    const players = Array.from({ length: 5 }, (_, i) => makePlayer(i + 1));

    const result = randomlyAssignCharacters(players, pool, dist);

    result.forEach((p) => {
      if (p.characterId !== '') {
        expect(p.visibleAlignment).toBe(Alignment.Unknown);
      }
    });
  });

  it('handles minimum players (5)', () => {
    const dist: Distribution = { townsfolk: 3, outsiders: 0, minions: 1, demons: 1 };
    const players = Array.from({ length: 5 }, (_, i) => makePlayer(i + 1));

    const result = randomlyAssignCharacters(players, pool, dist);
    const assigned = result.filter((p) => p.characterId !== '');

    expect(assigned).toHaveLength(5);
  });

  it('handles maximum players (15)', () => {
    const dist: Distribution = { townsfolk: 9, outsiders: 2, minions: 3, demons: 1 };
    const players = Array.from({ length: 15 }, (_, i) => makePlayer(i + 1));

    const result = randomlyAssignCharacters(players, pool, dist);
    const assigned = result.filter((p) => p.characterId !== '');

    expect(assigned).toHaveLength(15);
  });

  it('throws when there are not enough Townsfolk in the pool', () => {
    const smallPool = [makeChar('townsfolk1', 'Townsfolk'), makeChar('demon1', 'Demon')];
    const dist: Distribution = { townsfolk: 3, outsiders: 0, minions: 0, demons: 1 };
    const players = Array.from({ length: 4 }, (_, i) => makePlayer(i + 1));

    expect(() => randomlyAssignCharacters(players, smallPool, dist)).toThrow('Not enough Townsfolk');
  });

  it('throws when there are not enough Outsiders in the pool', () => {
    const smallPool = [
      makeChar('townsfolk1', 'Townsfolk'),
      makeChar('demon1', 'Demon'),
    ];
    const dist: Distribution = { townsfolk: 1, outsiders: 2, minions: 0, demons: 1 };
    const players = Array.from({ length: 4 }, (_, i) => makePlayer(i + 1));

    expect(() => randomlyAssignCharacters(players, smallPool, dist)).toThrow('Not enough Outsiders');
  });

  it('throws when there are not enough Minions in the pool', () => {
    const smallPool = [
      makeChar('townsfolk1', 'Townsfolk'),
      makeChar('demon1', 'Demon'),
    ];
    const dist: Distribution = { townsfolk: 1, outsiders: 0, minions: 2, demons: 1 };
    const players = Array.from({ length: 4 }, (_, i) => makePlayer(i + 1));

    expect(() => randomlyAssignCharacters(players, smallPool, dist)).toThrow('Not enough Minions');
  });

  it('throws when there are not enough Demons in the pool', () => {
    const smallPool = [makeChar('townsfolk1', 'Townsfolk')];
    const dist: Distribution = { townsfolk: 1, outsiders: 0, minions: 0, demons: 1 };
    const players = Array.from({ length: 2 }, (_, i) => makePlayer(i + 1));

    expect(() => randomlyAssignCharacters(players, smallPool, dist)).toThrow('Not enough Demons');
  });

  it('random assignment produces valid distributions across multiple runs', () => {
    const dist: Distribution = { townsfolk: 3, outsiders: 1, minions: 1, demons: 1 };
    const players = Array.from({ length: 6 }, (_, i) => makePlayer(i + 1));

    // Run 10 times and verify invariants each time
    for (let run = 0; run < 10; run++) {
      const result = randomlyAssignCharacters(players, pool, dist);
      const charIds = result.map((p) => p.characterId).filter((id) => id !== '');

      // No duplicates
      expect(new Set(charIds).size).toBe(charIds.length);

      // All from pool
      const poolIds = new Set(pool.map((c) => c.id));
      charIds.forEach((id) => expect(poolIds.has(id)).toBe(true));

      // Correct type counts
      const assignedChars = charIds.map((id) => pool.find((c) => c.id === id)!);
      expect(assignedChars.filter((c) => c.type === 'Townsfolk')).toHaveLength(3);
      expect(assignedChars.filter((c) => c.type === 'Outsider')).toHaveLength(1);
      expect(assignedChars.filter((c) => c.type === 'Minion')).toHaveLength(1);
      expect(assignedChars.filter((c) => c.type === 'Demon')).toHaveLength(1);
    }
  });

  it('skips traveller players during assignment', () => {
    const dist: Distribution = { townsfolk: 3, outsiders: 0, minions: 1, demons: 1 };
    const players = [
      makePlayer(1),
      makePlayer(2),
      makePlayer(3, { isTraveller: true }),
      makePlayer(4),
      makePlayer(5),
      makePlayer(6),
    ];

    const result = randomlyAssignCharacters(players, pool, dist);
    const traveller = result.find((p) => p.seat === 3)!;

    expect(traveller.isTraveller).toBe(true);
    // Traveller should not get a character from the distribution
    expect(traveller.characterId).toBe('');
  });

  it('preserves seat numbers and player names', () => {
    const dist: Distribution = { townsfolk: 3, outsiders: 0, minions: 1, demons: 1 };
    const players = Array.from({ length: 5 }, (_, i) => makePlayer(i + 1));

    const result = randomlyAssignCharacters(players, pool, dist);

    result.forEach((p, i) => {
      expect(p.seat).toBe(i + 1);
      expect(p.playerName).toBe(`Player ${i + 1}`);
    });
  });
});
