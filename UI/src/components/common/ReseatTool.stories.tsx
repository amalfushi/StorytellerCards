import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { ReseatTool } from './ReseatTool';

const players = [
  { seat: 1, playerName: 'Alice' },
  { seat: 2, playerName: 'Bob' },
  { seat: 3, playerName: 'Charlie' },
  { seat: 4, playerName: 'Diana' },
];

const meta = {
  title: 'Common/ReseatTool',
  component: ReseatTool,
  args: {
    open: true,
    players,
    onClose: fn(),
    onConfirmSwap: fn(),
  },
} satisfies Meta<typeof ReseatTool>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Global reseat dialog opened from setup with no pre-selected player. */
export const Open: Story = {};

/** In-game reseat dialog opened from a player action with Bob selected first. */
export const PreTargeted: Story = {
  args: {
    initialSeat: 2,
  },
};

/** Interaction story: tap Alice, tap Charlie, then confirm the swap. */
export const SwapInteraction: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: /Seat 1 Alice/i }));
    await userEvent.click(canvas.getByRole('button', { name: /Seat 3 Charlie/i }));
    await expect(canvas.getByTestId('reseat-preview')).toHaveTextContent(
      'Alice (seat 1) ⇄ Charlie (seat 3)',
    );
    await userEvent.click(canvas.getByRole('button', { name: /Confirm swap/i }));
    await expect(args.onConfirmSwap).toHaveBeenCalledWith(1, 3);
  },
};
