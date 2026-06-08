import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ApparentCharacterDialog } from '@/components/Setup/ApparentCharacterDialog.tsx';
import type { CharacterDef } from '@/types/index.ts';
import { Alignment, CharacterType } from '@/types/index.ts';

// ── Test data ──

const drunkDef: CharacterDef = {
  id: 'drunk',
  name: 'Drunk',
  type: CharacterType.Outsider,
  defaultAlignment: Alignment.Good,
  abilityShort: 'You think you are a Townsfolk.',
  firstNight: null,
  otherNights: null,
  reminders: [],
};

const marionetteDef: CharacterDef = {
  id: 'marionette',
  name: 'Marionette',
  type: CharacterType.Minion,
  defaultAlignment: Alignment.Evil,
  abilityShort: 'You think you are good.',
  firstNight: null,
  otherNights: null,
  reminders: [],
};

const washerwomanDef: CharacterDef = {
  id: 'washerwoman',
  name: 'Washerwoman',
  type: CharacterType.Townsfolk,
  defaultAlignment: Alignment.Good,
  abilityShort: 'You learn 2 players.',
  firstNight: null,
  otherNights: null,
  reminders: [],
};

const empath: CharacterDef = {
  id: 'empath',
  name: 'Empath',
  type: CharacterType.Townsfolk,
  defaultAlignment: Alignment.Good,
  abilityShort: 'Each night, you learn how many of your neighbours are evil.',
  firstNight: null,
  otherNights: null,
  reminders: [],
};

const butlerDef: CharacterDef = {
  id: 'butler',
  name: 'Butler',
  type: CharacterType.Outsider,
  defaultAlignment: Alignment.Good,
  abilityShort: 'Choose a master.',
  firstNight: null,
  otherNights: null,
  reminders: [],
};

const scriptCharacters = [washerwomanDef, empath, butlerDef, drunkDef, marionetteDef];

const drunkPlayer = { playerId: 'player-1', playerName: 'Player 1' };
const marionettePlayer = { playerId: 'player-2', playerName: 'Player 2' };

// ── Tests ──

describe('ApparentCharacterDialog', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    playerId: drunkPlayer.playerId,
    playerName: drunkPlayer.playerName,
    actualCharacter: drunkDef,
    scriptCharacters,
    onConfirm: vi.fn(),
  };

  it('renders dialog title with player name', () => {
    render(<ApparentCharacterDialog {...defaultProps} />);
    expect(screen.getByText(/Identity Concealment — Player 1/)).toBeInTheDocument();
  });

  it('shows Drunk-specific instructions', () => {
    render(<ApparentCharacterDialog {...defaultProps} />);
    expect(screen.getByText(/Drunk thinks they are a Townsfolk/)).toBeInTheDocument();
  });

  it('shows Marionette-specific instructions', () => {
    render(
      <ApparentCharacterDialog
        {...defaultProps}
        playerId={marionettePlayer.playerId}
        playerName={marionettePlayer.playerName}
        actualCharacter={marionetteDef}
      />,
    );
    expect(screen.getByText(/Marionette thinks they are a good character/)).toBeInTheDocument();
  });

  it('filters candidates for Drunk — only Townsfolk shown', () => {
    render(<ApparentCharacterDialog {...defaultProps} />);
    // Townsfolk should be listed
    expect(screen.getByText('Washerwoman')).toBeInTheDocument();
    expect(screen.getByText('Empath')).toBeInTheDocument();
    // Non-Townsfolk should not be listed
    expect(screen.queryByText('Butler')).not.toBeInTheDocument();
    expect(screen.queryByText('Drunk')).not.toBeInTheDocument();
  });

  it('filters candidates for Marionette — Townsfolk and Outsiders shown', () => {
    render(
      <ApparentCharacterDialog
        {...defaultProps}
        playerId={marionettePlayer.playerId}
        playerName={marionettePlayer.playerName}
        actualCharacter={marionetteDef}
      />,
    );
    expect(screen.getByText('Washerwoman')).toBeInTheDocument();
    expect(screen.getByText('Empath')).toBeInTheDocument();
    expect(screen.getByText('Butler')).toBeInTheDocument();
    expect(screen.queryByText('Marionette')).not.toBeInTheDocument();
  });

  it('Confirm button is disabled until a candidate is selected', () => {
    render(<ApparentCharacterDialog {...defaultProps} />);
    const confirmBtn = screen.getByRole('button', { name: /Confirm/i });
    expect(confirmBtn).toBeDisabled();
  });

  it('selecting a candidate enables Confirm button', () => {
    render(<ApparentCharacterDialog {...defaultProps} />);
    fireEvent.click(screen.getByTestId('candidate-washerwoman'));
    const confirmBtn = screen.getByRole('button', { name: /Confirm/i });
    expect(confirmBtn).not.toBeDisabled();
  });

  it('calls onConfirm with seat and selected characterId', () => {
    const onConfirm = vi.fn();
    render(<ApparentCharacterDialog {...defaultProps} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByTestId('candidate-empath'));
    fireEvent.click(screen.getByRole('button', { name: /Confirm/i }));
    expect(onConfirm).toHaveBeenCalledWith('player-1', 'empath');
  });

  it('Cancel button calls onClose', () => {
    const onClose = vi.fn();
    render(<ApparentCharacterDialog {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
