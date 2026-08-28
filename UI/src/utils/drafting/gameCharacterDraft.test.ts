import { describe, expect, it } from 'vitest';
import { CharacterType } from '@/types/index.ts';
import { DraftSetupMode } from '@/utils/drafting/draftRules.ts';
import {
  createGameCharacterDraft,
  getHiddenOutsiderRolls,
  maskDraftOfferIdentities,
  regenerateGameCharacterDraftOffer,
  resolveGameCharacterDraft,
  selectGameCharacterDraftPlayer,
  upgradeLegacyGameCharacterDraft,
  updateGameCharacterDraftSetup,
} from '@/utils/drafting/gameCharacterDraft.ts';
import type { DraftSessionConfig } from '@/utils/drafting/draftSession.ts';
import type { DraftCharacter } from '@/utils/drafting/draftFeasibility.ts';
import type { CharacterDraftState } from '@/types/index.ts';

const config: DraftSessionConfig = {
  playerCount: 5,
  setupMode: DraftSetupMode.Standard,
  scriptCharacters: [
    ...Array.from({ length: 6 }, (_, index) => ({
      id: `t${index}`,
      type: CharacterType.Townsfolk,
    })),
    { id: 'o1', type: CharacterType.Outsider },
    { id: 'm1', type: CharacterType.Minion },
    { id: 'm2', type: CharacterType.Minion },
    { id: 'd1', type: CharacterType.Demon },
    { id: 'd2', type: CharacterType.Demon },
  ],
};

function completeDraft(configToComplete: DraftSessionConfig): CharacterDraftState {
  const playerIds = Array.from(
    { length: configToComplete.playerCount },
    (_, index) => `p${index + 1}`,
  );
  let state = createGameCharacterDraft(playerIds, configToComplete, () => 0.37);
  while (state.status === 'drafting') {
    const playerId = state.playerOrder.find(
      (candidateId) =>
        !state.entries.some(
          (entry) => entry.playerId === candidateId && entry.actualCharacterId !== undefined,
        ),
    );
    if (!playerId) throw new Error('Expected an unresolved player.');
    state = selectGameCharacterDraftPlayer(state, configToComplete, playerId, () => 0.37);
    const entry = state.entries.find((candidate) => candidate.playerId === playerId);
    if (!entry) throw new Error('Expected an active draft entry.');
    state = resolveGameCharacterDraft(
      state,
      configToComplete,
      entry.offer.offeredCharacterIds[0],
      'choice',
      () => 0.37,
    );
  }
  return state;
}

function exceptionalConfig(
  setupMode: DraftSetupMode,
  exceptionalCharacter: DraftCharacter,
): DraftSessionConfig {
  return {
    playerCount: 7,
    setupMode,
    scriptCharacters: [
      ...Array.from({ length: 8 }, (_, index) => ({
        id: `town${index}`,
        type: CharacterType.Townsfolk,
      })),
      ...Array.from({ length: 4 }, (_, index) => ({
        id: `outsider${index}`,
        type: CharacterType.Outsider,
      })),
      ...Array.from({ length: 4 }, (_, index) => ({
        id: `minion${index}`,
        type: CharacterType.Minion,
      })),
      ...Array.from({ length: 3 }, (_, index) => ({
        id: `demon${index}`,
        type: CharacterType.Demon,
      })),
      exceptionalCharacter,
    ],
  };
}

function lleechAndLegionConfig(): DraftSessionConfig {
  const base = exceptionalConfig(DraftSetupMode.Standard, {
    id: 'legion',
    type: CharacterType.Demon,
  });
  return {
    ...base,
    playerCount: 10,
    presentationMode: 'secret-two-types',
    scriptCharacters: [
      ...base.scriptCharacters.filter((character) => character.type !== CharacterType.Demon),
      { id: 'lleech', type: CharacterType.Demon },
      { id: 'legion', type: CharacterType.Demon },
    ],
  };
}

function marionetteRollConfig(): DraftSessionConfig {
  return {
    playerCount: 10,
    setupMode: DraftSetupMode.Standard,
    presentationMode: 'secret-two-types',
    scriptCharacters: [
      ...Array.from({ length: 13 }, (_, index) => ({
        id: `town${index}`,
        type: CharacterType.Townsfolk,
      })),
      { id: 'drunk', type: CharacterType.Outsider },
      { id: 'outsider1', type: CharacterType.Outsider },
      { id: 'baron', type: CharacterType.Minion },
      { id: 'cerenovus', type: CharacterType.Minion },
      { id: 'scarletwoman', type: CharacterType.Minion },
      { id: 'marionette', type: CharacterType.Minion },
      { id: 'imp', type: CharacterType.Demon },
      { id: 'fanggu', type: CharacterType.Demon },
      { id: 'nodashii', type: CharacterType.Demon },
    ],
  };
}

function openMarionetteRollConfig(): DraftSessionConfig {
  return {
    ...marionetteRollConfig(),
    presentationMode: 'open',
  };
}

function outsiderHiddenRollConfig(playerCount = 12): DraftSessionConfig {
  return {
    playerCount,
    setupMode: DraftSetupMode.Standard,
    presentationMode: 'secret-two-types',
    scriptCharacters: [
      ...Array.from({ length: 13 }, (_, index) => ({
        id: `town${index}`,
        type: CharacterType.Townsfolk,
      })),
      { id: 'butler', type: CharacterType.Outsider },
      { id: 'recluse', type: CharacterType.Outsider },
      { id: 'saint', type: CharacterType.Outsider },
      { id: 'drunk', type: CharacterType.Outsider },
      { id: 'lunatic', type: CharacterType.Outsider },
      { id: 'baron', type: CharacterType.Minion },
      { id: 'poisoner', type: CharacterType.Minion },
      { id: 'scarletwoman', type: CharacterType.Minion },
      { id: 'imp', type: CharacterType.Demon },
      { id: 'fanggu', type: CharacterType.Demon },
      { id: 'nodashii', type: CharacterType.Demon },
      { id: 'vortox', type: CharacterType.Demon },
    ],
  };
}

function troubleBrewingHiddenRollConfig(): DraftSessionConfig {
  const rollConfig = outsiderHiddenRollConfig();
  return {
    ...rollConfig,
    scriptCharacters: rollConfig.scriptCharacters.filter((character) => character.id !== 'lunatic'),
  };
}

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

function createDraftWithHiddenOutsider(
  rollConfig: DraftSessionConfig,
  hiddenCharacterId: 'drunk' | 'lunatic',
): CharacterDraftState {
  const playerIds = Array.from({ length: rollConfig.playerCount }, (_, index) => `p${index + 1}`);
  for (let seed = 1; seed <= 1_000; seed += 1) {
    const state = createGameCharacterDraft(playerIds, rollConfig, seededRandom(seed));
    if (getHiddenOutsiderRolls(state).some((roll) => roll.characterId === hiddenCharacterId)) {
      return state;
    }
  }
  throw new Error(`Could not produce a ${hiddenCharacterId} reservation.`);
}

describe('gameCharacterDraft', () => {
  it('resets legacy offers before initializing controlled hidden-character rolls', () => {
    const rollConfig = marionetteRollConfig();
    const legacyState: CharacterDraftState = {
      status: 'drafting',
      setupMode: DraftSetupMode.Standard,
      presentationMode: 'open',
      playerOrder: Array.from({ length: rollConfig.playerCount }, (_, index) => `p${index + 1}`),
      currentPlayerIndex: 0,
      activePlayerId: 'p2',
      entries: [
        {
          playerId: 'p1',
          offer: {
            offeredCharacterIds: ['t1', 't2', 't3'],
            mulliganCharacterId: 't4',
            rolledCharacterTypes: [CharacterType.Townsfolk],
            legalCandidateCount: 4,
            actualCharacterIdsByOfferedId: {
              t1: 'marionette',
              t2: 'marionette',
              t3: 'marionette',
              t4: 'marionette',
            },
          },
        },
        {
          playerId: 'p2',
          offer: {
            offeredCharacterIds: ['t2', 't3', 't4'],
            mulliganCharacterId: 't5',
            rolledCharacterTypes: [CharacterType.Townsfolk],
            legalCandidateCount: 4,
            actualCharacterIdsByOfferedId: {
              t2: 'marionette',
              t3: 'marionette',
              t4: 'marionette',
              t5: 'marionette',
            },
          },
        },
      ],
      revision: 7,
    };

    const upgraded = upgradeLegacyGameCharacterDraft(legacyState, rollConfig, () => 0);

    expect(upgraded.revision).toBe(8);
    expect(upgraded.entries).toEqual([]);
    expect(upgraded.activePlayerId).toBeUndefined();
    expect(upgraded.plannedCharacterTypes).toBeDefined();
    expect(upgraded.marionetteRoll).toBeDefined();
  });

  it('leaves current controlled drafts unchanged', () => {
    const rollConfig = marionetteRollConfig();
    const current = createGameCharacterDraft(
      Array.from({ length: rollConfig.playerCount }, (_, index) => `p${index + 1}`),
      rollConfig,
      () => 0,
    );

    expect(upgradeLegacyGameCharacterDraft(current, rollConfig, () => 0.9)).toBe(current);
  });

  it('extends a legacy single Outsider roll to cover every existing Outsider slot', () => {
    const rollConfig = outsiderHiddenRollConfig();
    const current = createGameCharacterDraft(
      Array.from({ length: rollConfig.playerCount }, (_, index) => `p${index + 1}`),
      rollConfig,
      seededRandom(1),
    );
    const legacyRoll = current.outsiderCharacterRolls?.[0];
    if (!legacyRoll) throw new Error('Expected an initial Outsider roll.');
    const legacyState: CharacterDraftState = {
      ...current,
      outsiderCharacterRolls: undefined,
      outsiderHiddenRoll: legacyRoll,
    };

    const upgraded = upgradeLegacyGameCharacterDraft(legacyState, rollConfig, seededRandom(2));

    expect(upgraded.outsiderHiddenRoll).toBeUndefined();
    expect(upgraded.outsiderCharacterRolls).toHaveLength(2);
    expect(upgraded.outsiderCharacterRolls?.[0]).toEqual(legacyRoll);
  });

  it('regenerates an empty blocked draft when the current character pool is feasible', () => {
    const current = createGameCharacterDraft(['p1', 'p2', 'p3', 'p4', 'p5'], config, () => 0);
    const staleBlocked = {
      ...current,
      status: 'blocked' as const,
      blockedReason: 'No character leaves a legal completion from this draft state.',
      revision: 4,
    };

    const upgraded = upgradeLegacyGameCharacterDraft(staleBlocked, config, () => 0);

    expect(upgraded.status).toBe('drafting');
    expect(upgraded.blockedReason).toBeUndefined();
    expect(upgraded.revision).toBe(5);
  });

  it('starts with every player available for Storyteller-selected drafting', () => {
    const state = createGameCharacterDraft(['p1', 'p2', 'p3', 'p4', 'p5'], config, () => 0);

    expect(state.playerOrder).toEqual(['p1', 'p2', 'p3', 'p4', 'p5']);
    expect(state.entries).toEqual([]);
    expect(state.activePlayerId).toBeUndefined();

    const selected = selectGameCharacterDraftPlayer(state, config, 'p3', () => 0);
    expect(selected.activePlayerId).toBe('p3');
    expect(selected.entries[0].playerId).toBe('p3');
    expect(selected.entries[0].offer.legalCandidateCount).toBeGreaterThan(0);
  });

  it('discards stale previews while preserving resolved drafts and hidden reservations', () => {
    const rollConfig = outsiderHiddenRollConfig();
    let state = createDraftWithHiddenOutsider(rollConfig, 'drunk');
    const drunkRoll = getHiddenOutsiderRolls(state).find((roll) => roll.characterId === 'drunk');
    if (!drunkRoll) throw new Error('Expected a reserved Drunk player.');
    const ordinaryPlayerIds = state.playerOrder.filter(
      (playerId) => playerId !== drunkRoll.playerId,
    );

    state = selectGameCharacterDraftPlayer(state, rollConfig, ordinaryPlayerIds[0], () => 0.5);
    const resolvedCharacterId = state.entries[0].offer.offeredCharacterIds[0];
    state = resolveGameCharacterDraft(state, rollConfig, resolvedCharacterId, 'choice', () => 0.5);
    const persistedOutsiderRolls = state.outsiderCharacterRolls;

    state = selectGameCharacterDraftPlayer(state, rollConfig, drunkRoll.playerId, () => 0.5);
    expect(
      Object.values(state.entries.at(-1)?.offer.actualCharacterIdsByOfferedId ?? {}),
    ).toContain('drunk');

    state = selectGameCharacterDraftPlayer(state, rollConfig, ordinaryPlayerIds[1], () => 0.5);

    expect(state.outsiderCharacterRolls).toEqual(persistedOutsiderRolls);
    expect(state.entries).toHaveLength(2);
    expect(state.entries[0]).toEqual(
      expect.objectContaining({
        playerId: ordinaryPlayerIds[0],
        actualCharacterId: expect.any(String),
      }),
    );
    expect(state.entries[1].playerId).toBe(ordinaryPlayerIds[1]);
    expect(state.entries[1].actualCharacterId).toBeUndefined();
    expect(Object.values(state.entries[1].offer.actualCharacterIdsByOfferedId ?? {})).not.toContain(
      'drunk',
    );
  });

  it('preplans the exact remaining type distribution for secret single-type drafts', () => {
    const secretConfig: DraftSessionConfig = {
      ...config,
      presentationMode: 'secret-single-type',
    };
    const state = createGameCharacterDraft(['p1', 'p2', 'p3', 'p4', 'p5'], secretConfig, () => 0);
    const plannedTypes = Object.values(state.plannedCharacterTypes ?? {}).flat();

    expect(plannedTypes).toHaveLength(5);
    expect(plannedTypes.filter((type) => type === CharacterType.Townsfolk)).toHaveLength(3);
    expect(plannedTypes.filter((type) => type === CharacterType.Minion)).toHaveLength(1);
    expect(plannedTypes.filter((type) => type === CharacterType.Demon)).toHaveLength(1);
  });

  it('persists one script Minion roll against one primary Minion player', () => {
    const rollConfig = marionetteRollConfig();
    const state = createGameCharacterDraft(
      Array.from({ length: 10 }, (_, index) => `p${index + 1}`),
      rollConfig,
      () => 0.999,
    );

    expect(state.marionetteRoll?.characterId).toBe('marionette');
    expect(state.plannedCharacterTypes?.[state.marionetteRoll!.playerId]?.[0]).toBe(
      CharacterType.Minion,
    );
  });

  it('rolls Marionette at approximately one in four games on a four-Minion script', () => {
    const rollConfig = openMarionetteRollConfig();
    const playerIds = Array.from({ length: 10 }, (_, index) => `p${index + 1}`);
    const gameCount = 200;
    const marionetteGameCount = Array.from({ length: gameCount }, (_, index) =>
      createGameCharacterDraft(playerIds, rollConfig, seededRandom(index + 1)),
    ).filter((state) => state.marionetteRoll?.characterId === 'marionette').length;

    expect(marionetteGameCount).toBeGreaterThanOrEqual(35);
    expect(marionetteGameCount).toBeLessThanOrEqual(65);
  });

  it('preserves the Marionette reservation while other players use open offers', () => {
    const rollConfig = openMarionetteRollConfig();
    const playerIds = Array.from({ length: 10 }, (_, index) => `p${index + 1}`);
    let state = createGameCharacterDraft(playerIds, rollConfig, () => 0.999);
    const reservedPlayerId = state.marionetteRoll?.playerId;
    expect(state.marionetteRoll?.characterId).toBe('marionette');
    if (!reservedPlayerId) throw new Error('Expected a reserved Marionette player.');

    for (const playerId of playerIds.filter((id) => id !== reservedPlayerId)) {
      state = selectGameCharacterDraftPlayer(state, rollConfig, playerId, () => 0.999);
      const entry = state.entries.find((candidate) => candidate.playerId === playerId);
      if (!entry) {
        throw new Error(
          `Expected an offer for ${playerId}; status=${state.status}, reason=${state.blockedReason}, committed=${state.entries
            .map((candidate) => candidate.actualCharacterId)
            .filter(Boolean)
            .join(',')}, hidden=${JSON.stringify(getHiddenOutsiderRolls(state))}.`,
        );
      }
      expect(entry.offer.rolledCharacterTypes).toEqual([]);
      state = resolveGameCharacterDraft(
        state,
        rollConfig,
        entry.offer.offeredCharacterIds[0],
        'choice',
        () => 0.999,
      );
    }

    state = selectGameCharacterDraftPlayer(state, rollConfig, reservedPlayerId, () => 0.5);
    const reservedEntry = state.entries.find((entry) => entry.playerId === reservedPlayerId);
    expect(Object.values(reservedEntry?.offer.actualCharacterIdsByOfferedId ?? {})).toContain(
      'marionette',
    );
  });

  it('rolls each hidden Outsider at approximately two in five games with two Outsider slots', () => {
    const rollConfig = outsiderHiddenRollConfig();
    const playerIds = Array.from({ length: 12 }, (_, index) => `p${index + 1}`);
    const gameCount = 200;
    const rolls = Array.from({ length: gameCount }, (_, index) =>
      createGameCharacterDraft(playerIds, rollConfig, seededRandom(index + 1)),
    );
    const drunkGameCount = rolls.filter((state) =>
      getHiddenOutsiderRolls(state).some((roll) => roll.characterId === 'drunk'),
    ).length;
    const lunaticGameCount = rolls.filter((state) =>
      getHiddenOutsiderRolls(state).some((roll) => roll.characterId === 'lunatic'),
    ).length;

    expect(drunkGameCount).toBeGreaterThanOrEqual(65);
    expect(drunkGameCount).toBeLessThanOrEqual(95);
    expect(lunaticGameCount).toBeGreaterThanOrEqual(65);
    expect(lunaticGameCount).toBeLessThanOrEqual(95);
    expect(
      rolls.some((state) => {
        const hiddenIds = getHiddenOutsiderRolls(state).map((roll) => roll.characterId);
        return hiddenIds.includes('drunk') && hiddenIds.includes('lunatic');
      }),
    ).toBe(true);
  });

  it('rolls the Drunk in approximately half of 12-player Trouble Brewing drafts', () => {
    const rollConfig = troubleBrewingHiddenRollConfig();
    const playerIds = Array.from({ length: 12 }, (_, index) => `p${index + 1}`);
    const gameCount = 200;
    const drunkGameCount = Array.from({ length: gameCount }, (_, index) =>
      createGameCharacterDraft(playerIds, rollConfig, seededRandom(index + 1)),
    ).filter((state) =>
      getHiddenOutsiderRolls(state).some((roll) => roll.characterId === 'drunk'),
    ).length;

    expect(drunkGameCount).toBeGreaterThanOrEqual(80);
    expect(drunkGameCount).toBeLessThanOrEqual(120);
  });

  it.each([['drunk'], ['lunatic']] as const)(
    'forces a rolled %s into the reserved Outsider illusion offer',
    (hiddenId) => {
      const rollConfig = outsiderHiddenRollConfig();
      const created = createDraftWithHiddenOutsider(rollConfig, hiddenId);
      const playerId = getHiddenOutsiderRolls(created).find(
        (roll) => roll.characterId === hiddenId,
      )?.playerId;
      if (!playerId) throw new Error(`Expected a reserved ${hiddenId} player.`);

      const selected = selectGameCharacterDraftPlayer(created, rollConfig, playerId, () => 0.5);
      const entry = selected.entries.find((candidate) => candidate.playerId === playerId);
      const visibleIds = [
        ...(entry?.offer.offeredCharacterIds ?? []),
        entry?.offer.mulliganCharacterId,
      ].filter((characterId): characterId is string => characterId !== null);

      expect(visibleIds).toHaveLength(4);
      expect(entry?.offer.actualCharacterIdsByOfferedId).toEqual(
        Object.fromEntries(visibleIds.map((characterId) => [characterId, hiddenId])),
      );
    },
  );

  it('excludes Drunk and Lunatic when the persisted Outsider roll selects a normal Outsider', () => {
    const rollConfig = outsiderHiddenRollConfig();
    const created = createGameCharacterDraft(
      Array.from({ length: 12 }, (_, index) => `p${index + 1}`),
      rollConfig,
      () => 0,
    );

    expect(getHiddenOutsiderRolls(created)).toEqual([]);
    for (const playerId of created.playerOrder) {
      const selected = selectGameCharacterDraftPlayer(created, rollConfig, playerId, () => 0.37);
      const entry = selected.entries.find((candidate) => candidate.playerId === playerId);
      const hiddenActualIds = Object.values(entry?.offer.actualCharacterIdsByOfferedId ?? {});
      expect(hiddenActualIds).not.toContain('drunk');
      expect(hiddenActualIds).not.toContain('lunatic');
    }
  });

  it('creates the hidden Outsider roll when a setup modifier adds Outsider slots', () => {
    const rollConfig = outsiderHiddenRollConfig(10);
    const playerIds = Array.from({ length: 10 }, (_, index) => `p${index + 1}`);
    const created = createGameCharacterDraft(playerIds, rollConfig, () => 0);
    const stateWithBaron: CharacterDraftState = {
      ...created,
      currentPlayerIndex: 1,
      entries: [
        {
          playerId: 'p1',
          offer: {
            offeredCharacterIds: ['baron'],
            mulliganCharacterId: null,
            rolledCharacterTypes: [CharacterType.Minion],
            legalCandidateCount: 1,
          },
          selectedCharacterId: 'baron',
          actualCharacterId: 'baron',
          apparentCharacterId: 'baron',
          resolution: 'choice',
        },
      ],
    };

    expect(created.outsiderHiddenRoll).toBeUndefined();
    const replanned = updateGameCharacterDraftSetup(stateWithBaron, rollConfig, {}, () => 0.5);
    const drunkRoll = getHiddenOutsiderRolls(replanned).find(
      (roll) => roll.characterId === 'drunk',
    );
    expect(drunkRoll).toBeDefined();
    expect(replanned.plannedCharacterTypes?.[drunkRoll!.playerId]?.[0]).toBe(
      CharacterType.Outsider,
    );
  });

  it('extends persisted Outsider rolls when Baron adds slots without rerolling prior results', () => {
    const rollConfig = troubleBrewingHiddenRollConfig();
    const playerIds = Array.from({ length: 12 }, (_, index) => `p${index + 1}`);
    const created = Array.from({ length: 1_000 }, (_, index) =>
      createGameCharacterDraft(playerIds, rollConfig, seededRandom(index + 1)),
    ).find((state) => getHiddenOutsiderRolls(state).length === 0);
    if (!created) throw new Error('Expected an initial conceptual draw without the Drunk.');
    const originalCharacterIds = created.outsiderCharacterRolls?.map((roll) => roll.characterId);
    const stateWithBaron: CharacterDraftState = {
      ...created,
      entries: [
        {
          playerId: 'p1',
          offer: {
            offeredCharacterIds: ['baron'],
            mulliganCharacterId: null,
            rolledCharacterTypes: [CharacterType.Minion],
            legalCandidateCount: 1,
          },
          selectedCharacterId: 'baron',
          actualCharacterId: 'baron',
          apparentCharacterId: 'baron',
          resolution: 'choice',
        },
      ],
    };

    const replanned = updateGameCharacterDraftSetup(
      stateWithBaron,
      rollConfig,
      {},
      seededRandom(2_001),
    );

    expect(replanned.outsiderCharacterRolls).toHaveLength(4);
    expect(replanned.outsiderCharacterRolls?.map((roll) => roll.characterId)).toEqual(
      expect.arrayContaining(originalCharacterIds ?? []),
    );
    expect(getHiddenOutsiderRolls(replanned).map((roll) => roll.characterId)).toContain('drunk');
  });

  it('keeps a pending Lunatic reservation when another Outsider requires a future Godfather', () => {
    const rollConfig: DraftSessionConfig = {
      playerCount: 11,
      setupMode: DraftSetupMode.Standard,
      presentationMode: 'secret-two-types',
      scriptCharacters: [
        ...Array.from({ length: 13 }, (_, index) => ({
          id: index === 0 ? 'fool' : `town${index}`,
          type: CharacterType.Townsfolk,
        })),
        { id: 'tinker', type: CharacterType.Outsider },
        { id: 'lunatic', type: CharacterType.Outsider },
        { id: 'assassin', type: CharacterType.Minion },
        { id: 'godfather', type: CharacterType.Minion },
        { id: 'mastermind', type: CharacterType.Minion },
        { id: 'po', type: CharacterType.Demon },
        { id: 'pukka', type: CharacterType.Demon },
        { id: 'shabaloth', type: CharacterType.Demon },
        { id: 'zombuul', type: CharacterType.Demon },
      ],
    };
    const state: CharacterDraftState = {
      status: 'drafting',
      setupMode: DraftSetupMode.Standard,
      presentationMode: 'secret-two-types',
      playerOrder: Array.from({ length: 11 }, (_, index) => `p${index + 1}`),
      outsiderHiddenRoll: { playerId: 'p4', characterId: 'lunatic' },
      currentPlayerIndex: 3,
      entries: [
        {
          playerId: 'p1',
          offer: {
            offeredCharacterIds: ['assassin'],
            mulliganCharacterId: null,
            rolledCharacterTypes: [CharacterType.Minion],
            legalCandidateCount: 1,
          },
          selectedCharacterId: 'assassin',
          actualCharacterId: 'assassin',
          apparentCharacterId: 'assassin',
          resolution: 'choice',
        },
        {
          playerId: 'p2',
          offer: {
            offeredCharacterIds: ['tinker'],
            mulliganCharacterId: null,
            rolledCharacterTypes: [CharacterType.Outsider],
            legalCandidateCount: 1,
          },
          selectedCharacterId: 'tinker',
          actualCharacterId: 'tinker',
          apparentCharacterId: 'tinker',
          resolution: 'choice',
        },
        {
          playerId: 'p3',
          offer: {
            offeredCharacterIds: ['fool'],
            mulliganCharacterId: null,
            rolledCharacterTypes: [CharacterType.Townsfolk],
            legalCandidateCount: 1,
          },
          selectedCharacterId: 'fool',
          actualCharacterId: 'fool',
          apparentCharacterId: 'fool',
          resolution: 'choice',
        },
      ],
      revision: 7,
    };

    const resumed = upgradeLegacyGameCharacterDraft(
      {
        ...state,
        status: 'blocked',
        blockedReason: "lunatic is outside the reserved player's rolled character types.",
      },
      rollConfig,
      () => 0.5,
    );
    const selected = selectGameCharacterDraftPlayer(resumed, rollConfig, 'p4', () => 0.5);
    const entry = selected.entries.find((candidate) => candidate.playerId === 'p4');

    expect(resumed.status).toBe('drafting');
    expect(resumed.entries).toEqual(state.entries);
    expect(selected.status).toBe('drafting');
    expect(selected.outsiderHiddenRoll).toEqual(state.outsiderHiddenRoll);
    expect(selected.plannedCharacterTypes?.p4?.[0]).toBe(CharacterType.Outsider);
    expect(Object.values(entry?.offer.actualCharacterIdsByOfferedId ?? {})).toEqual([
      'lunatic',
      'lunatic',
      'lunatic',
      'lunatic',
    ]);
  });

  it('forces a rolled Marionette into the reserved player illusion offer', () => {
    const rollConfig = marionetteRollConfig();
    const created = createGameCharacterDraft(
      Array.from({ length: 10 }, (_, index) => `p${index + 1}`),
      rollConfig,
      () => 0.999,
    );
    const playerId = created.marionetteRoll?.playerId;
    if (!playerId) throw new Error('Expected a reserved Marionette player.');

    const selected = selectGameCharacterDraftPlayer(created, rollConfig, playerId, () => 0.5);
    const entry = selected.entries.find((candidate) => candidate.playerId === playerId);
    const visibleIds = [
      ...(entry?.offer.offeredCharacterIds ?? []),
      entry?.offer.mulliganCharacterId,
    ].filter((characterId): characterId is string => characterId !== null);

    expect(visibleIds).toHaveLength(4);
    expect(entry?.offer.actualCharacterIdsByOfferedId).toEqual(
      Object.fromEntries(visibleIds.map((characterId) => [characterId, 'marionette'])),
    );
  });

  it('excludes Marionette when the persisted Minion roll selects another Minion', () => {
    const rollConfig = marionetteRollConfig();
    const created = createGameCharacterDraft(
      Array.from({ length: 10 }, (_, index) => `p${index + 1}`),
      rollConfig,
      () => 0,
    );

    expect(created.marionetteRoll?.characterId).toBe('baron');
    for (const playerId of created.playerOrder) {
      const selected = selectGameCharacterDraftPlayer(created, rollConfig, playerId, () => 0.37);
      const entry = selected.entries.find((candidate) => candidate.playerId === playerId);
      expect(Object.values(entry?.offer.actualCharacterIdsByOfferedId ?? {})).not.toContain(
        'marionette',
      );
    }
  });

  it('keeps an unresolved reserved Marionette player on a primary Minion roll after replanning', () => {
    const rollConfig = marionetteRollConfig();
    let state = createGameCharacterDraft(
      Array.from({ length: 10 }, (_, index) => `p${index + 1}`),
      rollConfig,
      () => 0.999,
    );
    const reservedPlayerId = state.marionetteRoll?.playerId;
    if (!reservedPlayerId) throw new Error('Expected a reserved Marionette player.');
    const otherPlayerId = state.playerOrder.find((playerId) => playerId !== reservedPlayerId);
    if (!otherPlayerId) throw new Error('Expected another draft player.');

    state = selectGameCharacterDraftPlayer(state, rollConfig, otherPlayerId, () => 0);
    const otherEntry = state.entries.find((entry) => entry.playerId === otherPlayerId);
    if (!otherEntry) throw new Error('Expected an offer for the other player.');
    state = resolveGameCharacterDraft(
      state,
      rollConfig,
      otherEntry.offer.offeredCharacterIds[0],
      'choice',
      () => 0,
    );

    expect(state.plannedCharacterTypes?.[reservedPlayerId]?.[0]).toBe(CharacterType.Minion);
  });

  it('replans undrafted type rolls after a Lord of Typhon setup choice', () => {
    const lordOfTyphonConfig: DraftSessionConfig = {
      playerCount: 7,
      setupMode: DraftSetupMode.Standard,
      presentationMode: 'secret-single-type',
      scriptCharacters: [
        ...Array.from({ length: 5 }, (_, index) => ({
          id: `town${index}`,
          type: CharacterType.Townsfolk,
        })),
        { id: 'outsider1', type: CharacterType.Outsider },
        { id: 'outsider2', type: CharacterType.Outsider },
        { id: 'minion1', type: CharacterType.Minion },
        { id: 'minion2', type: CharacterType.Minion },
        { id: 'lordoftyphon', type: CharacterType.Demon },
      ],
    };
    const state: CharacterDraftState = {
      status: 'drafting',
      setupMode: 'standard',
      presentationMode: 'secret-single-type',
      playerOrder: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'],
      plannedCharacterTypes: {
        p2: [CharacterType.Townsfolk],
        p3: [CharacterType.Townsfolk],
        p4: [CharacterType.Townsfolk],
        p5: [CharacterType.Townsfolk],
        p6: [CharacterType.Minion],
        p7: [CharacterType.Minion],
      },
      currentPlayerIndex: 1,
      entries: [
        {
          playerId: 'p1',
          offer: {
            offeredCharacterIds: ['lordoftyphon'],
            mulliganCharacterId: null,
            rolledCharacterTypes: [CharacterType.Demon],
            legalCandidateCount: 1,
          },
          selectedCharacterId: 'lordoftyphon',
          actualCharacterId: 'lordoftyphon',
          apparentCharacterId: 'lordoftyphon',
          resolution: 'choice',
        },
      ],
      revision: 2,
    };

    const next = updateGameCharacterDraftSetup(
      state,
      lordOfTyphonConfig,
      { variableModifierValues: { lordoftyphon: 1 } },
      () => 0,
    );
    const plannedTypes = Object.values(next.plannedCharacterTypes ?? {}).flat();

    expect(plannedTypes.filter((type) => type === CharacterType.Townsfolk)).toHaveLength(3);
    expect(plannedTypes.filter((type) => type === CharacterType.Outsider)).toHaveLength(1);
    expect(plannedTypes.filter((type) => type === CharacterType.Minion)).toHaveLength(2);
    expect(next.variableModifierValues).toEqual({ lordoftyphon: 1 });
  });

  it('records a choice separately as actual and apparent identity', () => {
    const created = createGameCharacterDraft(['p1', 'p2', 'p3', 'p4', 'p5'], config, () => 0);
    const state = selectGameCharacterDraftPlayer(created, config, 'p1', () => 0);
    const characterId = state.entries[0].offer.offeredCharacterIds[0];
    const next = resolveGameCharacterDraft(state, config, characterId, 'choice', () => 0);

    expect(next.entries[0]).toMatchObject({
      selectedCharacterId: characterId,
      actualCharacterId: characterId,
      apparentCharacterId: characterId,
      resolution: 'choice',
    });
    expect(next.currentPlayerIndex).toBe(1);
    expect(next.activePlayerId).toBeUndefined();
    expect(next.entries).toHaveLength(1);
  });

  it('does not implicitly activate an unresolved offer after another player resolves', () => {
    let state = createGameCharacterDraft(['p1', 'p2', 'p3', 'p4', 'p5'], config, () => 0);
    state = selectGameCharacterDraftPlayer(state, config, 'p1', () => 0);
    state = selectGameCharacterDraftPlayer(state, config, 'p3', () => 0.5);
    const activeEntry = state.entries.find((entry) => entry.playerId === 'p3');
    if (!activeEntry) throw new Error('Expected an active draft entry.');

    const resolved = resolveGameCharacterDraft(
      state,
      config,
      activeEntry.offer.offeredCharacterIds[0],
      'choice',
      () => 0,
    );

    expect(resolved.activePlayerId).toBeUndefined();
    expect(resolved.entries.map((entry) => entry.playerId)).toEqual(['p3']);
    expect(() => resolveGameCharacterDraft(resolved, config, 't0', 'choice', () => 0)).toThrow(
      'does not have an active player',
    );
  });

  it('excludes Demons and unique characters already committed out of player order', () => {
    let state = createGameCharacterDraft(['p1', 'p2', 'p3', 'p4', 'p5'], config, () => 0);
    let demonOffer: CharacterDraftState | undefined;
    for (let index = 0; index < 100; index += 1) {
      const candidate = selectGameCharacterDraftPlayer(state, config, 'p3', () => index / 100);
      const entry = candidate.entries.find((item) => item.playerId === 'p3');
      if (entry?.offer.offeredCharacterIds.includes('d1')) {
        demonOffer = candidate;
        break;
      }
    }
    expect(demonOffer).toBeDefined();

    state = resolveGameCharacterDraft(demonOffer!, config, 'd1', 'choice', () => 0);
    state = selectGameCharacterDraftPlayer(state, config, 'p1', () => 0);
    const nextOffer = state.entries.find((entry) => entry.playerId === 'p1')!.offer;

    expect(nextOffer.offeredCharacterIds).not.toContain('d1');
    expect(nextOffer.offeredCharacterIds).not.toContain('d2');
    expect(nextOffer.mulliganCharacterId).not.toBe('d1');
    expect(nextOffer.mulliganCharacterId).not.toBe('d2');
    expect(nextOffer.legalCandidateCount).toBeLessThan(config.scriptCharacters.length);
  });

  it('rejects a stale offer that became illegal after another player committed', () => {
    const state: CharacterDraftState = {
      status: 'drafting',
      setupMode: 'standard',
      presentationMode: 'open',
      playerOrder: ['p1', 'p2', 'p3', 'p4', 'p5'],
      currentPlayerIndex: 1,
      activePlayerId: 'p1',
      entries: [
        {
          playerId: 'p1',
          offer: {
            offeredCharacterIds: ['d2'],
            mulliganCharacterId: null,
            rolledCharacterTypes: [],
            legalCandidateCount: config.scriptCharacters.length,
          },
        },
        {
          playerId: 'p3',
          offer: {
            offeredCharacterIds: ['d1'],
            mulliganCharacterId: null,
            rolledCharacterTypes: [],
            legalCandidateCount: config.scriptCharacters.length,
          },
          selectedCharacterId: 'd1',
          actualCharacterId: 'd1',
          apparentCharacterId: 'd1',
          resolution: 'choice',
        },
      ],
      revision: 4,
    };

    expect(() => resolveGameCharacterDraft(state, config, 'd2', 'choice', () => 0)).toThrow(
      'draft offer is stale',
    );
  });

  it('resolves a false identity choice to its hidden actual character', () => {
    const state: CharacterDraftState = {
      status: 'drafting',
      setupMode: 'standard',
      presentationMode: 'open',
      playerOrder: ['p1', 'p2', 'p3', 'p4', 'p5'],
      currentPlayerIndex: 0,
      activePlayerId: 'p1',
      entries: [
        {
          playerId: 'p1',
          offer: {
            offeredCharacterIds: ['t0'],
            mulliganCharacterId: null,
            rolledCharacterTypes: [],
            legalCandidateCount: 1,
            actualCharacterIdsByOfferedId: { t0: 't1' },
          },
        },
      ],
      revision: 1,
    };

    const next = resolveGameCharacterDraft(state, config, 't0', 'choice', () => 0);

    expect(next.entries[0]).toMatchObject({
      selectedCharacterId: 't0',
      actualCharacterId: 't1',
      apparentCharacterId: 't0',
    });
  });

  it.each([
    ['drunk', CharacterType.Outsider, 'chef', CharacterType.Townsfolk],
    ['marionette', CharacterType.Minion, 'chef', CharacterType.Townsfolk],
    ['lunatic', CharacterType.Outsider, 'imp', CharacterType.Demon],
  ] as const)(
    'masks %s with a valid player-facing identity',
    (actualId, actualType, decoyId, decoyType) => {
      const offer = maskDraftOfferIdentities(
        {
          offeredCharacterIds: [actualId],
          mulliganCharacterId: null,
          rolledCharacterTypes: [],
        },
        1,
        {
          ...config,
          scriptCharacters: [
            { id: actualId, type: actualType },
            { id: decoyId, type: decoyType },
          ],
        },
        [],
        () => 0,
      );

      expect(offer.offeredCharacterIds).toEqual([decoyId]);
      expect(offer.actualCharacterIdsByOfferedId).toEqual({
        [decoyId]: actualId,
      });
    },
  );

  it.each(['open', 'secret-single-type', 'secret-two-types'] as const)(
    'strictly isolates Legion and good offers in %s presentation mode',
    (presentationMode) => {
      const legionConfig: DraftSessionConfig = {
        ...exceptionalConfig(DraftSetupMode.Legion, {
          id: 'legion',
          type: CharacterType.Demon,
        }),
        playerCount: 10,
        presentationMode,
      };
      const playerIds = Array.from(
        { length: legionConfig.playerCount },
        (_, index) => `p${index + 1}`,
      );
      const created = createGameCharacterDraft(playerIds, legionConfig, () => 0.37);
      const evilPlayerIds = playerIds.filter(
        (playerId) => created.plannedCharacterTypes?.[playerId]?.[0] === CharacterType.Demon,
      );
      const goodPlayerIds = playerIds.filter((playerId) => !evilPlayerIds.includes(playerId));

      expect(evilPlayerIds).toHaveLength(7);
      expect(goodPlayerIds).toHaveLength(3);

      for (const playerId of evilPlayerIds) {
        const selected = selectGameCharacterDraftPlayer(
          created,
          legionConfig,
          playerId,
          () => 0.37,
        );
        const offer = selected.entries.find((entry) => entry.playerId === playerId)?.offer;
        expect(offer?.offeredCharacterIds).toEqual(['legion', 'legion', 'legion']);
        expect(offer?.mulliganCharacterId).toBeNull();
      }

      const selectedGoodPlayer = selectGameCharacterDraftPlayer(
        created,
        legionConfig,
        goodPlayerIds[0],
        () => 0.37,
      );
      const goodOffer = selectedGoodPlayer.entries.find(
        (entry) => entry.playerId === goodPlayerIds[0],
      )?.offer;
      expect(goodOffer?.offeredCharacterIds).not.toContain('legion');
      const goodCharacterIds = [
        ...(goodOffer?.offeredCharacterIds ?? []),
        goodOffer?.mulliganCharacterId,
      ].filter((characterId): characterId is string => characterId !== null);
      const typeById = new Map(
        legionConfig.scriptCharacters.map((character) => [character.id, character.type]),
      );
      expect(
        goodCharacterIds.every(
          (characterId) =>
            typeById.get(characterId) === CharacterType.Townsfolk ||
            typeById.get(characterId) === CharacterType.Outsider,
        ),
      ).toBe(true);
      expect(goodOffer?.rolledCharacterTypes).toEqual(
        expect.arrayContaining([CharacterType.Townsfolk, CharacterType.Outsider]),
      );
    },
  );

  it.each(['open', 'secret-single-type', 'secret-two-types'] as const)(
    'completes a ten-player %s Legion draft with seven Legion',
    (presentationMode) => {
      const legionConfig: DraftSessionConfig = {
        ...exceptionalConfig(DraftSetupMode.Legion, {
          id: 'legion',
          type: CharacterType.Demon,
        }),
        playerCount: 10,
        presentationMode,
      };
      const state = completeDraft(legionConfig);
      const actualCharacterIds = state.entries.map((entry) => entry.actualCharacterId);

      expect(state.status).toBe('complete');
      expect(actualCharacterIds.filter((id) => id === 'legion')).toHaveLength(7);
      expect(actualCharacterIds.filter((id) => id !== 'legion')).toHaveLength(3);
    },
  );

  it('offers Legion in a normal Standard draft without activating it before selection', () => {
    const legionConfig: DraftSessionConfig = {
      ...exceptionalConfig(DraftSetupMode.Standard, {
        id: 'legion',
        type: CharacterType.Demon,
      }),
      playerCount: 10,
      presentationMode: 'secret-two-types',
    };
    const playerIds = Array.from(
      { length: legionConfig.playerCount },
      (_, index) => `p${index + 1}`,
    );
    const created = createGameCharacterDraft(playerIds, legionConfig, () => 0.37);
    const selected = selectGameCharacterDraftPlayer(created, legionConfig, 'p1', () => 0.999);
    const offer = selected.entries[0].offer;
    const rolledIds = [...offer.offeredCharacterIds, offer.mulliganCharacterId];

    expect(selected.setupMode).toBe(DraftSetupMode.Standard);
    expect(offer.offeredCharacterIds).toHaveLength(3);
    expect(rolledIds.filter((characterId) => characterId === 'legion')).toHaveLength(1);
    expect(selected.plannedCharacterTypes).toEqual(created.plannedCharacterTypes);
    expect(
      Object.values(selected.plannedCharacterTypes ?? {}).filter(
        (types) => types?.[0] === CharacterType.Demon,
      ),
    ).toHaveLength(1);

    const ordinaryCharacterId = offer.offeredCharacterIds.find(
      (characterId) => characterId !== 'legion',
    );
    expect(ordinaryCharacterId).toBeDefined();
    const remainedStandard = resolveGameCharacterDraft(
      selected,
      legionConfig,
      ordinaryCharacterId!,
      'choice',
      () => 0.37,
    );
    expect(remainedStandard.setupMode).toBe(DraftSetupMode.Standard);

    const activated = resolveGameCharacterDraft(
      selected,
      legionConfig,
      'legion',
      'choice',
      () => 0.37,
    );
    const evilPlans = Object.values(activated.plannedCharacterTypes ?? {}).filter(
      (types) => types?.[0] === CharacterType.Demon,
    );

    expect(activated.setupMode).toBe(DraftSetupMode.Legion);
    expect(activated.entries[0].actualCharacterId).toBe('legion');
    expect(evilPlans).toHaveLength(6);
  });

  it('lets an early good-primary player choose Legion from a mixed Standard offer', () => {
    const legionConfig = lleechAndLegionConfig();
    const playerIds = Array.from(
      { length: legionConfig.playerCount },
      (_, index) => `p${index + 1}`,
    );
    const created = createGameCharacterDraft(playerIds, legionConfig, () => 0.1);
    const eligible = {
      ...created,
      plannedCharacterTypes: {
        ...created.plannedCharacterTypes,
        p1: [CharacterType.Townsfolk, CharacterType.Demon],
      },
    };
    const selected = selectGameCharacterDraftPlayer(eligible, legionConfig, 'p1', () => 0.99);
    const offer = selected.entries[0].offer;
    expect(selected.setupMode).toBe(DraftSetupMode.Standard);
    expect(offer.offeredCharacterIds).toHaveLength(3);
    expect(offer.offeredCharacterIds).toContain('legion');
    expect(offer.offeredCharacterIds[0]).not.toBe('legion');
    expect(offer.offeredCharacterIds).not.toContain('lleech');

    const activated = resolveGameCharacterDraft(
      selected,
      legionConfig,
      'legion',
      'choice',
      () => 0.37,
    );
    expect(activated.setupMode).toBe(DraftSetupMode.Legion);
  });

  it('offers the Demon that wins the early roll and eliminates Legion when it is Lleech', () => {
    const legionConfig = lleechAndLegionConfig();
    const playerIds = Array.from(
      { length: legionConfig.playerCount },
      (_, index) => `p${index + 1}`,
    );
    const created = createGameCharacterDraft(playerIds, legionConfig, () => 0.37);
    const eligible = {
      ...created,
      plannedCharacterTypes: {
        ...created.plannedCharacterTypes,
        p1: [CharacterType.Demon, CharacterType.Townsfolk],
      },
    };

    const selected = selectGameCharacterDraftPlayer(eligible, legionConfig, 'p1', () => 0.1);
    const offer = selected.entries[0].offer;
    const typeById = new Map(
      legionConfig.scriptCharacters.map((character) => [character.id, character.type]),
    );
    const visibleCharacterIds = [...offer.offeredCharacterIds, offer.mulliganCharacterId].filter(
      (characterId): characterId is string => characterId !== null,
    );

    expect(selected.setupMode).toBe(DraftSetupMode.Standard);
    expect(visibleCharacterIds).not.toContain('legion');
    expect(visibleCharacterIds.filter((characterId) => characterId === 'lleech')).toHaveLength(1);
    expect(selected.legionEliminated).toBe(true);
    expect(
      visibleCharacterIds
        .filter((characterId) => characterId !== 'lleech')
        .every(
          (characterId) =>
            typeById.get(characterId) === CharacterType.Townsfolk ||
            typeById.get(characterId) === CharacterType.Outsider,
        ),
    ).toBe(true);

    const nextPlayer = selectGameCharacterDraftPlayer(selected, legionConfig, 'p2', () => 0.99);
    expect(nextPlayer.entries.at(-1)!.offer.offeredCharacterIds).not.toContain('legion');
  });

  it('lets any of the first four drafts trigger Legion in a ten-player game', () => {
    const legionConfig: DraftSessionConfig = {
      ...exceptionalConfig(DraftSetupMode.Standard, {
        id: 'legion',
        type: CharacterType.Demon,
      }),
      playerCount: 10,
      presentationMode: 'secret-two-types',
    };
    const playerIds = Array.from(
      { length: legionConfig.playerCount },
      (_, index) => `p${index + 1}`,
    );

    for (const triggeringDraftIndex of [0, 1, 2, 3]) {
      let state = createGameCharacterDraft(playerIds, legionConfig, () => 0.37);
      for (let draftIndex = 0; draftIndex < triggeringDraftIndex; draftIndex += 1) {
        state = selectGameCharacterDraftPlayer(
          state,
          legionConfig,
          playerIds[draftIndex],
          () => 0.99,
        );
        const offer = state.entries.at(-1)!.offer;
        state = resolveGameCharacterDraft(
          state,
          legionConfig,
          offer.offeredCharacterIds[0],
          'choice',
          () => 0.37,
        );
      }

      state = selectGameCharacterDraftPlayer(
        state,
        legionConfig,
        playerIds[triggeringDraftIndex],
        () => 0.999,
      );

      expect(state.setupMode).toBe(DraftSetupMode.Standard);
      expect(state.entries.at(-1)!.offer.offeredCharacterIds).toContain('legion');
      state = resolveGameCharacterDraft(state, legionConfig, 'legion', 'choice', () => 0.37);
      expect(state.setupMode).toBe(DraftSetupMode.Legion);
    }
  });

  it('regenerates an eligible Standard offer with Legion without activating it', () => {
    const legionConfig: DraftSessionConfig = {
      ...exceptionalConfig(DraftSetupMode.Standard, {
        id: 'legion',
        type: CharacterType.Demon,
      }),
      playerCount: 10,
      presentationMode: 'secret-two-types',
    };
    const playerIds = Array.from(
      { length: legionConfig.playerCount },
      (_, index) => `p${index + 1}`,
    );
    const created = createGameCharacterDraft(playerIds, legionConfig, () => 0.37);
    const state: CharacterDraftState = {
      ...created,
      activePlayerId: 'p1',
      plannedCharacterTypes: {
        ...created.plannedCharacterTypes,
        p1: [CharacterType.Demon, CharacterType.Townsfolk],
      },
      entries: [
        {
          playerId: 'p1',
          offer: {
            offeredCharacterIds: ['town0', 'town1', 'town2'],
            mulliganCharacterId: 'town3',
            rolledCharacterTypes: [CharacterType.Townsfolk],
            legalCandidateCount: 4,
          },
        },
      ],
    };

    const regenerated = regenerateGameCharacterDraftOffer(state, legionConfig, () => 0.999);
    const offer = regenerated.entries.find((entry) => entry.playerId === 'p1')!.offer;

    expect(regenerated.setupMode).toBe(DraftSetupMode.Standard);
    expect(offer.offeredCharacterIds).toHaveLength(3);
    expect(offer.offeredCharacterIds).toContain('legion');
  });

  it('blocks a persisted Legion setup containing another Demon', () => {
    const legionConfig: DraftSessionConfig = {
      ...exceptionalConfig(DraftSetupMode.Legion, {
        id: 'legion',
        type: CharacterType.Demon,
      }),
      playerCount: 10,
      presentationMode: 'secret-two-types',
    };
    const playerIds = Array.from(
      { length: legionConfig.playerCount },
      (_, index) => `p${index + 1}`,
    );
    const created = createGameCharacterDraft(playerIds, legionConfig, () => 0.37);
    const corrupt: CharacterDraftState = {
      ...created,
      entries: [
        {
          playerId: 'p1',
          offer: {
            offeredCharacterIds: ['demon0'],
            mulliganCharacterId: null,
            rolledCharacterTypes: [CharacterType.Demon],
            legalCandidateCount: 1,
          },
          selectedCharacterId: 'demon0',
          actualCharacterId: 'demon0',
          apparentCharacterId: 'demon0',
          resolution: 'choice',
        },
      ],
    };

    const selected = selectGameCharacterDraftPlayer(corrupt, legionConfig, 'p2', () => 0.37);

    expect(selected.status).toBe('blocked');
    expect(selected.blockedReason).toContain('demon0 cannot be committed in Legion setup');
  });

  it('clears Standard hidden reservations when Legion activates', () => {
    const baseConfig = exceptionalConfig(DraftSetupMode.Standard, {
      id: 'legion',
      type: CharacterType.Demon,
    });
    const legionConfig: DraftSessionConfig = {
      ...baseConfig,
      playerCount: 10,
      presentationMode: 'secret-two-types',
      scriptCharacters: [
        ...baseConfig.scriptCharacters,
        { id: 'marionette', type: CharacterType.Minion },
      ],
    };
    const playerIds = Array.from(
      { length: legionConfig.playerCount },
      (_, index) => `p${index + 1}`,
    );
    const created = createGameCharacterDraft(playerIds, legionConfig, () => 0.1);
    const eligible: CharacterDraftState = {
      ...created,
      plannedCharacterTypes: {
        ...created.plannedCharacterTypes,
        p1: [CharacterType.Demon, CharacterType.Townsfolk],
      },
      outsiderCharacterRolls: [{ playerId: 'p2', characterId: 'outsider0' }],
      marionetteRoll: { playerId: 'p3', characterId: 'marionette' },
    };
    const selected = selectGameCharacterDraftPlayer(eligible, legionConfig, 'p1', () => 0.999);
    expect(selected.setupMode).toBe(DraftSetupMode.Standard);
    expect(selected.entries[0].offer.offeredCharacterIds).toContain('legion');
    expect(selected.outsiderCharacterRolls).toBeDefined();
    expect(selected.marionetteRoll).toBeDefined();

    const activated = resolveGameCharacterDraft(
      selected,
      legionConfig,
      'legion',
      'choice',
      () => 0.37,
    );
    expect(activated.setupMode).toBe(DraftSetupMode.Legion);
    expect(activated.outsiderHiddenRoll).toBeUndefined();
    expect(activated.outsiderCharacterRolls).toBeUndefined();
    expect(activated.marionetteRoll).toBeUndefined();
  });

  it('never offers Legion after the early Legion reveal window', () => {
    const legionConfig: DraftSessionConfig = {
      ...exceptionalConfig(DraftSetupMode.Standard, {
        id: 'legion',
        type: CharacterType.Demon,
      }),
      playerCount: 10,
      presentationMode: 'secret-two-types',
    };
    const playerIds = Array.from(
      { length: legionConfig.playerCount },
      (_, index) => `p${index + 1}`,
    );
    let state = createGameCharacterDraft(playerIds, legionConfig, () => 0.37);

    for (const playerId of playerIds.slice(0, 4)) {
      state = {
        ...state,
        plannedCharacterTypes: {
          ...state.plannedCharacterTypes,
          [playerId]: [CharacterType.Townsfolk, CharacterType.Outsider],
        },
      };
      state = selectGameCharacterDraftPlayer(state, legionConfig, playerId, () => 0.37);
      state = resolveGameCharacterDraft(
        state,
        legionConfig,
        state.entries.at(-1)!.offer.offeredCharacterIds[0],
        'choice',
        () => 0.37,
      );
    }

    state = {
      ...state,
      plannedCharacterTypes: {
        ...state.plannedCharacterTypes,
        p5: [CharacterType.Demon, CharacterType.Townsfolk],
      },
    };
    const selected = selectGameCharacterDraftPlayer(state, legionConfig, 'p5', () => 0);
    const offer = selected.entries.at(-1)!.offer;

    expect([...offer.offeredCharacterIds, offer.mulliganCharacterId]).not.toContain('legion');
  });

  it.each([CharacterType.Minion, CharacterType.Demon])(
    'eliminates Legion after an ordinary %s is shown but not selected',
    (evilType) => {
      const legionConfig: DraftSessionConfig = {
        ...exceptionalConfig(DraftSetupMode.Standard, {
          id: 'legion',
          type: CharacterType.Demon,
        }),
        playerCount: 10,
        presentationMode: 'secret-two-types',
      };
      const playerIds = Array.from(
        { length: legionConfig.playerCount },
        (_, index) => `p${index + 1}`,
      );

      let state = createGameCharacterDraft(playerIds, legionConfig, () => 0.37);
      for (const playerId of playerIds.slice(0, 4)) {
        state = selectGameCharacterDraftPlayer(state, legionConfig, playerId, () => 0.99);
        state = resolveGameCharacterDraft(
          state,
          legionConfig,
          state.entries.at(-1)!.offer.offeredCharacterIds[0],
          'choice',
          () => 0.37,
        );
      }
      state = {
        ...state,
        plannedCharacterTypes: {
          ...state.plannedCharacterTypes,
          p5: [evilType, CharacterType.Townsfolk],
        },
      };
      state = selectGameCharacterDraftPlayer(state, legionConfig, 'p5', () => 0.9);
      const firstOffer = state.entries.at(-1)!.offer;
      const typeById = new Map(
        legionConfig.scriptCharacters.map((character) => [character.id, character.type]),
      );
      const goodChoice = firstOffer.offeredCharacterIds.find(
        (characterId) => typeById.get(characterId) === CharacterType.Townsfolk,
      );

      expect(
        [...firstOffer.offeredCharacterIds, firstOffer.mulliganCharacterId].some(
          (characterId) => characterId !== null && typeById.get(characterId) === evilType,
        ),
      ).toBe(true);
      expect(goodChoice).toBeDefined();

      state = resolveGameCharacterDraft(state, legionConfig, goodChoice!, 'choice', () => 0.9);
      state = {
        ...state,
        plannedCharacterTypes: {
          ...state.plannedCharacterTypes,
          p6: [CharacterType.Demon, CharacterType.Townsfolk],
        },
      };
      const selected = selectGameCharacterDraftPlayer(state, legionConfig, 'p6', () => 0.9);
      const nextOffer = selected.entries.at(-1)!.offer;

      expect([...nextOffer.offeredCharacterIds, nextOffer.mulliganCharacterId]).not.toContain(
        'legion',
      );
    },
  );

  it('keeps Legion eliminated after an ordinary evil offer is regenerated away', () => {
    const legionConfig: DraftSessionConfig = {
      ...exceptionalConfig(DraftSetupMode.Standard, {
        id: 'legion',
        type: CharacterType.Demon,
      }),
      playerCount: 10,
      presentationMode: 'secret-two-types',
    };
    const playerIds = Array.from(
      { length: legionConfig.playerCount },
      (_, index) => `p${index + 1}`,
    );
    let state = createGameCharacterDraft(playerIds, legionConfig, () => 0.9);
    for (const playerId of playerIds.slice(0, 4)) {
      state = selectGameCharacterDraftPlayer(state, legionConfig, playerId, () => 0.99);
      state = resolveGameCharacterDraft(
        state,
        legionConfig,
        state.entries.at(-1)!.offer.offeredCharacterIds[0],
        'choice',
        () => 0.9,
      );
    }
    state = {
      ...state,
      plannedCharacterTypes: {
        ...state.plannedCharacterTypes,
        p5: [CharacterType.Minion, CharacterType.Townsfolk],
      },
    };
    state = selectGameCharacterDraftPlayer(state, legionConfig, 'p5', () => 0.9);
    state = regenerateGameCharacterDraftOffer(state, legionConfig, () => 0.1);

    expect(state.legionEliminated).toBe(true);
    expect([
      ...state.entries.at(-1)!.offer.offeredCharacterIds,
      state.entries.at(-1)!.offer.mulliganCharacterId,
    ]).not.toContain('legion');
  });

  it.each([
    ['marionette', [CharacterType.Townsfolk, CharacterType.Outsider], ['drunk', 'lunatic']],
    ['lunatic', [CharacterType.Demon], []],
    ['drunk', [CharacterType.Townsfolk], ['lunatic']],
  ] as const)(
    'turns an offered %s into a type-constrained illusion draft',
    (actualId, allowedTypes, excludedIds) => {
      const illusionConfig: DraftSessionConfig = {
        ...config,
        scriptCharacters: [
          {
            id: actualId,
            type: actualId === 'marionette' ? CharacterType.Minion : CharacterType.Outsider,
          },
          { id: 'chef', type: CharacterType.Townsfolk },
          { id: 'empath', type: CharacterType.Townsfolk },
          { id: 'fortuneteller', type: CharacterType.Townsfolk },
          { id: 'monk', type: CharacterType.Townsfolk },
          { id: 'drunk', type: CharacterType.Outsider },
          { id: 'lunatic', type: CharacterType.Outsider },
          { id: 'butler', type: CharacterType.Outsider },
          { id: 'recluse', type: CharacterType.Outsider },
          { id: 'saint', type: CharacterType.Outsider },
          { id: 'imp', type: CharacterType.Demon },
          { id: 'po', type: CharacterType.Demon },
          { id: 'shabaloth', type: CharacterType.Demon },
          { id: 'vortox', type: CharacterType.Demon },
          { id: 'nodashii', type: CharacterType.Demon },
          { id: 'poisoner', type: CharacterType.Minion },
        ],
      };
      const offer = maskDraftOfferIdentities(
        {
          offeredCharacterIds: [actualId, 'poisoner', 'imp'],
          mulliganCharacterId: 'butler',
          rolledCharacterTypes: [],
        },
        12,
        illusionConfig,
        [],
        () => 0,
      );
      const visibleCharacterIds = [...offer.offeredCharacterIds, offer.mulliganCharacterId].filter(
        (characterId): characterId is string => characterId !== null,
      );
      const characterTypes = new Map(
        illusionConfig.scriptCharacters.map((character) => [character.id, character.type]),
      );
      const allowedTypeSet: ReadonlySet<CharacterType> = new Set(allowedTypes);

      expect(visibleCharacterIds).toHaveLength(4);
      expect(new Set(visibleCharacterIds)).toHaveProperty('size', 4);
      expect(
        visibleCharacterIds.every((characterId) =>
          allowedTypeSet.has(characterTypes.get(characterId)!),
        ),
      ).toBe(true);
      if (excludedIds.length > 0) {
        expect(visibleCharacterIds).not.toEqual(expect.arrayContaining([...excludedIds]));
      }
      expect(offer.actualCharacterIdsByOfferedId).toEqual(
        Object.fromEntries(visibleCharacterIds.map((characterId) => [characterId, actualId])),
      );
    },
  );

  it('masks hidden mulligan results and maps them to the actual character', () => {
    const offer = maskDraftOfferIdentities(
      {
        offeredCharacterIds: ['chef'],
        mulliganCharacterId: 'lunatic',
        rolledCharacterTypes: [],
      },
      2,
      {
        ...config,
        scriptCharacters: [
          { id: 'chef', type: CharacterType.Townsfolk },
          { id: 'lunatic', type: CharacterType.Outsider },
          { id: 'imp', type: CharacterType.Demon },
        ],
      },
      [],
      () => 0,
    );

    expect(offer.mulliganCharacterId).toBe('imp');
    expect(offer.actualCharacterIdsByOfferedId?.imp).toBe('lunatic');
  });

  it('uses a committed decoy rather than revealing a hidden role', () => {
    const offer = maskDraftOfferIdentities(
      {
        offeredCharacterIds: ['drunk'],
        mulliganCharacterId: null,
        rolledCharacterTypes: [],
      },
      1,
      {
        ...config,
        scriptCharacters: [
          { id: 'drunk', type: CharacterType.Outsider },
          { id: 'chef', type: CharacterType.Townsfolk },
        ],
      },
      ['chef'],
      () => 0,
    );

    expect(offer.offeredCharacterIds).toEqual(['chef']);
    expect(offer.actualCharacterIdsByOfferedId?.chef).toBe('drunk');
  });

  it('blocks rather than exposing a hidden role when no false identity exists', () => {
    const unsafeLunaticConfig: DraftSessionConfig = {
      playerCount: 5,
      setupMode: DraftSetupMode.Standard,
      scriptCharacters: [
        { id: 'chef', type: CharacterType.Townsfolk },
        { id: 'lunatic', type: CharacterType.Outsider },
        { id: 'recluse', type: CharacterType.Outsider },
        { id: 'baron', type: CharacterType.Minion },
        { id: 'imp', type: CharacterType.Demon },
      ],
    };

    const created = createGameCharacterDraft(['p1', 'p2', 'p3', 'p4', 'p5'], unsafeLunaticConfig);
    const states = Array.from({ length: 20 }, (_, index) =>
      selectGameCharacterDraftPlayer(created, unsafeLunaticConfig, 'p1', () => index / 20),
    );
    const blocked = states.find((state) =>
      state.blockedReason?.includes('no unused valid false identity'),
    );

    expect(blocked?.status).toBe('blocked');
    expect(blocked?.entries).toEqual([]);
  });

  it('does not reuse one false identity for two characters in the same offer', () => {
    expect(() =>
      maskDraftOfferIdentities(
        {
          offeredCharacterIds: ['drunk', 'marionette'],
          mulliganCharacterId: null,
          rolledCharacterTypes: [],
        },
        2,
        {
          ...config,
          scriptCharacters: [
            { id: 'drunk', type: CharacterType.Outsider },
            { id: 'marionette', type: CharacterType.Minion },
            { id: 'chef', type: CharacterType.Townsfolk },
          ],
        },
        [],
        () => 0,
      ),
    ).toThrow('no unused valid false identity');
  });

  it.each([
    [DraftSetupMode.Summoner, { id: 'summoner', type: CharacterType.Minion }],
    [DraftSetupMode.LilMonsta, { id: 'lilmonsta', type: CharacterType.Demon }],
    [DraftSetupMode.Legion, { id: 'legion', type: CharacterType.Demon }],
  ] as const)('completes a persisted %s production draft', (setupMode, exceptionalCharacter) => {
    const modeConfig = exceptionalConfig(setupMode, exceptionalCharacter);
    const state = completeDraft(modeConfig);
    const actualCharacterIds = state.entries.map((entry) => entry.actualCharacterId);

    expect(state.status).toBe('complete');
    expect(state.entries).toHaveLength(modeConfig.playerCount);
    expect(actualCharacterIds).not.toContain(undefined);
    if (setupMode === DraftSetupMode.LilMonsta) {
      expect(actualCharacterIds).not.toContain('lilmonsta');
    } else {
      expect(actualCharacterIds).toContain(exceptionalCharacter.id);
    }
  });

  it('regenerates only the current unresolved offer', () => {
    const created = createGameCharacterDraft(['p1', 'p2', 'p3', 'p4', 'p5'], config, () => 0);
    const state = selectGameCharacterDraftPlayer(created, config, 'p2', () => 0);
    const next = regenerateGameCharacterDraftOffer(state, config, () => 0.99);

    expect(next.playerOrder).toEqual(state.playerOrder);
    expect(next.entries.find((entry) => entry.playerId === 'p2')?.offer).not.toEqual(
      state.entries.find((entry) => entry.playerId === 'p2')?.offer,
    );
    expect(next.revision).toBe(state.revision + 1);
  });

  it('lets three players roll and choose Village Idiot when three copies are configured', () => {
    const villageIdiotConfig: DraftSessionConfig = {
      playerCount: 7,
      setupMode: DraftSetupMode.Standard,
      characterCopyTargets: { villageidiot: 3 },
      scriptCharacters: [
        { id: 'villageidiot', type: CharacterType.Townsfolk },
        { id: 't1', type: CharacterType.Townsfolk },
        { id: 't2', type: CharacterType.Townsfolk },
        { id: 'm1', type: CharacterType.Minion },
        { id: 'd1', type: CharacterType.Demon },
      ],
    };
    let state = createGameCharacterDraft(
      ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'],
      villageIdiotConfig,
    );

    for (const playerId of ['p1', 'p2', 'p3']) {
      let selected: CharacterDraftState | undefined;
      for (let index = 0; index < 100; index += 1) {
        const candidate = selectGameCharacterDraftPlayer(
          state,
          villageIdiotConfig,
          playerId,
          () => index / 100,
        );
        const offer = candidate.entries.find((entry) => entry.playerId === playerId)?.offer;
        if (offer?.offeredCharacterIds.includes('villageidiot')) {
          selected = candidate;
          break;
        }
      }
      expect(selected, `Village Idiot should be offered to ${playerId}`).toBeDefined();
      state = resolveGameCharacterDraft(
        selected!,
        villageIdiotConfig,
        'villageidiot',
        'choice',
        () => 0,
      );
    }

    expect(state.entries.map((entry) => entry.actualCharacterId)).toEqual([
      'villageidiot',
      'villageidiot',
      'villageidiot',
    ]);
    const fourth = selectGameCharacterDraftPlayer(state, villageIdiotConfig, 'p4', () => 0);
    const fourthOffer = fourth.entries.find((entry) => entry.playerId === 'p4')?.offer;
    expect(fourthOffer?.offeredCharacterIds).not.toContain('villageidiot');
    expect(fourthOffer?.mulliganCharacterId).not.toBe('villageidiot');
  });
});
