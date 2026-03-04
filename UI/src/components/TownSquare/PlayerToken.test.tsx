import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlayerToken } from '@/components/TownSquare/PlayerToken.tsx';
import type { PlayerSeat, CharacterDef } from '@/types/index.ts';
import { CharacterType, Alignment } from '@/types/index.ts';

// ──────────────────────────────────────────────
// Mock CharacterDetailModal
// ──────────────────────────────────────────────

vi.mock('@/components/common/CharacterDetailModal.tsx', () => ({
  CharacterDetailModal: ({
    open,
    onClose,
    character,
  }: {
    open: boolean;
    onClose: () => void;
    character: CharacterDef | null;
  }) =>
    open ? (
      <div data-testid="character-detail-modal">
        <span>{character?.name}</span>
        <button onClick={onClose}>Close Modal</button>
      </div>
    ) : null,
}));

// ──────────────────────────────────────────────
// Mock data
// ──────────────────────────────────────────────

const nobleCharacter: CharacterDef = {
  id: 'noble',
  name: 'Noble',
  type: CharacterType.Townsfolk,
  defaultAlignment: Alignment.Good,
  abilityShort: 'On your 1st night, you learn 3 players, 1 and only 1 of which is evil.',
  firstNight: null,
  otherNights: null,
  reminders: [],
};

const alivePlayer: PlayerSeat = {
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
};

const deadPlayer: PlayerSeat = {
  seat: 3,
  playerName: 'Charlie',
  characterId: 'noble',
  alive: false,
  ghostVoteUsed: false,
  visibleAlignment: Alignment.Unknown,
  actualAlignment: Alignment.Good,
  startingAlignment: Alignment.Good,
  activeReminders: [],
  isTraveller: false,
  tokens: [],
};

const deadPlayerGhostVoteUsed: PlayerSeat = {
  seat: 5,
  playerName: 'Eve',
  characterId: 'noble',
  alive: false,
  ghostVoteUsed: true,
  visibleAlignment: Alignment.Unknown,
  actualAlignment: Alignment.Good,
  startingAlignment: Alignment.Good,
  activeReminders: [],
  isTraveller: false,
  tokens: [],
};

const travellerPlayer: PlayerSeat = {
  seat: 10,
  playerName: 'TravJack',
  characterId: 'spiritofivory',
  alive: true,
  ghostVoteUsed: false,
  visibleAlignment: Alignment.Good,
  actualAlignment: Alignment.Good,
  startingAlignment: Alignment.Good,
  activeReminders: [],
  isTraveller: true,
  tokens: [],
};

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe('PlayerToken', () => {
  const defaultProps = {
    showCharacters: false,
    isSelected: false,
    onClick: vi.fn(),
    size: 'medium' as const,
  };

  it('renders without crashing', () => {
    const { container } = render(
      <PlayerToken
        player={alivePlayer}
        characterDef={nobleCharacter}
        {...defaultProps}
      />,
    );
    expect(container).toBeTruthy();
  });

  it('shows player name', () => {
    render(
      <PlayerToken
        player={alivePlayer}
        characterDef={nobleCharacter}
        {...defaultProps}
      />,
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('shows seat number', () => {
    render(
      <PlayerToken
        player={alivePlayer}
        characterDef={nobleCharacter}
        {...defaultProps}
      />,
    );
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('shows character icon when showCharacters is true', () => {
    render(
      <PlayerToken
        player={alivePlayer}
        characterDef={nobleCharacter}
        {...defaultProps}
        showCharacters={true}
      />,
    );
    // Character icon shows first letter "N" for Noble
    expect(screen.getByText('N')).toBeInTheDocument();
  });

  it('shows abbreviated character name when showCharacters is true', () => {
    render(
      <PlayerToken
        player={alivePlayer}
        characterDef={nobleCharacter}
        {...defaultProps}
        showCharacters={true}
      />,
    );
    // "Noble" is ≤ 8 chars, so full name is shown
    expect(screen.getByText('Noble')).toBeInTheDocument();
  });

  it('hides character icon when showCharacters is false', () => {
    render(
      <PlayerToken
        player={alivePlayer}
        characterDef={nobleCharacter}
        {...defaultProps}
        showCharacters={false}
      />,
    );
    // Should NOT show the character first-letter icon
    expect(screen.queryByText('N')).not.toBeInTheDocument();
  });

  it('has correct aria-label for alive player', () => {
    render(
      <PlayerToken
        player={alivePlayer}
        characterDef={nobleCharacter}
        {...defaultProps}
      />,
    );
    expect(screen.getByLabelText('Alice, Seat 1, alive')).toBeInTheDocument();
  });

  it('has correct aria-label for dead player', () => {
    render(
      <PlayerToken
        player={deadPlayer}
        characterDef={nobleCharacter}
        {...defaultProps}
      />,
    );
    expect(screen.getByLabelText('Charlie, Seat 3, dead')).toBeInTheDocument();
  });

  it('shows dead indicator for dead players', () => {
    render(
      <PlayerToken
        player={deadPlayer}
        characterDef={nobleCharacter}
        {...defaultProps}
      />,
    );
    expect(screen.getByText('💀')).toBeInTheDocument();
  });

  it('shows alive indicator for alive players', () => {
    render(
      <PlayerToken
        player={alivePlayer}
        characterDef={nobleCharacter}
        {...defaultProps}
      />,
    );
    expect(screen.getByText('●')).toBeInTheDocument();
  });

  it('shows ghost vote used indicator for dead players', () => {
    render(
      <PlayerToken
        player={deadPlayerGhostVoteUsed}
        characterDef={nobleCharacter}
        {...defaultProps}
      />,
    );
    expect(screen.getByTitle('Ghost vote used')).toBeInTheDocument();
  });

  it('does not show ghost vote indicator when not used', () => {
    render(
      <PlayerToken
        player={deadPlayer}
        characterDef={nobleCharacter}
        {...defaultProps}
      />,
    );
    expect(screen.queryByTitle('Ghost vote used')).not.toBeInTheDocument();
  });

  it('click handler is called', () => {
    const onClick = vi.fn();
    render(
      <PlayerToken
        player={alivePlayer}
        characterDef={nobleCharacter}
        {...defaultProps}
        onClick={onClick}
      />,
    );
    fireEvent.click(screen.getByLabelText('Alice, Seat 1, alive'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('character icon click opens detail modal (with stopPropagation)', () => {
    const onClick = vi.fn();
    render(
      <PlayerToken
        player={alivePlayer}
        characterDef={nobleCharacter}
        {...defaultProps}
        showCharacters={true}
        onClick={onClick}
      />,
    );
    // Click the character icon (first letter "N")
    fireEvent.click(screen.getByText('N'));
    // Modal should open
    expect(screen.getByTestId('character-detail-modal')).toBeInTheDocument();
    // The parent onClick should NOT be called (stopPropagation)
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders traveller player', () => {
    const { container } = render(
      <PlayerToken
        player={travellerPlayer}
        {...defaultProps}
      />,
    );
    expect(container).toBeTruthy();
    expect(screen.getByText('TravJack')).toBeInTheDocument();
  });

  it('shows "?" for character icon when no characterDef provided', () => {
    render(
      <PlayerToken
        player={alivePlayer}
        {...defaultProps}
        showCharacters={true}
      />,
    );
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('shows "—" for character name when no characterDef provided', () => {
    render(
      <PlayerToken
        player={alivePlayer}
        {...defaultProps}
        showCharacters={true}
      />,
    );
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
