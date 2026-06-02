import type { Decorator } from '@storybook/react-vite';
import { GameProvider } from '../context/GameContext';
import type { GameViewState } from '../context/GameContext';
import type { Game } from '../types';
import { Phase } from '../types';
import { mockPlayers } from './mockData';
import { GameLoader } from './GameLoader';

// ──────────────────────────────────────────────
// Default mock game
// ──────────────────────────────────────────────

const defaultMockGame: Game = {
  id: 'story-game-1',
  sessionId: 'story-session-1',
  scriptId: 'boozling',
  currentDay: 1,
  currentPhase: Phase.Day,
  isFirstNight: true,
  players: mockPlayers,
  nightHistory: [],
};

// ──────────────────────────────────────────────
// Public decorator factory
// ──────────────────────────────────────────────

/**
 * Creates a Storybook decorator that wraps the story with a GameProvider
 * pre-loaded with mock data and optional state overrides.
 *
 * @example
 * ```ts
 * decorators: [withMockGameContext({ game: { currentPhase: Phase.Night } })]
 * ```
 */
export const withMockGameContext =
  (overrides: Partial<GameViewState> = {}): Decorator =>
  (Story) => {
    const game: Game = {
      ...defaultMockGame,
      ...(overrides.game ?? {}),
    } as Game;
    return (
      <GameProvider>
        <GameLoader game={game} overrides={overrides}>
          <Story />
        </GameLoader>
      </GameProvider>
    );
  };
