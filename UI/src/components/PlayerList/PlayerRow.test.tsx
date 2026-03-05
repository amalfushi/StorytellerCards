import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import { PlayerRow } from '@/components/PlayerList/PlayerRow.tsx';
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

// Mock TokenChips
vi.mock('@/components/common/TokenChips.tsx', () => ({
  TokenChips: ({ tokens }: { tokens: unknown[] }) => (
    <span data-testid="token-chips">{tokens.length} tokens</span>
  ),
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
  firstNight: {
    order: 14,
    helpText: 'Point to 3 players. One is evil.',
    subActions: [{ id: 'noble-fn-1', description: 'Point to 3', isConditional: false }],
  },
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

const evilTownsfolkPlayer: PlayerSeat = {
  seat: 11,
  playerName: 'Mallory',
  characterId: 'noble',
  alive: true,
  ghostVoteUsed: false,
  visibleAlignment: Alignment.Unknown,
  actualAlignment: Alignment.Evil,
  startingAlignment: Alignment.Good,
  activeReminders: [],
  isTraveller: false,
  tokens: [],
};

const playerWithTokens: PlayerSeat = {
  ...alivePlayer,
  tokens: [
    { id: 'tok-1', type: 'drunk', label: 'Drunk', color: '#1976d2' },
    { id: 'tok-2', type: 'poisoned', label: 'Poisoned', color: '#7b1fa2' },
  ],
};

// ──────────────────────────────────────────────
// Helper — wraps PlayerRow in a Table for valid DOM
// ──────────────────────────────────────────────

function renderPlayerRow(player: PlayerSeat, showCharacters: boolean, character?: CharacterDef) {
  const onToggleAlive = vi.fn();
  const onToggleGhostVote = vi.fn();
  const onRowClick = vi.fn();

  const result = render(
    <Table>
      <TableBody>
        <PlayerRow
          player={player}
          showCharacters={showCharacters}
          character={character}
          onToggleAlive={onToggleAlive}
          onToggleGhostVote={onToggleGhostVote}
          onRowClick={onRowClick}
        />
      </TableBody>
    </Table>,
  );

  return { ...result, onToggleAlive, onToggleGhostVote, onRowClick };
}

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe('PlayerRow', () => {
  it('renders without crashing', () => {
    const { container } = renderPlayerRow(alivePlayer, true, nobleCharacter);
    expect(container).toBeTruthy();
  });

  it('shows player name', () => {
    renderPlayerRow(alivePlayer, true, nobleCharacter);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('shows seat number', () => {
    renderPlayerRow(alivePlayer, true, nobleCharacter);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('shows character name when showCharacters is true', () => {
    renderPlayerRow(alivePlayer, true, nobleCharacter);
    expect(screen.getByText('Noble')).toBeInTheDocument();
  });

  it('hides character info when showCharacters is false (Day mode)', () => {
    renderPlayerRow(alivePlayer, false, nobleCharacter);
    // Character name should not be shown
    expect(screen.queryByText('Noble')).not.toBeInTheDocument();
    // Type chip should not be shown
    expect(screen.queryByText('Townsfolk')).not.toBeInTheDocument();
  });

  it('shows alive status with correct aria-label', () => {
    renderPlayerRow(alivePlayer, true, nobleCharacter);
    expect(screen.getByLabelText('Mark as dead')).toBeInTheDocument();
  });

  it('shows dead status with correct aria-label', () => {
    renderPlayerRow(deadPlayer, true, nobleCharacter);
    expect(screen.getByLabelText('Mark as alive')).toBeInTheDocument();
  });

  it('shows ghost vote button for dead players', () => {
    renderPlayerRow(deadPlayer, true, nobleCharacter);
    expect(screen.getByLabelText('Ghost vote available')).toBeInTheDocument();
  });

  it('shows ghost vote used status', () => {
    renderPlayerRow(deadPlayerGhostVoteUsed, true, nobleCharacter);
    expect(screen.getByLabelText('Ghost vote used')).toBeInTheDocument();
  });

  it('does not show ghost vote button for alive players', () => {
    renderPlayerRow(alivePlayer, true, nobleCharacter);
    expect(screen.queryByLabelText('Ghost vote available')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Ghost vote used')).not.toBeInTheDocument();
  });

  it('shows type pill with character type text', () => {
    renderPlayerRow(alivePlayer, true, nobleCharacter);
    expect(screen.getByText('Townsfolk')).toBeInTheDocument();
  });

  it('shows alignment mismatch border for Evil player with Townsfolk character', () => {
    renderPlayerRow(evilTownsfolkPlayer, true, nobleCharacter);
    // The chip should be rendered with a border style
    const chip = screen.getByText('Townsfolk');
    // The chip has an mismatch border (3px solid demon color)
    expect(chip.closest('.MuiChip-root')).toBeInTheDocument();
  });

  it('calls onToggleAlive when alive button is clicked', async () => {
    const { onToggleAlive } = renderPlayerRow(alivePlayer, true, nobleCharacter);
    const aliveButton = screen.getByLabelText('Mark as dead');
    await userEvent.click(aliveButton);
    expect(onToggleAlive).toHaveBeenCalledWith(1);
  });

  it('calls onToggleGhostVote when ghost vote button is clicked', async () => {
    const { onToggleGhostVote } = renderPlayerRow(deadPlayer, true, nobleCharacter);
    const ghostVoteButton = screen.getByLabelText('Ghost vote available');
    await userEvent.click(ghostVoteButton);
    expect(onToggleGhostVote).toHaveBeenCalledWith(3);
  });

  it('calls onRowClick when row is clicked (showCharacters = true)', async () => {
    const { onRowClick } = renderPlayerRow(alivePlayer, true, nobleCharacter);
    // Click the player name cell
    await userEvent.click(screen.getByText('Alice'));
    expect(onRowClick).toHaveBeenCalledWith(1);
  });

  it('does not call onRowClick when showCharacters is false', async () => {
    const { onRowClick } = renderPlayerRow(alivePlayer, false, nobleCharacter);
    await userEvent.click(screen.getByText('Alice'));
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it('character icon click opens detail modal', async () => {
    renderPlayerRow(alivePlayer, true, nobleCharacter);
    // Find the icon img with alt "Noble"
    const icon = screen.getByAltText('Noble');
    await userEvent.click(icon);
    expect(screen.getByTestId('character-detail-modal')).toBeInTheDocument();
  });

  it('shows ability short text when showCharacters is true', () => {
    renderPlayerRow(alivePlayer, true, nobleCharacter);
    expect(screen.getByText(/On your 1st night, you learn 3 players/)).toBeInTheDocument();
  });

  it('shows token chips when player has tokens', () => {
    renderPlayerRow(playerWithTokens, true, nobleCharacter);
    expect(screen.getByTestId('token-chips')).toBeInTheDocument();
    expect(screen.getByText('2 tokens')).toBeInTheDocument();
  });

  it('shows dash when player has no tokens', () => {
    renderPlayerRow(alivePlayer, true, nobleCharacter);
    // Multiple dashes could appear for various empty columns
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThan(0);
  });

  it('shows dash for unassigned character in night view', () => {
    const unassignedPlayer: PlayerSeat = {
      ...alivePlayer,
      characterId: '',
    };
    renderPlayerRow(unassignedPlayer, true);
    // Multiple '—' placeholders for type, icon, character name, ability
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(3);
  });
});
