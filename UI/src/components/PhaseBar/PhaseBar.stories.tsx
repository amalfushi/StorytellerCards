import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, userEvent, expect } from 'storybook/test';
import { PhaseBar } from './PhaseBar';
import { Phase } from '../../types';
import { withMockGameContext } from '../../stories/decorators';

const meta = {
  title: 'PhaseBar/PhaseBar',
  component: PhaseBar,
} satisfies Meta<typeof PhaseBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Day phase — main daytime activity. */
export const Day: Story = {
  decorators: [withMockGameContext({ game: { currentPhase: Phase.Day } as never })],
};

/** Night phase — nighttime actions in progress. */
export const Night: Story = {
  decorators: [withMockGameContext({ game: { currentPhase: Phase.Night } as never })],
};

// ────────────────────────────────────────────────────────
// Responsive viewport variant (P2-2)
// ────────────────────────────────────────────────────────

/** Tablet viewport — day phase at iPad size. */
export const TabletViewport: Story = {
  ...Day,
  parameters: {
    viewport: { defaultViewport: 'tablet' },
  },
};

// ────────────────────────────────────────────────────────
// Interaction test (P2-3)
// ────────────────────────────────────────────────────────

/** Clicking the Night chip opens the confirmation dialog. */
export const ClickNightPhase: Story = {
  decorators: [withMockGameContext({ game: { currentPhase: Phase.Day } as never })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nightChip = canvas.getByText('Night');
    await userEvent.click(nightChip);
    // Confirmation dialog should appear
    const confirmButton = await within(document.body).findByRole('button', { name: /confirm/i });
    await expect(confirmButton).toBeInTheDocument();
  },
};
