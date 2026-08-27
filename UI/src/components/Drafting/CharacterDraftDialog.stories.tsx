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
    playerColors: {
      p1: '#1976d2',
      p2: '#d32f2f',
      p3: '#388e3c',
      p4: '#f57c00',
      p5: '#7b1fa2',
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

/** Storyteller board after players have completed type-colored draft selections. */
export const StorytellerBoard: Story = {
  args: {
    draftState: {
      status: 'drafting',
      setupMode: 'standard',
      presentationMode: 'open',
      playerOrder: ['p1', 'p2', 'p3', 'p4', 'p5'],
      currentPlayerIndex: 2,
      activePlayerId: 'p3',
      entries: [
        {
          playerId: 'p1',
          offer: {
            offeredCharacterIds: ['washerwoman'],
            mulliganCharacterId: null,
            rolledCharacterTypes: [],
            legalCandidateCount: 10,
          },
          selectedCharacterId: 'washerwoman',
          actualCharacterId: 'washerwoman',
          apparentCharacterId: 'washerwoman',
          resolution: 'choice',
        },
        {
          playerId: 'p2',
          offer: {
            offeredCharacterIds: ['baron'],
            mulliganCharacterId: null,
            rolledCharacterTypes: [],
            legalCandidateCount: 8,
          },
          selectedCharacterId: 'baron',
          actualCharacterId: 'baron',
          apparentCharacterId: 'baron',
          resolution: 'choice',
        },
        {
          playerId: 'p3',
          offer: {
            offeredCharacterIds: ['chef', 'empath', 'imp'],
            mulliganCharacterId: 'poisoner',
            rolledCharacterTypes: [],
            legalCandidateCount: 7,
          },
        },
      ],
      revision: 4,
    },
  },
};
