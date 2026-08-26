import { describe, expect, it } from 'vitest';
import { CharacterType } from '@/types/index.ts';
import { DraftSetupMode } from '@/utils/drafting/draftRules.ts';
import {
  createGameCharacterDraft,
  maskDraftOfferIdentities,
  regenerateGameCharacterDraftOffer,
  resolveGameCharacterDraft,
  selectGameCharacterDraftPlayer,
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

describe('gameCharacterDraft', () => {
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
    expect(() =>
      resolveGameCharacterDraft(
        resolved,
        config,
        resolved.entries.find((entry) => entry.playerId === 'p1')!.offer.offeredCharacterIds[0],
        'choice',
        () => 0,
      ),
    ).toThrow('does not have an active player');
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
