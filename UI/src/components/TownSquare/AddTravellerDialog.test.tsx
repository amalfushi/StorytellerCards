import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AddTravellerDialog } from '@/components/TownSquare/AddTravellerDialog.tsx';
import type { PlayerSeat } from '@/types/index.ts';
import { Alignment } from '@/types/index.ts';

// ──────────────────────────────────────────────
// Mock data
// ──────────────────────────────────────────────

const existingPlayers: PlayerSeat[] = [
  {
    seat: 1,
    playerName: 'Alice',
    characterId: 'noble',
    alive: true,
    ghostVoteUsed: false,
    visibleAlignment: Alignment.Unknown,
    actualAlignment: Alignment.Good,
    startingAlignment: Alignment.Good,
    activeReminders: [],
    isTraveller: false,
    tokens: [],
  },
  {
    seat: 2,
    playerName: 'Bob',
    characterId: 'imp',
    alive: true,
    ghostVoteUsed: false,
    visibleAlignment: Alignment.Unknown,
    actualAlignment: Alignment.Evil,
    startingAlignment: Alignment.Evil,
    activeReminders: [],
    isTraveller: false,
    tokens: [],
  },
];

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe('AddTravellerDialog', () => {
  const defaultProps = {
    open: true,
    existingPlayers,
    onClose: vi.fn(),
    onAdd: vi.fn(),
  };

  it('renders nothing when not open', () => {
    render(<AddTravellerDialog {...defaultProps} open={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows dialog when open', () => {
    render(<AddTravellerDialog {...defaultProps} />);
    // "Add Traveller" appears as both the title and the action button.
    // Use the dialog role to verify the dialog is present.
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // Title text exists (there are 2 matches so use getAllByText)
    const matches = screen.getAllByText('Add Traveller');
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('has traveller character name input', () => {
    render(<AddTravellerDialog {...defaultProps} />);
    expect(screen.getByLabelText(/Traveller Character Name/i)).toBeInTheDocument();
  });

  it('has player name input', () => {
    render(<AddTravellerDialog {...defaultProps} />);
    expect(screen.getByLabelText(/Player Name/i)).toBeInTheDocument();
  });

  it('has seat number input', () => {
    render(<AddTravellerDialog {...defaultProps} />);
    expect(screen.getByLabelText(/Seat Number/i)).toBeInTheDocument();
  });

  it('has alignment selection', () => {
    render(<AddTravellerDialog {...defaultProps} />);
    expect(screen.getByLabelText(/Alignment/i)).toBeInTheDocument();
  });

  it('auto-suggests next available seat number', () => {
    render(<AddTravellerDialog {...defaultProps} />);
    // Seats 1 and 2 are taken, so next available is 3
    const seatInput = screen.getByLabelText(/Seat Number/i);
    expect(seatInput).toHaveValue(3);
  });

  it('has add button that is disabled until form is filled', () => {
    render(<AddTravellerDialog {...defaultProps} />);
    // The "Add Traveller" button in actions (not the title)
    const buttons = screen.getAllByText('Add Traveller');
    const addButton = buttons[buttons.length - 1]; // Last one is the action button
    expect(addButton.closest('button')).toBeDisabled();
  });

  it('add button is enabled when character name and player name are filled', () => {
    render(<AddTravellerDialog {...defaultProps} />);
    fireEvent.change(screen.getByLabelText(/Traveller Character Name/i), {
      target: { value: 'Scapegoat' },
    });
    fireEvent.change(screen.getByLabelText(/Player Name/i), {
      target: { value: 'Jake' },
    });

    const buttons = screen.getAllByText('Add Traveller');
    const addButton = buttons[buttons.length - 1];
    expect(addButton.closest('button')).not.toBeDisabled();
  });

  it('has cancel button', () => {
    render(<AddTravellerDialog {...defaultProps} />);
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
  });

  it('calls onClose when cancel is clicked', () => {
    const onClose = vi.fn();
    render(<AddTravellerDialog {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onAdd with correct data when add button is clicked', () => {
    const onAdd = vi.fn();
    const onClose = vi.fn();
    render(<AddTravellerDialog {...defaultProps} onAdd={onAdd} onClose={onClose} />);

    fireEvent.change(screen.getByLabelText(/Traveller Character Name/i), {
      target: { value: 'Scapegoat' },
    });
    fireEvent.change(screen.getByLabelText(/Player Name/i), {
      target: { value: 'Jake' },
    });

    const buttons = screen.getAllByText('Add Traveller');
    const addButton = buttons[buttons.length - 1];
    fireEvent.click(addButton);

    expect(onAdd).toHaveBeenCalledWith(
      3, // next available seat
      'Jake', // player name
      'scapegoat', // character id (lowercase, no spaces)
      'Good', // default alignment
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('defaults alignment to Good', () => {
    render(<AddTravellerDialog {...defaultProps} />);
    // The select should have "Good" as default value
    expect(screen.getByText('Good')).toBeInTheDocument();
  });

  it('auto-suggests seat 1 when no existing players', () => {
    render(<AddTravellerDialog {...defaultProps} existingPlayers={[]} />);
    const seatInput = screen.getByLabelText(/Seat Number/i);
    expect(seatInput).toHaveValue(1);
  });

  it('shows helper text for character name', () => {
    render(<AddTravellerDialog {...defaultProps} />);
    expect(screen.getByText(/Scapegoat, Gunslinger/)).toBeInTheDocument();
  });
});
