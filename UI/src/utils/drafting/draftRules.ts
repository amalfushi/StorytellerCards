import type { CharacterType } from '@/types/index.ts';

export const DraftSetupMode = {
  Standard: 'standard',
  Atheist: 'atheist',
  Legion: 'legion',
  LilMonsta: 'lilmonsta',
  Summoner: 'summoner',
  Kazali: 'kazali',
} as const;
export type DraftSetupMode = (typeof DraftSetupMode)[keyof typeof DraftSetupMode];

export const DraftOwnership = {
  Player: 'player',
  SetupOnly: 'setup-only',
} as const;
export type DraftOwnership = (typeof DraftOwnership)[keyof typeof DraftOwnership];

export const DraftIdentityKind = {
  Actual: 'actual',
  FalseGood: 'false-good',
  FalseTownsfolk: 'false-townsfolk',
  FalseDemon: 'false-demon',
  DeferredGood: 'deferred-good',
} as const;
export type DraftIdentityKind = (typeof DraftIdentityKind)[keyof typeof DraftIdentityKind];

export const DraftSeatingConstraint = {
  NeighborDemon: 'neighbor-demon',
  EvilLineDemonMiddle: 'evil-line-demon-middle',
  TownsfolkNeighbors: 'townsfolk-neighbors',
} as const;
export type DraftSeatingConstraint =
  (typeof DraftSeatingConstraint)[keyof typeof DraftSeatingConstraint];

export interface DraftCountRule {
  type: CharacterType;
  values: readonly number[];
  operation: 'delta' | 'exact';
}

export interface CharacterDraftRule {
  ownership?: DraftOwnership;
  setupMode?: DraftSetupMode;
  countRules?: readonly DraftCountRule[];
  requiredCharacterIds?: readonly string[];
  incompatibleCharacterIds?: readonly string[];
  maxCopies?: number;
  identity?: DraftIdentityKind;
  seatingConstraint?: DraftSeatingConstraint;
  requiresEvilTownsfolk?: boolean;
  requiresOffBoardGoodCharacters?: number;
  setupDisclosure?: string;
}

const HERETIC_INCOMPATIBILITIES = [
  'baron',
  'godfather',
  'lleech',
  'pithag',
  'spy',
  'widow',
] as const;

export const CHARACTER_DRAFT_RULES: Readonly<Record<string, CharacterDraftRule>> = {
  alchemist: {
    setupDisclosure:
      'Choose an eligible Minion ability; Alchemist-Summoner uses the no-Demon workflow.',
  },
  atheist: {
    setupMode: DraftSetupMode.Atheist,
  },
  balloonist: {
    countRules: [{ type: 'Outsider', values: [0, 1], operation: 'delta' }],
  },
  bountyhunter: {
    requiresEvilTownsfolk: true,
  },
  choirboy: {
    requiredCharacterIds: ['king'],
  },
  huntsman: {
    requiredCharacterIds: ['damsel'],
  },
  nodashii: {
    seatingConstraint: DraftSeatingConstraint.TownsfolkNeighbors,
  },
  poppygrower: {
    setupDisclosure: 'Do not reveal the Minion and Demon teams while Poppy Grower is active.',
  },
  magician: {
    setupDisclosure: 'Use the Magician evil-team information workflow.',
  },
  villageidiot: {
    maxCopies: 3,
  },
  drunk: {
    identity: DraftIdentityKind.FalseTownsfolk,
  },
  hermit: {
    countRules: [{ type: 'Outsider', values: [-1, 0], operation: 'delta' }],
  },
  heretic: {
    incompatibleCharacterIds: HERETIC_INCOMPATIBILITIES,
  },
  lunatic: {
    identity: DraftIdentityKind.FalseDemon,
    requiresOffBoardGoodCharacters: 3,
  },
  snitch: {
    requiresOffBoardGoodCharacters: 3,
  },
  baron: {
    countRules: [{ type: 'Outsider', values: [2], operation: 'delta' }],
    incompatibleCharacterIds: ['heretic'],
  },
  boffin: {
    requiresOffBoardGoodCharacters: 1,
  },
  godfather: {
    countRules: [{ type: 'Outsider', values: [-1, 1], operation: 'delta' }],
    incompatibleCharacterIds: ['heretic'],
  },
  marionette: {
    identity: DraftIdentityKind.FalseGood,
    seatingConstraint: DraftSeatingConstraint.NeighborDemon,
  },
  pithag: {
    incompatibleCharacterIds: ['heretic'],
  },
  spy: {
    incompatibleCharacterIds: ['heretic'],
  },
  summoner: {
    setupMode: DraftSetupMode.Summoner,
    requiresOffBoardGoodCharacters: 3,
  },
  widow: {
    incompatibleCharacterIds: ['heretic'],
    setupDisclosure: 'Choose one good player to learn that a Widow is in play.',
  },
  xaan: {
    countRules: [{ type: 'Outsider', values: [0, 1, 2, 3, 4], operation: 'exact' }],
  },
  fanggu: {
    countRules: [{ type: 'Outsider', values: [1], operation: 'delta' }],
  },
  kazali: {
    setupMode: DraftSetupMode.Kazali,
    countRules: [{ type: 'Outsider', values: [-4, -3, -2, -1, 0, 1, 2, 3, 4], operation: 'delta' }],
    identity: DraftIdentityKind.DeferredGood,
    requiresOffBoardGoodCharacters: 3,
  },
  legion: {
    setupMode: DraftSetupMode.Legion,
    maxCopies: 15,
  },
  lilmonsta: {
    ownership: DraftOwnership.SetupOnly,
    setupMode: DraftSetupMode.LilMonsta,
  },
  lleech: {
    incompatibleCharacterIds: ['heretic'],
    setupDisclosure: 'Choose a living Lleech host.',
  },
  lordoftyphon: {
    countRules: [
      { type: 'Minion', values: [1], operation: 'delta' },
      {
        type: 'Outsider',
        values: [-4, -3, -2, -1, 0, 1, 2, 3, 4],
        operation: 'delta',
      },
    ],
    seatingConstraint: DraftSeatingConstraint.EvilLineDemonMiddle,
  },
  vigormortis: {
    countRules: [{ type: 'Outsider', values: [-1], operation: 'delta' }],
  },
} as const;

export function getCharacterDraftRule(characterId: string): CharacterDraftRule | undefined {
  return CHARACTER_DRAFT_RULES[characterId];
}

export function getMaximumDraftCopies(characterId: string): number {
  return CHARACTER_DRAFT_RULES[characterId]?.maxCopies ?? 1;
}

export function isPlayerDraftable(characterId: string): boolean {
  return CHARACTER_DRAFT_RULES[characterId]?.ownership !== DraftOwnership.SetupOnly;
}

export function isProductionDraftSetupMode(mode: DraftSetupMode): boolean {
  return mode !== DraftSetupMode.Kazali;
}
