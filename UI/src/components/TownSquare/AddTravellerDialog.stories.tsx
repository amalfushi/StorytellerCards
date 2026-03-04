import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, userEvent, expect, fn } from 'storybook/test';
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

// ────────────────────────────────────────────────────────
// Interaction test (P2-3)
// ────────────────────────────────────────────────────────

/** Fill in the form and verify the Add button becomes enabled. */
export const FormInteraction: Story = {
  args: {
    existingPlayers: [],
    onAdd: fn(),
    onClose: fn(),
  },
  play: async () => {
    // Dialog renders in a portal on document.body
    const body = within(document.body);

    // The "Add Traveller" button should initially be disabled (no input)
    const addButton = await body.findByRole('button', { name: /add traveller/i });
    await expect(addButton).toBeDisabled();

    // Fill in character name
    const charInput = body.getByLabelText(/traveller character name/i);
    await userEvent.type(charInput, 'Scapegoat');

    // Fill in player name
    const playerInput = body.getByLabelText(/player name/i);
    await userEvent.type(playerInput, 'TestPlayer');

    // Now the Add button should be enabled
    await expect(addButton).toBeEnabled();
  },
};
