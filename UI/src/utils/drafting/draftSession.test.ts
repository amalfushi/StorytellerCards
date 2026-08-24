import { describe, expect, it } from 'vitest';
import { Alignment, CharacterType, type CharacterDef } from '@/types/index.ts';
import { DraftSetupMode } from '@/utils/drafting/draftRules.ts';
import {
  createDraftSession,
  generateDraftOffer,
  regenerateDraftOffer,
  resolveDraftPick,
  toDraftCharacters,
  type DraftSessionConfig,
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
    const ids = [...result.offer!.offeredCharacterIds, result.offer!.mulliganCharacterId];
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

  it('reports an explicit blocked state when four distinct branches are unavailable', () => {
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
    expect(result.offer).toBeNull();
    expect(result.legalCandidateIds).toEqual(['d1']);
    expect(result.blockedReason).toContain('require at least four');
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
    const next = resolveDraftPick(state, config, mulliganId, 'mulligan', () => 0);

    expect(next.committedCharacterIds).toEqual([mulliganId]);
    expect(next.picks[0].resolution).toBe('mulligan');
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
});
