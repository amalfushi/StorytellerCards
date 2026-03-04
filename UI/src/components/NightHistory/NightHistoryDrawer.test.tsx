import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { NightHistoryDrawer } from '@/components/NightHistory/NightHistoryDrawer.tsx';
import type { Game, NightHistoryEntry } from '@/types/index.ts';
import { Alignment } from '@/types/index.ts';

// ──────────────────────────────────────────────
// Mock data
// ──────────────────────────────────────────────

const mockNightHistory: NightHistoryEntry[] = [
  {
    dayNumber: 1,
    isFirstNight: true,
    completedAt: '2026-02-15T22:30:00.000Z',
    subActionStates: {
      noble: [true, true],
      fortuneteller: [true, true],
    },
    notes: {
      noble: 'Shown Alice, Bob, Charlie — one is evil.',
    },
    selections: {},
  },
  {
    dayNumber: 2,
    isFirstNight: false,
    completedAt: '2026-02-15T23:15:00.000Z',
    subActionStates: {
      fortuneteller: [true, true],
      imp: [true],
    },
    notes: {},
    selections: {},
  },
  {
    dayNumber: 3,
    isFirstNight: false,
    completedAt: '2026-02-16T00:05:00.000Z',
    subActionStates: {
      fortuneteller: [true, false],
      imp: [true],
    },
    notes: {
      imp: 'Killed Diana.',
    },
    selections: {},
  },
];

const baseGame: Game = {
  id: 'game-1',
  sessionId: 'session-1',
  scriptId: 'boozling',
  currentDay: 4,
  currentPhase: 'Day',
  isFirstNight: false,
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
  nightHistory: mockNightHistory,
};

// ──────────────────────────────────────────────
// Mocks
// ──────────────────────────────────────────────

const mockUpdateNightHistory = vi.fn();

let mockState: {
  game: Game | null;
  nightProgress: null;
  showCharacters: boolean;
};

vi.mock('@/context/GameContext.tsx', () => ({
  useGame: () => ({
    state: mockState,
    updateNightHistory: mockUpdateNightHistory,
  }),
}));

// Mock NightHistoryReview to avoid deep rendering
vi.mock('./NightHistoryReview.tsx', () => ({
  NightHistoryReview: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? (
      <div data-testid="night-history-review">
        <button onClick={onClose}>Close Review</button>
      </div>
    ) : null,
}));

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe('NightHistoryDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState = {
      game: baseGame,
      nightProgress: null,
      showCharacters: false,
    };
  });

  it('renders without crashing', () => {
    const { container } = render(
      <NightHistoryDrawer open={false} onClose={vi.fn()} />,
    );
    expect(container).toBeTruthy();
  });

  it('shows drawer when open prop is true', () => {
    render(<NightHistoryDrawer open={true} onClose={vi.fn()} />);
    expect(screen.getByText('📜 Night History')).toBeInTheDocument();
  });

  it('hides content when open is false', () => {
    render(<NightHistoryDrawer open={false} onClose={vi.fn()} />);
    // MUI Drawer does not render children when open=false
    expect(screen.queryByText('📜 Night History')).not.toBeInTheDocument();
  });

  it('displays list of completed nights from game history', () => {
    render(<NightHistoryDrawer open={true} onClose={vi.fn()} />);
    expect(screen.getByText('Night 1 — First Night')).toBeInTheDocument();
    expect(screen.getByText('Night 2')).toBeInTheDocument();
    expect(screen.getByText('Night 3')).toBeInTheDocument();
  });

  it('shows night number and type (First Night vs Night X)', () => {
    render(<NightHistoryDrawer open={true} onClose={vi.fn()} />);
    // First entry is a first night
    expect(screen.getByText('Night 1 — First Night')).toBeInTheDocument();
    // Second entry is an other night (no "First Night" suffix)
    expect(screen.getByText('Night 2')).toBeInTheDocument();
  });

  it('has close button that calls onClose', async () => {
    const onClose = vi.fn();
    render(<NightHistoryDrawer open={true} onClose={onClose} />);
    // Find close icon button
    const closeButton = screen.getByTestId('CloseIcon').closest('button')!;
    await userEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('has edit icon on each entry', () => {
    render(<NightHistoryDrawer open={true} onClose={vi.fn()} />);
    const editIcons = screen.getAllByTestId('EditIcon');
    expect(editIcons).toHaveLength(3);
  });

  it('shows "No nights completed yet" message when nightHistory is empty', () => {
    mockState = {
      ...mockState,
      game: { ...baseGame, nightHistory: [] },
    };
    render(<NightHistoryDrawer open={true} onClose={vi.fn()} />);
    expect(screen.getByText('No nights completed yet')).toBeInTheDocument();
  });

  it('shows empty message when game is null', () => {
    mockState = { game: null, nightProgress: null, showCharacters: false };
    render(<NightHistoryDrawer open={true} onClose={vi.fn()} />);
    expect(screen.getByText('No nights completed yet')).toBeInTheDocument();
  });

  it('shows sub-action completion counts', () => {
    render(<NightHistoryDrawer open={true} onClose={vi.fn()} />);
    // Night 1: noble [true,true] + fortuneteller [true,true] = 4/4
    expect(screen.getByText('4/4 sub-actions completed')).toBeInTheDocument();
    // Night 2: fortuneteller [true,true] + imp [true] = 3/3
    expect(screen.getByText('3/3 sub-actions completed')).toBeInTheDocument();
    // Night 3: fortuneteller [true,false] + imp [true] = 2/3
    expect(screen.getByText('2/3 sub-actions completed')).toBeInTheDocument();
  });

  it('opens review overlay when a night entry is clicked', async () => {
    render(<NightHistoryDrawer open={true} onClose={vi.fn()} />);
    const firstEntry = screen.getByText('Night 1 — First Night');
    await userEvent.click(firstEntry);
    expect(screen.getByTestId('night-history-review')).toBeInTheDocument();
  });

  it('closes review overlay when close is called', async () => {
    render(<NightHistoryDrawer open={true} onClose={vi.fn()} />);
    // Open review
    await userEvent.click(screen.getByText('Night 1 — First Night'));
    expect(screen.getByTestId('night-history-review')).toBeInTheDocument();
    // Close review
    await userEvent.click(screen.getByText('Close Review'));
    expect(screen.queryByTestId('night-history-review')).not.toBeInTheDocument();
  });
});
