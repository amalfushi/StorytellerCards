import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlayerListTab } from '@/components/PlayerList/PlayerListTab.tsx';
import type { Game, PlayerSeat } from '@/types/index.ts';
import { Alignment } from '@/types/index.ts';

// ──────────────────────────────────────────────
// Mock data
// ──────────────────────────────────────────────

const mockPlayers: PlayerSeat[] = [
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
  {
    seat: 3,
    playerName: 'Charlie',
    characterId: 'fortuneteller',
    alive: false,
    ghostVoteUsed: false,
    visibleAlignment: Alignment.Unknown,
    actualAlignment: Alignment.Good,
    startingAlignment: Alignment.Good,
    activeReminders: [],
    isTraveller: false,
    tokens: [],
  },
];

const baseGame: Game = {
  id: 'game-1',
  sessionId: 'session-1',
  scriptId: 'boozling',
  currentDay: 1,
  currentPhase: 'Day',
  isFirstNight: true,
  players: mockPlayers,
  nightHistory: [],
};

// ──────────────────────────────────────────────
// Mocks
// ──────────────────────────────────────────────

const mockUpdatePlayer = vi.fn();

let mockShowCharacters: boolean;
let mockGame: Game | null;

vi.mock('@/context/GameContext.tsx', () => ({
  useGame: () => ({
    state: {
      game: mockGame,
      showCharacters: mockShowCharacters,
      nightProgress: null,
    },
    updatePlayer: mockUpdatePlayer,
  }),
}));

vi.mock('@/hooks/useCharacterLookup.ts', () => ({
  useCharacterLookup: () => ({
    getCharacter: (id: string) => {
      const chars: Record<string, { id: string; name: string; type: string; defaultAlignment: string; abilityShort: string; firstNight: null; otherNights: null; reminders: never[] }> = {
        noble: {
          id: 'noble',
          name: 'Noble',
          type: 'Townsfolk',
          defaultAlignment: 'Good',
          abilityShort: 'On your 1st night, you learn 3 players.',
          firstNight: null,
          otherNights: null,
          reminders: [],
        },
        imp: {
          id: 'imp',
          name: 'Imp',
          type: 'Demon',
          defaultAlignment: 'Evil',
          abilityShort: 'Each night*, choose a player: they die.',
          firstNight: null,
          otherNights: null,
          reminders: [],
        },
        fortuneteller: {
          id: 'fortuneteller',
          name: 'Fortune Teller',
          type: 'Townsfolk',
          defaultAlignment: 'Good',
          abilityShort: 'Choose 2 players.',
          firstNight: null,
          otherNights: null,
          reminders: [],
        },
      };
      return chars[id];
    },
    getCharactersByIds: (ids: string[]) =>
      ids
        .filter((id) => ['noble', 'imp', 'fortuneteller'].includes(id))
        .map((id) => ({
          id,
          name: id === 'noble' ? 'Noble' : id === 'imp' ? 'Imp' : 'Fortune Teller',
          type: id === 'imp' ? 'Demon' : 'Townsfolk',
          defaultAlignment: id === 'imp' ? 'Evil' : 'Good',
          abilityShort: 'Test ability.',
          firstNight: null,
          otherNights: null,
          reminders: [],
        })),
    allCharacters: [],
  }),
}));

// Mock PlayerRow to simplify
vi.mock('@/components/PlayerList/PlayerRow.tsx', () => ({
  PlayerRow: ({
    player,
    showCharacters,
  }: {
    player: PlayerSeat;
    showCharacters: boolean;
  }) => (
    <tr data-testid={`player-row-${player.seat}`}>
      <td>{player.seat}</td>
      <td>{player.playerName}</td>
      {showCharacters && <td data-testid="character-col">{player.characterId}</td>}
    </tr>
  ),
}));

// Mock PlayerEditDialog
vi.mock('@/components/PlayerList/PlayerEditDialog.tsx', () => ({
  PlayerEditDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="player-edit-dialog">Edit Dialog</div> : null,
}));

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe('PlayerListTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockShowCharacters = true;
    mockGame = baseGame;
  });

  it('renders without crashing', () => {
    const { container } = render(
      <PlayerListTab scriptCharacterIds={['noble', 'imp', 'fortuneteller']} />,
    );
    expect(container).toBeTruthy();
  });

  it('shows a table of all players', () => {
    render(
      <PlayerListTab scriptCharacterIds={['noble', 'imp', 'fortuneteller']} />,
    );
    expect(screen.getByTestId('player-row-1')).toBeInTheDocument();
    expect(screen.getByTestId('player-row-2')).toBeInTheDocument();
    expect(screen.getByTestId('player-row-3')).toBeInTheDocument();
  });

  it('shows all players from game state', () => {
    render(
      <PlayerListTab scriptCharacterIds={['noble', 'imp', 'fortuneteller']} />,
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('displays correct column headers when showCharacters is true', () => {
    render(
      <PlayerListTab scriptCharacterIds={['noble', 'imp', 'fortuneteller']} />,
    );
    expect(screen.getByText('#')).toBeInTheDocument();
    expect(screen.getByText('Player')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Icon')).toBeInTheDocument();
    expect(screen.getByText('Character')).toBeInTheDocument();
    expect(screen.getByText('Ability')).toBeInTheDocument();
    expect(screen.getByText('Alive')).toBeInTheDocument();
    expect(screen.getByText('Align')).toBeInTheDocument();
    expect(screen.getByText('Vote')).toBeInTheDocument();
  });

  it('hides character columns when showCharacters is false (Day mode)', () => {
    mockShowCharacters = false;
    render(
      <PlayerListTab scriptCharacterIds={['noble', 'imp', 'fortuneteller']} />,
    );
    // Should show basic columns
    expect(screen.getByText('#')).toBeInTheDocument();
    expect(screen.getByText('Player')).toBeInTheDocument();
    expect(screen.getByText('Alive')).toBeInTheDocument();
    expect(screen.getByText('Vote')).toBeInTheDocument();
    // Should NOT show character-specific columns
    expect(screen.queryByText('Type')).not.toBeInTheDocument();
    expect(screen.queryByText('Icon')).not.toBeInTheDocument();
    expect(screen.queryByText('Character')).not.toBeInTheDocument();
    expect(screen.queryByText('Ability')).not.toBeInTheDocument();
    expect(screen.queryByText('Align')).not.toBeInTheDocument();
  });

  it('shows "No players in this game" when players list is empty', () => {
    mockGame = { ...baseGame, players: [] };
    render(
      <PlayerListTab scriptCharacterIds={['noble', 'imp', 'fortuneteller']} />,
    );
    expect(screen.getByText('No players in this game.')).toBeInTheDocument();
  });

  it('shows "No players" when game is null', () => {
    mockGame = null;
    render(
      <PlayerListTab scriptCharacterIds={['noble', 'imp', 'fortuneteller']} />,
    );
    expect(screen.getByText('No players in this game.')).toBeInTheDocument();
  });

  it('passes showCharacters to player rows', () => {
    mockShowCharacters = true;
    render(
      <PlayerListTab scriptCharacterIds={['noble', 'imp', 'fortuneteller']} />,
    );
    // When showCharacters=true, our mock PlayerRow renders the character-col
    const characterCols = screen.getAllByTestId('character-col');
    expect(characterCols).toHaveLength(3);
  });

  it('does not pass character columns in Day mode', () => {
    mockShowCharacters = false;
    render(
      <PlayerListTab scriptCharacterIds={['noble', 'imp', 'fortuneteller']} />,
    );
    expect(screen.queryByTestId('character-col')).not.toBeInTheDocument();
  });

  it('sorts players by seat number', () => {
    // Provide players in scrambled order
    mockGame = {
      ...baseGame,
      players: [mockPlayers[2], mockPlayers[0], mockPlayers[1]], // seats 3, 1, 2
    };
    render(
      <PlayerListTab scriptCharacterIds={['noble', 'imp', 'fortuneteller']} />,
    );
    const rows = screen.getAllByTestId(/^player-row-/);
    // Should be sorted: seat 1, 2, 3
    expect(rows[0]).toHaveAttribute('data-testid', 'player-row-1');
    expect(rows[1]).toHaveAttribute('data-testid', 'player-row-2');
    expect(rows[2]).toHaveAttribute('data-testid', 'player-row-3');
  });
});
