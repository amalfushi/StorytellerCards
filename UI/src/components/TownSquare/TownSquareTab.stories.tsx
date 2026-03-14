import { useEffect, useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import Box from '@mui/material/Box';
import { TownSquareTab } from './TownSquareTab';
import { GameProvider, useGame } from '../../context/GameContext';
import type { Game, PlayerSeat } from '../../types';
import {
  generateMockPlayers,
  worstCase20Players,
  mockDrunkToken,
  mockPoisonedToken,
  mockCustomTokens,
} from '../../stories/mockData';

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

function makeGame(players: PlayerSeat[], overrides?: Partial<Game>): Game {
  return {
    id: 'game-story-1',
    sessionId: 'session-story-1',
    scriptId: 'boozling',
    currentDay: 1,
    currentPhase: 'Day',
    isFirstNight: false,
    players,
    nightHistory: [],
    inPlayCharacterIds: players.map((p) => p.characterId).filter(Boolean),
    ...overrides,
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
function createDecorator(game: Game, showCharacters: boolean) {
  return function Decorator() {
    return (
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
    );
  };
}

// ──────────────────────────────────────────────
// Player sets
// ──────────────────────────────────────────────

const fivePlayers = generateMockPlayers(5);
const sevenPlayers = generateMockPlayers(7);
const twelvePlayers = generateMockPlayers(12);

const fivePlayersWithDead: PlayerSeat[] = fivePlayers.map((p, i) =>
  i === 2 ? { ...p, alive: false } : p,
);

const sevenPlayersWithTokens: PlayerSeat[] = sevenPlayers.map((p, i) => {
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
  render: createDecorator(makeGame(fivePlayers), false),
};

/** Day mode with 7 players — mid-size game, all alive. */
export const DaySevenPlayers: Story = {
  render: createDecorator(makeGame(sevenPlayers), false),
};

/** Day mode with 12 players — larger game, smaller token size. */
export const DayTwelvePlayers: Story = {
  render: createDecorator(makeGame(twelvePlayers), false),
};

// ──────────────────────────────────────────────
// Night mode stories
// ──────────────────────────────────────────────

/** Night mode with 5 players — character icons, names, and alignment borders visible. */
export const NightFivePlayers: Story = {
  render: createDecorator(makeGame(fivePlayers), true),
};

/** Night mode with 7 players — mid-size game with character details. */
export const NightSevenPlayers: Story = {
  render: createDecorator(makeGame(sevenPlayers), true),
};

/** Night mode with 12 players — compact tokens at medium size. */
export const NightTwelvePlayers: Story = {
  render: createDecorator(makeGame(twelvePlayers), true),
};

// ──────────────────────────────────────────────
// Dead players
// ──────────────────────────────────────────────

/** Day mode with one dead player — faded styling on seat 3. */
export const DayWithDeadPlayer: Story = {
  render: createDecorator(makeGame(fivePlayersWithDead), false),
};

/** Night mode with dead player — shows ghost indicators and character info. */
export const NightWithDeadPlayer: Story = {
  render: createDecorator(makeGame(fivePlayersWithDead), true),
};

// ──────────────────────────────────────────────
// Token display stories
// ──────────────────────────────────────────────

/** Night mode with status tokens — Drunk, Poisoned, and custom tokens shown as badges. */
export const NightWithTokens: Story = {
  render: createDecorator(makeGame(sevenPlayersWithTokens), true),
};

/** Day mode with tokens — tokens should be hidden (secret info). */
export const DayWithTokensHidden: Story = {
  render: createDecorator(makeGame(sevenPlayersWithTokens), false),
};

// ──────────────────────────────────────────────
// Worst case (20 players)
// ──────────────────────────────────────────────

/** Worst case 20 players — stress test with dead players, tokens, travellers. */
export const WorstCaseTwentyPlayers: Story = {
  render: createDecorator(makeGame(worstCase20Players), true),
};

// ──────────────────────────────────────────────
// Responsive viewport variants
// ──────────────────────────────────────────────

/** Tablet viewport — circular layout at iPad size. */
export const TabletViewport: Story = {
  render: createDecorator(makeGame(sevenPlayers), true),
  parameters: {
    viewport: { defaultViewport: 'tablet' },
  },
};
