import type { Meta, StoryObj } from '@storybook/react-vite';
import { NightHistoryDrawer } from './NightHistoryDrawer';
import { withMockGameContext } from '../../stories/decorators';
import {
  mockPlayers,
  mockNightHistoryEntries,
  mockManyNightHistoryEntries,
  mockNightHistoryWithSelections,
} from '../../stories/mockData';

const noop = () => {};

const meta = {
  title: 'NightHistory/NightHistoryDrawer',
  component: NightHistoryDrawer,
  args: {
    open: true,
    onClose: noop,
  },
} satisfies Meta<typeof NightHistoryDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Empty drawer — no night history entries yet. */
export const Empty: Story = {
  decorators: [
    withMockGameContext({
      game: {
        nightHistory: [],
        players: mockPlayers,
      } as never,
    }),
  ],
};

/** Drawer with 3 completed night entries showing various completion counts. */
export const WithEntries: Story = {
  decorators: [
    withMockGameContext({
      game: {
        nightHistory: mockNightHistoryEntries,
        players: mockPlayers,
      } as never,
    }),
  ],
};

/** Drawer with 8+ entries to test scrolling behaviour. */
export const ManyEntries: Story = {
  decorators: [
    withMockGameContext({
      game: {
        nightHistory: mockManyNightHistoryEntries,
        players: mockPlayers,
      } as never,
    }),
  ],
};

/** Drawer with actionable summaries showing Demon kills, player choices, etc. */
export const WithActionableSummaries: Story = {
  decorators: [
    withMockGameContext({
      game: {
        nightHistory: mockNightHistoryWithSelections,
        players: mockPlayers,
      } as never,
    }),
  ],
};
