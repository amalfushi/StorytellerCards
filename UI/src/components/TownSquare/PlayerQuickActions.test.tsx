import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlayerQuickActions } from '@/components/TownSquare/PlayerQuickActions.tsx';
import type { PlayerSeat } from '@/types/index.ts';
import { Alignment } from '@/types/index.ts';

// ──────────────────────────────────────────────
// Mock data
// ──────────────────────────────────────────────

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
// Helper
// ──────────────────────────────────────────────

function createAnchorEl(): HTMLElement {
  const el = document.createElement('div');
  document.body.appendChild(el);
  return el;
}

function defaultCallbacks() {
  return {
    onClose: vi.fn(),
    onToggleAlive: vi.fn(),
    onToggleGhostVote: vi.fn(),
    onEditCharacter: vi.fn(),
    onRemoveTraveller: vi.fn(),
    onManageTokens: vi.fn(),
  };
}

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe('PlayerQuickActions', () => {
  it('renders nothing when player is null', () => {
    const { container } = render(
      <PlayerQuickActions
        anchorEl={null}
        player={null}
        showCharacters={false}
        {...defaultCallbacks()}
      />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when anchorEl is null', () => {
    const { container } = render(
      <PlayerQuickActions
        anchorEl={null}
        player={alivePlayer}
        showCharacters={false}
        {...defaultCallbacks()}
      />,
    );
    // Menu should not be open
    expect(screen.queryByText('Mark as Dead')).not.toBeInTheDocument();
  });

  it('shows menu when anchorEl and player are provided', () => {
    const anchorEl = createAnchorEl();
    render(
      <PlayerQuickActions
        anchorEl={anchorEl}
        player={alivePlayer}
        showCharacters={false}
        {...defaultCallbacks()}
      />,
    );
    expect(screen.getByText('Mark as Dead')).toBeInTheDocument();
  });

  it('shows "Mark as Dead" option for alive players', () => {
    const anchorEl = createAnchorEl();
    render(
      <PlayerQuickActions
        anchorEl={anchorEl}
        player={alivePlayer}
        showCharacters={false}
        {...defaultCallbacks()}
      />,
    );
    expect(screen.getByText('Mark as Dead')).toBeInTheDocument();
  });

  it('shows "Mark as Alive" option for dead players', () => {
    const anchorEl = createAnchorEl();
    render(
      <PlayerQuickActions
        anchorEl={anchorEl}
        player={deadPlayer}
        showCharacters={false}
        {...defaultCallbacks()}
      />,
    );
    expect(screen.getByText('Mark as Alive')).toBeInTheDocument();
  });

  it('shows "Use Ghost Vote" option for dead players with unused ghost vote', () => {
    const anchorEl = createAnchorEl();
    render(
      <PlayerQuickActions
        anchorEl={anchorEl}
        player={deadPlayer}
        showCharacters={false}
        {...defaultCallbacks()}
      />,
    );
    expect(screen.getByText('Use Ghost Vote')).toBeInTheDocument();
  });

  it('shows "Restore Ghost Vote" option for dead players with used ghost vote', () => {
    const anchorEl = createAnchorEl();
    render(
      <PlayerQuickActions
        anchorEl={anchorEl}
        player={deadPlayerGhostVoteUsed}
        showCharacters={false}
        {...defaultCallbacks()}
      />,
    );
    expect(screen.getByText('Restore Ghost Vote')).toBeInTheDocument();
  });

  it('does not show ghost vote option for alive players', () => {
    const anchorEl = createAnchorEl();
    render(
      <PlayerQuickActions
        anchorEl={anchorEl}
        player={alivePlayer}
        showCharacters={false}
        {...defaultCallbacks()}
      />,
    );
    expect(screen.queryByText('Use Ghost Vote')).not.toBeInTheDocument();
    expect(screen.queryByText('Restore Ghost Vote')).not.toBeInTheDocument();
  });

  it('calls onToggleAlive and onClose when "Mark as Dead" is clicked', () => {
    const anchorEl = createAnchorEl();
    const callbacks = defaultCallbacks();
    render(
      <PlayerQuickActions
        anchorEl={anchorEl}
        player={alivePlayer}
        showCharacters={false}
        {...callbacks}
      />,
    );
    fireEvent.click(screen.getByText('Mark as Dead'));
    expect(callbacks.onToggleAlive).toHaveBeenCalledWith(1);
    expect(callbacks.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onToggleGhostVote and onClose when ghost vote option is clicked', () => {
    const anchorEl = createAnchorEl();
    const callbacks = defaultCallbacks();
    render(
      <PlayerQuickActions
        anchorEl={anchorEl}
        player={deadPlayer}
        showCharacters={false}
        {...callbacks}
      />,
    );
    fireEvent.click(screen.getByText('Use Ghost Vote'));
    expect(callbacks.onToggleGhostVote).toHaveBeenCalledWith(3);
    expect(callbacks.onClose).toHaveBeenCalledTimes(1);
  });

  it('shows "Edit Character" option only in night view (showCharacters=true)', () => {
    const anchorEl = createAnchorEl();
    render(
      <PlayerQuickActions
        anchorEl={anchorEl}
        player={alivePlayer}
        showCharacters={true}
        {...defaultCallbacks()}
      />,
    );
    expect(screen.getByText('Edit Character')).toBeInTheDocument();
  });

  it('hides "Edit Character" option in day view (showCharacters=false)', () => {
    const anchorEl = createAnchorEl();
    render(
      <PlayerQuickActions
        anchorEl={anchorEl}
        player={alivePlayer}
        showCharacters={false}
        {...defaultCallbacks()}
      />,
    );
    expect(screen.queryByText('Edit Character')).not.toBeInTheDocument();
  });

  it('shows "Remove Traveller" option for traveller players', () => {
    const anchorEl = createAnchorEl();
    render(
      <PlayerQuickActions
        anchorEl={anchorEl}
        player={travellerPlayer}
        showCharacters={false}
        {...defaultCallbacks()}
      />,
    );
    expect(screen.getByText('Remove Traveller')).toBeInTheDocument();
  });

  it('hides "Remove Traveller" option for non-traveller players', () => {
    const anchorEl = createAnchorEl();
    render(
      <PlayerQuickActions
        anchorEl={anchorEl}
        player={alivePlayer}
        showCharacters={false}
        {...defaultCallbacks()}
      />,
    );
    expect(screen.queryByText('Remove Traveller')).not.toBeInTheDocument();
  });

  it('shows "Manage Tokens" option when onManageTokens is provided', () => {
    const anchorEl = createAnchorEl();
    render(
      <PlayerQuickActions
        anchorEl={anchorEl}
        player={alivePlayer}
        showCharacters={false}
        {...defaultCallbacks()}
      />,
    );
    expect(screen.getByText('Manage Tokens')).toBeInTheDocument();
  });

  it('hides "Manage Tokens" option when onManageTokens is not provided', () => {
    const anchorEl = createAnchorEl();
    const callbacks = defaultCallbacks();
    render(
      <PlayerQuickActions
        anchorEl={anchorEl}
        player={alivePlayer}
        showCharacters={false}
        onClose={callbacks.onClose}
        onToggleAlive={callbacks.onToggleAlive}
        onToggleGhostVote={callbacks.onToggleGhostVote}
        onEditCharacter={callbacks.onEditCharacter}
        onRemoveTraveller={callbacks.onRemoveTraveller}
      />,
    );
    expect(screen.queryByText('Manage Tokens')).not.toBeInTheDocument();
  });

  it('calls onRemoveTraveller and onClose when "Remove Traveller" is clicked', () => {
    const anchorEl = createAnchorEl();
    const callbacks = defaultCallbacks();
    render(
      <PlayerQuickActions
        anchorEl={anchorEl}
        player={travellerPlayer}
        showCharacters={false}
        {...callbacks}
      />,
    );
    fireEvent.click(screen.getByText('Remove Traveller'));
    expect(callbacks.onRemoveTraveller).toHaveBeenCalledWith(10);
    expect(callbacks.onClose).toHaveBeenCalledTimes(1);
  });
});
