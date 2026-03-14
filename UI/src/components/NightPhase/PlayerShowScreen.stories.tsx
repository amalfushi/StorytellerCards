import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, within, expect } from 'storybook/test';
import { PlayerShowScreen } from './PlayerShowScreen';
import {
  fortuneTeller,
  imp,
  cerenovus,
  noble,
  drunk,
  slayer,
  philosopher,
} from '../../stories/mockData';

const noop = () => {};

const meta = {
  title: 'NightPhase/PlayerShowScreen',
  component: PlayerShowScreen,
  args: {
    open: true,
    onClose: noop,
  },
  parameters: {
    backgrounds: { default: 'dark' },
    layout: 'fullscreen',
  },
} satisfies Meta<typeof PlayerShowScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

// ──────────────────────────────────────────────
// Bluffs variant
// ──────────────────────────────────────────────

/** Bluffs variant — "Your bluffs are:" with 3 good character icons. */
export const BluffsThreeCharacters: Story = {
  args: {
    variant: 'bluffs',
    bluffCharacters: [noble, fortuneTeller, slayer],
  },
};

/** Bluffs with only 1 character — minimal display. */
export const BluffsSingleCharacter: Story = {
  args: {
    variant: 'bluffs',
    bluffCharacters: [philosopher],
  },
};

// ──────────────────────────────────────────────
// Text variant
// ──────────────────────────────────────────────

/** Text variant — large centered message shown to the player. */
export const TextMessage: Story = {
  args: {
    variant: 'text',
    message: 'You are the Fortune Teller',
  },
};

/** Text variant — "You know:" message for information reveals. */
export const YouKnowMessage: Story = {
  args: {
    variant: 'text',
    message: 'You know: Alice, Bob, or Charlie is evil.',
  },
};

/** Text variant — might/may rewrite style message. */
export const MightMayRewrite: Story = {
  args: {
    variant: 'text',
    message: 'You might die tonight. You may want to use your ability.',
  },
};

/** Text variant — long message to test text wrapping. */
export const LongTextMessage: Story = {
  args: {
    variant: 'text',
    message:
      'The Storyteller shows you 3 character tokens of good characters that are not in play. Any 3 of these characters could be your bluffs.',
  },
};

// ──────────────────────────────────────────────
// Token variant — basic
// ──────────────────────────────────────────────

/** Token variant with "SELECTED YOU" text and Cerenovus source icon — the Cerenovus picked this player. */
export const SelectedYouWithSource: Story = {
  args: {
    variant: 'token',
    tokenText: 'SELECTED YOU',
    sourceCharacter: cerenovus,
  },
};

/** Token variant with "You are:" text — basic identity reveal. */
export const YouAreToken: Story = {
  args: {
    variant: 'token',
    tokenText: 'You are:',
  },
};

// ──────────────────────────────────────────────
// Token variant — with character picker
// ──────────────────────────────────────────────

/** Token variant with character picker — Storyteller can select a character to display. */
export const TokenWithCharacterPicker: Story = {
  args: {
    variant: 'token',
    tokenText: 'You are:',
    showCharacterPicker: true,
    scriptCharacters: [noble, fortuneTeller, imp, drunk, slayer, philosopher],
  },
};

// ──────────────────────────────────────────────
// Token variant — Cerenovus madness
// ──────────────────────────────────────────────

/** Cerenovus "SELECTED YOU" with madness character and instruction text. */
export const CerenovusSelectedYouWithMadness: Story = {
  args: {
    variant: 'token',
    tokenText: 'SELECTED YOU',
    sourceCharacter: cerenovus,
    additionalLabel: 'You are now MAD that you are:',
    additionalCharacter: fortuneTeller,
    instructionText:
      'Something bad may happen if you do not pretend to be the character you are mad about.',
  },
};

// ──────────────────────────────────────────────
// Token variant — additional character only
// ──────────────────────────────────────────────

/** Token with additional character but no source — shows both labels and icon. */
export const TokenWithAdditionalCharacter: Story = {
  args: {
    variant: 'token',
    tokenText: 'You must be MAD that you are:',
    sourceCharacter: undefined,
    additionalLabel: undefined,
    additionalCharacter: noble,
    instructionText:
      'If you are MAD that you are this character, you may gain their ability when they die.',
  },
};

// ──────────────────────────────────────────────
// Edge cases
// ──────────────────────────────────────────────

/** Closed state — dialog should not be visible. */
export const Closed: Story = {
  args: {
    open: false,
    variant: 'text',
    message: 'This should not be visible',
  },
};

// ──────────────────────────────────────────────
// Responsive viewport variants
// ──────────────────────────────────────────────

/** Tablet viewport — icons and text scale up ~50% for readability at a distance. */
export const TabletBluffs: Story = {
  args: {
    variant: 'bluffs',
    bluffCharacters: [noble, fortuneTeller, slayer],
  },
  parameters: {
    viewport: { defaultViewport: 'tablet' },
  },
};

/** Tablet viewport — text variant at larger size. */
export const TabletTextMessage: Story = {
  args: {
    variant: 'text',
    message: 'You are the Fortune Teller',
  },
  parameters: {
    viewport: { defaultViewport: 'tablet' },
  },
};

// ──────────────────────────────────────────────
// Interaction tests
// ──────────────────────────────────────────────

/** Close button interaction — clicking the close button calls onClose. */
export const CloseButtonInteraction: Story = {
  args: {
    variant: 'text',
    message: 'Tap the X to close',
    onClose: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body);
    const closeBtn = canvas.getByTestId('player-show-screen-close');
    await expect(closeBtn).toBeInTheDocument();
  },
};
