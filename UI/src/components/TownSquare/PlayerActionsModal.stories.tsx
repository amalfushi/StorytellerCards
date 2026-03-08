import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, userEvent, expect } from 'storybook/test';
import { PlayerActionsModal } from './PlayerActionsModal';
import { alicePlayer, charliePlayer, travJackPlayer, mockCharacters } from '../../stories/mockData';
import type { PlayerSeat, CharacterDef } from '../../types';

const noop = () => {};

/** Subset of script characters for the character dropdown. */
const scriptCharacters: CharacterDef[] = mockCharacters.filter((c) =>
  ['noble', 'imp', 'fortuneteller', 'cerenovus', 'drunk', 'slayer'].includes(c.id),
);

/** Dead player with ghost vote not used. */
const deadPlayerNoGhostVote: PlayerSeat = {
  ...charliePlayer,
  ghostVoteUsed: false,
};

/** Dead traveller player (for combined dead + traveller state). */
const deadTraveller: PlayerSeat = {
  ...travJackPlayer,
  alive: false,
  ghostVoteUsed: false,
};

const meta = {
  title: 'TownSquare/PlayerActionsModal',
  component: PlayerActionsModal,
  args: {
    open: true,
    showCharacters: false,
    scriptCharacters,
    onClose: noop,
    onToggleAlive: noop,
    onToggleGhostVote: noop,
    onRemoveTraveller: noop,
    onManageTokens: noop,
    onSaveCharacter: noop,
  },
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof PlayerActionsModal>;

export default meta;
type Story = StoryObj<typeof meta>;

// ────────────────────────────────────────────────────────
// Hidden mode stories (showCharacters = false)
// ────────────────────────────────────────────────────────

/**
 * Hidden mode — alive player.
 * Shows only Mark as Dead and Close buttons.
 * No character dropdown, alignment toggles, or token management.
 */
export const HiddenModeAlivePlayer: Story = {
  args: {
    player: alicePlayer,
    showCharacters: false,
  },
};

/**
 * Hidden mode — dead player.
 * Shows Mark as Alive and ghost vote toggle options.
 */
export const HiddenModeDeadPlayer: Story = {
  args: {
    player: deadPlayerNoGhostVote,
    showCharacters: false,
  },
};

/**
 * Hidden mode — traveller player.
 * Shows Remove Traveller button in addition to alive/dead toggle.
 */
export const HiddenModeTraveller: Story = {
  args: {
    player: travJackPlayer,
    showCharacters: false,
  },
};

// ────────────────────────────────────────────────────────
// Visible mode stories (showCharacters = true)
// ────────────────────────────────────────────────────────

/**
 * Visible mode — full actions.
 * Shows all available actions: alive toggle, Manage Tokens,
 * character dropdown, alignment toggles, and Save Changes.
 */
export const VisibleModeFullActions: Story = {
  args: {
    player: alicePlayer,
    showCharacters: true,
  },
};

/**
 * Visible mode — with script characters populated.
 * Demonstrates the character dropdown with multiple selectable characters.
 */
export const VisibleModeWithScriptCharacters: Story = {
  args: {
    player: alicePlayer,
    showCharacters: true,
    scriptCharacters,
  },
};

// ────────────────────────────────────────────────────────
// Interaction test (Phase 7B)
// ────────────────────────────────────────────────────────

/**
 * Interaction test: clicking "Mark as Dead" button.
 * Verifies the button renders and is clickable within the dialog.
 */
export const ClickMarkAsDead: Story = {
  args: {
    player: alicePlayer,
    showCharacters: false,
  },
  play: async () => {
    // Dialog renders in a portal on document.body
    const body = within(document.body);
    const markDeadBtn = await body.findByText('Mark as Dead');
    await expect(markDeadBtn).toBeInTheDocument();
    await userEvent.click(markDeadBtn);
  },
};

/**
 * Interaction test: clicking ghost vote toggle for dead player.
 * Verifies the "Use Ghost Vote" button renders for a dead player.
 */
export const ClickGhostVote: Story = {
  args: {
    player: deadTraveller,
    showCharacters: false,
  },
  play: async () => {
    const body = within(document.body);
    const ghostVoteBtn = await body.findByText('Use Ghost Vote');
    await expect(ghostVoteBtn).toBeInTheDocument();
    await userEvent.click(ghostVoteBtn);
  },
};
