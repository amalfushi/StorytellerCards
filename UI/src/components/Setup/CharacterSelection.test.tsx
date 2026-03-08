import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CharacterSelection } from '@/components/Setup/CharacterSelection.tsx';
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
  makeChar({
    id: 'drunk',
    name: 'Drunk',
    type: CharacterType.Outsider,
    defaultAlignment: Alignment.Good,
  }),
  makeChar({
    id: 'recluse',
    name: 'Recluse',
    type: CharacterType.Outsider,
    defaultAlignment: Alignment.Good,
  }),
  makeChar({
    id: 'poisoner',
    name: 'Poisoner',
    type: CharacterType.Minion,
    defaultAlignment: Alignment.Evil,
  }),
  makeChar({
    id: 'spy',
    name: 'Spy',
    type: CharacterType.Minion,
    defaultAlignment: Alignment.Evil,
  }),
  makeChar({ id: 'imp', name: 'Imp', type: CharacterType.Demon, defaultAlignment: Alignment.Evil }),
  makeChar({ id: 'spiritofivory', name: 'Spirit of Ivory', type: CharacterType.Traveller }),
  makeChar({ id: 'angel', name: 'Angel', type: CharacterType.Fabled }),
];

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe('CharacterSelection', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    scriptCharacters,
    playerCount: 7,
    onConfirm: vi.fn(),
  };

  it('renders the dialog with title when open', () => {
    render(<CharacterSelection {...defaultProps} />);
    expect(screen.getByText('Select Characters')).toBeInTheDocument();
  });

  it('does not render content when closed', () => {
    render(<CharacterSelection {...defaultProps} open={false} />);
    expect(screen.queryByText('Select Characters')).not.toBeInTheDocument();
  });

  it('renders characters grouped by type (Travellers excluded)', () => {
    render(<CharacterSelection {...defaultProps} />);
    expect(screen.getByTestId('char-group-Townsfolk')).toBeInTheDocument();
    expect(screen.getByTestId('char-group-Outsider')).toBeInTheDocument();
    expect(screen.getByTestId('char-group-Minion')).toBeInTheDocument();
    expect(screen.getByTestId('char-group-Demon')).toBeInTheDocument();
    // Travellers are omitted from this screen
    expect(screen.queryByTestId('char-group-Traveller')).not.toBeInTheDocument();
    expect(screen.getByTestId('char-group-Fabled')).toBeInTheDocument();
  });

  it('renders character names within their groups', () => {
    render(<CharacterSelection {...defaultProps} />);
    expect(screen.getByText('Washerwoman')).toBeInTheDocument();
    expect(screen.getByText('Poisoner')).toBeInTheDocument();
    expect(screen.getByText('Imp')).toBeInTheDocument();
    expect(screen.getByText('Drunk')).toBeInTheDocument();
  });

  it('shows distribution summary chips with full type names', () => {
    render(<CharacterSelection {...defaultProps} />);
    // 7 players = 5 townsfolk, 0 outsiders, 1 minion, 1 demon
    expect(screen.getByTestId('summary-chip-Townsfolk')).toHaveTextContent('Townsfolk: 0/5');
    expect(screen.getByTestId('summary-chip-Outsider')).toHaveTextContent('Outsider: 0/0');
    expect(screen.getByTestId('summary-chip-Minion')).toHaveTextContent('Minion: 0/1');
    expect(screen.getByTestId('summary-chip-Demon')).toHaveTextContent('Demon: 0/1');
  });

  it('toggles character selection on click', () => {
    render(<CharacterSelection {...defaultProps} />);
    const toggle = screen.getByTestId('char-toggle-washerwoman');
    fireEvent.click(toggle);

    // Should now show 1/5 for Townsfolk
    expect(screen.getByTestId('summary-chip-Townsfolk')).toHaveTextContent('Townsfolk: 1/5');
  });

  it('updates distribution chip when selections match targets', () => {
    render(<CharacterSelection {...defaultProps} />);

    // Select 1 minion
    fireEvent.click(screen.getByTestId('char-toggle-poisoner'));
    expect(screen.getByTestId('summary-chip-Minion')).toHaveTextContent('Minion: 1/1');

    // Select 1 demon
    fireEvent.click(screen.getByTestId('char-toggle-imp'));
    expect(screen.getByTestId('summary-chip-Demon')).toHaveTextContent('Demon: 1/1');
  });

  it('shows confirm button with selected count', () => {
    render(<CharacterSelection {...defaultProps} />);
    expect(screen.getByTestId('confirm-selection')).toHaveTextContent('Confirm (0 selected)');

    fireEvent.click(screen.getByTestId('char-toggle-washerwoman'));
    fireEvent.click(screen.getByTestId('char-toggle-imp'));
    expect(screen.getByTestId('confirm-selection')).toHaveTextContent('Confirm (2 selected)');
  });

  it('calls onConfirm with selected IDs when confirmed', () => {
    const onConfirm = vi.fn();
    render(<CharacterSelection {...defaultProps} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByTestId('char-toggle-washerwoman'));
    fireEvent.click(screen.getByTestId('char-toggle-imp'));
    fireEvent.click(screen.getByTestId('confirm-selection'));

    expect(onConfirm).toHaveBeenCalledWith(expect.arrayContaining(['washerwoman', 'imp']));
    expect(onConfirm.mock.calls[0][0]).toHaveLength(2);
  });

  it('calls onClose when cancel is clicked', () => {
    const onClose = vi.fn();
    render(<CharacterSelection {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('respects initialSelected prop', () => {
    render(
      <CharacterSelection {...defaultProps} initialSelected={['washerwoman', 'imp', 'poisoner']} />,
    );

    expect(screen.getByTestId('summary-chip-Townsfolk')).toHaveTextContent('Townsfolk: 1/5');
    expect(screen.getByTestId('summary-chip-Minion')).toHaveTextContent('Minion: 1/1');
    expect(screen.getByTestId('summary-chip-Demon')).toHaveTextContent('Demon: 1/1');
    expect(screen.getByTestId('confirm-selection')).toHaveTextContent('Confirm (3 selected)');
  });

  it('deselects a previously selected character on toggle', () => {
    render(<CharacterSelection {...defaultProps} initialSelected={['washerwoman']} />);

    expect(screen.getByTestId('summary-chip-Townsfolk')).toHaveTextContent('Townsfolk: 1/5');

    // Deselect
    fireEvent.click(screen.getByTestId('char-toggle-washerwoman'));
    expect(screen.getByTestId('summary-chip-Townsfolk')).toHaveTextContent('Townsfolk: 0/5');
  });

  it('shows player count description', () => {
    render(<CharacterSelection {...defaultProps} playerCount={10} />);
    expect(screen.getByText(/10-player game/)).toBeInTheDocument();
  });

  it('toggle all selects/deselects entire type group', { timeout: 15000 }, () => {
    render(<CharacterSelection {...defaultProps} />);

    // Click the Townsfolk group header to select all
    const townsfolkHeader = screen.getByRole('button', { name: 'Toggle all Townsfolk' });
    fireEvent.click(townsfolkHeader);

    expect(screen.getByTestId('summary-chip-Townsfolk')).toHaveTextContent('Townsfolk: 5/5');

    // Click again to deselect all
    fireEvent.click(townsfolkHeader);
    expect(screen.getByTestId('summary-chip-Townsfolk')).toHaveTextContent('Townsfolk: 0/5');
  });

  it('does not render group for types with no characters', () => {
    const minimalChars = [makeChar({ id: 'imp', name: 'Imp', type: CharacterType.Demon })];
    render(<CharacterSelection {...defaultProps} scriptCharacters={minimalChars} />);

    expect(screen.queryByTestId('char-group-Townsfolk')).not.toBeInTheDocument();
    expect(screen.getByTestId('char-group-Demon')).toBeInTheDocument();
  });

  it('shows sticky count header with per-type chips (no total chip)', () => {
    render(<CharacterSelection {...defaultProps} initialSelected={['washerwoman', 'imp']} />);

    expect(screen.getByTestId('sticky-count-header')).toBeInTheDocument();
    // No total-count-chip — only per-type chips with full names
    expect(screen.queryByTestId('total-count-chip')).not.toBeInTheDocument();
    expect(screen.getByTestId('summary-chip-Townsfolk')).toHaveTextContent('Townsfolk: 1/5');
    expect(screen.getByTestId('summary-chip-Demon')).toHaveTextContent('Demon: 1/1');
  });
});
