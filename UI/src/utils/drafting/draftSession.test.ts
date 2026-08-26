import { describe, expect, it } from 'vitest';
import { Alignment, CharacterType, type CharacterDef } from '@/types/index.ts';
import { characterMap } from '@/data/characters/index.ts';
import { DraftSetupMode } from '@/utils/drafting/draftRules.ts';
import {
  createDraftSession,
  DraftPresentationMode,
  generateDraftOffer,
  regenerateDraftOffer,
  resolveDraftPick,
  toDraftCharacters,
  type DraftSessionConfig,
  type DraftSessionState,
} from '@/utils/drafting/draftSession.ts';

function makeCharacter(
  id: string,
  type: CharacterDef['type'],
  edition?: CharacterDef['edition'],
): CharacterDef {
  return {
    id,
    name: id,
    type,
    edition,
    defaultAlignment:
      type === CharacterType.Minion || type === CharacterType.Demon
        ? Alignment.Evil
        : Alignment.Good,
    abilityShort: id,
    firstNight: null,
    otherNights: null,
    reminders: [],
  };
}

const characters = [
  ...Array.from({ length: 8 }, (_, index) => makeCharacter(`t${index}`, CharacterType.Townsfolk)),
  ...Array.from({ length: 5 }, (_, index) => makeCharacter(`o${index}`, CharacterType.Outsider)),
  ...Array.from({ length: 5 }, (_, index) => makeCharacter(`m${index}`, CharacterType.Minion)),
  ...Array.from({ length: 5 }, (_, index) => makeCharacter(`d${index}`, CharacterType.Demon)),
];

const config: DraftSessionConfig = {
  playerCount: 5,
  scriptCharacters: toDraftCharacters(characters),
  setupMode: DraftSetupMode.Standard,
};

describe('draftSession', () => {
  it('converts only regular counted characters to solver input', () => {
    const converted = toDraftCharacters([
      makeCharacter('town', CharacterType.Townsfolk),
      makeCharacter('traveller', CharacterType.Traveller),
      makeCharacter('fabled', CharacterType.Fabled),
    ]);

    expect(converted).toEqual([{ id: 'town', type: CharacterType.Townsfolk }]);
  });

  it('generates three distinct choices and a fourth distinct mulligan', () => {
    const result = generateDraftOffer(config, [], () => 0);

    expect(result.offer).not.toBeNull();
    const ids = [...result.offer!.offeredCharacterIds, result.offer!.mulliganCharacterId as string];
    expect(new Set(ids).size).toBe(4);
    expect(ids.every((id) => result.legalCandidateIds.includes(id))).toBe(true);
  });

  it('mixes character types when multiple legal types are available', () => {
    const result = generateDraftOffer(config, [], () => 0);
    const typeById = new Map(
      config.scriptCharacters.map((character) => [character.id, character.type]),
    );
    const offeredTypes = new Set(result.offer!.offeredCharacterIds.map((id) => typeById.get(id)));

    expect(offeredTypes.size).toBeGreaterThan(1);
  });

  it('prefers another Village Idiot after one has been committed without bypassing legality', () => {
    const villageIdiotConfig: DraftSessionConfig = {
      ...config,
      scriptCharacters: [
        ...config.scriptCharacters,
        { id: 'villageidiot', type: CharacterType.Townsfolk },
      ],
      characterCopyTargets: { villageidiot: 3 },
    };

    const result = generateDraftOffer(villageIdiotConfig, ['villageidiot'], () => 0);
    expect(result.offer?.offeredCharacterIds[0]).toBe('villageidiot');
    expect(result.legalCandidateIds).toContain('villageidiot');
  });

  it('forces a single legal character instead of blocking', () => {
    const narrowConfig: DraftSessionConfig = {
      playerCount: 5,
      setupMode: DraftSetupMode.Standard,
      scriptCharacters: [
        { id: 't1', type: 'Townsfolk' },
        { id: 't2', type: 'Townsfolk' },
        { id: 't3', type: 'Townsfolk' },
        { id: 'm1', type: 'Minion' },
        { id: 'd1', type: 'Demon' },
      ],
    };

    const result = generateDraftOffer(narrowConfig, ['t1', 't2', 't3', 'm1']);
    expect(result.offer).toEqual({
      offeredCharacterIds: ['d1'],
      mulliganCharacterId: null,
      rolledCharacterTypes: [],
    });
    expect(result.legalCandidateIds).toEqual(['d1']);
  });

  it.each([
    { candidates: 4, visible: 3, hasMulligan: true },
    { candidates: 3, visible: 2, hasMulligan: true },
    { candidates: 2, visible: 1, hasMulligan: true },
    { candidates: 1, visible: 1, hasMulligan: false },
  ])(
    'uses $visible choices when $candidates legal candidates remain',
    ({ candidates, visible, hasMulligan }) => {
      const scriptCharacters = [
        { id: 'base-t1', type: CharacterType.Townsfolk },
        { id: 'base-t2', type: CharacterType.Townsfolk },
        ...Array.from({ length: candidates }, (_, index) => ({
          id: `t${index}`,
          type: CharacterType.Townsfolk,
        })),
        { id: 'm1', type: CharacterType.Minion },
        { id: 'd1', type: CharacterType.Demon },
      ];
      const adaptiveConfig: DraftSessionConfig = {
        playerCount: 5,
        scriptCharacters,
        setupMode: DraftSetupMode.Standard,
      };
      const result = generateDraftOffer(
        adaptiveConfig,
        ['base-t1', 'base-t2', 'm1', 'd1'],
        () => 0,
      );

      expect(result.offer?.offeredCharacterIds).toHaveLength(visible);
      expect(result.offer?.mulliganCharacterId !== null).toBe(hasMulligan);
    },
  );

  it('restricts secret type offers after exact legal candidates are known', () => {
    const result = generateDraftOffer(
      { ...config, presentationMode: DraftPresentationMode.SecretSingleType },
      [],
      () => 0,
    );

    expect(result.offer?.rolledCharacterTypes).toHaveLength(1);
    const typeById = new Map(
      config.scriptCharacters.map((character) => [character.id, character.type]),
    );
    expect(
      result.offer?.offeredCharacterIds.every(
        (id) => typeById.get(id) === result.offer?.rolledCharacterTypes[0],
      ),
    ).toBe(true);
  });

  it('commits a normal choice and generates the next offer', () => {
    const state = createDraftSession(config, () => 0);
    const chosenId = state.currentOffer!.offeredCharacterIds[1];
    const next = resolveDraftPick(state, config, chosenId, 'choice', () => 0);

    expect(next.committedCharacterIds).toEqual([chosenId]);
    expect(next.picks[0]).toEqual({
      playerIndex: 0,
      characterId: chosenId,
      resolution: 'choice',
    });
  });

  it('commits only the predetermined mulligan character for a mulligan', () => {
    const state = createDraftSession(config, () => 0);
    const mulliganId = state.currentOffer!.mulliganCharacterId;
    expect(mulliganId).not.toBeNull();
    if (!mulliganId) throw new Error('Expected a mulligan character.');
    const next = resolveDraftPick(state, config, mulliganId, 'mulligan', () => 0);

    expect(next.committedCharacterIds).toEqual([mulliganId]);
    expect(next.picks[0].resolution).toBe('mulligan');
  });

  it('rejects a mulligan when only a mandatory character remains', () => {
    const narrowConfig: DraftSessionConfig = {
      playerCount: 5,
      setupMode: DraftSetupMode.Standard,
      scriptCharacters: [
        { id: 't1', type: CharacterType.Townsfolk },
        { id: 't2', type: CharacterType.Townsfolk },
        { id: 't3', type: CharacterType.Townsfolk },
        { id: 'm1', type: CharacterType.Minion },
        { id: 'd1', type: CharacterType.Demon },
      ],
    };
    const generated = generateDraftOffer(narrowConfig, ['t1', 't2', 't3', 'm1'], () => 0);
    const forcedState: DraftSessionState = {
      committedCharacterIds: ['t1', 't2', 't3', 'm1'],
      picks: [],
      currentOffer: generated.offer,
      legalCandidateIds: generated.legalCandidateIds,
      status: 'drafting',
    };

    expect(forcedState.currentOffer?.mulliganCharacterId).toBeNull();
    expect(() => resolveDraftPick(forcedState, narrowConfig, 'd1', 'mulligan')).toThrow(
      'does not have a mulligan',
    );
  });

  it('rejects a selection outside the active branch', () => {
    const state = createDraftSession(config, () => 0);
    expect(() => resolveDraftPick(state, config, 'not-offered', 'choice')).toThrow(
      'not valid for this offer',
    );
  });

  it('regenerates without changing committed picks', () => {
    const state = createDraftSession(config, () => 0);
    const next = regenerateDraftOffer(state, config, () => 0.99);

    expect(next.committedCharacterIds).toEqual(state.committedCharacterIds);
    expect(next.picks).toEqual(state.picks);
    expect(next.currentOffer).not.toEqual(state.currentOffer);
  });

  it('completes a seven-player Boozling draft without blocking', () => {
    const boozlingIds = [
      'noble',
      'pixie',
      'highpriestess',
      'balloonist',
      'fortuneteller',
      'oracle',
      'savant',
      'philosopher',
      'huntsman',
      'fisherman',
      'slayer',
      'sage',
      'cannibal',
      'drunk',
      'mutant',
      'damsel',
      'klutz',
      'golem',
      'baron',
      'cerenovus',
      'scarletwoman',
      'marionette',
      'nodashii',
      'fanggu',
      'imp',
    ];
    const boozlingConfig: DraftSessionConfig = {
      playerCount: 7,
      setupMode: DraftSetupMode.Standard,
      scriptCharacters: toDraftCharacters(
        boozlingIds.flatMap((id) => {
          const character = characterMap.get(id);
          return character ? [character] : [];
        }),
      ),
    };

    let state = createDraftSession(boozlingConfig, () => 0);
    while (state.status === 'drafting') {
      const characterId = state.currentOffer?.offeredCharacterIds[0];
      if (!characterId) throw new Error('Expected Boozling to produce an offer.');
      state = resolveDraftPick(state, boozlingConfig, characterId, 'choice', () => 0);
    }

    expect(state.status).toBe('complete');
    expect(state.committedCharacterIds).toHaveLength(7);
  });
});
