import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlayerActionsModal } from '@/components/TownSquare/PlayerActionsModal.tsx';
import type { PlayerSeat, CharacterDef } from '@/types/index.ts';
import { Alignment, CharacterType } from '@/types/index.ts';

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

const impCharacter: CharacterDef = {
  id: 'imp',
  name: 'Imp',
  type: CharacterType.Demon,
  defaultAlignment: Alignment.Evil,
  abilityShort: 'Each night*, choose a player: they die.',
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

const scriptCharacters: CharacterDef[] = [nobleCharacter, impCharacter];

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

const defaultHandlers = () => ({
  onClose: vi.fn(),
  onToggleAlive: vi.fn(),
  onToggleGhostVote: vi.fn(),
  onRemoveTraveller: vi.fn(),
  onManageTokens: vi.fn(),
  onSaveCharacter: vi.fn(),
});

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe('PlayerActionsModal', () => {
  // ── Render guards ──

  it('does not render when open=false', () => {
    const handlers = defaultHandlers();
    const { container } = render(
      <PlayerActionsModal
        open={false}
        player={alivePlayer}
        showCharacters={false}
        scriptCharacters={scriptCharacters}
        {...handlers}
      />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('does not render when player=null', () => {
    const handlers = defaultHandlers();
    const { container } = render(
      <PlayerActionsModal
        open={true}
        player={null}
        showCharacters={false}
        scriptCharacters={scriptCharacters}
        {...handlers}
      />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('shows player name in dialog title', () => {
    const handlers = defaultHandlers();
    render(
      <PlayerActionsModal
        open={true}
        player={alivePlayer}
        showCharacters={false}
        scriptCharacters={scriptCharacters}
        {...handlers}
      />,
    );
    expect(screen.getByText(/Alice — Seat 1/)).toBeInTheDocument();
  });

  // ── Hidden mode tests (showCharacters=false) ──

  describe('hidden mode (showCharacters=false)', () => {
    it('shows "Mark as Dead" button for alive player', () => {
      const handlers = defaultHandlers();
      render(
        <PlayerActionsModal
          open={true}
          player={alivePlayer}
          showCharacters={false}
          scriptCharacters={scriptCharacters}
          {...handlers}
        />,
      );
      expect(screen.getByText('Mark as Dead')).toBeInTheDocument();
    });

    it('shows "Mark as Alive" button for dead player', () => {
      const handlers = defaultHandlers();
      render(
        <PlayerActionsModal
          open={true}
          player={deadPlayer}
          showCharacters={false}
          scriptCharacters={scriptCharacters}
          {...handlers}
        />,
      );
      expect(screen.getByText('Mark as Alive')).toBeInTheDocument();
    });

    it('shows "Use Ghost Vote" for dead player who has not used ghost vote', () => {
      const handlers = defaultHandlers();
      render(
        <PlayerActionsModal
          open={true}
          player={deadPlayer}
          showCharacters={false}
          scriptCharacters={scriptCharacters}
          {...handlers}
        />,
      );
      expect(screen.getByText('Use Ghost Vote')).toBeInTheDocument();
    });

    it('shows "Restore Ghost Vote" for dead player who has used ghost vote', () => {
      const handlers = defaultHandlers();
      render(
        <PlayerActionsModal
          open={true}
          player={deadPlayerGhostVoteUsed}
          showCharacters={false}
          scriptCharacters={scriptCharacters}
          {...handlers}
        />,
      );
      expect(screen.getByText('Restore Ghost Vote')).toBeInTheDocument();
    });

    it('does NOT show ghost vote options for alive player', () => {
      const handlers = defaultHandlers();
      render(
        <PlayerActionsModal
          open={true}
          player={alivePlayer}
          showCharacters={false}
          scriptCharacters={scriptCharacters}
          {...handlers}
        />,
      );
      expect(screen.queryByText('Use Ghost Vote')).not.toBeInTheDocument();
      expect(screen.queryByText('Restore Ghost Vote')).not.toBeInTheDocument();
    });

    it('shows "Remove Traveller" for traveller player', () => {
      const handlers = defaultHandlers();
      render(
        <PlayerActionsModal
          open={true}
          player={travellerPlayer}
          showCharacters={false}
          scriptCharacters={scriptCharacters}
          {...handlers}
        />,
      );
      expect(screen.getByText('Remove Traveller')).toBeInTheDocument();
    });

    it('does NOT show "Remove Traveller" for non-traveller', () => {
      const handlers = defaultHandlers();
      render(
        <PlayerActionsModal
          open={true}
          player={alivePlayer}
          showCharacters={false}
          scriptCharacters={scriptCharacters}
          {...handlers}
        />,
      );
      expect(screen.queryByText('Remove Traveller')).not.toBeInTheDocument();
    });

    it('does NOT show "Manage Tokens" button', () => {
      const handlers = defaultHandlers();
      render(
        <PlayerActionsModal
          open={true}
          player={alivePlayer}
          showCharacters={false}
          scriptCharacters={scriptCharacters}
          {...handlers}
        />,
      );
      expect(screen.queryByText('Manage Tokens')).not.toBeInTheDocument();
    });

    it('does NOT show character dropdown', () => {
      const handlers = defaultHandlers();
      render(
        <PlayerActionsModal
          open={true}
          player={alivePlayer}
          showCharacters={false}
          scriptCharacters={scriptCharacters}
          {...handlers}
        />,
      );
      expect(screen.queryByLabelText('Character')).not.toBeInTheDocument();
    });

    it('does NOT show alignment toggles', () => {
      const handlers = defaultHandlers();
      render(
        <PlayerActionsModal
          open={true}
          player={alivePlayer}
          showCharacters={false}
          scriptCharacters={scriptCharacters}
          {...handlers}
        />,
      );
      expect(screen.queryByText('Actual Alignment')).not.toBeInTheDocument();
      expect(screen.queryByText('Good')).not.toBeInTheDocument();
      expect(screen.queryByText('Evil')).not.toBeInTheDocument();
    });
  });

  // ── Visible mode tests (showCharacters=true) ──

  describe('visible mode (showCharacters=true)', () => {
    it('shows "Mark as Dead" button', () => {
      const handlers = defaultHandlers();
      render(
        <PlayerActionsModal
          open={true}
          player={alivePlayer}
          showCharacters={true}
          scriptCharacters={scriptCharacters}
          {...handlers}
        />,
      );
      expect(screen.getByText('Mark as Dead')).toBeInTheDocument();
    });

    it('shows "Manage Tokens" button', () => {
      const handlers = defaultHandlers();
      render(
        <PlayerActionsModal
          open={true}
          player={alivePlayer}
          showCharacters={true}
          scriptCharacters={scriptCharacters}
          {...handlers}
        />,
      );
      expect(screen.getByText('Manage Tokens')).toBeInTheDocument();
    });

    it('shows character select dropdown', () => {
      const handlers = defaultHandlers();
      render(
        <PlayerActionsModal
          open={true}
          player={alivePlayer}
          showCharacters={true}
          scriptCharacters={scriptCharacters}
          {...handlers}
        />,
      );
      expect(screen.getByLabelText('Character')).toBeInTheDocument();
    });

    it('shows alignment toggle buttons (Good/Evil/Unknown)', () => {
      const handlers = defaultHandlers();
      render(
        <PlayerActionsModal
          open={true}
          player={alivePlayer}
          showCharacters={true}
          scriptCharacters={scriptCharacters}
          {...handlers}
        />,
      );
      expect(screen.getByText('Actual Alignment')).toBeInTheDocument();
      expect(screen.getByText('Good')).toBeInTheDocument();
      expect(screen.getByText('Evil')).toBeInTheDocument();
      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });

    it('shows "Save Changes" button', () => {
      const handlers = defaultHandlers();
      render(
        <PlayerActionsModal
          open={true}
          player={alivePlayer}
          showCharacters={true}
          scriptCharacters={scriptCharacters}
          {...handlers}
        />,
      );
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });
  });

  // ── Interaction tests ──

  describe('interactions', () => {
    it('clicking "Mark as Dead" calls onToggleAlive with correct seat', () => {
      const handlers = defaultHandlers();
      render(
        <PlayerActionsModal
          open={true}
          player={alivePlayer}
          showCharacters={false}
          scriptCharacters={scriptCharacters}
          {...handlers}
        />,
      );
      fireEvent.click(screen.getByText('Mark as Dead'));
      expect(handlers.onToggleAlive).toHaveBeenCalledWith(1);
    });

    it('clicking "Mark as Alive" calls onToggleAlive with correct seat', () => {
      const handlers = defaultHandlers();
      render(
        <PlayerActionsModal
          open={true}
          player={deadPlayer}
          showCharacters={false}
          scriptCharacters={scriptCharacters}
          {...handlers}
        />,
      );
      fireEvent.click(screen.getByText('Mark as Alive'));
      expect(handlers.onToggleAlive).toHaveBeenCalledWith(3);
    });

    it('clicking ghost vote toggle calls onToggleGhostVote', () => {
      const handlers = defaultHandlers();
      render(
        <PlayerActionsModal
          open={true}
          player={deadPlayer}
          showCharacters={false}
          scriptCharacters={scriptCharacters}
          {...handlers}
        />,
      );
      fireEvent.click(screen.getByText('Use Ghost Vote'));
      expect(handlers.onToggleGhostVote).toHaveBeenCalledWith(3);
    });

    it('clicking "Manage Tokens" calls onManageTokens and onClose', () => {
      const handlers = defaultHandlers();
      render(
        <PlayerActionsModal
          open={true}
          player={alivePlayer}
          showCharacters={true}
          scriptCharacters={scriptCharacters}
          {...handlers}
        />,
      );
      fireEvent.click(screen.getByText('Manage Tokens'));
      expect(handlers.onManageTokens).toHaveBeenCalledWith(1);
      expect(handlers.onClose).toHaveBeenCalled();
    });

    it('clicking "Remove Traveller" calls onRemoveTraveller and onClose', () => {
      const handlers = defaultHandlers();
      render(
        <PlayerActionsModal
          open={true}
          player={travellerPlayer}
          showCharacters={false}
          scriptCharacters={scriptCharacters}
          {...handlers}
        />,
      );
      fireEvent.click(screen.getByText('Remove Traveller'));
      expect(handlers.onRemoveTraveller).toHaveBeenCalledWith(10);
      expect(handlers.onClose).toHaveBeenCalled();
    });

    it('clicking "Save Changes" calls onSaveCharacter with seat and initial values, then onClose', () => {
      const handlers = defaultHandlers();
      render(
        <PlayerActionsModal
          open={true}
          player={alivePlayer}
          showCharacters={true}
          scriptCharacters={scriptCharacters}
          {...handlers}
        />,
      );
      fireEvent.click(screen.getByText('Save Changes'));
      expect(handlers.onSaveCharacter).toHaveBeenCalledWith(1, {
        characterId: 'noble',
        actualAlignment: 'Good',
      });
      expect(handlers.onClose).toHaveBeenCalled();
    });

    it('toggling alignment and clicking Save calls onSaveCharacter with new alignment', () => {
      const handlers = defaultHandlers();
      render(
        <PlayerActionsModal
          open={true}
          player={alivePlayer}
          showCharacters={true}
          scriptCharacters={scriptCharacters}
          {...handlers}
        />,
      );
      // Click "Evil" toggle
      fireEvent.click(screen.getByText('Evil'));
      // Click Save
      fireEvent.click(screen.getByText('Save Changes'));
      expect(handlers.onSaveCharacter).toHaveBeenCalledWith(1, {
        characterId: 'noble',
        actualAlignment: 'Evil',
      });
    });

    it('saving closes the dialog (onClose called)', () => {
      const handlers = defaultHandlers();
      render(
        <PlayerActionsModal
          open={true}
          player={alivePlayer}
          showCharacters={true}
          scriptCharacters={scriptCharacters}
          {...handlers}
        />,
      );
      fireEvent.click(screen.getByText('Save Changes'));
      expect(handlers.onClose).toHaveBeenCalled();
    });
  });
});
