import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShiftSeatsDialog } from '@/components/common/ShiftSeatsDialog.tsx';

const players = [
  { seat: 1, playerName: 'Alice' },
  { seat: 2, playerName: 'Bob' },
  { seat: 3, playerName: 'Charlie' },
];

function renderDialog(overrides = {}) {
  const props = {
    open: true,
    players,
    onClose: vi.fn(),
    onAddPlayerAtSeat: vi.fn(),
    onShiftSeats: vi.fn(),
    onInsertEmptySeat: vi.fn(),
    ...overrides,
  };
  render(<ShiftSeatsDialog {...props} />);
  return props;
}

describe('ShiftSeatsDialog', () => {
  it('renders add-player mode with preview text', () => {
    renderDialog();
    expect(screen.getByText('Shift / Insert seats')).toBeInTheDocument();
    expect(screen.getByTestId('shift-preview')).toHaveTextContent(
      'Add New Player at seat 1; shift seats 1+ outward by 1.',
    );
  });

  it('confirms shift everyone clockwise by N', () => {
    const props = renderDialog();
    fireEvent.click(screen.getByRole('button', { name: /Shift everyone clockwise by N/i }));
    fireEvent.change(screen.getByLabelText(/Seats clockwise/i), { target: { value: '2' } });
    expect(screen.getByTestId('shift-preview')).toHaveTextContent(
      'Shift everyone clockwise by 2 seats.',
    );
    fireEvent.click(screen.getByRole('button', { name: /Confirm/i }));
    expect(props.onShiftSeats).toHaveBeenCalledWith(1, 2);
  });

  it('confirms insert empty seat at X', () => {
    const props = renderDialog();
    fireEvent.click(screen.getByRole('button', { name: /Insert empty seat at position X/i }));
    fireEvent.change(screen.getByLabelText(/Seat position/i), { target: { value: '2' } });
    expect(screen.getByTestId('shift-preview')).toHaveTextContent(
      'Insert an empty seat at position 2; shift seats 2+ outward by 1.',
    );
    fireEvent.click(screen.getByRole('button', { name: /Confirm/i }));
    expect(props.onInsertEmptySeat).toHaveBeenCalledWith(2);
  });

  it('confirms add player at seat X', () => {
    const props = renderDialog();
    fireEvent.change(screen.getByLabelText(/Player name/i), { target: { value: 'Diana' } });
    fireEvent.change(screen.getByLabelText(/Seat position/i), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: /Confirm/i }));
    expect(props.onAddPlayerAtSeat).toHaveBeenCalledWith(3, 'Diana');
  });

  it('cancels without applying a change', () => {
    const props = renderDialog();
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props.onAddPlayerAtSeat).not.toHaveBeenCalled();
    expect(props.onShiftSeats).not.toHaveBeenCalled();
    expect(props.onInsertEmptySeat).not.toHaveBeenCalled();
  });
});
