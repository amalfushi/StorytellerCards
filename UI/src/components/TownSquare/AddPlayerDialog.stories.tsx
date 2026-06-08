import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { AddPlayerDialog } from './AddPlayerDialog';
import { mockPlayers } from '../../stories/mockData';

const noop = () => {};

const meta = {
  title: 'TownSquare/AddPlayerDialog',
  component: AddPlayerDialog,
  args: {
    open: true,
    onClose: noop,
    onAdd: noop,
    scriptCharacterIds: ['imp', 'noble', 'scapegoat', 'butler', 'poisoner', 'washerwoman'],
    inPlayCharacterIds: ['imp', 'noble'],
  },
} satisfies Meta<typeof AddPlayerDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Dialog in open state with no existing players — seat defaults to 1. */
export const Open: Story = {
  args: {
    existingPlayers: [],
  },
};

/** Dialog with existing players — auto-suggests the next available seat number. */
export const WithSeatsAvailable: Story = {
  args: {
    existingPlayers: mockPlayers.map((player) => ({
      seatNumber: player.seatNumber ?? player.seat,
    })),
  },
};

/** Dialog with form callbacks for interaction testing. */
export const FormInteraction: Story = {
  args: {
    existingPlayers: [],
    onAdd: fn(),
    onClose: fn(),
  },
};
