import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlayerListTab } from '@/components/PlayerList/PlayerListTab.tsx';
import type { Game, Player, PlayerGameState, PlayerId, Slot } from '@/types/index.ts';
import { Alignment, Phase } from '@/types/index.ts';
import type { PlayerListRowPlayer } from '@/components/PlayerList/PlayerRow.tsx';

const sessionPlayers: Player[] = [
  { id: 'player-1', name: 'Alice' },
  { id: 'player-2', name: 'Bob' },
  { id: 'player-3', name: 'Charlie' },
];

const slots: Slot[] = [
  { kind: 'seat', id: 'slot-1', playerId: 'player-1' },
  { kind: 'seat', id: 'slot-2', playerId: 'player-2' },
  { kind: 'seat', id: 'slot-3', playerId: 'player-3' },
];

function makeState(characterId: string, alignment: Alignment, alive = true): PlayerGameState {
  return {
    characterId,
    alive,
    ghostVoteUsed: false,
    visibleAlignment: Alignment.Unknown,
    actualAlignment: alignment,
    startingAlignment: alignment,
    activeReminders: [],
    tokens: [],
  };
}

const playerState: Record<PlayerId, PlayerGameState> = {
  'player-1': makeState('noble', Alignment.Good),
  'player-2': makeState('imp', Alignment.Evil),
  'player-3': makeState('fortuneteller', Alignment.Good, false),
};

const baseGame: Game = {
  id: 'game-1',
  sessionId: 'session-1',
  scriptId: 'boozling',
  currentDay: 1,
  currentPhase: Phase.Day,
  isFirstNight: true,
  slots,
  participants: sessionPlayers.map((player) => ({ playerId: player.id, isTraveller: false })),
  playerState,
  playerCountOverride: null,
  nightHistory: [],
};

const mockUpdatePlayerState = vi.fn();
const mockMoveGameSlot = vi.fn();
const mockRemoveParticipant = vi.fn();
const mockAddToken = vi.fn();
const mockRemoveToken = vi.fn();
const mockSetPlayerBluffs = vi.fn();

let mockShowCharacters = true;
let mockGame: Game | null = baseGame;

vi.mock('@/context/useGame.ts', () => ({
  useGame: () => ({
    state: { game: mockGame, showCharacters: mockShowCharacters, nightProgress: null },
    updatePlayerState: mockUpdatePlayerState,
    moveGameSlot: mockMoveGameSlot,
    removeParticipant: mockRemoveParticipant,
    addToken: mockAddToken,
    removeToken: mockRemoveToken,
    setPlayerBluffs: mockSetPlayerBluffs,
  }),
}));

vi.mock('@/context/useSession.ts', () => ({
  useSession: () => ({
    state: {
      sessions: [
        {
          id: 'session-1',
          name: 'Test Session',
          createdAt: '2026-01-01T00:00:00.000Z',
          defaultScriptId: 'boozling',
          players: sessionPlayers,
          template: { slots },
          propagationDefault: { toTemplate: true, toOtherGames: true },
          gameIds: ['game-1'],
        },
      ],
      activeSessionId: 'session-1',
      activeGameId: 'game-1',
    },
  }),
}));

vi.mock('@/hooks/useCharacterLookup.ts', () => ({
  useCharacterLookup: () => ({
    getCharacter: (id: string) => {
      const chars = {
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
        angel: {
          id: 'angel',
          name: 'Angel',
          type: 'Fabled',
          defaultAlignment: 'Good',
          abilityShort: 'Protects new players from death.',
          firstNight: null,
          otherNights: null,
          reminders: [],
        },
        bigwig: {
          id: 'bigwig',
          name: 'Big Wig',
          type: 'Loric',
          defaultAlignment: 'Good',
          abilityShort: 'Gives nominees a defence lawyer.',
          firstNight: null,
          otherNights: null,
          reminders: [],
        },
      } as const;
      return chars[id as keyof typeof chars];
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

vi.mock('@/components/common/characterTypeColor.ts', () => ({
  getCharacterTypeColor: (type: string) =>
    ({
      Townsfolk: '#1976d2',
      Outsider: '#42a5f5',
      Minion: '#d32f2f',
      Demon: '#b71c1c',
      Fabled: '#ff9800',
      Loric: '#558b2f',
    })[type] ?? '#9e9e9e',
}));

vi.mock('@/components/PlayerList/PlayerRow.tsx', () => ({
  PlayerRow: ({
    player,
    showCharacters,
    dragHandle,
  }: {
    player: PlayerListRowPlayer;
    showCharacters: boolean;
    dragHandle?: React.ReactNode;
  }) => (
    <tr data-testid={`player-row-${player.seat}`}>
      {dragHandle !== undefined && <td data-testid={`drag-handle-${player.seat}`}>{dragHandle}</td>}
      <td>{player.seat}</td>
      <td>{player.playerName}</td>
      {showCharacters && <td data-testid="character-col">{player.characterId}</td>}
    </tr>
  ),
}));

vi.mock('@/components/TownSquare/PlayerActionsModal.tsx', () => ({
  PlayerActionsModal: ({ open }: { open: boolean }) =>
    open ? <div data-testid="player-actions-modal">Actions Modal</div> : null,
}));

vi.mock('@/components/TownSquare/TokenManager.tsx', () => ({
  TokenManager: ({ open }: { open: boolean }) =>
    open ? <div data-testid="token-manager">Token Manager</div> : null,
}));

vi.mock('@/utils/buildAvailableTokens.ts', () => ({ buildAvailableTokens: () => [] }));

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

  it('shows a table of all seated players', () => {
    render(<PlayerListTab scriptCharacterIds={['noble', 'imp', 'fortuneteller']} />);
    expect(screen.getByTestId('player-row-1')).toBeInTheDocument();
    expect(screen.getByTestId('player-row-2')).toBeInTheDocument();
    expect(screen.getByTestId('player-row-3')).toBeInTheDocument();
  });

  it('shows all player names from the session roster', () => {
    render(<PlayerListTab scriptCharacterIds={['noble', 'imp', 'fortuneteller']} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('displays character column headers when showCharacters is true', () => {
    render(<PlayerListTab scriptCharacterIds={['noble', 'imp', 'fortuneteller']} />);
    for (const header of [
      '#',
      'Player',
      'Type',
      'Icon',
      'Character',
      'Ability',
      'Reminders',
      'Alive',
      'Vote',
      'Edit',
    ]) {
      expect(screen.getByText(header)).toBeInTheDocument();
    }
    expect(screen.queryByText('Align')).not.toBeInTheDocument();
  });

  it('hides character columns when showCharacters is false', () => {
    mockShowCharacters = false;
    render(<PlayerListTab scriptCharacterIds={['noble', 'imp', 'fortuneteller']} />);
    expect(screen.getByText('#')).toBeInTheDocument();
    expect(screen.getByText('Player')).toBeInTheDocument();
    expect(screen.getByText('Alive')).toBeInTheDocument();
    expect(screen.getByText('Vote')).toBeInTheDocument();
    expect(screen.queryByText('Type')).not.toBeInTheDocument();
    expect(screen.queryByText('Character')).not.toBeInTheDocument();
    expect(screen.queryByTestId('character-col')).not.toBeInTheDocument();
  });

  it('shows no players message when no seats are occupied', () => {
    mockGame = {
      ...baseGame,
      slots: baseGame.slots.map((slot) =>
        slot.kind === 'seat' ? { ...slot, playerId: null } : slot,
      ),
    };
    render(<PlayerListTab scriptCharacterIds={['noble', 'imp', 'fortuneteller']} />);
    expect(screen.getByText('No players in this game.')).toBeInTheDocument();
  });

  it('shows no players message when game is null', () => {
    mockGame = null;
    render(<PlayerListTab scriptCharacterIds={['noble', 'imp', 'fortuneteller']} />);
    expect(screen.getByText('No players in this game.')).toBeInTheDocument();
  });

  it('passes showCharacters to player rows', () => {
    render(<PlayerListTab scriptCharacterIds={['noble', 'imp', 'fortuneteller']} />);
    expect(screen.getAllByTestId('character-col')).toHaveLength(3);
  });

  it('sorts players by display seat number derived from slot order', () => {
    mockGame = { ...baseGame, slots: [slots[2], slots[0], slots[1]] };
    render(<PlayerListTab scriptCharacterIds={['noble', 'imp', 'fortuneteller']} />);
    const rows = screen.getAllByTestId(/^player-row-/);
    expect(rows[0]).toHaveAttribute('data-testid', 'player-row-1');
    expect(rows[1]).toHaveAttribute('data-testid', 'player-row-2');
    expect(rows[2]).toHaveAttribute('data-testid', 'player-row-3');
  });

  it('shows Game Modifiers section when Fabled are active', () => {
    mockGame = { ...baseGame, activeFabled: ['angel'] };
    render(<PlayerListTab scriptCharacterIds={['noble', 'imp', 'fortuneteller']} />);
    expect(screen.getByTestId('game-modifiers-section')).toBeInTheDocument();
    expect(screen.getByText('Game Modifiers')).toBeInTheDocument();
  });

  it('shows Game Modifiers section when Loric are active', () => {
    mockGame = { ...baseGame, activeLoric: ['bigwig'] };
    render(<PlayerListTab scriptCharacterIds={['noble', 'imp', 'fortuneteller']} />);
    expect(screen.getByTestId('game-modifiers-section')).toBeInTheDocument();
  });

  it('does not show Game Modifiers section when no Fabled or Loric are active', () => {
    render(<PlayerListTab scriptCharacterIds={['noble', 'imp', 'fortuneteller']} />);
    expect(screen.queryByTestId('game-modifiers-section')).not.toBeInTheDocument();
  });

  it('renders Fabled character name and ability in Game Modifiers', () => {
    mockGame = { ...baseGame, activeFabled: ['angel'] };
    render(<PlayerListTab scriptCharacterIds={['noble', 'imp', 'fortuneteller']} />);
    expect(screen.getByTestId('modifier-angel')).toBeInTheDocument();
    expect(screen.getByText('Angel')).toBeInTheDocument();
    expect(screen.getByText('Protects new players from death.')).toBeInTheDocument();
  });

  it('renders Loric character name and type in Game Modifiers', () => {
    mockGame = { ...baseGame, activeLoric: ['bigwig'] };
    render(<PlayerListTab scriptCharacterIds={['noble', 'imp', 'fortuneteller']} />);
    expect(screen.getByTestId('modifier-bigwig')).toBeInTheDocument();
    expect(screen.getByText('Big Wig')).toBeInTheDocument();
  });

  it('renders both Fabled and Loric in Game Modifiers', () => {
    mockGame = { ...baseGame, activeFabled: ['angel'], activeLoric: ['bigwig'] };
    render(<PlayerListTab scriptCharacterIds={['noble', 'imp', 'fortuneteller']} />);
    expect(screen.getByTestId('modifier-angel')).toBeInTheDocument();
    expect(screen.getByTestId('modifier-bigwig')).toBeInTheDocument();
  });

  it('renders drag handles for each player row', () => {
    render(<PlayerListTab scriptCharacterIds={['noble', 'imp', 'fortuneteller']} />);
    expect(screen.getByTestId('drag-handle-1')).toBeInTheDocument();
    expect(screen.getByTestId('drag-handle-2')).toBeInTheDocument();
    expect(screen.getByTestId('drag-handle-3')).toBeInTheDocument();
  });

  it('renders an empty header cell for the drag handle column', () => {
    render(<PlayerListTab scriptCharacterIds={['noble', 'imp', 'fortuneteller']} />);
    expect(screen.getAllByRole('columnheader')[0]).toHaveTextContent('');
  });
});
