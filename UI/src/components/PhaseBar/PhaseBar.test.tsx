import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { PhaseBar } from '@/components/PhaseBar/PhaseBar.tsx';
import type { Game } from '@/types/index.ts';
import { Phase, Alignment } from '@/types/index.ts';

// ──────────────────────────────────────────────
// Mock data
// ──────────────────────────────────────────────

const baseGame: Game = {
  id: 'game-1',
  sessionId: 'session-1',
  scriptId: 'boozling',
  currentDay: 1,
  currentPhase: Phase.Day,
  isFirstNight: true,
  players: [
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
  ],
  nightHistory: [],
};

// ──────────────────────────────────────────────
// Mocks
// ──────────────────────────────────────────────

const mockSetPhase = vi.fn();
const mockStartNight = vi.fn();

let mockState: {
  game: Game | null;
  nightProgress: null;
  showCharacters: boolean;
};

vi.mock('@/context/GameContext.tsx', () => ({
  useGame: () => ({
    state: mockState,
    setPhase: mockSetPhase,
    startNight: mockStartNight,
  }),
}));

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe('PhaseBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState = {
      game: baseGame,
      nightProgress: null,
      showCharacters: false,
    };
  });

  it('renders without crashing', () => {
    const { container } = render(<PhaseBar />);
    expect(container).toBeTruthy();
  });

  it('shows Day and Night phase options', () => {
    render(<PhaseBar />);
    expect(screen.getByText('Day')).toBeInTheDocument();
    expect(screen.getByText('Night')).toBeInTheDocument();
  });

  it('has navigation role', () => {
    render(<PhaseBar />);
    expect(screen.getByRole('navigation', { name: 'Game phase selector' })).toBeInTheDocument();
  });

  it('shows confirmation dialog when clicking Night chip during Day phase', async () => {
    render(<PhaseBar />);
    const nightChip = screen.getByText('Night');
    await userEvent.click(nightChip);
    // Confirmation dialog should appear
    expect(screen.getByText('Change Phase')).toBeInTheDocument();
    expect(screen.getByText(/Advance from/)).toBeInTheDocument();
    expect(screen.getByText(/This will start the night phase/)).toBeInTheDocument();
  });

  it('calls setPhase and startNight after confirming phase change to Night', async () => {
    render(<PhaseBar />);
    // Click Night chip
    await userEvent.click(screen.getByText('Night'));
    // Confirm in dialog
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(mockSetPhase).toHaveBeenCalledWith(Phase.Night);
    expect(mockStartNight).toHaveBeenCalledWith(0);
  });

  it('does not change phase when Cancel is clicked', async () => {
    render(<PhaseBar />);
    // Click Night chip
    await userEvent.click(screen.getByText('Night'));
    // Cancel
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(mockSetPhase).not.toHaveBeenCalled();
    expect(mockStartNight).not.toHaveBeenCalled();
  });

  it('does nothing when clicking the currently active phase', async () => {
    render(<PhaseBar />);
    // Click Day chip when already in Day phase
    await userEvent.click(screen.getByText('Day'));
    // No dialog should appear
    expect(screen.queryByText('Change Phase')).not.toBeInTheDocument();
    expect(mockSetPhase).not.toHaveBeenCalled();
  });

  it('blocks Night → Day transition (requires Complete Night flow)', async () => {
    mockState = {
      ...mockState,
      game: { ...baseGame, currentPhase: Phase.Night },
    };
    render(<PhaseBar />);
    // Click Day chip when in Night phase
    await userEvent.click(screen.getByText('Day'));
    // Should not show confirmation dialog
    expect(screen.queryByText('Change Phase')).not.toBeInTheDocument();
    expect(mockSetPhase).not.toHaveBeenCalled();
  });

  it('handles null game gracefully (defaults to Day phase)', () => {
    mockState = { game: null, nightProgress: null, showCharacters: false };
    render(<PhaseBar />);
    // Should render Day and Night chips without crashing
    expect(screen.getByText('Day')).toBeInTheDocument();
    expect(screen.getByText('Night')).toBeInTheDocument();
  });
});
