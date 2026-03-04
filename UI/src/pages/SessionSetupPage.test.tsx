import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Session } from '@/types/index.ts';

// ──────────────────────────────────────────────
// Mock data
// ──────────────────────────────────────────────

const mockSession: Session = {
  id: 'session-1',
  name: 'Friday Night Game',
  createdAt: '2026-02-15T20:00:00.000Z',
  defaultScriptId: 'boozling',
  defaultPlayers: [
    { seat: 1, playerName: 'Alice' },
    { seat: 2, playerName: 'Bob' },
    { seat: 3, playerName: 'Charlie' },
    { seat: 4, playerName: 'Diana' },
    { seat: 5, playerName: 'Eve' },
  ],
  gameIds: ['game-1', 'game-2'],
};

const emptySession: Session = {
  id: 'session-2',
  name: 'Empty Session',
  createdAt: '2026-02-16T14:00:00.000Z',
  defaultScriptId: '',
  defaultPlayers: [
    { seat: 1, playerName: 'Player 1' },
    { seat: 2, playerName: 'Player 2' },
    { seat: 3, playerName: 'Player 3' },
    { seat: 4, playerName: 'Player 4' },
    { seat: 5, playerName: 'Player 5' },
  ],
  gameIds: [],
};

// ──────────────────────────────────────────────
// Mocks
// ──────────────────────────────────────────────

const mockUpdateSession = vi.fn();
const mockAddGameToSession = vi.fn();
const mockSelectGame = vi.fn();
const mockNavigate = vi.fn();

let mockSessions: Session[];
let mockSessionId: string;

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ sessionId: mockSessionId }),
}));

vi.mock('@/context/SessionContext.tsx', () => ({
  useSession: () => ({
    state: { sessions: mockSessions },
    updateSession: mockUpdateSession,
    addGameToSession: mockAddGameToSession,
    selectGame: mockSelectGame,
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
    expect(screen.getByText('Default Players (5)')).toBeInTheDocument();
  });

  it('shows player name inputs for all default players', () => {
    render(<SessionSetupPage />);
    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Bob')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Charlie')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Diana')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Eve')).toBeInTheDocument();
  });

  it('shows Add Player button', () => {
    render(<SessionSetupPage />);
    expect(screen.getByRole('button', { name: /add player/i })).toBeInTheDocument();
  });

  it('shows Games section with New Game button', () => {
    render(<SessionSetupPage />);
    expect(screen.getByRole('button', { name: /new game/i })).toBeInTheDocument();
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
    const removeButtons = screen.getAllByRole('button', { name: /remove player/i });
    expect(removeButtons.length).toBe(5);
  });

  it('disables remove player buttons when at minimum player count (5)', () => {
    render(<SessionSetupPage />);
    const removeButtons = screen.getAllByRole('button', { name: /remove player/i });
    removeButtons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });
});
