import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { Session } from '@/types/index.ts';

// ──────────────────────────────────────────────
// Mock data
// ──────────────────────────────────────────────

const mockSessions: Session[] = [
  {
    id: 'session-1',
    name: 'Friday Night Game',
    createdAt: '2026-02-15T20:00:00.000Z',
    defaultScriptId: 'boozling',
    defaultPlayers: [
      { seat: 1, playerName: 'Alice' },
      { seat: 2, playerName: 'Bob' },
    ],
    gameIds: ['game-1', 'game-2'],
  },
  {
    id: 'session-2',
    name: 'Saturday Session',
    createdAt: '2026-02-16T14:00:00.000Z',
    defaultScriptId: '',
    defaultPlayers: [{ seat: 1, playerName: 'Charlie' }],
    gameIds: [],
  },
];

// ──────────────────────────────────────────────
// Mocks
// ──────────────────────────────────────────────

const mockCreateSession = vi.fn();
const mockDeleteSession = vi.fn();
const mockNavigate = vi.fn();

let mockSessionState: { sessions: Session[] };

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({}),
  MemoryRouter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

vi.mock('@/context/SessionContext.tsx', () => ({
  useSession: () => ({
    state: mockSessionState,
    createSession: mockCreateSession,
    deleteSession: mockDeleteSession,
  }),
}));

// ──────────────────────────────────────────────
// Import after mocks
// ──────────────────────────────────────────────

import { HomePage } from '@/pages/HomePage.tsx';

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionState = { sessions: [] };
  });

  it('renders without crashing', () => {
    const { container } = render(<HomePage />);
    expect(container).toBeTruthy();
  });

  it('shows the app title in the header', () => {
    render(<HomePage />);
    expect(screen.getByText('Storyteller Cards')).toBeInTheDocument();
  });

  it('shows empty state when no sessions exist', () => {
    render(<HomePage />);
    expect(screen.getByText('No sessions yet')).toBeInTheDocument();
    expect(
      screen.getByText(/Create your first session to start managing/),
    ).toBeInTheDocument();
  });

  it('shows a "Create Session" button in empty state', () => {
    render(<HomePage />);
    expect(screen.getByRole('button', { name: /create session/i })).toBeInTheDocument();
  });

  it('shows list of existing sessions', () => {
    mockSessionState = { sessions: mockSessions };
    render(<HomePage />);
    expect(screen.getByText('Friday Night Game')).toBeInTheDocument();
    expect(screen.getByText('Saturday Session')).toBeInTheDocument();
  });

  it('shows game count for each session', () => {
    mockSessionState = { sessions: mockSessions };
    render(<HomePage />);
    expect(screen.getByText(/2 games/)).toBeInTheDocument();
    expect(screen.getByText(/0 games/)).toBeInTheDocument();
  });

  it('shows FAB when sessions exist', () => {
    mockSessionState = { sessions: mockSessions };
    render(<HomePage />);
    expect(screen.getByRole('button', { name: /create session/i })).toBeInTheDocument();
  });

  it('navigates to session page when a session card is clicked', () => {
    mockSessionState = { sessions: mockSessions };
    render(<HomePage />);
    fireEvent.click(screen.getByText('Friday Night Game'));
    expect(mockNavigate).toHaveBeenCalledWith('/session/session-1');
  });

  it('shows delete button for each session', () => {
    mockSessionState = { sessions: mockSessions };
    render(<HomePage />);
    const deleteButtons = screen.getAllByRole('button', { name: /delete session/i });
    expect(deleteButtons).toHaveLength(2);
  });

  it('calls deleteSession when delete button is clicked', () => {
    mockSessionState = { sessions: mockSessions };
    render(<HomePage />);
    const deleteButtons = screen.getAllByRole('button', { name: /delete session/i });
    fireEvent.click(deleteButtons[0]);
    expect(mockDeleteSession).toHaveBeenCalledWith('session-1');
  });

  it('opens create session dialog from empty state button', () => {
    render(<HomePage />);
    fireEvent.click(screen.getByRole('button', { name: /create session/i }));
    expect(screen.getByText('New Session')).toBeInTheDocument();
    expect(screen.getByLabelText('Session Name')).toBeInTheDocument();
  });

  it('calls createSession when dialog Create button is clicked', () => {
    render(<HomePage />);
    // Open dialog
    fireEvent.click(screen.getByRole('button', { name: /create session/i }));
    // Type a session name
    fireEvent.change(screen.getByLabelText('Session Name'), {
      target: { value: 'My New Game' },
    });
    // Click Create in dialog
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(mockCreateSession).toHaveBeenCalledWith(
      'My New Game',
      '',
      expect.any(Array),
    );
  });

  it('closes dialog when Cancel is clicked', async () => {
    render(<HomePage />);
    fireEvent.click(screen.getByRole('button', { name: /create session/i }));
    expect(screen.getByText('New Session')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    // MUI Dialog uses a transition; wait for the dialog role to be removed from DOM
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
