import type { Meta, StoryObj } from '@storybook/react-vite';
import { CharacterDetailModal } from './CharacterDetailModal';
import { noble, imp, cerenovus, slayer, fortuneTeller } from '../../stories/mockData';
import type { CharacterDef } from '../../types';

const meta = {
  title: 'Common/CharacterDetailModal',
  component: CharacterDetailModal,
  args: {
    open: true,
    onClose: () => {},
  },
} satisfies Meta<typeof CharacterDetailModal>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Townsfolk with first-night action only, no detailed rules, no wiki link. */
export const TownsfolkMinimal: Story = {
  args: {
    character: noble,
  },
};

/** Demon with both night actions and reminders. */
export const DemonFullData: Story = {
  args: {
    character: {
      ...imp,
      abilityDetailed:
        'If the Imp kills themselves at night, a Minion becomes the Imp. ' +
        'The Storyteller chooses which Minion. If the Imp attacks and the target is protected, ' +
        'the Imp learns nothing — they simply failed to kill. ' +
        'If the Imp dies during the day, good wins.',
      wikiLink: 'https://wiki.bloodontheclocktower.com/Imp',
    },
  },
};

/** Minion with detailed rules. */
export const MinionWithDetails: Story = {
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

/** Character with no night actions at all (day-only ability). */
export const NoNightActions: Story = {
  args: {
    character: slayer,
  },
};

/** Character with both night actions, showing the full layout. */
export const BothNightActions: Story = {
  args: {
    character: fortuneTeller,
  },
};

/** Character with no detailed rules — shows fallback message. */
export const NoDetailedRules: Story = {
  args: {
    character: noble,
  },
};

/** Character with wiki link only (no detailed rules). */
export const WithWikiLink: Story = {
  args: {
    character: {
      ...slayer,
      wikiLink: 'https://wiki.bloodontheclocktower.com/Slayer',
    },
  },
};

/** Minimal fallback character (unknown type, no data). */
export const FallbackCharacter: Story = {
  args: {
    character: {
      id: 'unknown_char',
      name: 'Unknown Character',
      type: 'Unknown' as CharacterDef['type'],
      defaultAlignment: 'Unknown',
      abilityShort: '<TODO>',
      firstNight: null,
      otherNights: null,
      icon: { placeholder: '#9e9e9e' },
      reminders: [],
    } as CharacterDef,
  },
};

/** Modal in closed state (should render nothing visible). */
export const Closed: Story = {
  args: {
    open: false,
    character: noble,
  },
};
