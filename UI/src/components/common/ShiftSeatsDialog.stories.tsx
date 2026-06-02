import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { ShiftSeatsDialog } from './ShiftSeatsDialog';

const players = [
  { seat: 1, playerName: 'Alice' },
  { seat: 2, playerName: 'Bob' },
  { seat: 3, playerName: 'Charlie' },
  { seat: 4, playerName: 'Diana' },
];

const meta = {
  title: 'Common/ShiftSeatsDialog',
  component: ShiftSeatsDialog,
  args: {
    open: true,
    players,
    onClose: fn(),
    onAddPlayerAtSeat: fn(),
    onShiftSeats: fn(),
    onInsertEmptySeat: fn(),
  },
} satisfies Meta<typeof ShiftSeatsDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Dialog defaults to adding a late-arriving player at a chosen seat. */
export const AddPlayerAtSeat: Story = {};

/** Dialog in shift-all mode for rotating the whole table. */
export const ShiftEveryone: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: /Shift everyone clockwise by N/i }));
    await userEvent.clear(canvas.getByLabelText(/Seats clockwise/i));
    await userEvent.type(canvas.getByLabelText(/Seats clockwise/i), '2');
    await expect(canvas.getByTestId('shift-preview')).toHaveTextContent(
      'Shift everyone clockwise by 2 seats.',
    );
    await userEvent.click(canvas.getByRole('button', { name: /Confirm/i }));
    await expect(args.onShiftSeats).toHaveBeenCalledWith(1, 2);
  },
};

/** Dialog in insert-empty mode for creating a gap before a late arrival sits. */
export const InsertEmptySeat: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: /Insert empty seat at position X/i }));
    await userEvent.clear(canvas.getByLabelText(/Seat position/i));
    await userEvent.type(canvas.getByLabelText(/Seat position/i), '3');
    await expect(canvas.getByTestId('shift-preview')).toHaveTextContent(
      'Insert an empty seat at position 3; shift seats 3+ outward by 1.',
    );
    await userEvent.click(canvas.getByRole('button', { name: /Confirm/i }));
    await expect(args.onInsertEmptySeat).toHaveBeenCalledWith(3);
  },
};
