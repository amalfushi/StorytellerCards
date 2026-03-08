import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, userEvent, expect, fn } from 'storybook/test';
import { PhaseBar } from './PhaseBar';

const meta = {
  title: 'PhaseBar/PhaseBar',
  component: PhaseBar,
  args: {
    activeView: 'Day',
    nightInProgress: false,
    onDayClick: fn(),
    onNightClick: fn(),
  },
} satisfies Meta<typeof PhaseBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Day view — normal daytime tabs visible. */
export const DayView: Story = {
  args: {
    activeView: 'Day',
    nightInProgress: false,
  },
};

/** Night view — flashcard panel is active. */
export const NightView: Story = {
  args: {
    activeView: 'Night',
    nightInProgress: true,
  },
};

/** Day view with a night in progress — shows indicator dot on Night chip. */
export const NightInProgressFromDayView: Story = {
  args: {
    activeView: 'Day',
    nightInProgress: true,
  },
};

// ────────────────────────────────────────────────────────
// Responsive viewport variant
// ────────────────────────────────────────────────────────

/** Tablet viewport — day view at iPad size. */
export const TabletViewport: Story = {
  args: {
    activeView: 'Day',
    nightInProgress: false,
  },
  parameters: {
    viewport: { defaultViewport: 'tablet' },
  },
};

// ────────────────────────────────────────────────────────
// Interaction test
// ────────────────────────────────────────────────────────

/** Clicking the Night chip calls onNightClick. */
export const ClickNightChip: Story = {
  args: {
    activeView: 'Day',
    nightInProgress: false,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const nightChip = canvas.getByText('Night');
    await userEvent.click(nightChip);
    await expect(args.onNightClick).toHaveBeenCalledTimes(1);
  },
};
