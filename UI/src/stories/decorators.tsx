import type { Decorator } from '@storybook/react-vite';
import { GameProvider } from '../context/GameContext';
import { SessionProvider } from '../context/SessionContext';
import type { GameViewState } from '../context/GameContext';
import type { Game } from '../types';
import { Phase } from '../types';
import { mockParticipants, mockPlayerState, mockSlots } from './mockData';
import { GameLoader } from './GameLoader';
import { SessionLoader } from './SessionLoader';
import { STORY_GAME_ID, STORY_SESSION_ID, mockSession } from './mockSession';

// ──────────────────────────────────────────────
// Default mock game
// ──────────────────────────────────────────────

const defaultMockGame: Game = {
  id: STORY_GAME_ID,
  sessionId: STORY_SESSION_ID,
  scriptId: 'boozling',
  currentDay: 1,
  currentPhase: Phase.Day,
  isFirstNight: true,
  slots: mockSlots,
  participants: mockParticipants,
  playerState: mockPlayerState,
  playerCountOverride: null,
  nightHistory: [],
};

// ──────────────────────────────────────────────
// Public decorator factory
// ──────────────────────────────────────────────

/**
 * Creates a Storybook decorator that wraps the story with a `SessionProvider`
 * (seeded with a matching mock session) and a `GameProvider` pre-loaded with
 * mock game data plus optional state overrides.
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
      <SessionProvider>
        <SessionLoader session={mockSession}>
          <GameProvider>
            <GameLoader game={game} overrides={overrides}>
              <Story />
            </GameLoader>
          </GameProvider>
        </SessionLoader>
      </SessionProvider>
    );
  };
