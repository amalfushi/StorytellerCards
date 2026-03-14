import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { NightFlashcard } from './NightFlashcard';
import type { ActiveJinx } from '../../types';
import {
  fortuneTeller,
  imp,
  cerenovus,
  noble,
  drunk,
  slayer,
  lunatic,
  fortuneTellerFirstNightEntry,
  impOtherNightEntry,
  cerenovusFirstNightEntry,
  lunaticFirstNightEntry,
  charliePlayer,
  bobPlayer,
  dianaPlayer,
  alicePlayer,
  mockPlayers,
  mockCharacters,
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

// ────────────────────────────────────────────────────────
// Active Jinx stories (M29-M34)
// ────────────────────────────────────────────────────────

const mockJinxes: ActiveJinx[] = [
  {
    character1Id: 'fortuneteller',
    character1Name: 'Fortune Teller',
    character2Id: 'nodashii',
    character2Name: 'No Dashii',
    description:
      'If the Fortune Teller is in play, the No Dashii kills an additional player on the first night.',
  },
];

const multipleJinxes: ActiveJinx[] = [
  ...mockJinxes,
  {
    character1Id: 'fortuneteller',
    character1Name: 'Fortune Teller',
    character2Id: 'cerenovus',
    character2Name: 'Cerenovus',
    description: 'The Fortune Teller may register as mad when being read.',
  },
];

/** Card with a single active jinx — amber warning banner below the separator. */
export const WithSingleJinx: Story = {
  args: {
    entry: fortuneTellerFirstNightEntry,
    playerSeat: { ...charliePlayer, alive: true },
    characterDef: fortuneTeller,
    checkedStates: [false, false],
    isDead: false,
    activeJinxes: mockJinxes,
  },
};

/** Card with multiple active jinxes — stacked jinx reminders. */
export const WithMultipleJinxes: Story = {
  args: {
    entry: fortuneTellerFirstNightEntry,
    playerSeat: { ...charliePlayer, alive: true },
    characterDef: fortuneTeller,
    checkedStates: [false, false],
    isDead: false,
    activeJinxes: multipleJinxes,
  },
};

// ────────────────────────────────────────────────────────
// Selection/choice stories (M29-M34)
// ────────────────────────────────────────────────────────

/** Cerenovus with compound choice selectors (player + character). */
export const WithSelectionValue: Story = {
  args: {
    entry: cerenovusFirstNightEntry,
    playerSeat: dianaPlayer,
    characterDef: cerenovus,
    checkedStates: [false, false, false, false],
    isDead: false,
    players: mockPlayers.slice(0, 7),
    scriptCharacters: [noble, fortuneTeller, imp, drunk, slayer],
    selectionValue: ['Alice', 'noble'],
    onSelectionChange: fn(),
    characterLookup: (id: string) => mockCharacters.find((c) => c.id === id),
  },
};

/** Fortune Teller with previous selection displayed for context. */
export const WithPreviousSelection: Story = {
  args: {
    entry: fortuneTellerFirstNightEntry,
    playerSeat: { ...charliePlayer, alive: true },
    characterDef: fortuneTeller,
    checkedStates: [false, false],
    isDead: false,
    players: mockPlayers.slice(0, 7),
    scriptCharacters: [noble, fortuneTeller, imp, drunk, slayer],
    selectionValue: '',
    onSelectionChange: fn(),
    previousSelection: ['Alice', 'Bob'],
    characterLookup: (id: string) => mockCharacters.find((c) => c.id === id),
  },
};

// ────────────────────────────────────────────────────────
// Lunatic bluff display (M29-M34)
// ────────────────────────────────────────────────────────

/** Lunatic card with bluff characters — shows "Show these bluffs to the Lunatic" section. */
export const LunaticWithBluffs: Story = {
  args: {
    entry: lunaticFirstNightEntry,
    playerSeat: { ...alicePlayer, characterId: 'lunatic' },
    characterDef: lunatic,
    checkedStates: new Array(lunaticFirstNightEntry.subActions.length).fill(false),
    isDead: false,
    lunaticBluffCharacters: [noble, fortuneTeller, slayer],
  },
};

/** Demon card with demon bluff characters — prop is accepted but display is on PlayerShowScreen. */
export const DemonWithBluffs: Story = {
  args: {
    entry: impOtherNightEntry,
    playerSeat: bobPlayer,
    characterDef: imp,
    checkedStates: [false, false, false, false, false],
    isDead: false,
    demonBluffCharacters: [noble, fortuneTeller, drunk],
  },
};

// ────────────────────────────────────────────────────────
// Reminder token click (M29-M34)
// ────────────────────────────────────────────────────────

/** Card with reminder tokens that have onClick handlers — clicking navigates to Day view. */
export const WithReminderTokenClick: Story = {
  args: {
    entry: fortuneTellerFirstNightEntry,
    playerSeat: { ...charliePlayer, alive: true },
    characterDef: fortuneTeller,
    checkedStates: [false, false],
    isDead: false,
    onReminderTokenClick: fn(),
    characterLookup: (id: string) => mockCharacters.find((c) => c.id === id),
  },
};

// ────────────────────────────────────────────────────────
// Show Player drawer button (M29-M34)
// ────────────────────────────────────────────────────────

/** Card with "Show Player" button — visibility icon above notes when onOpenShowDrawer is provided. */
export const WithShowDrawerButton: Story = {
  args: {
    entry: fortuneTellerFirstNightEntry,
    playerSeat: { ...charliePlayer, alive: true },
    characterDef: fortuneTeller,
    checkedStates: [false, false],
    isDead: false,
    onOpenShowDrawer: fn(),
  },
};

/** Read-only mode hides the show drawer button. */
export const ReadOnlyNoShowDrawer: Story = {
  args: {
    entry: fortuneTellerFirstNightEntry,
    playerSeat: { ...charliePlayer, alive: true },
    characterDef: fortuneTeller,
    checkedStates: [true, true],
    isDead: false,
    readOnly: true,
    onOpenShowDrawer: fn(),
    notes: 'Historic note — show button should not appear.',
  },
};

// ────────────────────────────────────────────────────────
// Combined — kitchen sink story (M29-M34)
// ────────────────────────────────────────────────────────

/** All M29-M34 features combined: jinxes, selections, reminder click, and show drawer. */
export const KitchenSink: Story = {
  args: {
    entry: cerenovusFirstNightEntry,
    playerSeat: dianaPlayer,
    characterDef: cerenovus,
    checkedStates: [true, false, false, false],
    isDead: false,
    players: mockPlayers.slice(0, 7),
    scriptCharacters: [noble, fortuneTeller, imp, drunk, slayer],
    selectionValue: ['Bob', 'noble'],
    onSelectionChange: fn(),
    previousSelection: ['Alice', 'fortuneteller'],
    activeJinxes: [
      {
        character1Id: 'cerenovus',
        character1Name: 'Cerenovus',
        character2Id: 'nodashii',
        character2Name: 'No Dashii',
        description: 'The Cerenovus and No Dashii have a special interaction affecting madness.',
      },
    ],
    characterLookup: (id: string) => mockCharacters.find((c) => c.id === id),
    onReminderTokenClick: fn(),
    onOpenShowDrawer: fn(),
    notes: 'Selected Bob to be mad as Noble.',
  },
};
