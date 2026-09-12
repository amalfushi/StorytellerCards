import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { allCharacters } from '@/data/characters/index.ts';
import { AddTravellerDialog } from './AddTravellerDialog.tsx';

const meta = {
  title: 'Town Square/AddTravellerDialog',
  component: AddTravellerDialog,
  args: {
    open: true,
    players: [
      { id: 'player-1', name: 'Alice' },
      { id: 'player-2', name: 'Bob' },
    ],
    slots: [
      { kind: 'seat', id: 'seat-1', playerId: 'player-1' },
      { kind: 'seat', id: 'seat-2', playerId: null },
    ],
    scriptCharacterIds: ['scapegoat'],
    characters: allCharacters,
    onClose: fn(),
    onAdd: fn(),
  },
} satisfies Meta<typeof AddTravellerDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithEmptySeat: Story = {};

export const NewPlayerAndSeat: Story = {
  args: {
    players: [],
    slots: [],
    scriptCharacterIds: [],
  },
};
