import { describe, expect, it } from 'vitest';
import type { DraftCharacter, DraftFeasibilityInput } from '@/utils/drafting/draftFeasibility.ts';
import {
  getLegalDraftCandidates,
  getLegalMulliganCandidates,
  hasLegalDraftCompletion,
} from '@/utils/drafting/draftFeasibility.ts';
import { DraftSetupMode } from '@/utils/drafting/draftRules.ts';

function characters(type: DraftCharacter['type'], ...ids: string[]): DraftCharacter[] {
  return ids.map((id) => ({ id, type }));
}

function makeStandardScript(extra: DraftCharacter[] = []): DraftCharacter[] {
  return [
    ...characters(
      'Townsfolk',
      'washerwoman',
      'librarian',
      'investigator',
      'chef',
      'empath',
      'fortuneteller',
      'undertaker',
      'monk',
      'ravenkeeper',
      'virgin',
      'slayer',
      'soldier',
      'mayor',
    ),
    ...characters('Outsider', 'butler', 'drunk', 'recluse', 'saint'),
    ...characters('Minion', 'poisoner', 'spy', 'scarletwoman', 'baron'),
    ...characters('Demon', 'imp', 'fanggu', 'vigormortis'),
    ...extra,
  ];
}

function input(
  playerCount: number,
  committedCharacterIds: string[] = [],
  extra: DraftCharacter[] = [],
): DraftFeasibilityInput {
  return {
    playerCount,
    committedCharacterIds,
    scriptCharacters: makeStandardScript(extra),
  };
}

describe('hasLegalDraftCompletion', () => {
  it('completes a standard exact distribution', () => {
    expect(hasLegalDraftCompletion(input(8, ['washerwoman', 'butler', 'poisoner', 'imp']))).toBe(
      true,
    );
    expect(
      hasLegalDraftCompletion(input(8, ['washerwoman', 'butler', 'recluse', 'poisoner', 'imp'])),
    ).toBe(false);
  });

  it('forces the last available Demon slot', () => {
    const state = input(5, ['washerwoman', 'librarian', 'investigator', 'poisoner']);
    expect(getLegalDraftCandidates(state)).toEqual(expect.arrayContaining(['imp', 'vigormortis']));
    expect(getLegalDraftCandidates(state)).not.toContain('fanggu');
    expect(getLegalDraftCandidates(state)).not.toContain('chef');
  });

  it('reserves King when Choirboy is committed', () => {
    const withoutKing = input(7, ['choirboy'], [characters('Townsfolk', 'choirboy')[0]]);
    expect(hasLegalDraftCompletion(withoutKing)).toBe(false);

    const withKing = input(7, ['choirboy'], characters('Townsfolk', 'choirboy', 'king'));
    expect(hasLegalDraftCompletion(withKing)).toBe(true);
  });

  it('reserves Damsel and an Outsider slot when Huntsman is committed', () => {
    const script = characters('Townsfolk', 'huntsman');
    expect(hasLegalDraftCompletion(input(7, ['huntsman'], script))).toBe(false);
    expect(
      hasLegalDraftCompletion(
        input(8, ['huntsman'], [...script, ...characters('Outsider', 'damsel')]),
      ),
    ).toBe(true);
  });

  it('supports fixed outsider modifiers and rejects impossible totals', () => {
    expect(hasLegalDraftCompletion(input(8, ['baron']))).toBe(true);
    expect(
      hasLegalDraftCompletion(
        input(
          5,
          ['baron', 'fanggu', 'chef'],
          [...characters('Outsider', 'damsel', 'heretic', 'lunatic')],
        ),
      ),
    ).toBe(false);
    expect(hasLegalDraftCompletion(input(8, ['vigormortis']))).toBe(true);
  });

  it('supports variable and exact outsider modifiers', () => {
    const modifiers = [
      ...characters('Townsfolk', 'balloonist'),
      ...characters('Outsider', 'hermit'),
      ...characters('Minion', 'godfather', 'xaan'),
    ];
    for (const id of ['balloonist', 'hermit', 'godfather', 'xaan']) {
      expect(hasLegalDraftCompletion(input(8, [id], modifiers))).toBe(true);
    }
  });

  it('supports Lord of Typhon only when the extra Minion can be filled', () => {
    const lord = characters('Demon', 'lordoftyphon');
    expect(hasLegalDraftCompletion(input(5, ['lordoftyphon'], lord))).toBe(true);

    const oneMinionScript = makeStandardScript(lord).filter(
      (character) => character.type !== 'Minion' || character.id === 'poisoner',
    );
    expect(
      hasLegalDraftCompletion({
        playerCount: 5,
        committedCharacterIds: ['lordoftyphon'],
        scriptCharacters: oneMinionScript,
      }),
    ).toBe(false);
  });

  it('supports Atheist, Summoner, Lil Monsta, Kazali, and Legion setup modes', () => {
    expect(
      hasLegalDraftCompletion({
        ...input(7, ['atheist'], characters('Townsfolk', 'atheist')),
        setupMode: DraftSetupMode.Atheist,
      }),
    ).toBe(true);
    expect(
      hasLegalDraftCompletion({
        ...input(7, ['summoner'], characters('Minion', 'summoner')),
        setupMode: DraftSetupMode.Summoner,
      }),
    ).toBe(true);
    expect(
      hasLegalDraftCompletion({
        ...input(7, [], characters('Demon', 'lilmonsta')),
        setupMode: DraftSetupMode.LilMonsta,
      }),
    ).toBe(true);
    expect(
      hasLegalDraftCompletion({
        ...input(7, ['kazali'], characters('Demon', 'kazali')),
        setupMode: DraftSetupMode.Kazali,
      }),
    ).toBe(true);
    expect(
      hasLegalDraftCompletion({
        ...input(7, ['legion'], characters('Demon', 'legion')),
        setupMode: DraftSetupMode.Legion,
      }),
    ).toBe(true);
  });

  it('does not mix branches from different resolved setup modes', () => {
    expect(
      hasLegalDraftCompletion({
        ...input(7, ['atheist'], characters('Townsfolk', 'atheist')),
        setupMode: DraftSetupMode.Standard,
      }),
    ).toBe(false);
    expect(
      hasLegalDraftCompletion({
        ...input(7),
        setupMode: DraftSetupMode.Legion,
      }),
    ).toBe(false);
  });

  it('does not expose setup-only Lil Monsta as a player candidate', () => {
    const state = input(7, [], characters('Demon', 'lilmonsta'));
    expect(getLegalDraftCandidates(state)).not.toContain('lilmonsta');
  });

  it('allows up to three Village Idiots and rejects other duplicate roles', () => {
    const extra = characters('Townsfolk', 'villageidiot');
    expect(hasLegalDraftCompletion(input(7, ['villageidiot', 'villageidiot'], extra))).toBe(true);
    expect(
      hasLegalDraftCompletion(
        input(7, ['villageidiot', 'villageidiot', 'villageidiot', 'villageidiot'], extra),
      ),
    ).toBe(false);
    expect(hasLegalDraftCompletion(input(7, ['chef', 'chef']))).toBe(false);
  });

  it('enforces Heretic incompatibilities in either commit order', () => {
    const heretic = characters('Outsider', 'heretic');
    expect(hasLegalDraftCompletion(input(8, ['heretic', 'baron'], heretic))).toBe(false);
    expect(hasLegalDraftCompletion(input(8, ['baron', 'heretic'], heretic))).toBe(false);
  });

  it('rejects invalid player counts and unknown committed characters', () => {
    expect(hasLegalDraftCompletion(input(4))).toBe(false);
    expect(hasLegalDraftCompletion(input(16))).toBe(false);
    expect(hasLegalDraftCompletion(input(8, ['notonscript']))).toBe(false);
  });

  it('proves every returned opening candidate across player counts 5 through 15', () => {
    for (let playerCount = 5; playerCount <= 15; playerCount += 1) {
      const state = { ...input(playerCount), setupMode: DraftSetupMode.Standard };
      expect(hasLegalDraftCompletion(state)).toBe(true);

      for (const candidateId of getLegalDraftCandidates(state)) {
        expect(
          hasLegalDraftCompletion({
            ...state,
            committedCharacterIds: [candidateId],
          }),
        ).toBe(true);
      }
    }
  });
});

describe('draft candidate helpers', () => {
  it('returns the same legal candidates regardless of script order', () => {
    const state = input(8, ['washerwoman']);
    const reversed = { ...state, scriptCharacters: [...state.scriptCharacters].reverse() };
    expect(getLegalDraftCandidates(state)).toEqual(getLegalDraftCandidates(reversed));
  });

  it('excludes all offered characters from the mulligan pool', () => {
    const state = input(8, ['washerwoman']);
    const offered = ['chef', 'empath', 'imp'];
    const mulligans = getLegalMulliganCandidates(state, offered);
    expect(mulligans).not.toEqual(expect.arrayContaining(offered));
    expect(mulligans.length).toBeGreaterThan(0);
  });
});
