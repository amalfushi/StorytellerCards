import type { Meta, StoryObj } from '@storybook/react-vite';
import { action } from 'storybook/actions';
import { NightProgressBar } from './NightProgressBar';
import { mockFirstNightEntries } from '../../stories/mockData';
import Box from '@mui/material/Box';

/** Build a characterTypes map from the entries for colouring dots. */
function buildCharacterTypes(entries: typeof mockFirstNightEntries): Record<string, string> {
  const map: Record<string, string> = {};
  for (const e of entries) {
    if (e.type === 'character') {
      // Use the character id to approximate type colours
      // In real usage the caller would map from CharacterDef.type
      if (['imp', 'nodashii', 'fanggu'].includes(e.id)) map[e.id] = 'Demon';
      else if (['cerenovus', 'scarletwoman', 'marionette', 'baron'].includes(e.id))
        map[e.id] = 'Minion';
      else if (['drunk', 'mutant', 'damsel', 'klutz', 'golem'].includes(e.id))
        map[e.id] = 'Outsider';
      else map[e.id] = 'Townsfolk';
    }
  }
  return map;
}

const characterTypes = buildCharacterTypes(mockFirstNightEntries);
const deadIds = new Set(['fortuneteller']);

const meta = {
  title: 'NightPhase/NightProgressBar',
  component: NightProgressBar,
  decorators: [
    (Story) => (
      <Box sx={{ bgcolor: 'rgba(30, 30, 50, 0.95)', p: 2, maxWidth: 500 }}>
        <Story />
      </Box>
    ),
  ],
  args: {
    entries: mockFirstNightEntries,
    characterTypes,
    deadIds,
  },
  argTypes: {
    currentIndex: {
      control: { type: 'range', min: 0, max: 20, step: 1 },
      description: 'Index of the currently active night order card',
    },
    totalCards: {
      control: { type: 'range', min: 1, max: 25, step: 1 },
      description: 'Total number of cards in the night order',
    },
  },
} satisfies Meta<typeof NightProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** At the very start of the night — first card active. */
export const Start: Story = {
  args: {
    currentIndex: 0,
    totalCards: mockFirstNightEntries.length,
  },
};

/** Roughly mid-way through the night order. */
export const Middle: Story = {
  args: {
    currentIndex: Math.floor(mockFirstNightEntries.length / 2),
    totalCards: mockFirstNightEntries.length,
  },
};

/** Near the end of the night order. */
export const NearEnd: Story = {
  args: {
    currentIndex: mockFirstNightEntries.length - 2,
    totalCards: mockFirstNightEntries.length,
  },
};

/** Small game with only 5 entries. */
export const SmallGame: Story = {
  args: {
    currentIndex: 2,
    totalCards: 5,
    entries: mockFirstNightEntries.slice(0, 5),
    characterTypes: buildCharacterTypes(mockFirstNightEntries.slice(0, 5)),
    deadIds: new Set<string>(),
  },
};

/** Clickable dots — click any dot to see the action logged. */
export const Clickable: Story = {
  args: {
    currentIndex: 4,
    totalCards: mockFirstNightEntries.length,
    onClick: action('onDotClick'),
  },
};

/** Scrollable carousel — demonstrates horizontal scroll behaviour with 10+ entries. */
export const ScrollableCarousel: Story = {
  args: {
    currentIndex: Math.floor(mockFirstNightEntries.length / 2),
    totalCards: mockFirstNightEntries.length,
    onClick: action('onDotClick'),
  },
};
