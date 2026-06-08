import { useEffect, useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import Box from '@mui/material/Box';
import { TownSquareTab } from './TownSquareTab';
import { GameProvider } from '../../context/GameContext';
import { useGame } from '../../context/useGame';
import { SessionContext } from '../../context/useSession';
import type { SessionContextValue } from '../../context/SessionContext';
import type { Game, Session } from '../../types';
import {
  generateMockPlayers,
  worstCase20Players,
  mockDrunkToken,
  mockPoisonedToken,
  mockCustomTokens,
  storyPlayersToParticipants,
  storyPlayersToPlayerState,
  storyPlayersToSessionPlayers,
  storyPlayersToSlots,
} from '../../stories/mockData';
import type { StoryPlayer } from '../../stories/mockData';

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

const boozlingCharacterIds = [
  'noble',
  'pixie',
  'highpriestess',
  'balloonist',
  'fortuneteller',
  'oracle',
  'savant',
  'philosopher',
  'huntsman',
  'fisherman',
  'slayer',
  'sage',
  'cannibal',
  'drunk',
  'mutant',
  'damsel',
  'klutz',
  'golem',
  'baron',
  'cerenovus',
  'scarletwoman',
  'marionette',
  'nodashii',
  'fanggu',
  'imp',
];

function makeGame(players: StoryPlayer[], overrides?: Partial<Game>): Game {
  return {
    id: 'game-story-1',
    sessionId: 'session-story-1',
    scriptId: 'boozling',
    currentDay: 1,
    currentPhase: 'Day',
    isFirstNight: false,
    slots: storyPlayersToSlots(players),
    participants: storyPlayersToParticipants(players),
    playerState: storyPlayersToPlayerState(players),
    playerCountOverride: null,
    nightHistory: [],
    inPlayCharacterIds: players.map((p) => p.characterId).filter(Boolean),
    ...overrides,
  };
}

function makeSession(players: StoryPlayer[]): Session {
  return {
    id: 'session-story-1',
    name: 'Story Session',
    createdAt: '2026-01-01T00:00:00.000Z',
    defaultScriptId: 'boozling',
    players: storyPlayersToSessionPlayers(players),
    template: { slots: storyPlayersToSlots(players) },
    propagationDefault: { toTemplate: true, toOtherGames: true },
    gameIds: ['game-story-1'],
  };
}

function makeSessionContextValue(session: Session): SessionContextValue {
  return {
    state: { sessions: [session], activeSessionId: session.id, activeGameId: 'game-story-1' },
    dispatch: () => undefined,
    createSession: () => undefined,
    deleteSession: () => undefined,
    selectSession: () => undefined,
    selectGame: () => undefined,
    updateSession: () => undefined,
    addPlayer: (_sessionId, name) => ({ id: `new-${name}`, name }),
    renamePlayer: () => undefined,
    removePlayer: () => undefined,
    addTemplateSeat: () => 'new-seat',
    addTemplateSpacer: () => 'new-spacer',
    addTemplateStoryteller: () => 'new-storyteller',
    removeTemplateSlot: () => undefined,
    moveTemplateSlot: () => undefined,
    assignTemplateSeat: () => undefined,
    setPropagationDefault: () => undefined,
    addGameToSession: () => undefined,
    deleteGame: () => undefined,
    getActiveSession: () => session,
    getActiveGame: () => null,
    syncSession: () => undefined,
  };
}

/**
 * Inner wrapper that loads a game into GameContext on mount.
 * This is needed because `GameProvider` starts with no game loaded.
 */
function GameSeeder({
  game,
  showCharacters,
  children,
}: {
  game: Game;
  showCharacters: boolean;
  children: React.ReactNode;
}) {
  const { loadGame, toggleShowCharacters, state } = useGame();
  const hasSeeded = useRef(false);

  useEffect(() => {
    if (!hasSeeded.current) {
      hasSeeded.current = true;
      loadGame(game);
    }
  }, [game, loadGame]);

  // Toggle to night view after game is loaded if needed
  useEffect(() => {
    if (state.game && showCharacters && !state.showCharacters) {
      toggleShowCharacters();
    }
  }, [state.game, showCharacters, state.showCharacters, toggleShowCharacters]);

  if (!state.game) return null;
  return <>{children}</>;
}

/**
 * Storybook decorator that wraps TownSquareTab with a seeded GameProvider.
 */
function createDecorator(game: Game, showCharacters: boolean, players: StoryPlayer[]) {
  const sessionValue = makeSessionContextValue(makeSession(players));
  return function Decorator() {
    return (
      <SessionContext.Provider value={sessionValue}>
        <GameProvider>
          <GameSeeder game={game} showCharacters={showCharacters}>
            <Box
              sx={{
                width: '100%',
                height: 600,
                position: 'relative',
                bgcolor: '#1a1a2e',
              }}
            >
              <TownSquareTab scriptCharacterIds={boozlingCharacterIds} />
            </Box>
          </GameSeeder>
        </GameProvider>
      </SessionContext.Provider>
    );
  };
}

// ──────────────────────────────────────────────
// Player sets
// ──────────────────────────────────────────────

const fivePlayers = generateMockPlayers(5);
const sevenPlayers = generateMockPlayers(7);
const twelvePlayers = generateMockPlayers(12);

const fivePlayersWithDead: StoryPlayer[] = fivePlayers.map((p, i) =>
  i === 2 ? { ...p, alive: false } : p,
);

const sevenPlayersWithTokens: StoryPlayer[] = sevenPlayers.map((p, i) => {
  if (i === 1) return { ...p, tokens: [mockDrunkToken] };
  if (i === 3) return { ...p, tokens: [mockPoisonedToken] };
  if (i === 5) return { ...p, tokens: [mockCustomTokens[0], mockCustomTokens[4]] };
  return p;
});

// ──────────────────────────────────────────────
// Meta
// ──────────────────────────────────────────────

const meta = {
  title: 'TownSquare/TownSquareTab',
  component: TownSquareTab,
  args: {
    scriptCharacterIds: boozlingCharacterIds,
  },
  parameters: {
    backgrounds: { default: 'dark' },
    layout: 'fullscreen',
  },
} satisfies Meta<typeof TownSquareTab>;

export default meta;
type Story = StoryObj<typeof meta>;

// ──────────────────────────────────────────────
// Day mode stories
// ──────────────────────────────────────────────

/** Day mode with 5 players — character info hidden, tokens show names and seat numbers only. */
export const DayFivePlayers: Story = {
  render: createDecorator(makeGame(fivePlayers), false, fivePlayers),
};

/** Day mode with 7 players — mid-size game, all alive. */
export const DaySevenPlayers: Story = {
  render: createDecorator(makeGame(sevenPlayers), false, sevenPlayers),
};

/** Day mode with 12 players — larger game, smaller token size. */
export const DayTwelvePlayers: Story = {
  render: createDecorator(makeGame(twelvePlayers), false, twelvePlayers),
};

// ──────────────────────────────────────────────
// Night mode stories
// ──────────────────────────────────────────────

/** Night mode with 5 players — character icons, names, and alignment borders visible. */
export const NightFivePlayers: Story = {
  render: createDecorator(makeGame(fivePlayers), true, fivePlayers),
};

/** Night mode with 7 players — mid-size game with character details. */
export const NightSevenPlayers: Story = {
  render: createDecorator(makeGame(sevenPlayers), true, sevenPlayers),
};

/** Night mode with 12 players — compact tokens at medium size. */
export const NightTwelvePlayers: Story = {
  render: createDecorator(makeGame(twelvePlayers), true, twelvePlayers),
};

// ──────────────────────────────────────────────
// Dead players
// ──────────────────────────────────────────────

/** Day mode with one dead player — faded styling on seat 3. */
export const DayWithDeadPlayer: Story = {
  render: createDecorator(makeGame(fivePlayersWithDead), false, fivePlayersWithDead),
};

/** Night mode with dead player — shows ghost indicators and character info. */
export const NightWithDeadPlayer: Story = {
  render: createDecorator(makeGame(fivePlayersWithDead), true, fivePlayersWithDead),
};

// ──────────────────────────────────────────────
// Token display stories
// ──────────────────────────────────────────────

/** Night mode with status tokens — Drunk, Poisoned, and custom tokens shown as badges. */
export const NightWithTokens: Story = {
  render: createDecorator(makeGame(sevenPlayersWithTokens), true, sevenPlayersWithTokens),
};

/** Day mode with tokens — tokens should be hidden (secret info). */
export const DayWithTokensHidden: Story = {
  render: createDecorator(makeGame(sevenPlayersWithTokens), false, sevenPlayersWithTokens),
};

// ──────────────────────────────────────────────
// Worst case (20 players)
// ──────────────────────────────────────────────

/** Worst case 20 players — stress test with dead players, tokens, travellers. */
export const WorstCaseTwentyPlayers: Story = {
  render: createDecorator(makeGame(worstCase20Players), true, worstCase20Players),
};

// ──────────────────────────────────────────────
// Responsive viewport variants
// ──────────────────────────────────────────────

/** Tablet viewport — circular layout at iPad size. */
export const TabletViewport: Story = {
  render: createDecorator(makeGame(sevenPlayers), true, sevenPlayers),
  parameters: {
    viewport: { defaultViewport: 'tablet' },
  },
};
