import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { allCharacters } from '@/data/characters/index.ts';
import { CharacterDraftDialog } from '@/components/Drafting/CharacterDraftDialog.tsx';

const meta = {
  title: 'Drafting/CharacterDraftDialog',
  component: CharacterDraftDialog,
  args: {
    open: true,
    playerIds: ['p1', 'p2', 'p3', 'p4', 'p5'],
    playerNames: {
      p1: 'Alice',
      p2: 'Bob',
      p3: 'Cara',
      p4: 'Dan',
      p5: 'Eve',
    },
    scriptCharacters: allCharacters.filter((character) => character.edition === 'tb'),
    onClose: fn(),
    onDraftChange: fn(),
    onDraftComplete: fn(),
  },
} satisfies Meta<typeof CharacterDraftDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Production draft configuration shown from the normal game setup flow. */
export const ConfigureDraft: Story = {};
