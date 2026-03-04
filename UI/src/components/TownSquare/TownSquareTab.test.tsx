import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TownSquareTab } from '@/components/TownSquare/TownSquareTab.tsx';
import { GameProvider } from '@/context/GameContext.tsx';
import type { Game, PlayerSeat } from '@/types/index.ts';
import { Phase, Alignment } from '@/types/index.ts';

// ──────────────────────────────────────────────
// Mock heavy child components
// ──────────────────────────────────────────────

vi.mock('@/components/TownSquare/PlayerToken.tsx', () => ({
  PlayerToken: ({
    player,
    showCharacters,
    onClick,
  }: {
    player: PlayerSeat;
    showCharacters: boolean;
    onClick: (e: React.MouseEvent<HTMLElement>) => void;
  }) => (
    <div
      data-testid={`player-token-${player.seat}`}
      data-show-characters={showCharacters}
      onClick={onClick}
    >
      {player.playerName}
    </div>
  ),
}));

vi.mock('@/components/TownSquare/TownSquareLayout.tsx', () => ({
  TownSquareLayout: ({
    players,
    renderToken,
    containerWidth,
    containerHeight,
  }: {
    players: PlayerSeat[];
    renderToken: (player: PlayerSeat, pos: { x: number; y: number; angle: number }) => React.ReactNode;
    containerWidth: number;
    containerHeight: number;
  }) => (
    <div data-testid="town-square-layout">
      {players.map((p) => (
        <div key={p.seat}>{renderToken(p, { x: 100, y: 100, angle: 0 })}</div>
      ))}
    </div>
  ),
}));

vi.mock('@/components/TownSquare/PlayerQuickActions.tsx', () => ({
  PlayerQuickActions: ({ anchorEl, player }: { anchorEl: HTMLElement | null; player: PlayerSeat | null }) =>
    anchorEl && player ? (
      <div data-testid="player-quick-actions">{player.playerName}</div>
    ) : null,
}));

vi.mock('@/components/TownSquare/AddTravellerDialog.tsx', () => ({
  AddTravellerDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="add-traveller-dialog">Add Traveller Dialog</div> : null,
}));

vi.mock('@/components/TownSquare/TokenManager.tsx', () => ({
  TokenManager: ({ open }: { open: boolean }) =>
    open ? <div data-testid="token-manager">Token Manager</div> : null,
  TokenBadges: () => null,
}));

vi.mock('@/components/PlayerList/PlayerEditDialog.tsx', () => ({
  PlayerEditDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="player-edit-dialog">Player Edit Dialog</div> : null,
}));

vi.mock('@/components/Timer/DayTimerFab.tsx', () => ({
  DayTimerFab: () => <div data-testid="day-timer-fab">Timer FAB</div>,
}));

vi.mock('@/utils/audioAlarm.ts', () => ({
  playAlarmBeeps: vi.fn(() => ({ stop: vi.fn() })),
}));

// ──────────────────────────────────────────────
// Mock ResizeObserver
// ──────────────────────────────────────────────

const mockResizeObserver = vi.fn().mockImplementation(function MockResizeObserver(
  this: { observe: ReturnType<typeof vi.fn>; unobserve: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> },
  callback: ResizeObserverCallback,
) {
  this.observe = vi.fn((element: Element) => {
    // Immediately call with fake dimensions
    callback(
      [
        {
          target: element,
          contentRect: { width: 360, height: 500, top: 0, left: 0, bottom: 500, right: 360, x: 0, y: 0, toJSON: () => ({}) },
          borderBoxSize: [],
          contentBoxSize: [],
          devicePixelContentBoxSize: [],
        },
      ],
      this as unknown as ResizeObserver,
    );
  });
  this.unobserve = vi.fn();
  this.disconnect = vi.fn();
});

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

const mockGame: Game = {
  id: 'game-1',
  sessionId: 'session-1',
  scriptId: 'boozling',
  currentDay: 1,
  currentPhase: Phase.Day,
  isFirstNight: false,
  players: mockPlayers,
  nightHistory: [],
};

// ──────────────────────────────────────────────
// Helper
// ──────────────────────────────────────────────

function renderWithGameContext(
  ui: React.ReactElement,
  game: Game = mockGame,
) {
  return render(
    <GameProvider>
      {/* We need to load the game into context — done via preloading localStorage */}
      {ui}
    </GameProvider>,
  );
}

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe('TownSquareTab', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', mockResizeObserver);
    // Preload game into localStorage
    localStorage.setItem(
      `storyteller-game-${mockGame.id}`,
      JSON.stringify(mockGame),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('renders without crashing', () => {
    const { container } = renderWithGameContext(
      <TownSquareTab scriptCharacterIds={['noble', 'imp', 'fortuneteller']} />,
    );
    expect(container).toBeTruthy();
  });

  it('has "add traveller" FAB button', () => {
    renderWithGameContext(
      <TownSquareTab scriptCharacterIds={['noble', 'imp', 'fortuneteller']} />,
    );
    expect(screen.getByLabelText('add traveller')).toBeInTheDocument();
  });

  it('clicking add traveller button opens AddTravellerDialog', () => {
    renderWithGameContext(
      <TownSquareTab scriptCharacterIds={['noble', 'imp', 'fortuneteller']} />,
    );
    fireEvent.click(screen.getByLabelText('add traveller'));
    expect(screen.getByTestId('add-traveller-dialog')).toBeInTheDocument();
  });

  it('renders with no players when game is null', () => {
    const { container } = render(
      <GameProvider>
        <TownSquareTab scriptCharacterIds={[]} />
      </GameProvider>,
    );
    expect(container).toBeTruthy();
  });
});
