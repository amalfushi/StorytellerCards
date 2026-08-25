import { describe, expect, it } from 'vitest';
import {
  CHARACTER_DRAFT_RULES,
  DraftIdentityKind,
  DraftOwnership,
  DraftSeatingConstraint,
  DraftSetupMode,
  getCharacterDraftRule,
  getMaximumDraftCopies,
  isPlayerDraftable,
  isProductionDraftSetupMode,
} from '@/utils/drafting/draftRules.ts';

describe('character draft rules', () => {
  it('models every special setup mode', () => {
    expect(getCharacterDraftRule('atheist')?.setupMode).toBe(DraftSetupMode.Atheist);
    expect(getCharacterDraftRule('legion')?.setupMode).toBe(DraftSetupMode.Legion);
    expect(getCharacterDraftRule('lilmonsta')?.setupMode).toBe(DraftSetupMode.LilMonsta);
    expect(getCharacterDraftRule('summoner')?.setupMode).toBe(DraftSetupMode.Summoner);
    expect(getCharacterDraftRule('kazali')?.setupMode).toBe(DraftSetupMode.Kazali);
  });

  it('gates Kazali until its hidden conversion workflow is implemented', () => {
    expect(isProductionDraftSetupMode(DraftSetupMode.Standard)).toBe(true);
    expect(isProductionDraftSetupMode(DraftSetupMode.Atheist)).toBe(true);
    expect(isProductionDraftSetupMode(DraftSetupMode.Kazali)).toBe(false);
  });

  it('keeps Lil Monsta out of player-owned draft options', () => {
    expect(CHARACTER_DRAFT_RULES.lilmonsta.ownership).toBe(DraftOwnership.SetupOnly);
    expect(isPlayerDraftable('lilmonsta')).toBe(false);
    expect(isPlayerDraftable('imp')).toBe(true);
  });

  it('models false and deferred identities', () => {
    expect(CHARACTER_DRAFT_RULES.drunk.identity).toBe(DraftIdentityKind.FalseTownsfolk);
    expect(CHARACTER_DRAFT_RULES.lunatic.identity).toBe(DraftIdentityKind.FalseDemon);
    expect(CHARACTER_DRAFT_RULES.marionette.identity).toBe(DraftIdentityKind.FalseGood);
    expect(CHARACTER_DRAFT_RULES.kazali.identity).toBe(DraftIdentityKind.DeferredGood);
  });

  it('models partner requirements and Heretic incompatibilities', () => {
    expect(CHARACTER_DRAFT_RULES.choirboy.requiredCharacterIds).toEqual(['king']);
    expect(CHARACTER_DRAFT_RULES.huntsman.requiredCharacterIds).toEqual(['damsel']);
    expect(CHARACTER_DRAFT_RULES.heretic.incompatibleCharacterIds).toEqual(
      expect.arrayContaining(['baron', 'godfather', 'lleech', 'pithag', 'spy', 'widow']),
    );
  });

  it('allows only the supported repeated player characters', () => {
    expect(getMaximumDraftCopies('villageidiot')).toBe(3);
    expect(getMaximumDraftCopies('legion')).toBe(15);
    expect(getMaximumDraftCopies('washerwoman')).toBe(1);
  });

  it('records post-draft seating constraints', () => {
    expect(CHARACTER_DRAFT_RULES.marionette.seatingConstraint).toBe(
      DraftSeatingConstraint.NeighborDemon,
    );
    expect(CHARACTER_DRAFT_RULES.lordoftyphon.seatingConstraint).toBe(
      DraftSeatingConstraint.EvilLineDemonMiddle,
    );
    expect(CHARACTER_DRAFT_RULES.nodashii.seatingConstraint).toBe(
      DraftSeatingConstraint.TownsfolkNeighbors,
    );
  });
});
