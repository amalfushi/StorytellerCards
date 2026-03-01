/* eslint-disable react-refresh/only-export-components */
import type { Decorator } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { GameProvider, useGame } from '../context/GameContext';
import type { GameViewState } from '../context/GameContext';
import type { Game } from '../types';
import { Phase } from '../types';
import { useEffect } from 'react';
import { mockPlayers } from './mockData';

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
// Internal loader component
// ──────────────────────────────────────────────

function GameLoader({
  overrides,
  children,
}: {
  overrides: Partial<GameViewState>;
  children: ReactNode;
}) {
  const { loadGame, setPhase, toggleShowCharacters, state } = useGame();

  useEffect(() => {
    // Build the game object with any overrides
    const game: Game = {
      ...defaultMockGame,
      ...(overrides.game ?? {}),
    } as Game;

    loadGame(game);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Apply phase override after game is loaded
    if (state.game && overrides.game?.currentPhase) {
      setPhase(overrides.game.currentPhase);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.game?.id]);

  useEffect(() => {
    // Apply showCharacters override
    if (
      overrides.showCharacters !== undefined &&
      overrides.showCharacters !== state.showCharacters
    ) {
      toggleShowCharacters();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.game?.id]);

  return <>{children}</>;
}

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
  (Story) => (
    <GameProvider>
      <GameLoader overrides={overrides}>
        <Story />
      </GameLoader>
    </GameProvider>
  );
