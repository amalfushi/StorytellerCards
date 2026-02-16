import type { Meta, StoryObj } from '@storybook/react-vite';
import { AddTravellerDialog } from './AddTravellerDialog';
import { mockPlayers } from '../../stories/mockData';

const noop = () => {};

const meta = {
  title: 'TownSquare/AddTravellerDialog',
  component: AddTravellerDialog,
  args: {
    open: true,
    onClose: noop,
    onAdd: noop,
  },
} satisfies Meta<typeof AddTravellerDialog>;

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
    existingPlayers: mockPlayers,
  },
};
