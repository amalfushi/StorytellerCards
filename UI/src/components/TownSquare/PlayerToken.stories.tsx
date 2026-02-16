import type { Meta, StoryObj } from '@storybook/react-vite';
import { PlayerToken } from './PlayerToken';
import {
  mockCharacters,
  alicePlayer,
  charliePlayer,
  bobPlayer,
  dianaPlayer,
  evePlayer,
  travJackPlayer,
} from '../../stories/mockData';
import type { CharacterDef } from '../../types';

const noop = () => {};

/** Look up a character definition by id. */
const char = (id: string): CharacterDef | undefined => mockCharacters.find((c) => c.id === id);

const meta = {
  title: 'TownSquare/PlayerToken',
  component: PlayerToken,
  args: {
    showCharacters: false,
    isSelected: false,
    onClick: noop,
    size: 'medium',
  },
  argTypes: {
    showCharacters: { control: 'boolean' },
    isSelected: { control: 'boolean' },
    size: { control: 'select', options: ['small', 'medium', 'large'] },
  },
} satisfies Meta<typeof PlayerToken>;

export default meta;
type Story = StoryObj<typeof meta>;

// ────────────────────────────────────────────────────────
// Day-view stories
// ────────────────────────────────────────────────────────

/** Day view — alive player showing name + seat number. */
export const DayViewAlive: Story = {
  args: {
    player: alicePlayer,
    characterDef: char('noble'),
    showCharacters: false,
  },
};

/** Day view — dead player with faded appearance and ghost indicator. */
export const DayViewDead: Story = {
  args: {
    player: charliePlayer,
    characterDef: char('fortuneteller'),
    showCharacters: false,
  },
};

// ────────────────────────────────────────────────────────
// Night-view stories (showCharacters = true)
// ────────────────────────────────────────────────────────

/** Night view — townsfolk character with blue icon and blue border. */
export const NightViewTownsfolk: Story = {
  args: {
    player: alicePlayer,
    characterDef: char('noble'),
    showCharacters: true,
  },
};

/** Night view — demon character with dark red icon and evil border. */
export const NightViewDemon: Story = {
  args: {
    player: bobPlayer,
    characterDef: char('imp'),
    showCharacters: true,
  },
};

/** Night view — minion character with red styling. */
export const NightViewMinion: Story = {
  args: {
    player: dianaPlayer,
    characterDef: char('cerenovus'),
    showCharacters: true,
  },
};

// ────────────────────────────────────────────────────────
// State variations
// ────────────────────────────────────────────────────────

/** Dead player who has used their ghost vote — shows crossed-out ballot. */
export const GhostVoteUsed: Story = {
  args: {
    player: evePlayer,
    characterDef: char('drunk'),
    showCharacters: false,
  },
};

/** Traveller token — split blue/red border in night view. */
export const TravellerToken: Story = {
  args: {
    player: travJackPlayer,
    characterDef: undefined,
    showCharacters: true,
  },
};

/** Selected token — elevated with highlighted ring. */
export const Selected: Story = {
  args: {
    player: alicePlayer,
    characterDef: char('noble'),
    showCharacters: false,
    isSelected: true,
  },
};

// ────────────────────────────────────────────────────────
// Size variations
// ────────────────────────────────────────────────────────

/** Small size — compact token for 15+ player games. */
export const SmallSize: Story = {
  args: {
    player: alicePlayer,
    characterDef: char('noble'),
    showCharacters: true,
    size: 'small',
  },
};

/** Large size — roomy token for 5–8 player games. */
export const LargeSize: Story = {
  args: {
    player: alicePlayer,
    characterDef: char('noble'),
    showCharacters: true,
    size: 'large',
  },
};
