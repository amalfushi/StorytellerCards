import type { Meta, StoryObj } from '@storybook/react-vite';
import { NightFlashcard } from './NightFlashcard';
import {
  fortuneTeller,
  imp,
  cerenovus,
  fortuneTellerFirstNightEntry,
  impOtherNightEntry,
  cerenovusFirstNightEntry,
  charliePlayer,
  bobPlayer,
  dianaPlayer,
} from '../../stories/mockData';

const noop = () => {};

const meta = {
  title: 'NightPhase/NightFlashcard',
  component: NightFlashcard,
  args: {
    onToggleSubAction: noop,
    onNotesChange: noop,
    notes: '',
    readOnly: false,
    isDead: false,
  },
  argTypes: {
    readOnly: { control: 'boolean' },
    isDead: { control: 'boolean' },
    notes: { control: 'text' },
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
} satisfies Meta<typeof NightFlashcard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Fortune Teller card with a living player assigned, all sub-actions unchecked.
 *  The power description (`abilityShort`) is rendered in bold with slightly larger font. */
export const AlivePlayer: Story = {
  args: {
    entry: fortuneTellerFirstNightEntry,
    playerSeat: { ...charliePlayer, alive: true },
    characterDef: fortuneTeller,
    checkedStates: [false, false],
    isDead: false,
  },
};

/** Same card but the player is dead — faded ghost styling with 👻 badge. */
export const DeadPlayer: Story = {
  args: {
    entry: fortuneTellerFirstNightEntry,
    playerSeat: charliePlayer,
    characterDef: fortuneTeller,
    checkedStates: [false, false],
    isDead: true,
  },
};

/** Some sub-actions checked (partially completed). */
export const PartiallyCompleted: Story = {
  args: {
    entry: fortuneTellerFirstNightEntry,
    playerSeat: { ...charliePlayer, alive: true },
    characterDef: fortuneTeller,
    checkedStates: [true, false],
    isDead: false,
  },
};

/** Card with storyteller notes filled in. */
export const WithNotes: Story = {
  args: {
    entry: fortuneTellerFirstNightEntry,
    playerSeat: { ...charliePlayer, alive: true },
    characterDef: fortuneTeller,
    checkedStates: [true, true],
    isDead: false,
    notes: 'Charlie chose Alice and Bob. Nodded yes (Bob is Imp).',
  },
};

/** Character entry with no player assigned. */
export const UnassignedCharacter: Story = {
  args: {
    entry: fortuneTellerFirstNightEntry,
    playerSeat: undefined,
    characterDef: fortuneTeller,
    checkedStates: [false, false],
    isDead: false,
  },
};

/** Read-only mode for reviewing night history. */
export const ReadOnly: Story = {
  args: {
    entry: fortuneTellerFirstNightEntry,
    playerSeat: { ...charliePlayer, alive: true },
    characterDef: fortuneTeller,
    checkedStates: [true, false],
    isDead: false,
    readOnly: true,
    notes: 'Historic note from previous night.',
  },
};

/** Imp character card — Demon type with red styling. */
export const DemonCard: Story = {
  args: {
    entry: impOtherNightEntry,
    playerSeat: bobPlayer,
    characterDef: imp,
    checkedStates: [false, false, false, false, false],
    isDead: false,
  },
};

/** Cerenovus character card — Minion type. */
export const MinionCard: Story = {
  args: {
    entry: cerenovusFirstNightEntry,
    playerSeat: dianaPlayer,
    characterDef: cerenovus,
    checkedStates: [false, false, false, false],
    isDead: false,
  },
};

// ────────────────────────────────────────────────────────
// Token stories (F3-18)
// ────────────────────────────────────────────────────────

/** Player with a Drunk token — purple "Drunk" chip below ability text. */
export const WithDrunkToken: Story = {
  args: {
    entry: fortuneTellerFirstNightEntry,
    playerSeat: {
      ...charliePlayer,
      alive: true,
      tokens: [{ id: 'tok-drunk-1', type: 'drunk', label: 'Drunk', color: '#1976d2' }],
    },
    characterDef: fortuneTeller,
    checkedStates: [false, false],
    isDead: false,
  },
};

/** Player with Poisoned + custom tokens — multiple chips below ability text. */
export const WithMultipleTokens: Story = {
  args: {
    entry: impOtherNightEntry,
    playerSeat: {
      ...bobPlayer,
      tokens: [
        { id: 'tok-poisoned-1', type: 'poisoned', label: 'Poisoned', color: '#7b1fa2' },
        { id: 'tok-custom-1', type: 'custom', label: 'Is the Drunk', color: '#ff9800' },
        { id: 'tok-custom-2', type: 'custom', label: 'Mad', color: '#e91e63' },
      ],
    },
    characterDef: imp,
    checkedStates: [false, false, false, false, false],
    isDead: false,
  },
};

// ────────────────────────────────────────────────────────
// Responsive viewport variant (P2-2)
// ────────────────────────────────────────────────────────

/** Tablet viewport — alive player card at iPad size. */
export const TabletViewport: Story = {
  ...AlivePlayer,
  parameters: {
    ...AlivePlayer.parameters,
    viewport: { defaultViewport: 'tablet' },
  },
};
