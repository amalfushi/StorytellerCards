import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { SessionProvider, useSession } from './SessionContext';
import type { Game, Session } from '@/types/index.ts';
import { Phase, Alignment } from '@/types/index.ts';

// ──────────────────────────────────────────────
// Mocks
// ──────────────────────────────────────────────

// Mock generateId for predictable IDs
let idCounter = 0;
vi.mock('@/utils/idGenerator.ts', () => ({
  generateId: () => `mock-id-${++idCounter}`,
}));

// ──────────────────────────────────────────────
// Factories
// ──────────────────────────────────────────────

const makeSession = (overrides: Partial<Session> = {}): Session => ({
  id: 'session-1',
  name: 'Test Session',
  createdAt: '2025-01-01T00:00:00.000Z',
  defaultScriptId: 'boozling',
  defaultPlayers: [
    { seat: 1, playerName: 'Alice' },
    { seat: 2, playerName: 'Bob' },
  ],
  gameIds: [],
  ...overrides,
});

const _makeGame = (overrides: Partial<Game> = {}): Game => ({
  id: 'game-1',
  sessionId: 'session-1',
  scriptId: 'boozling',
  currentDay: 1,
  currentPhase: Phase.Day,
  isFirstNight: true,
  players: [],
  nightHistory: [],
  ...overrides,
});

// ──────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────

const wrapper = ({ children }: { children: ReactNode }) => (
  <SessionProvider>{children}</SessionProvider>
);

function renderSessionHook() {
  return renderHook(() => useSession(), { wrapper });
}

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe('SessionContext', () => {
  beforeEach(() => {
    localStorage.clear();
    idCounter = 0;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ── Initial state ──

  describe('initial state', () => {
    it('starts with empty sessions, null activeSessionId, null activeGameId', () => {
      const { result } = renderSessionHook();
      expect(result.current.state.sessions).toEqual([]);
      expect(result.current.state.activeSessionId).toBeNull();
      expect(result.current.state.activeGameId).toBeNull();
    });
  });

  // ── CREATE_SESSION ──

  describe('CREATE_SESSION', () => {
    it('creates a session with name, scriptId, and players', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('My Session', 'boozling', ['Alice', 'Bob', 'Charlie']);
      });

      expect(result.current.state.sessions).toHaveLength(1);
      const session = result.current.state.sessions[0];
      expect(session.name).toBe('My Session');
      expect(session.defaultScriptId).toBe('boozling');
      expect(session.defaultPlayers).toEqual([
        { seat: 1, playerName: 'Alice' },
        { seat: 2, playerName: 'Bob' },
        { seat: 3, playerName: 'Charlie' },
      ]);
      expect(session.gameIds).toEqual([]);
      expect(session.id).toBe('mock-id-1');
    });

    it('sets the new session as active', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Session A', 'script-1', ['Alice']);
      });

      expect(result.current.state.activeSessionId).toBe('mock-id-1');
    });

    it('creates a session with createdAt timestamp', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Session A', 'script-1', ['Alice']);
      });

      expect(result.current.state.sessions[0].createdAt).toBeDefined();
      expect(typeof result.current.state.sessions[0].createdAt).toBe('string');
    });

    it('can create multiple sessions', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Session A', 'script-1', ['Alice']);
      });
      act(() => {
        result.current.createSession('Session B', 'script-2', ['Bob']);
      });

      expect(result.current.state.sessions).toHaveLength(2);
      expect(result.current.state.sessions[0].name).toBe('Session A');
      expect(result.current.state.sessions[1].name).toBe('Session B');
      // Latest created becomes active
      expect(result.current.state.activeSessionId).toBe('mock-id-2');
    });

    it('creates a session with empty players array', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Empty Session', 'script-1', []);
      });

      expect(result.current.state.sessions[0].defaultPlayers).toEqual([]);
    });
  });

  // ── DELETE_SESSION ──

  describe('DELETE_SESSION', () => {
    it('removes a session by id', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Session A', 'script-1', ['Alice']);
      });
      const sessionId = result.current.state.sessions[0].id;

      act(() => {
        result.current.deleteSession(sessionId);
      });

      expect(result.current.state.sessions).toHaveLength(0);
    });

    it('clears activeSessionId when deleting the active session', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Session A', 'script-1', ['Alice']);
      });
      const sessionId = result.current.state.sessions[0].id;
      expect(result.current.state.activeSessionId).toBe(sessionId);

      act(() => {
        result.current.deleteSession(sessionId);
      });

      expect(result.current.state.activeSessionId).toBeNull();
      expect(result.current.state.activeGameId).toBeNull();
    });

    it('does not clear activeSessionId when deleting a different session', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Session A', 'script-1', ['Alice']);
      });
      act(() => {
        result.current.createSession('Session B', 'script-2', ['Bob']);
      });
      const sessionAId = result.current.state.sessions[0].id;
      const sessionBId = result.current.state.sessions[1].id;

      // Session B is active (last created)
      expect(result.current.state.activeSessionId).toBe(sessionBId);

      act(() => {
        result.current.deleteSession(sessionAId);
      });

      expect(result.current.state.activeSessionId).toBe(sessionBId);
      expect(result.current.state.sessions).toHaveLength(1);
    });

    it('cleans up game data from localStorage', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Session A', 'script-1', ['Alice']);
      });
      const sessionId = result.current.state.sessions[0].id;

      // Add a game to the session
      act(() => {
        result.current.addGameToSession(sessionId);
      });
      const gameId = result.current.state.sessions[0].gameIds[0];

      // Verify game is in localStorage
      expect(localStorage.getItem(`storyteller-game-${gameId}`)).not.toBeNull();

      act(() => {
        result.current.deleteSession(sessionId);
      });

      // Game data should be cleaned up
      expect(localStorage.getItem(`storyteller-game-${gameId}`)).toBeNull();
    });

    it('does nothing when deleting a non-existent session', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Session A', 'script-1', ['Alice']);
      });

      act(() => {
        result.current.deleteSession('nonexistent');
      });

      expect(result.current.state.sessions).toHaveLength(1);
    });
  });

  // ── SET_ACTIVE_SESSION ──

  describe('SET_ACTIVE_SESSION (selectSession)', () => {
    it('sets the active session id', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Session A', 'script-1', ['Alice']);
      });
      act(() => {
        result.current.createSession('Session B', 'script-2', ['Bob']);
      });
      const sessionAId = result.current.state.sessions[0].id;

      act(() => {
        result.current.selectSession(sessionAId);
      });

      expect(result.current.state.activeSessionId).toBe(sessionAId);
    });

    it('clears activeGameId when switching sessions', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Session A', 'script-1', ['Alice']);
      });
      const sessionId = result.current.state.sessions[0].id;

      // Add and select a game
      act(() => {
        result.current.addGameToSession(sessionId);
      });
      expect(result.current.state.activeGameId).not.toBeNull();

      act(() => {
        result.current.selectSession(sessionId);
      });

      expect(result.current.state.activeGameId).toBeNull();
    });

    it('can set activeSessionId to null', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Session A', 'script-1', ['Alice']);
      });
      expect(result.current.state.activeSessionId).not.toBeNull();

      act(() => {
        result.current.selectSession(null);
      });

      expect(result.current.state.activeSessionId).toBeNull();
    });
  });

  // ── SET_ACTIVE_GAME (selectGame) ──

  describe('SET_ACTIVE_GAME (selectGame)', () => {
    it('sets both active session and game', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Session A', 'script-1', ['Alice']);
      });
      const sessionId = result.current.state.sessions[0].id;

      act(() => {
        result.current.addGameToSession(sessionId);
      });
      const gameId = result.current.state.sessions[0].gameIds[0];

      // Switch away first
      act(() => {
        result.current.selectSession(null);
      });

      act(() => {
        result.current.selectGame(sessionId, gameId);
      });

      expect(result.current.state.activeSessionId).toBe(sessionId);
      expect(result.current.state.activeGameId).toBe(gameId);
    });
  });

  // ── UPDATE_SESSION ──

  describe('UPDATE_SESSION', () => {
    it('updates the session name', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Old Name', 'script-1', ['Alice']);
      });
      const sessionId = result.current.state.sessions[0].id;

      act(() => {
        result.current.updateSession(sessionId, { name: 'New Name' });
      });

      expect(result.current.state.sessions[0].name).toBe('New Name');
    });

    it('updates the default script', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Session', 'script-1', ['Alice']);
      });
      const sessionId = result.current.state.sessions[0].id;

      act(() => {
        result.current.updateSession(sessionId, { defaultScriptId: 'script-2' });
      });

      expect(result.current.state.sessions[0].defaultScriptId).toBe('script-2');
    });

    it('updates the default players', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Session', 'script-1', ['Alice']);
      });
      const sessionId = result.current.state.sessions[0].id;

      const newPlayers = [
        { seat: 1, playerName: 'Charlie' },
        { seat: 2, playerName: 'Dave' },
        { seat: 3, playerName: 'Eve' },
      ];
      act(() => {
        result.current.updateSession(sessionId, { defaultPlayers: newPlayers });
      });

      expect(result.current.state.sessions[0].defaultPlayers).toEqual(newPlayers);
    });

    it('does not modify other sessions', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Session A', 'script-1', ['Alice']);
      });
      act(() => {
        result.current.createSession('Session B', 'script-2', ['Bob']);
      });
      const sessionAId = result.current.state.sessions[0].id;

      act(() => {
        result.current.updateSession(sessionAId, { name: 'Updated A' });
      });

      expect(result.current.state.sessions[0].name).toBe('Updated A');
      expect(result.current.state.sessions[1].name).toBe('Session B');
    });

    it('does not modify a non-existent session', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Session A', 'script-1', ['Alice']);
      });

      act(() => {
        result.current.updateSession('nonexistent', { name: 'X' });
      });

      expect(result.current.state.sessions[0].name).toBe('Session A');
    });

    it('preserves fields not included in the update', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Session', 'script-1', ['Alice', 'Bob']);
      });
      const sessionId = result.current.state.sessions[0].id;

      act(() => {
        result.current.updateSession(sessionId, { name: 'Renamed' });
      });

      // defaultScriptId and defaultPlayers should be unchanged
      expect(result.current.state.sessions[0].defaultScriptId).toBe('script-1');
      expect(result.current.state.sessions[0].defaultPlayers).toHaveLength(2);
    });
  });

  // ── ADD_GAME_TO_SESSION ──

  describe('ADD_GAME_TO_SESSION (addGameToSession)', () => {
    it('creates a new game and adds its id to the session', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Session', 'boozling', ['Alice', 'Bob']);
      });
      const sessionId = result.current.state.sessions[0].id;

      act(() => {
        result.current.addGameToSession(sessionId);
      });

      expect(result.current.state.sessions[0].gameIds).toHaveLength(1);
    });

    it('sets the new game as active', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Session', 'boozling', ['Alice']);
      });
      const sessionId = result.current.state.sessions[0].id;

      act(() => {
        result.current.addGameToSession(sessionId);
      });

      expect(result.current.state.activeGameId).not.toBeNull();
    });

    it('persists the new game to localStorage', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Session', 'boozling', ['Alice']);
      });
      const sessionId = result.current.state.sessions[0].id;

      act(() => {
        result.current.addGameToSession(sessionId);
      });

      const gameId = result.current.state.sessions[0].gameIds[0];
      const raw = localStorage.getItem(`storyteller-game-${gameId}`);
      expect(raw).not.toBeNull();
      const game = JSON.parse(raw!) as Game;
      expect(game.sessionId).toBe(sessionId);
      expect(game.scriptId).toBe('boozling');
      expect(game.currentPhase).toBe(Phase.Day);
      expect(game.isFirstNight).toBe(true);
      expect(game.currentDay).toBe(1);
    });

    it('creates a game with players based on session defaults', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Session', 'boozling', ['Alice', 'Bob']);
      });
      const sessionId = result.current.state.sessions[0].id;

      act(() => {
        result.current.addGameToSession(sessionId);
      });

      const gameId = result.current.state.sessions[0].gameIds[0];
      const raw = localStorage.getItem(`storyteller-game-${gameId}`);
      const game = JSON.parse(raw!) as Game;
      expect(game.players).toHaveLength(2);
      expect(game.players[0].playerName).toBe('Alice');
      expect(game.players[0].seat).toBe(1);
      expect(game.players[0].characterId).toBe('');
      expect(game.players[0].alive).toBe(true);
      expect(game.players[0].ghostVoteUsed).toBe(false);
      expect(game.players[0].visibleAlignment).toBe(Alignment.Unknown);
      expect(game.players[0].actualAlignment).toBe(Alignment.Unknown);
      expect(game.players[0].isTraveller).toBe(false);
      expect(game.players[1].playerName).toBe('Bob');
      expect(game.players[1].seat).toBe(2);
    });

    it('carries forward player names from previous game', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Session', 'boozling', ['Alice', 'Bob']);
      });
      const sessionId = result.current.state.sessions[0].id;

      // Create first game
      act(() => {
        result.current.addGameToSession(sessionId);
      });

      // Modify the first game's player data in localStorage to simulate gameplay
      const firstGameId = result.current.state.sessions[0].gameIds[0];
      const firstGameRaw = localStorage.getItem(`storyteller-game-${firstGameId}`);
      const firstGame = JSON.parse(firstGameRaw!) as Game;
      firstGame.players[0].characterId = 'imp';
      firstGame.players[0].alive = false;
      localStorage.setItem(`storyteller-game-${firstGameId}`, JSON.stringify(firstGame));

      // Create second game — should carry forward player names but reset state
      act(() => {
        result.current.addGameToSession(sessionId);
      });

      const secondGameId = result.current.state.sessions[0].gameIds[1];
      const secondGameRaw = localStorage.getItem(`storyteller-game-${secondGameId}`);
      const secondGame = JSON.parse(secondGameRaw!) as Game;

      expect(secondGame.players[0].playerName).toBe('Alice');
      expect(secondGame.players[0].characterId).toBe('');
      expect(secondGame.players[0].alive).toBe(true);
    });

    it('falls back to session defaults if last game is not in localStorage', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Session', 'boozling', ['Alice', 'Bob']);
      });
      const sessionId = result.current.state.sessions[0].id;

      // Create first game
      act(() => {
        result.current.addGameToSession(sessionId);
      });

      // Remove the first game from localStorage
      const firstGameId = result.current.state.sessions[0].gameIds[0];
      localStorage.removeItem(`storyteller-game-${firstGameId}`);

      // Create second game — should fall back to session defaults
      act(() => {
        result.current.addGameToSession(sessionId);
      });

      const secondGameId = result.current.state.sessions[0].gameIds[1];
      const raw = localStorage.getItem(`storyteller-game-${secondGameId}`);
      const game = JSON.parse(raw!) as Game;
      expect(game.players).toHaveLength(2);
      expect(game.players[0].playerName).toBe('Alice');
    });

    it('does nothing for non-existent session', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.addGameToSession('nonexistent');
      });

      expect(result.current.state.activeGameId).toBeNull();
    });

    it('can add multiple games to one session', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Session', 'boozling', ['Alice']);
      });
      const sessionId = result.current.state.sessions[0].id;

      act(() => {
        result.current.addGameToSession(sessionId);
      });
      act(() => {
        result.current.addGameToSession(sessionId);
      });

      expect(result.current.state.sessions[0].gameIds).toHaveLength(2);
      // Each game should have a unique ID
      expect(result.current.state.sessions[0].gameIds[0]).not.toBe(
        result.current.state.sessions[0].gameIds[1],
      );
    });
  });

  // ── getActiveSession ──

  describe('getActiveSession', () => {
    it('returns null when no session is active', () => {
      const { result } = renderSessionHook();

      expect(result.current.getActiveSession()).toBeNull();
    });

    it('returns the active session', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Session A', 'script-1', ['Alice']);
      });

      const active = result.current.getActiveSession();
      expect(active).not.toBeNull();
      expect(active!.name).toBe('Session A');
    });

    it('returns null when activeSessionId points to non-existent session', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Session A', 'script-1', ['Alice']);
      });
      const sessionId = result.current.state.sessions[0].id;

      act(() => {
        result.current.deleteSession(sessionId);
      });

      expect(result.current.getActiveSession()).toBeNull();
    });
  });

  // ── getActiveGame ──

  describe('getActiveGame', () => {
    it('returns null when no game is active', () => {
      const { result } = renderSessionHook();

      expect(result.current.getActiveGame()).toBeNull();
    });

    it('returns the active game from localStorage', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Session', 'boozling', ['Alice']);
      });
      const sessionId = result.current.state.sessions[0].id;

      act(() => {
        result.current.addGameToSession(sessionId);
      });

      const game = result.current.getActiveGame();
      expect(game).not.toBeNull();
      expect(game!.sessionId).toBe(sessionId);
    });

    it('returns null when game is not in localStorage', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Session', 'boozling', ['Alice']);
      });
      const sessionId = result.current.state.sessions[0].id;

      act(() => {
        result.current.addGameToSession(sessionId);
      });
      const gameId = result.current.state.activeGameId!;

      // Remove the game from localStorage
      localStorage.removeItem(`storyteller-game-${gameId}`);

      expect(result.current.getActiveGame()).toBeNull();
    });
  });

  // ── localStorage persistence ──

  describe('localStorage persistence', () => {
    it('persists session state to localStorage (via useLocalStorage debounce)', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Persisted Session', 'script-1', ['Alice']);
      });

      // Advance timers to flush the debounced write (300ms)
      act(() => {
        vi.advanceTimersByTime(350);
      });

      const raw = localStorage.getItem('storyteller-sessions');
      expect(raw).not.toBeNull();
      const persisted = JSON.parse(raw!);
      expect(persisted.sessions).toHaveLength(1);
      expect(persisted.sessions[0].name).toBe('Persisted Session');
    });

    it('loads session state from localStorage on mount', () => {
      // Pre-populate localStorage
      const existingState = {
        sessions: [makeSession({ id: 'preloaded', name: 'Preloaded Session' })],
        activeSessionId: 'preloaded',
        activeGameId: null,
      };
      localStorage.setItem('storyteller-sessions', JSON.stringify(existingState));

      const { result } = renderSessionHook();

      expect(result.current.state.sessions).toHaveLength(1);
      expect(result.current.state.sessions[0].name).toBe('Preloaded Session');
      expect(result.current.state.activeSessionId).toBe('preloaded');
    });

    it('handles corrupted localStorage gracefully', () => {
      // Put invalid JSON in localStorage
      localStorage.setItem('storyteller-sessions', '{invalid json!!!');

      const { result } = renderSessionHook();

      // Should fall back to initial state
      expect(result.current.state.sessions).toEqual([]);
      expect(result.current.state.activeSessionId).toBeNull();
    });

    it('handles missing localStorage key gracefully', () => {
      // Don't set anything in localStorage
      const { result } = renderSessionHook();

      expect(result.current.state.sessions).toEqual([]);
      expect(result.current.state.activeSessionId).toBeNull();
    });
  });

  // ── Immutability ──

  describe('immutability', () => {
    it('does not mutate the original sessions array when creating', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Session A', 'script-1', ['Alice']);
      });

      const sessionsBefore = result.current.state.sessions;

      act(() => {
        result.current.createSession('Session B', 'script-2', ['Bob']);
      });

      // Original array reference should differ
      expect(result.current.state.sessions).not.toBe(sessionsBefore);
      // But old content is preserved
      expect(result.current.state.sessions[0].name).toBe('Session A');
    });

    it('does not mutate the session when updating', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Session', 'script-1', ['Alice']);
      });
      const sessionBefore = result.current.state.sessions[0];

      act(() => {
        result.current.updateSession(sessionBefore.id, { name: 'Updated' });
      });

      // The reference in the sessions array should be a new object
      expect(result.current.state.sessions[0]).not.toBe(sessionBefore);
      // Old object is unchanged
      expect(sessionBefore.name).toBe('Session');
    });
  });

  // ── useSession hook guard ──

  describe('useSession hook', () => {
    it('throws when used outside SessionProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useSession());
      }).toThrow('useSession must be used within a <SessionProvider>');

      consoleSpy.mockRestore();
    });
  });
});
