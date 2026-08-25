import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { allCharacters } from '@/data/characters/index.ts';
import { CharacterDraftRoller } from '@/components/Drafting/CharacterDraftRoller.tsx';

const scriptCharacters = allCharacters.filter((character) => character.edition === 'bmr');

const meta = {
  title: 'Drafting/CharacterDraftRoller',
  component: CharacterDraftRoller,
  parameters: { layout: 'padded' },
  args: {
    playerName: 'Player 1',
    scriptCharacters,
    offer: {
      offeredCharacterIds: ['grandmother', 'lunatic', 'assassin'],
      mulliganCharacterId: 'po',
      rolledCharacterTypes: [],
    },
    onChoose: fn(),
    onMulligan: fn(),
  },
} satisfies Meta<typeof CharacterDraftRoller>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Standard private player handoff with three unrevealed rolling columns. */
export const StandardOffer: Story = {};

/** Scarce legal pool with two visible choices and one mandatory mulligan branch. */
export const TwoChoiceOffer: Story = {
  args: {
    offer: {
      offeredCharacterIds: ['grandmother', 'lunatic'],
      mulliganCharacterId: 'po',
      rolledCharacterTypes: [],
    },
  },
};

/** Final forced role when only one legal completion remains. */
export const MandatoryCharacter: Story = {
  args: {
    offer: {
      offeredCharacterIds: ['grandmother'],
      mulliganCharacterId: null,
      rolledCharacterTypes: ['Townsfolk'],
    },
  },
};
