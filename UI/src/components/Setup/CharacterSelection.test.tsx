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

// Script with setup-affecting characters for modifier tests
const scriptWithModifiers: CharacterDef[] = [
  ...scriptCharacters.filter((c) => c.type !== 'Traveller' && c.type !== 'Fabled'),
  makeChar({
    id: 'baron',
    name: 'Baron',
    type: CharacterType.Minion,
    defaultAlignment: Alignment.Evil,
    abilityShort: '+2 Outsiders',
  }),
  makeChar({
    id: 'xaan',
    name: 'Xaan',
    type: CharacterType.Minion,
    defaultAlignment: Alignment.Evil,
    abilityShort: 'X Outsiders',
  }),
  makeChar({
    id: 'villageidiot',
    name: 'Village Idiot',
    type: CharacterType.Townsfolk,
    defaultAlignment: Alignment.Good,
    abilityShort: 'Can have 0-2 extra copies.',
  }),
  makeChar({
    id: 'legion',
    name: 'Legion',
    type: CharacterType.Demon,
    defaultAlignment: Alignment.Evil,
    abilityShort: 'Most players are Legion.',
  }),
  makeChar({
    id: 'balloonist',
    name: 'Balloonist',
    type: CharacterType.Townsfolk,
    defaultAlignment: Alignment.Good,
    abilityShort: '+0 or +1 Outsider',
  }),
  makeChar({
    id: 'godfather',
    name: 'Godfather',
    type: CharacterType.Minion,
    defaultAlignment: Alignment.Evil,
    abilityShort: '-1 or +1 Outsider',
  }),
  makeChar({
    id: 'sentinel',
    name: 'Sentinel',
    type: CharacterType.Fabled,
    defaultAlignment: Alignment.Good,
    abilityShort: 'Might add Outsiders',
  }),
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

  it('renders characters grouped by type (Travellers and setup powers excluded)', () => {
    render(<CharacterSelection {...defaultProps} />);
    expect(screen.getByTestId('char-group-Townsfolk')).toBeInTheDocument();
    expect(screen.getByTestId('char-group-Outsider')).toBeInTheDocument();
    expect(screen.getByTestId('char-group-Minion')).toBeInTheDocument();
    expect(screen.getByTestId('char-group-Demon')).toBeInTheDocument();
    // Travellers, Fabled, and Loric setup powers are omitted from this player-character screen.
    expect(screen.queryByTestId('char-group-Traveller')).not.toBeInTheDocument();
    expect(screen.queryByTestId('char-group-Fabled')).not.toBeInTheDocument();
    expect(screen.queryByText('Angel')).not.toBeInTheDocument();
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

  // ──────────────────────────────────────────
  // M27: Adaptive targets & modifier chips
  // ──────────────────────────────────────────

  describe('adaptive targets and modifier chips', () => {
    it('shows modifier chip when Baron is selected', () => {
      render(
        <CharacterSelection
          {...defaultProps}
          scriptCharacters={scriptWithModifiers}
          playerCount={8}
          initialSelected={['baron']}
        />,
      );
      expect(screen.getByTestId('modifier-chips')).toBeInTheDocument();
      expect(screen.getByTestId('modifier-chip-baron')).toBeInTheDocument();
    });

    it('updates outsider target when Baron is selected', () => {
      render(
        <CharacterSelection
          {...defaultProps}
          scriptCharacters={scriptWithModifiers}
          playerCount={8}
        />,
      );

      // Before Baron: target is 1 outsider for 8 players
      expect(screen.getByTestId('summary-chip-Outsider')).toHaveTextContent('Outsider: 0/1');

      // Select Baron
      fireEvent.click(screen.getByTestId('char-toggle-baron'));

      // After Baron: target becomes 3 outsiders (1 + 2)
      expect(screen.getByTestId('summary-chip-Outsider')).toHaveTextContent('Outsider: 0/3');
    });

    it('does not show modifier chips when no modifiers active', () => {
      render(<CharacterSelection {...defaultProps} />);
      expect(screen.queryByTestId('modifier-chips')).not.toBeInTheDocument();
    });

    it('shows Xaan input when Xaan is selected', () => {
      render(
        <CharacterSelection
          {...defaultProps}
          scriptCharacters={scriptWithModifiers}
          playerCount={8}
          initialSelected={['xaan']}
        />,
      );
      expect(screen.getByTestId('xaan-input')).toBeInTheDocument();
      expect(screen.getByLabelText('Xaan X value')).toBeInTheDocument();
    });

    it('hides Xaan input when Xaan is not selected', () => {
      render(
        <CharacterSelection
          {...defaultProps}
          scriptCharacters={scriptWithModifiers}
          playerCount={8}
        />,
      );
      expect(screen.queryByTestId('xaan-input')).not.toBeInTheDocument();
    });
  });

  // ──────────────────────────────────────────
  // M27: Duplicate character support
  // ──────────────────────────────────────────

  describe('duplicate character selection', () => {
    it('shows duplicate stepper for Village Idiot when selected', () => {
      render(
        <CharacterSelection
          {...defaultProps}
          scriptCharacters={scriptWithModifiers}
          playerCount={8}
          initialSelected={['villageidiot']}
        />,
      );
      expect(screen.getByTestId('duplicate-stepper-villageidiot')).toBeInTheDocument();
    });

    it('does not show duplicate stepper when Village Idiot is not selected', () => {
      render(
        <CharacterSelection
          {...defaultProps}
          scriptCharacters={scriptWithModifiers}
          playerCount={8}
        />,
      );
      expect(screen.queryByTestId('duplicate-stepper-villageidiot')).not.toBeInTheDocument();
    });

    it('shows duplicate stepper for Legion when selected', () => {
      render(
        <CharacterSelection
          {...defaultProps}
          scriptCharacters={scriptWithModifiers}
          playerCount={8}
          initialSelected={['legion']}
        />,
      );
      expect(screen.getByTestId('duplicate-stepper-legion')).toBeInTheDocument();
    });

    it('does not show duplicate stepper for non-duplicate characters', () => {
      render(
        <CharacterSelection
          {...defaultProps}
          scriptCharacters={scriptWithModifiers}
          playerCount={8}
          initialSelected={['imp']}
        />,
      );
      expect(screen.queryByTestId('duplicate-stepper-imp')).not.toBeInTheDocument();
    });
  });

  // ──────────────────────────────────────────
  // M27: Variable modifier steppers
  // ──────────────────────────────────────────

  describe('variable modifier steppers', () => {
    it('shows variable stepper for Balloonist when selected', () => {
      render(
        <CharacterSelection
          {...defaultProps}
          scriptCharacters={scriptWithModifiers}
          playerCount={8}
          initialSelected={['balloonist']}
        />,
      );
      expect(screen.getByTestId('variable-stepper-balloonist')).toBeInTheDocument();
    });

    it('shows variable stepper for Godfather when selected', () => {
      render(
        <CharacterSelection
          {...defaultProps}
          scriptCharacters={scriptWithModifiers}
          playerCount={8}
          initialSelected={['godfather']}
        />,
      );
      expect(screen.getByTestId('variable-stepper-godfather')).toBeInTheDocument();
    });

    it('does not show variable stepper for Sentinel because Fabled are setup powers', () => {
      render(
        <CharacterSelection
          {...defaultProps}
          scriptCharacters={scriptWithModifiers}
          playerCount={8}
          initialSelected={['sentinel']}
        />,
      );
      expect(screen.queryByTestId('variable-stepper-sentinel')).not.toBeInTheDocument();
    });

    it('does not show variable stepper when character is not selected', () => {
      render(
        <CharacterSelection
          {...defaultProps}
          scriptCharacters={scriptWithModifiers}
          playerCount={8}
        />,
      );
      expect(screen.queryByTestId('variable-stepper-balloonist')).not.toBeInTheDocument();
      expect(screen.queryByTestId('variable-stepper-godfather')).not.toBeInTheDocument();
      expect(screen.queryByTestId('variable-stepper-sentinel')).not.toBeInTheDocument();
    });

    it('does not show variable stepper for non-variable characters', () => {
      render(
        <CharacterSelection
          {...defaultProps}
          scriptCharacters={scriptWithModifiers}
          playerCount={8}
          initialSelected={['washerwoman']}
        />,
      );
      expect(screen.queryByTestId('variable-stepper-washerwoman')).not.toBeInTheDocument();
    });
  });
});
