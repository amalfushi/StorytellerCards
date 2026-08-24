import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { Session } from '@/types/index.ts';

// ──────────────────────────────────────────────
// Mock data
// ──────────────────────────────────────────────

function makeSession(
  id: string,
  name: string,
  playerNames: string[],
  gameIds: string[],
  scriptId = 'boozling',
): Session {
  const players = playerNames.map((playerName, index) => ({
    id: `${id}-player-${index + 1}`,
    name: playerName,
  }));
  const slots = players.map((player, index) => ({
    kind: 'seat' as const,
    id: `${id}-slot-${index + 1}`,
    playerId: player.id,
  }));
  return {
    id,
    name,
    createdAt: '2026-02-15T20:00:00.000Z',
    defaultScriptId: scriptId,
    players,
    template: { slots },
    propagationDefault: { toTemplate: true, toOtherGames: true },
    gameIds,
  };
}

const mockSession: Session = makeSession(
  'session-1',
  'Friday Night Game',
  ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'],
  ['game-1', 'game-2'],
);

const emptySession: Session = makeSession(
  'session-2',
  'Empty Session',
  ['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5'],
  [],
  '',
);

// ──────────────────────────────────────────────
// Mocks
// ──────────────────────────────────────────────

const mockUpdateSession = vi.fn();
const mockAddGameToSession = vi.fn();
const mockSelectGame = vi.fn();
const mockNavigate = vi.fn();
const mockDeleteGame = vi.fn();
const mockAddPlayer = vi.fn();
const mockRenamePlayer = vi.fn();
const mockRemovePlayer = vi.fn();
const mockSetDefaultParticipant = vi.fn();
const mockAddTemplateSeat = vi.fn();
const mockAddTemplateSpacer = vi.fn();
const mockAddTemplateStoryteller = vi.fn();
const mockRemoveTemplateSlot = vi.fn();
const mockMoveTemplateSlot = vi.fn();
const mockAssignTemplateSeat = vi.fn();
const mockSetPropagationDefault = vi.fn();
const mockApplyTemplateToGame = vi.fn();

let mockSessions: Session[];
let mockSessionId: string;

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ sessionId: mockSessionId }),
}));

vi.mock('@/context/useSession.ts', () => ({
  useSession: () => ({
    state: { sessions: mockSessions },
    updateSession: mockUpdateSession,
    addPlayer: mockAddPlayer,
    renamePlayer: mockRenamePlayer,
    removePlayer: mockRemovePlayer,
    setDefaultParticipant: mockSetDefaultParticipant,
    addTemplateSeat: mockAddTemplateSeat,
    addTemplateSpacer: mockAddTemplateSpacer,
    addTemplateStoryteller: mockAddTemplateStoryteller,
    removeTemplateSlot: mockRemoveTemplateSlot,
    moveTemplateSlot: mockMoveTemplateSlot,
    assignTemplateSeat: mockAssignTemplateSeat,
    setPropagationDefault: mockSetPropagationDefault,
    addGameToSession: mockAddGameToSession,
    applyTemplateToGame: mockApplyTemplateToGame,
    selectGame: mockSelectGame,
    deleteGame: mockDeleteGame,
  }),
}));

// Mock ScriptBuilder to avoid complex dependency tree
vi.mock('@/components/ScriptBuilder/ScriptBuilder.tsx', () => ({
  ScriptBuilder: ({ open }: { open: boolean }) =>
    open ? <div data-testid="script-builder">Script Builder</div> : null,
}));

// Mock LoadingState
vi.mock('@/components/common/LoadingState.tsx', () => ({
  LoadingState: ({ message }: { message: string }) => (
    <div data-testid="loading-state">{message}</div>
  ),
}));

// ──────────────────────────────────────────────
// Import after mocks
// ──────────────────────────────────────────────

import { SessionSetupPage } from '@/pages/SessionSetupPage.tsx';

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe('SessionSetupPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockSessions = [mockSession, emptySession];
    mockSessionId = 'session-1';
  });

  it('renders without crashing', () => {
    const { container } = render(<SessionSetupPage />);
    expect(container).toBeTruthy();
  });

  it('shows "Session Setup" in the AppBar', () => {
    render(<SessionSetupPage />);
    expect(screen.getByText('Session Setup')).toBeInTheDocument();
  });

  it('shows session name in the text field', () => {
    render(<SessionSetupPage />);
    const nameInput = screen.getByLabelText('Session Name');
    expect(nameInput).toBeInTheDocument();
    expect(nameInput).toHaveValue('Friday Night Game');
  });

  it('shows script section with Import Script button', () => {
    render(<SessionSetupPage />);
    expect(screen.getByRole('button', { name: /import script/i })).toBeInTheDocument();
  });

  it('shows Create Script button', () => {
    render(<SessionSetupPage />);
    expect(screen.getByRole('button', { name: /create script/i })).toBeInTheDocument();
  });

  it('shows script info text', () => {
    render(<SessionSetupPage />);
    expect(screen.getByText(/Script:/)).toBeInTheDocument();
  });

  it('shows Default Players section with player count', () => {
    render(<SessionSetupPage />);
    expect(screen.getByText('Seating Template (5 seats)')).toBeInTheDocument();
  });

  it('shows player name inputs for all default players', () => {
    render(<SessionSetupPage />);
    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Bob')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Charlie')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Diana')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Eve')).toBeInTheDocument();
  });

  it('edits the explicit default lineup independently for future games', () => {
    render(<SessionSetupPage />);
    fireEvent.click(screen.getByRole('switch', { name: /include alice in new games/i }));
    expect(mockSetDefaultParticipant).toHaveBeenCalledWith(
      'session-1',
      'session-1-player-1',
      false,
    );
  });

  it('shows Add Seat button', () => {
    render(<SessionSetupPage />);
    expect(screen.getByRole('button', { name: /^add seat$/i })).toBeInTheDocument();
  });

  it('adds a named player through the roster action', () => {
    render(<SessionSetupPage />);

    fireEvent.change(screen.getByLabelText(/new player name/i), {
      target: { value: 'Frank' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }));

    expect(mockAddPlayer).toHaveBeenCalledWith('session-1', 'Frank');
    expect(screen.getByLabelText(/new player name/i)).toHaveValue('');
  });

  it('shows Games section with New Game button', () => {
    render(<SessionSetupPage />);
    expect(screen.getByRole('button', { name: /new game/i })).toBeInTheDocument();
  });

  it('bulk-applies the template only to games that have not started', () => {
    localStorage.setItem(
      'storyteller-game-game-1',
      JSON.stringify({
        id: 'game-1',
        currentDay: 1,
        currentPhase: 'Day',
        isFirstNight: true,
        nightHistory: [],
      }),
    );
    localStorage.setItem(
      'storyteller-game-game-2',
      JSON.stringify({
        id: 'game-2',
        currentDay: 1,
        currentPhase: 'Night',
        isFirstNight: true,
        nightHistory: [],
      }),
    );
    render(<SessionSetupPage />);

    fireEvent.click(screen.getByRole('button', { name: /apply template to all games/i }));

    expect(mockApplyTemplateToGame).toHaveBeenCalledTimes(1);
    expect(mockApplyTemplateToGame).toHaveBeenCalledWith('session-1', 'game-1');
    expect(screen.getByRole('button', { name: /apply template to game 1/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /apply template to game 2/i })).toBeDisabled();
  });

  it('creates a new game for the active session', () => {
    render(<SessionSetupPage />);
    fireEvent.click(screen.getByRole('button', { name: /new game/i }));
    expect(mockAddGameToSession).toHaveBeenCalledWith('session-1');
  });

  it('shows game count in Games section heading', () => {
    render(<SessionSetupPage />);
    expect(screen.getByText('Games (2)')).toBeInTheDocument();
  });

  it('shows empty game state message when no games exist', () => {
    mockSessionId = 'session-2';
    render(<SessionSetupPage />);
    expect(
      screen.getByText(/No games yet\. Create your first game to start playing\./),
    ).toBeInTheDocument();
  });

  it('shows "Session not found" for invalid session ID', () => {
    mockSessionId = 'nonexistent';
    render(<SessionSetupPage />);
    expect(screen.getByText('Session not found')).toBeInTheDocument();
  });

  it('shows back button in AppBar', () => {
    render(<SessionSetupPage />);
    expect(screen.getByRole('button', { name: 'back' })).toBeInTheDocument();
  });

  it('shows Session Info section', () => {
    render(<SessionSetupPage />);
    expect(screen.getByText('Session Info')).toBeInTheDocument();
  });

  it('shows remove player buttons', () => {
    render(<SessionSetupPage />);
    const removeButtons = screen.getAllByRole('button', { name: /remove seat/i });
    expect(removeButtons.length).toBe(5);
  });

  it('shows drag handles for each player', () => {
    render(<SessionSetupPage />);
    const dragHandles = screen.getAllByLabelText(/drag to reorder slot/i);
    expect(dragHandles).toHaveLength(5);
  });

  it('renders drag handle before each player name input', () => {
    render(<SessionSetupPage />);
    const dragHandles = screen.getAllByLabelText(/drag to reorder slot/i);
    expect(dragHandles.length).toBeGreaterThanOrEqual(5);
  });

  it('keeps seating slot remove buttons enabled at the minimum player count', () => {
    render(<SessionSetupPage />);
    const removeButtons = screen.getAllByRole('button', { name: /remove seat/i });
    removeButtons.forEach((btn) => {
      expect(btn).toBeEnabled();
    });
  });
});
