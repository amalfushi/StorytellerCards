import type { Meta, StoryObj } from '@storybook/react-vite';
import { CharacterCard } from './CharacterCard';
import { noble, drunk, cerenovus, imp, slayer } from '../../stories/mockData';

const meta = {
  title: 'ScriptViewer/CharacterCard',
  component: CharacterCard,
} satisfies Meta<typeof CharacterCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Townsfolk — Noble character with blue styling. */
export const Townsfolk: Story = {
  args: {
    character: noble,
  },
};

/** Outsider — Drunk character with lighter blue styling. */
export const Outsider: Story = {
  args: {
    character: drunk,
  },
};

/** Minion — Cerenovus character with red styling. */
export const Minion: Story = {
  args: {
    character: cerenovus,
  },
};

/** Demon — Imp character with dark red styling. */
export const Demon: Story = {
  args: {
    character: imp,
  },
};

/**
 * Pre-expanded to show detailed rules, night help text, and links.
 * Uses a render function to mount the Accordion as already-expanded.
 */
export const Expanded: Story = {
  args: {
    character: {
      ...cerenovus,
      abilityDetailed:
        'The Cerenovus forces a player to pretend to be a different good character tomorrow, ' +
        'or risk execution. The Cerenovus acts each night, choosing a player and a good character. ' +
        'That player must pretend to be that character the next day.',
      wikiLink: 'https://wiki.bloodontheclocktower.com/Cerenovus',
    },
  },
};

/** No night actions to display — Slayer is a day-ability character. */
export const NoNightAction: Story = {
  args: {
    character: slayer,
  },
};
