import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DemonBluffSelection } from '@/components/Setup/DemonBluffSelection.tsx';
import type { CharacterDef } from '@/types/index.ts';
import { CharacterType, Alignment } from '@/types/index.ts';

// ──────────────────────────────────────────────
// Mock data
// ──────────────────────────────────────────────

const makeChar = (overrides: Partial<CharacterDef> = {}): CharacterDef => ({
  id: 'washerwoman',
  name: 'Washerwoman',
  type: CharacterType.Townsfolk,
  defaultAlignment: Alignment.Good,
  abilityShort: 'You start knowing a Townsfolk is in play.',
  firstNight: null,
  otherNights: null,
  reminders: [],
  ...overrides,
});

const scriptCharacters: CharacterDef[] = [
  makeChar({ id: 'washerwoman', name: 'Washerwoman', type: CharacterType.Townsfolk }),
  makeChar({ id: 'librarian', name: 'Librarian', type: CharacterType.Townsfolk }),
  makeChar({ id: 'investigator', name: 'Investigator', type: CharacterType.Townsfolk }),
  makeChar({ id: 'chef', name: 'Chef', type: CharacterType.Townsfolk }),
  makeChar({ id: 'empath', name: 'Empath', type: CharacterType.Townsfolk }),
  makeChar({ id: 'fortuneteller', name: 'Fortune Teller', type: CharacterType.Townsfolk }),
  makeChar({ id: 'undertaker', name: 'Undertaker', type: CharacterType.Townsfolk }),
  makeChar({ id: 'butler', name: 'Butler', type: CharacterType.Outsider }),
  makeChar({ id: 'drunk', name: 'Drunk', type: CharacterType.Outsider }),
  makeChar({ id: 'saint', name: 'Saint', type: CharacterType.Outsider }),
  makeChar({ id: 'imp', name: 'Imp', type: CharacterType.Demon }),
  makeChar({ id: 'poisoner', name: 'Poisoner', type: CharacterType.Minion }),
];

// 5 townsfolk + 1 outsider in play
const inPlayCharacterIds = ['washerwoman', 'librarian', 'investigator', 'chef', 'empath', 'butler'];

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  scriptCharacters,
  inPlayCharacterIds,
  onConfirm: vi.fn(),
};

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe('DemonBluffSelection', () => {
  it('renders without crashing', () => {
    render(<DemonBluffSelection {...defaultProps} />);
    expect(screen.getByText('Select Demon Bluffs')).toBeInTheDocument();
  });

  it('displays the dialog title', () => {
    render(<DemonBluffSelection {...defaultProps} />);
    expect(screen.getByText('Select Demon Bluffs')).toBeInTheDocument();
  });

  it('shows only unselected good characters (not in play)', () => {
    render(<DemonBluffSelection {...defaultProps} />);
    // Fortune Teller and Undertaker are Townsfolk not in play
    expect(screen.getByText('Fortune Teller')).toBeInTheDocument();
    expect(screen.getByText('Undertaker')).toBeInTheDocument();
    // Drunk and Saint are Outsiders not in play
    expect(screen.getByText('Drunk')).toBeInTheDocument();
    expect(screen.getByText('Saint')).toBeInTheDocument();
    // In-play characters should not be shown
    expect(screen.queryByText('Washerwoman')).not.toBeInTheDocument();
    expect(screen.queryByText('Librarian')).not.toBeInTheDocument();
    expect(screen.queryByText('Chef')).not.toBeInTheDocument();
  });

  it('does not show evil characters (Demon/Minion)', () => {
    render(<DemonBluffSelection {...defaultProps} />);
    expect(screen.queryByTestId('bluff-toggle-imp')).not.toBeInTheDocument();
    expect(screen.queryByTestId('bluff-toggle-poisoner')).not.toBeInTheDocument();
  });

  it('shows count chip starting at 0/3', () => {
    render(<DemonBluffSelection {...defaultProps} />);
    expect(screen.getByTestId('bluff-count-chip')).toHaveTextContent('0/3');
  });

  it('allows selecting up to 3 bluffs', () => {
    render(<DemonBluffSelection {...defaultProps} />);

    fireEvent.click(screen.getByTestId('bluff-toggle-fortuneteller'));
    expect(screen.getByTestId('bluff-count-chip')).toHaveTextContent('1/3');

    fireEvent.click(screen.getByTestId('bluff-toggle-undertaker'));
    expect(screen.getByTestId('bluff-count-chip')).toHaveTextContent('2/3');

    fireEvent.click(screen.getByTestId('bluff-toggle-drunk'));
    expect(screen.getByTestId('bluff-count-chip')).toHaveTextContent('3/3');
  });

  it('prevents selecting more than 3 bluffs', () => {
    render(<DemonBluffSelection {...defaultProps} />);

    fireEvent.click(screen.getByTestId('bluff-toggle-fortuneteller'));
    fireEvent.click(screen.getByTestId('bluff-toggle-undertaker'));
    fireEvent.click(screen.getByTestId('bluff-toggle-drunk'));

    // Try to select a 4th — should not work (button disabled)
    const saint = screen.getByTestId('bluff-toggle-saint');
    expect(saint).toHaveAttribute('aria-disabled', 'true');
  });

  it('allows deselecting a bluff', () => {
    render(<DemonBluffSelection {...defaultProps} />);

    fireEvent.click(screen.getByTestId('bluff-toggle-fortuneteller'));
    expect(screen.getByTestId('bluff-count-chip')).toHaveTextContent('1/3');

    // Deselect
    fireEvent.click(screen.getByTestId('bluff-toggle-fortuneteller'));
    expect(screen.getByTestId('bluff-count-chip')).toHaveTextContent('0/3');
  });

  it('disables confirm button when less than 3 are selected', () => {
    render(<DemonBluffSelection {...defaultProps} />);
    const confirmButton = screen.getByTestId('confirm-bluffs');
    expect(confirmButton).toBeDisabled();

    fireEvent.click(screen.getByTestId('bluff-toggle-fortuneteller'));
    expect(confirmButton).toBeDisabled();
  });

  it('enables confirm button when exactly 3 are selected', () => {
    render(<DemonBluffSelection {...defaultProps} />);

    fireEvent.click(screen.getByTestId('bluff-toggle-fortuneteller'));
    fireEvent.click(screen.getByTestId('bluff-toggle-undertaker'));
    fireEvent.click(screen.getByTestId('bluff-toggle-drunk'));

    expect(screen.getByTestId('confirm-bluffs')).not.toBeDisabled();
  });

  it('calls onConfirm with selected IDs when confirmed', () => {
    const onConfirm = vi.fn();
    render(<DemonBluffSelection {...defaultProps} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByTestId('bluff-toggle-fortuneteller'));
    fireEvent.click(screen.getByTestId('bluff-toggle-undertaker'));
    fireEvent.click(screen.getByTestId('bluff-toggle-drunk'));
    fireEvent.click(screen.getByTestId('confirm-bluffs'));

    expect(onConfirm).toHaveBeenCalledWith(
      expect.arrayContaining(['fortuneteller', 'undertaker', 'drunk']),
    );
    expect(onConfirm.mock.calls[0][0]).toHaveLength(3);
  });

  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn();
    render(<DemonBluffSelection {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('pre-selects initial bluffs when provided', () => {
    render(
      <DemonBluffSelection {...defaultProps} initialSelected={['fortuneteller', 'undertaker']} />,
    );
    expect(screen.getByTestId('bluff-count-chip')).toHaveTextContent('2/3');
  });

  it('groups characters by type (Townsfolk and Outsider headers)', () => {
    render(<DemonBluffSelection {...defaultProps} />);
    expect(screen.getByTestId('bluff-group-Townsfolk')).toBeInTheDocument();
    expect(screen.getByTestId('bluff-group-Outsider')).toBeInTheDocument();
  });

  it('shows instruction text', () => {
    render(<DemonBluffSelection {...defaultProps} />);
    expect(
      screen.getByText(/Choose 3 not-in-play good characters to show the Demon as bluffs/),
    ).toBeInTheDocument();
  });
});
