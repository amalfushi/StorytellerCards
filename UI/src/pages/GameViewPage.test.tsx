import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import type { Game, Session, PlayerGameState } from '@/types/index.ts';
import type { GameViewState } from '@/context/GameContext.tsx';
import { Alignment, Phase } from '@/types/index.ts';

const sessionPlayers = [
  { id: 'player-1', name: 'Alice' },
  { id: 'player-2', name: 'Bob' },
  { id: 'player-3', name: 'Charlie' },
  { id: 'player-4', name: 'Diana' },
  { id: 'player-5', name: 'Eve' },
];
const slots = sessionPlayers.map((player, index) => ({
  kind: 'seat' as const,
  id: `slot-${index + 1}`,
  playerId: player.id,
}));
const participants = sessionPlayers.map((player) => ({ playerId: player.id, isTraveller: false }));

function makePlayerState(characterId: string, alignment: Alignment): PlayerGameState {
  return {
    characterId,
    alive: true,
    ghostVoteUsed: false,
    visibleAlignment: Alignment.Unknown,
    actualAlignment: alignment,
    startingAlignment: alignment,
    activeReminders: [],
    tokens: [],
  };
}

const playerState: Record<string, PlayerGameState> = {
  'player-1': makePlayerState('noble', Alignment.Good),
  'player-2': makePlayerState('imp', Alignment.Evil),
  'player-3': makePlayerState('fortuneteller', Alignment.Good),
  'player-4': makePlayerState('poisoner', Alignment.Evil),
  'player-5': makePlayerState('drunk', Alignment.Good),
};

const baseGame: Game = {
  id: 'game-1',
  sessionId: 'session-1',
  scriptId: 'boozling',
  currentDay: 2,
  currentPhase: Phase.Day,
  isFirstNight: false,
  slots,
  participants,
  playerState,
  playerCountOverride: null,
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
  players: sessionPlayers,
  template: { slots },
  propagationDefault: { toTemplate: true, toOtherGames: true },
  gameIds: ['game-1'],
};

let mockGame: Game | null;
let mockShowCharacters: boolean;
let mockNightProgress: GameViewState['nightProgress'];
let capturedPhaseBarProps: {
  activeView: string;
  nightInProgress: boolean;
  onDayClick: () => void;
  onNightClick: () => void;
} | null = null;

const mockLoadGame = vi.fn();
const mockSetPhase = vi.fn();
const mockNavigate = vi.fn();
const mockUpdatePlayerState = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ sessionId: 'session-1', gameId: 'game-1' }),
}));

vi.mock('@/context/useSession.ts', () => ({
  useSession: () => ({
    state: { sessions: [mockSession], activeSessionId: 'session-1', activeGameId: 'game-1' },
    addPlayer: vi.fn((sessionId: string, name: string) => ({ id: `${sessionId}-${name}`, name })),
  }),
}));

vi.mock('@/context/useGame.ts', () => ({
  useGame: () => ({
    state: { game: mockGame, showCharacters: mockShowCharacters, nightProgress: mockNightProgress },
    loadGame: mockLoadGame,
    updatePlayerState: mockUpdatePlayerState,
    addParticipant: vi.fn(),
    setParticipantTraveller: vi.fn(),
    addGameSeat: vi.fn(() => 'new-slot'),
    assignGameSeat: vi.fn(),
    saveGame: vi.fn(),
    setPhase: mockSetPhase,
    setInPlayCharacters: vi.fn(),
    setDemonBluffs: vi.fn(),
    setLunaticBluffs: vi.fn(),
    setPlayerBluffs: vi.fn(),
    setApparentCharacter: vi.fn(),
    setPlayerCountOverride: vi.fn(),
    addToken: vi.fn(),
    removeToken: vi.fn(),
  }),
}));

vi.mock('@/hooks/useApiSync.ts', () => ({
  useApiSync: () => ({ fetchGame: vi.fn(async () => null), fetchScript: vi.fn(async () => null) }),
}));

vi.mock('@/hooks/useCharacterLookup.ts', () => ({
  useCharacterLookup: () => ({
    getCharacter: (id: string) => ({
      id,
      name: id,
      type: 'Townsfolk',
      defaultAlignment: 'Good',
      abilityShort: 'Test',
      firstNight: null,
      otherNights: null,
      reminders: [],
    }),
    getCharactersByIds: (ids: string[]) =>
      ids.map((id) => ({
        id,
        name: id,
        type: 'Townsfolk',
        defaultAlignment: 'Good',
        abilityShort: 'Test',
        firstNight: null,
        otherNights: null,
        reminders: [],
      })),
    allCharacters: [],
  }),
}));
vi.mock('@/hooks/useNightOrder.ts', () => ({ useNightOrder: () => [] }));
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

vi.mock('@/components/common/ShowCharactersToggle.tsx', () => ({
  ShowCharactersToggle: () => <button data-testid="show-chars-toggle">Toggle</button>,
}));
vi.mock('@/components/PhaseBar/PhaseBar.tsx', () => ({
  PhaseBar: (
    props: typeof capturedPhaseBarProps & { onDayClick: () => void; onNightClick: () => void },
  ) => {
    capturedPhaseBarProps = props;
    return (
      <div data-testid="phase-bar">
        <button data-testid="night-chip" onClick={props.onNightClick}>
          Night
        </button>
        <button data-testid="day-chip" onClick={props.onDayClick}>
          Day
        </button>
      </div>
    );
  },
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
vi.mock('@/components/NightPhase/NightTabPanel.tsx', () => ({
  NightTabPanel: ({ onComplete }: { onComplete?: () => void }) => (
    <div data-testid="night-tab-panel">
      <button data-testid="complete-night-btn" onClick={onComplete}>
        Complete Night
      </button>
    </div>
  ),
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
vi.mock('@/components/Timer/DayTimerFab.tsx', () => ({
  DayTimerFab: () => <div data-testid="day-timer-fab">Timer FAB</div>,
}));
vi.mock('@/components/NightPhase/NightChoiceSelector.tsx', () => ({
  NightChoiceSelector: () => null,
}));
vi.mock('@/components/Setup/CharacterSelection.tsx', () => ({ CharacterSelection: () => null }));
vi.mock('@/components/Setup/DemonBluffSelection.tsx', () => ({ DemonBluffSelection: () => null }));
vi.mock('@/components/Setup/SetupChecklist.tsx', () => ({ SetupChecklist: () => null }));

import { GameViewPage } from '@/pages/GameViewPage.tsx';

describe('GameViewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedPhaseBarProps = null;
    mockGame = baseGame;
    mockShowCharacters = false;
    mockNightProgress = null;
    localStorage.setItem('storyteller-game-game-1', JSON.stringify(baseGame));
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders the session title and day number', () => {
    render(<GameViewPage />);
    expect(screen.getByText(/Friday Night Game — Day 2/)).toBeInTheDocument();
    expect(screen.getByTestId('phase-bar')).toBeInTheDocument();
    expect(screen.getByTestId('show-chars-toggle')).toBeInTheDocument();
  });

  it('shows day navigation tabs and switches between them', () => {
    render(<GameViewPage />);
    expect(screen.getByTestId('town-square-tab')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /players tab/i }));
    expect(screen.getByTestId('player-list-tab')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /script reference tab/i }));
    expect(screen.getByTestId('script-reference-tab')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /night order tab/i }));
    expect(screen.getByTestId('night-order-tab')).toBeInTheDocument();
  });

  it('shows night history controls only when history exists', () => {
    render(<GameViewPage />);
    expect(screen.getByRole('button', { name: /night history/i })).toBeInTheDocument();

    cleanup();
    localStorage.clear();
    mockGame = { ...baseGame, nightHistory: [] };
    localStorage.setItem('storyteller-game-game-1', JSON.stringify(mockGame));
    render(<GameViewPage />);
    expect(screen.queryByRole('button', { name: /night history/i })).not.toBeInTheDocument();
  });

  it('shows Game not found when no context or localStorage game exists', () => {
    mockGame = null;
    localStorage.clear();
    render(<GameViewPage />);
    expect(screen.getByText('Game not found')).toBeInTheDocument();
  });

  it('shows character assignment banner when playerState has no characters', () => {
    const unassignedPlayerState = Object.fromEntries(
      Object.entries(playerState).map(([playerId, state]) => [
        playerId,
        { ...state, characterId: '' },
      ]),
    );
    mockGame = { ...baseGame, playerState: unassignedPlayerState };
    localStorage.setItem('storyteller-game-game-1', JSON.stringify(mockGame));

    render(<GameViewPage />);

    expect(screen.getByText(/Characters haven't been assigned yet/)).toBeInTheDocument();
  });

  it('switches between day and night views using PhaseBar callbacks', () => {
    render(<GameViewPage />);
    expect(capturedPhaseBarProps?.activeView).toBe('Day');

    fireEvent.click(screen.getByTestId('night-chip'));
    expect(screen.getByTestId('night-tab-panel')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /town square tab/i })).not.toBeInTheDocument();
    expect(capturedPhaseBarProps?.activeView).toBe('Night');

    fireEvent.click(screen.getByTestId('day-chip'));
    expect(screen.getByTestId('town-square-tab')).toBeInTheDocument();
  });

  it('passes night progress state to PhaseBar and exits night view on completion', () => {
    mockNightProgress = {
      currentCardIndex: 0,
      totalCards: 1,
      subActionStates: {},
      notes: {},
      selections: {},
    };
    render(<GameViewPage />);
    expect(capturedPhaseBarProps?.nightInProgress).toBe(true);

    fireEvent.click(screen.getByTestId('night-chip'));
    fireEvent.click(screen.getByTestId('complete-night-btn'));
    expect(screen.getByTestId('town-square-tab')).toBeInTheDocument();
  });

  it('navigates back to the session setup page', () => {
    render(<GameViewPage />);
    fireEvent.click(screen.getByRole('button', { name: /back to session/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/session/session-1');
  });
});
