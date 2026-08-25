import { describe, expect, it } from 'vitest';
import { CharacterType } from '@/types/index.ts';
import { DraftSetupMode } from '@/utils/drafting/draftRules.ts';
import {
  createGameCharacterDraft,
  maskDraftOfferIdentities,
  regenerateGameCharacterDraftOffer,
  resolveGameCharacterDraft,
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
    const entry = state.entries[state.currentPlayerIndex];
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
  it('persists randomized player order and the first offer', () => {
    const state = createGameCharacterDraft(['p1', 'p2', 'p3', 'p4', 'p5'], config, () => 0);

    expect(state.playerOrder).toHaveLength(5);
    expect(new Set(state.playerOrder).size).toBe(5);
    expect(state.entries[0].playerId).toBe(state.playerOrder[0]);
    expect(state.entries[0].offer.legalCandidateCount).toBeGreaterThan(0);
  });

  it('records a choice separately as actual and apparent identity', () => {
    const state = createGameCharacterDraft(['p1', 'p2', 'p3', 'p4', 'p5'], config, () => 0);
    const characterId = state.entries[0].offer.offeredCharacterIds[0];
    const next = resolveGameCharacterDraft(state, config, characterId, 'choice', () => 0);

    expect(next.entries[0]).toMatchObject({
      selectedCharacterId: characterId,
      actualCharacterId: characterId,
      apparentCharacterId: characterId,
      resolution: 'choice',
    });
    expect(next.currentPlayerIndex).toBe(1);
  });

  it('resolves a false identity choice to its hidden actual character', () => {
    const state: CharacterDraftState = {
      status: 'drafting',
      setupMode: 'standard',
      presentationMode: 'open',
      playerOrder: ['p1', 'p2', 'p3', 'p4', 'p5'],
      currentPlayerIndex: 0,
      entries: [
        {
          playerId: 'p1',
          offer: {
            offeredCharacterIds: ['t0'],
            mulliganCharacterId: null,
            rolledCharacterTypes: [],
            legalCandidateCount: 1,
            actualCharacterIdsByOfferedId: { t0: 'o1' },
          },
        },
      ],
      revision: 1,
    };

    const next = resolveGameCharacterDraft(state, config, 't0', 'choice', () => 0);

    expect(next.entries[0]).toMatchObject({
      selectedCharacterId: 't0',
      actualCharacterId: 'o1',
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

    const states = Array.from({ length: 20 }, (_, index) =>
      createGameCharacterDraft(
        ['p1', 'p2', 'p3', 'p4', 'p5'],
        unsafeLunaticConfig,
        () => index / 20,
      ),
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
    const state = createGameCharacterDraft(['p1', 'p2', 'p3', 'p4', 'p5'], config, () => 0);
    const next = regenerateGameCharacterDraftOffer(state, config, () => 0.99);

    expect(next.playerOrder).toEqual(state.playerOrder);
    expect(next.entries[0].offer).not.toEqual(state.entries[0].offer);
    expect(next.revision).toBe(state.revision + 1);
  });
});
