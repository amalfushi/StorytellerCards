import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { Game, Session, PlayerSeat } from '@/types/index.ts';
import type { GameViewState } from '@/context/GameContext.tsx';
import { Alignment, Phase } from '@/types/index.ts';

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
    seat: 4,
    playerName: 'Diana',
    characterId: 'poisoner',
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
    seat: 5,
    playerName: 'Eve',
    characterId: 'drunk',
    alive: true,
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
  currentDay: 2,
  currentPhase: Phase.Day,
  isFirstNight: false,
  players: mockPlayers,
  nightHistory: [
    {
      dayNumber: 1,
      isFirstNight: true,
      completedAt: '2026-02-15T22:30:00.000Z',
      subActionStates: {},
      notes: {},
      selections: {},
    },
  ],
};

const mockSession: Session = {
  id: 'session-1',
  name: 'Friday Night Game',
  createdAt: '2026-02-15T20:00:00.000Z',
  defaultScriptId: 'boozling',
  defaultPlayers: [],
  gameIds: ['game-1'],
};

// ──────────────────────────────────────────────
// Mocks
// ──────────────────────────────────────────────

let mockGame: Game | null;
let mockShowCharacters: boolean;
let mockNightProgress: GameViewState['nightProgress'];

const mockLoadGame = vi.fn();
const mockUpdatePlayer = vi.fn();
const mockSaveGame = vi.fn();
const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ sessionId: 'session-1', gameId: 'game-1' }),
}));

vi.mock('@/context/SessionContext.tsx', () => ({
  useSession: () => ({
    state: {
      sessions: [mockSession],
      activeSessionId: 'session-1',
      activeGameId: 'game-1',
    },
  }),
}));

vi.mock('@/context/GameContext.tsx', () => ({
  useGame: () => ({
    state: {
      game: mockGame,
      showCharacters: mockShowCharacters,
      nightProgress: mockNightProgress,
    },
    loadGame: mockLoadGame,
    updatePlayer: mockUpdatePlayer,
    saveGame: mockSaveGame,
  }),
}));

vi.mock('@/hooks/useCharacterLookup.ts', () => ({
  useCharacterLookup: () => ({
    getCharacter: (id: string) => ({
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1),
      type: 'Townsfolk',
      defaultAlignment: 'Good',
      abilityShort: 'Test ability',
      firstNight: null,
      otherNights: null,
      reminders: [],
    }),
    getCharactersByIds: (ids: string[]) =>
      ids.map((id) => ({
        id,
        name: id.charAt(0).toUpperCase() + id.slice(1),
        type: 'Townsfolk',
        defaultAlignment: 'Good',
        abilityShort: 'Test ability',
        firstNight: null,
        otherNights: null,
        reminders: [],
      })),
    allCharacters: [],
  }),
}));

vi.mock('@/hooks/useTimer.ts', () => ({
  useTimer: () => ({
    timeRemaining: 0,
    isRunning: false,
    isPaused: false,
    isExpired: false,
    totalDuration: 0,
    start: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    reset: vi.fn(),
    formatTime: () => '00:00',
  }),
}));

// Mock heavy child components to simplify rendering
vi.mock('@/components/common/ShowCharactersToggle.tsx', () => ({
  ShowCharactersToggle: () => <button data-testid="show-chars-toggle">Toggle</button>,
}));

vi.mock('@/components/PhaseBar/PhaseBar.tsx', () => ({
  PhaseBar: () => <div data-testid="phase-bar">PhaseBar</div>,
}));

vi.mock('@/components/TownSquare/TownSquareTab.tsx', () => ({
  TownSquareTab: () => <div data-testid="town-square-tab">Town Square</div>,
}));

vi.mock('@/components/PlayerList/PlayerListTab.tsx', () => ({
  PlayerListTab: () => <div data-testid="player-list-tab">Player List</div>,
}));

vi.mock('@/components/ScriptViewer/ScriptReferenceTab.tsx', () => ({
  ScriptReferenceTab: () => <div data-testid="script-reference-tab">Script Reference</div>,
}));

vi.mock('@/components/NightOrder/NightOrderTab.tsx', () => ({
  NightOrderTab: () => <div data-testid="night-order-tab">Night Order</div>,
}));

vi.mock('@/components/NightPhase/NightPhaseOverlay.tsx', () => ({
  NightPhaseOverlay: () => <div data-testid="night-phase-overlay" />,
}));

vi.mock('@/components/NightHistory/NightHistoryDrawer.tsx', () => ({
  NightHistoryDrawer: ({ open }: { open: boolean }) =>
    open ? <div data-testid="night-history-drawer">History</div> : null,
}));

vi.mock('@/components/CharacterAssignment/CharacterAssignmentDialog.tsx', () => ({
  CharacterAssignmentDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="char-assign-dialog">Assignment</div> : null,
}));

vi.mock('@/components/common/LoadingState.tsx', () => ({
  LoadingState: ({ message }: { message: string }) => (
    <div data-testid="loading-state">{message}</div>
  ),
}));

// ──────────────────────────────────────────────
// Import after mocks
// ──────────────────────────────────────────────

import { GameViewPage } from '@/pages/GameViewPage.tsx';

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe('GameViewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGame = baseGame;
    mockShowCharacters = false;
    mockNightProgress = null;
    // Store game in localStorage so the page can find it
    localStorage.setItem('storyteller-game-game-1', JSON.stringify(baseGame));
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders without crashing', () => {
    const { container } = render(<GameViewPage />);
    expect(container).toBeTruthy();
  });

  it('shows session name and day number in the AppBar', () => {
    render(<GameViewPage />);
    expect(screen.getByText(/Friday Night Game — Day 2/)).toBeInTheDocument();
  });

  it('shows PhaseBar', () => {
    render(<GameViewPage />);
    expect(screen.getByTestId('phase-bar')).toBeInTheDocument();
  });

  it('shows ShowCharactersToggle', () => {
    render(<GameViewPage />);
    expect(screen.getByTestId('show-chars-toggle')).toBeInTheDocument();
  });

  it('shows 4 bottom navigation tabs', () => {
    render(<GameViewPage />);
    expect(screen.getByRole('button', { name: /town square tab/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /players tab/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /script reference tab/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /night order tab/i })).toBeInTheDocument();
  });

  it('shows Town Square tab by default', () => {
    render(<GameViewPage />);
    expect(screen.getByTestId('town-square-tab')).toBeInTheDocument();
  });

  it('switches to Players tab on click', () => {
    render(<GameViewPage />);
    fireEvent.click(screen.getByRole('button', { name: /players tab/i }));
    expect(screen.getByTestId('player-list-tab')).toBeInTheDocument();
    expect(screen.queryByTestId('town-square-tab')).not.toBeInTheDocument();
  });

  it('switches to Script tab on click', () => {
    render(<GameViewPage />);
    fireEvent.click(screen.getByRole('button', { name: /script reference tab/i }));
    expect(screen.getByTestId('script-reference-tab')).toBeInTheDocument();
  });

  it('switches to Night Order tab on click', () => {
    render(<GameViewPage />);
    fireEvent.click(screen.getByRole('button', { name: /night order tab/i }));
    expect(screen.getByTestId('night-order-tab')).toBeInTheDocument();
  });

  it('shows night history button when night history exists', () => {
    render(<GameViewPage />);
    expect(screen.getByRole('button', { name: /night history/i })).toBeInTheDocument();
  });

  it('does not show night history button when no history', () => {
    mockGame = { ...baseGame, nightHistory: [] };
    localStorage.setItem('storyteller-game-game-1', JSON.stringify(mockGame));
    render(<GameViewPage />);
    expect(screen.queryByRole('button', { name: /night history/i })).not.toBeInTheDocument();
  });

  it('shows back to session button', () => {
    render(<GameViewPage />);
    expect(screen.getByRole('button', { name: /back to session/i })).toBeInTheDocument();
  });

  it('shows "Game not found" when game is null and no localStorage data', () => {
    mockGame = null;
    localStorage.removeItem('storyteller-game-game-1');
    render(<GameViewPage />);
    expect(screen.getByText('Game not found')).toBeInTheDocument();
  });

  it('shows character assignment banner when all players have empty characterId', () => {
    const unassignedPlayers = mockPlayers.map((p) => ({
      ...p,
      characterId: '',
    }));
    mockGame = { ...baseGame, players: unassignedPlayers };
    localStorage.setItem('storyteller-game-game-1', JSON.stringify(mockGame));
    render(<GameViewPage />);
    expect(
      screen.getByText(/Characters haven't been assigned yet/),
    ).toBeInTheDocument();
  });

  it('does not show character assignment banner when players have characters', () => {
    render(<GameViewPage />);
    expect(
      screen.queryByText(/Characters haven't been assigned yet/),
    ).not.toBeInTheDocument();
  });
});
