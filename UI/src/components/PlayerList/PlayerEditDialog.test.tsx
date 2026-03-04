import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { PlayerEditDialog } from '@/components/PlayerList/PlayerEditDialog.tsx';
import type { PlayerSeat, CharacterDef } from '@/types/index.ts';
import { CharacterType, Alignment } from '@/types/index.ts';

// ──────────────────────────────────────────────
// Mock data
// ──────────────────────────────────────────────

const nobleCharacter: CharacterDef = {
  id: 'noble',
  name: 'Noble',
  type: CharacterType.Townsfolk,
  defaultAlignment: Alignment.Good,
  abilityShort: 'On your 1st night, you learn 3 players.',
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

const fortuneTellerCharacter: CharacterDef = {
  id: 'fortuneteller',
  name: 'Fortune Teller',
  type: CharacterType.Townsfolk,
  defaultAlignment: Alignment.Good,
  abilityShort: 'Choose 2 players.',
  firstNight: null,
  otherNights: null,
  reminders: [],
};

const scriptCharacters: CharacterDef[] = [nobleCharacter, impCharacter, fortuneTellerCharacter];

const alicePlayer: PlayerSeat = {
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

const unassignedPlayer: PlayerSeat = {
  seat: 9,
  playerName: 'Iris',
  characterId: '',
  alive: true,
  ghostVoteUsed: false,
  visibleAlignment: Alignment.Unknown,
  actualAlignment: Alignment.Unknown,
  startingAlignment: Alignment.Unknown,
  activeReminders: [],
  isTraveller: false,
  tokens: [],
};

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe('PlayerEditDialog', () => {
  it('renders nothing when player is null', () => {
    const { container } = render(
      <PlayerEditDialog
        open={true}
        player={null}
        scriptCharacters={scriptCharacters}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when open is false', () => {
    render(
      <PlayerEditDialog
        open={false}
        player={alicePlayer}
        scriptCharacters={scriptCharacters}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />,
    );
    expect(screen.queryByText('Edit Player — Seat 1')).not.toBeInTheDocument();
  });

  it('shows dialog when open with player data', () => {
    render(
      <PlayerEditDialog
        open={true}
        player={alicePlayer}
        scriptCharacters={scriptCharacters}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />,
    );
    expect(screen.getByText('Edit Player — Seat 1')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('has Character select field', () => {
    render(
      <PlayerEditDialog
        open={true}
        player={alicePlayer}
        scriptCharacters={scriptCharacters}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('Character')).toBeInTheDocument();
  });

  it('has alignment toggle buttons', () => {
    render(
      <PlayerEditDialog
        open={true}
        player={alicePlayer}
        scriptCharacters={scriptCharacters}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />,
    );
    expect(screen.getByText('Actual Alignment')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Good' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Evil' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Unknown' })).toBeInTheDocument();
  });

  it('calls onClose on cancel', async () => {
    const onClose = vi.fn();
    render(
      <PlayerEditDialog
        open={true}
        player={alicePlayer}
        scriptCharacters={scriptCharacters}
        onClose={onClose}
        onSave={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onSave with current data when Save is clicked', async () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(
      <PlayerEditDialog
        open={true}
        player={alicePlayer}
        scriptCharacters={scriptCharacters}
        onClose={onClose}
        onSave={onSave}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(1, {
      characterId: 'noble',
      actualAlignment: Alignment.Good,
    });
    // Also calls onClose after save
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('allows changing alignment via toggle buttons', async () => {
    const onSave = vi.fn();
    render(
      <PlayerEditDialog
        open={true}
        player={alicePlayer}
        scriptCharacters={scriptCharacters}
        onClose={vi.fn()}
        onSave={onSave}
      />,
    );
    // Toggle to Evil
    await userEvent.click(screen.getByRole('button', { name: 'Evil' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledWith(1, {
      characterId: 'noble',
      actualAlignment: Alignment.Evil,
    });
  });

  it('shows player name in the dialog body', () => {
    render(
      <PlayerEditDialog
        open={true}
        player={alicePlayer}
        scriptCharacters={scriptCharacters}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />,
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('initializes with player current alignment', () => {
    render(
      <PlayerEditDialog
        open={true}
        player={alicePlayer}
        scriptCharacters={scriptCharacters}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />,
    );
    // Good button should be pressed/selected for Alice (Good alignment)
    const goodButton = screen.getByRole('button', { name: 'Good' });
    expect(goodButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('handles unassigned player correctly', () => {
    render(
      <PlayerEditDialog
        open={true}
        player={unassignedPlayer}
        scriptCharacters={scriptCharacters}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />,
    );
    expect(screen.getByText('Edit Player — Seat 9')).toBeInTheDocument();
    expect(screen.getByText('Iris')).toBeInTheDocument();
    // Unknown alignment should be pressed
    const unknownButton = screen.getByRole('button', { name: 'Unknown' });
    expect(unknownButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('has Save and Cancel buttons', () => {
    render(
      <PlayerEditDialog
        open={true}
        player={alicePlayer}
        scriptCharacters={scriptCharacters}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });
});
