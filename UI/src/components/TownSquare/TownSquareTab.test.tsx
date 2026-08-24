import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TownSquareTab } from '@/components/TownSquare/TownSquareTab.tsx';
import type { Game, Player, PlayerGameState, PlayerId, Slot } from '@/types/index.ts';
import { Alignment, Phase } from '@/types/index.ts';
import type { TownSquarePlayer } from '@/components/TownSquare/PlayerToken.tsx';

vi.mock('@/components/TownSquare/PlayerToken.tsx', () => ({
  PlayerToken: ({
    player,
    showCharacters,
    onClick,
  }: {
    player: TownSquarePlayer;
    showCharacters: boolean;
    onClick: (event: React.MouseEvent<HTMLElement>) => void;
  }) => (
    <button
      data-testid={`player-token-${player.seatNumber}`}
      data-show-characters={showCharacters}
      onClick={onClick}
    >
      {player.name}
    </button>
  ),
  SIZE_MAP: {
    large: { width: 80, height: 120, icon: 56, nameFont: '0.91rem', metaFont: '0.78rem' },
    medium: { width: 73, height: 110, icon: 52, nameFont: '0.91rem', metaFont: '0.78rem' },
    small: { width: 67, height: 100, icon: 48, nameFont: '0.85rem', metaFont: '0.72rem' },
  },
}));

vi.mock('@/components/TownSquare/TownSquareLayout.tsx', () => ({
  TownSquareLayout: ({
    slots,
    playersBySlotId,
    renderToken,
  }: {
    slots: Slot[];
    playersBySlotId: Map<string, TownSquarePlayer>;
    renderToken: (
      player: TownSquarePlayer,
      pos: { x: number; y: number; angle: number },
    ) => React.ReactNode;
  }) => (
    <div data-testid="town-square-layout">
      {slots.map((slot) =>
        slot.kind === 'seat' && playersBySlotId.has(slot.id) ? (
          <div key={slot.id}>
            {renderToken(playersBySlotId.get(slot.id)!, { x: 100, y: 100, angle: 0 })}
          </div>
        ) : null,
      )}
    </div>
  ),
}));

vi.mock('@/components/TownSquare/PlayerActionsModal.tsx', () => ({
  PlayerActionsModal: ({ open, player }: { open: boolean; player: TownSquarePlayer | null }) =>
    open && player ? <div data-testid="player-actions-modal">{player.name}</div> : null,
}));

vi.mock('@/components/TownSquare/TokenManager.tsx', () => ({
  TokenManager: ({ open }: { open: boolean }) =>
    open ? <div data-testid="token-manager">Token Manager</div> : null,
  TokenBadges: () => null,
}));

vi.mock('@/utils/audioAlarm.ts', () => ({ playAlarmBeeps: vi.fn(() => ({ stop: vi.fn() })) }));
vi.mock('@/utils/buildAvailableTokens.ts', () => ({
  buildAvailableTokens: vi.fn(() => [{ id: 'basic-poisoned', text: 'Poisoned' }]),
}));
vi.mock('@mui/material/useMediaQuery', () => ({ default: () => false }));

const mockResizeObserver = vi.fn().mockImplementation(function MockResizeObserver(
  this: {
    observe: ReturnType<typeof vi.fn>;
    unobserve: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
  },
  callback: ResizeObserverCallback,
) {
  this.observe = vi.fn((element: Element) => {
    callback(
      [
        {
          target: element,
          contentRect: {
            width: 360,
            height: 500,
            top: 0,
            left: 0,
            bottom: 500,
            right: 360,
            x: 0,
            y: 0,
            toJSON: () => ({}),
          },
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
const mockGame: Game = {
  id: 'game-1',
  sessionId: 'session-1',
  scriptId: 'boozling',
  currentDay: 1,
  currentPhase: Phase.Day,
  isFirstNight: false,
  slots,
  participants: sessionPlayers.map((player) => ({ playerId: player.id, isTraveller: false })),
  playerState,
  playerCountOverride: null,
  nightHistory: [],
};

let currentGame: Game | null = mockGame;
let showCharacters = false;
const updatePlayerState = vi.fn();
const removeParticipant = vi.fn();
const addToken = vi.fn();
const removeToken = vi.fn();
const assignGameSeat = vi.fn();
const setPlayerBluffs = vi.fn();
const applyGameSetupDraft = vi.fn();

vi.mock('@/context/useGame.ts', () => ({
  useGame: () => ({
    state: { game: currentGame, showCharacters, nightProgress: null },
    updatePlayerState,
    removeParticipant,
    addToken,
    removeToken,
    assignGameSeat,
    setPlayerBluffs,
    setParticipantTraveller: vi.fn(),
    applyGameSetupDraft,
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
    getCharacter: (id: string) => ({
      id,
      name: id,
      type: id === 'imp' ? 'Demon' : 'Townsfolk',
      defaultAlignment: id === 'imp' ? 'Evil' : 'Good',
      abilityShort: 'Test ability.',
      firstNight: null,
      otherNights: null,
      reminders: [],
    }),
    getCharactersByIds: (ids: string[]) =>
      ids.map((id) => ({
        id,
        name: id,
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

describe('TownSquareTab', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', mockResizeObserver);
    vi.clearAllMocks();
    currentGame = mockGame;
    showCharacters = false;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(
      <TownSquareTab scriptCharacterIds={['noble', 'imp', 'fortuneteller']} />,
    );
    expect(container).toBeTruthy();
  });

  it('renders with no players when game is null', () => {
    currentGame = null;
    const { container } = render(<TownSquareTab scriptCharacterIds={[]} />);
    expect(container).toBeTruthy();
  });

  it('has layout toggle button', () => {
    render(<TownSquareTab scriptCharacterIds={['noble', 'imp', 'fortuneteller']} />);
    expect(screen.getByLabelText('toggle token layout')).toBeInTheDocument();
  });

  it('renders player tokens from Session.players plus Game.slots/playerState', () => {
    render(<TownSquareTab scriptCharacterIds={['noble', 'imp', 'fortuneteller']} />);
    expect(screen.getByTestId('player-token-1')).toHaveTextContent('Alice');
    expect(screen.getByTestId('player-token-2')).toHaveTextContent('Bob');
    expect(screen.getByTestId('player-token-3')).toHaveTextContent('Charlie');
  });

  it('opens player actions for a clicked token', () => {
    render(<TownSquareTab scriptCharacterIds={['noble', 'imp', 'fortuneteller']} />);
    fireEvent.click(screen.getByTestId('player-token-1'));
    expect(screen.getByTestId('player-actions-modal')).toHaveTextContent('Alice');
  });

  it('measures and renders the Town Square after leaving controlled edit mode', () => {
    const { rerender } = render(
      <TownSquareTab
        scriptCharacterIds={['noble', 'imp', 'fortuneteller']}
        editMode
        onEditModeChange={vi.fn()}
      />,
    );
    expect(screen.getByTestId('town-square-edit-mode')).toBeInTheDocument();

    rerender(
      <TownSquareTab
        scriptCharacterIds={['noble', 'imp', 'fortuneteller']}
        editMode={false}
        onEditModeChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId('town-square-layout')).toBeInTheDocument();
    expect(screen.getByTestId('player-token-1')).toHaveTextContent('Alice');
  });
});
