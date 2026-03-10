import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, within, userEvent, expect } from 'storybook/test';
import { PlayerActionsModal } from './PlayerActionsModal';
import {
  alicePlayer,
  bobPlayer,
  charliePlayer,
  travJackPlayer,
  mockCharacters,
} from '../../stories/mockData';
import type { PlayerSeat, CharacterDef } from '../../types';

const noop = () => {};

/** Subset of script characters for the character dropdown. */
const scriptCharacters: CharacterDef[] = mockCharacters.filter((c) =>
  ['noble', 'imp', 'fortuneteller', 'cerenovus', 'drunk', 'slayer'].includes(c.id),
);

/** Good-team characters for demon bluff options. */
const goodCharacters: CharacterDef[] = mockCharacters.filter(
  (c) => c.type === 'Townsfolk' || c.type === 'Outsider',
);

/** Demon bluff IDs. */
const demonBluffIds = ['noble', 'fortuneteller', 'slayer'];
/** Resolved bluff definitions. */
const bluffCharacters: CharacterDef[] = demonBluffIds
  .map((id) => mockCharacters.find((c) => c.id === id))
  .filter((c): c is CharacterDef => c !== undefined);

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
// Demon bluffs stories (M27)
// ────────────────────────────────────────────────────────

/**
 * Visible mode — Demon player with bluffs section.
 * Shows 3 demon bluffs with character avatars and swap autocomplete below
 * the main actions when the player is a Demon.
 */
export const VisibleModeWithDemonBluffs: Story = {
  args: {
    player: bobPlayer,
    showCharacters: true,
    scriptCharacters,
    demonBluffs: demonBluffIds,
    bluffCharacters,
    availableBluffCharacters: goodCharacters,
    onChangeBluff: fn(),
  },
};

/**
 * Visible mode — Demon player with swap seat action.
 * Shows both demon bluffs and the "Swap With" button.
 */
export const VisibleModeWithSwap: Story = {
  args: {
    player: bobPlayer,
    showCharacters: true,
    scriptCharacters,
    demonBluffs: demonBluffIds,
    bluffCharacters,
    availableBluffCharacters: goodCharacters,
    onChangeBluff: fn(),
    onSwapWith: fn(),
  },
};

// ────────────────────────────────────────────────────────
// Interaction tests
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
