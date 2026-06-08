import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { SessionProvider } from './SessionContext';
import { useSession } from './useSession';
import type { Game, Player, PropagationPreference, Session, Slot } from '@/types/index.ts';
import { Alignment, Phase } from '@/types/index.ts';

const apiDeleteGame = vi.fn();
const apiDeleteSession = vi.fn();
const apiFetchSessions = vi.fn<() => Promise<Session[]>>(() => Promise.resolve([]));
const apiPushSession = vi.fn();

vi.mock('@/hooks/useApiSync.ts', () => ({
  isSyncDisabled: true,
  useApiSync: () => ({
    syncSession: apiPushSession,
    fetchSessions: apiFetchSessions,
    deleteSession: apiDeleteSession,
    deleteGame: apiDeleteGame,
    syncGame: vi.fn(),
    syncScript: vi.fn(),
    fetchSession: vi.fn(),
    fetchGame: vi.fn(),
    fetchScript: vi.fn(),
  }),
}));

let idCounter = 0;
vi.mock('@/utils/idGenerator.ts', () => ({
  generateId: () => `mock-id-${++idCounter}`,
}));

const propagationDefault: PropagationPreference = { toTemplate: true, toOtherGames: true };

const makePlayers = (): Player[] => [
  { id: 'player-1', name: 'Alice' },
  { id: 'player-2', name: 'Bob' },
];

const makeTemplateSlots = (): Slot[] => [
  { kind: 'seat', id: 'slot-1', playerId: 'player-1' },
  { kind: 'seat', id: 'slot-2', playerId: 'player-2' },
];

const makeSession = (overrides: Partial<Session> = {}): Session => ({
  id: 'session-1',
  name: 'Test Session',
  createdAt: '2025-01-01T00:00:00.000Z',
  defaultScriptId: 'boozling',
  players: makePlayers(),
  template: { slots: makeTemplateSlots() },
  propagationDefault,
  gameIds: [],
  ...overrides,
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <SessionProvider>{children}</SessionProvider>
);

function renderSessionHook() {
  return renderHook(() => useSession(), { wrapper });
}

function readGame(gameId: string): Game {
  const raw = localStorage.getItem(`storyteller-game-${gameId}`);
  expect(raw).not.toBeNull();
  return JSON.parse(raw!) as Game;
}

/*
 * Removed M41-incompatible legacy tests:
 * - Updating `defaultPlayers`: sessions now expose `players` plus `template.slots`; the remaining tests cover roster and template updates.
 * - Reusing/carrying forward previous game seating by player name and opting out of that reuse: new games always snapshot the session template.
 * - Traveller exclusion during carry-forward: carry-forward no longer exists; travellers are game participants.
 * - Session swap/shift/insert helpers: those seat-number actions were removed; layout is managed with template slot add/move/remove/assign actions.
 */
describe('SessionContext', () => {
  beforeEach(() => {
    localStorage.clear();
    idCounter = 0;
    vi.useFakeTimers();
    apiDeleteGame.mockClear();
    apiDeleteSession.mockClear();
    apiFetchSessions.mockClear();
    apiPushSession.mockClear();
    apiFetchSessions.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('starts with empty sessions and no active IDs', () => {
      const { result } = renderSessionHook();

      expect(result.current.state.sessions).toEqual([]);
      expect(result.current.state.activeSessionId).toBeNull();
      expect(result.current.state.activeGameId).toBeNull();
    });
  });

  describe('createSession', () => {
    it('creates a session roster and matching seat template', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('My Session', 'boozling', ['Alice', 'Bob', 'Charlie']);
      });

      const session = result.current.state.sessions[0];
      expect(session.id).toBe('mock-id-1');
      expect(session.name).toBe('My Session');
      expect(session.defaultScriptId).toBe('boozling');
      expect(session.players).toEqual([
        { id: 'mock-id-2', name: 'Alice' },
        { id: 'mock-id-3', name: 'Bob' },
        { id: 'mock-id-4', name: 'Charlie' },
      ]);
      expect(session.template.slots).toEqual([
        { kind: 'seat', id: 'mock-id-5', playerId: 'mock-id-2' },
        { kind: 'seat', id: 'mock-id-6', playerId: 'mock-id-3' },
        { kind: 'seat', id: 'mock-id-7', playerId: 'mock-id-4' },
      ]);
      expect(session.propagationDefault).toEqual(propagationDefault);
      expect(session.gameIds).toEqual([]);
      expect(result.current.state.activeSessionId).toBe(session.id);
    });

    it('creates an empty roster and template when no player names are provided', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Empty Session', 'script-1', []);
      });

      expect(result.current.state.sessions[0].players).toEqual([]);
      expect(result.current.state.sessions[0].template.slots).toEqual([]);
    });

    it('can create multiple sessions and makes the latest one active', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Session A', 'script-1', ['Alice']);
      });
      act(() => {
        result.current.createSession('Session B', 'script-2', ['Bob']);
      });

      expect(result.current.state.sessions.map((s) => s.name)).toEqual(['Session A', 'Session B']);
      expect(result.current.state.activeSessionId).toBe(result.current.state.sessions[1].id);
    });
  });

  describe('deleteSession', () => {
    it('removes a session by id', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Session A', 'script-1', ['Alice']);
      });
      const sessionId = result.current.state.sessions[0].id;

      act(() => {
        result.current.deleteSession(sessionId);
      });

      expect(result.current.state.sessions).toEqual([]);
      expect(apiDeleteSession).toHaveBeenCalledWith(sessionId);
    });

    it('clears active IDs when deleting the active session', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Session A', 'script-1', ['Alice']);
      });
      const sessionId = result.current.state.sessions[0].id;
      act(() => {
        result.current.addGameToSession(sessionId);
      });

      act(() => {
        result.current.deleteSession(sessionId);
      });

      expect(result.current.state.activeSessionId).toBeNull();
      expect(result.current.state.activeGameId).toBeNull();
    });

    it('keeps activeSessionId when deleting a different session', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Session A', 'script-1', ['Alice']);
      });
      act(() => {
        result.current.createSession('Session B', 'script-2', ['Bob']);
      });
      const sessionAId = result.current.state.sessions[0].id;
      const sessionBId = result.current.state.sessions[1].id;

      act(() => {
        result.current.deleteSession(sessionAId);
      });

      expect(result.current.state.activeSessionId).toBe(sessionBId);
      expect(result.current.state.sessions).toHaveLength(1);
    });

    it('removes all persisted games for the deleted session', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Session A', 'script-1', ['Alice']);
      });
      const sessionId = result.current.state.sessions[0].id;
      act(() => {
        result.current.addGameToSession(sessionId);
      });
      const gameId = result.current.state.sessions[0].gameIds[0];
      expect(localStorage.getItem(`storyteller-game-${gameId}`)).not.toBeNull();

      act(() => {
        result.current.deleteSession(sessionId);
      });

      expect(localStorage.getItem(`storyteller-game-${gameId}`)).toBeNull();
    });

    it('does nothing locally when deleting a missing session', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Session A', 'script-1', ['Alice']);
      });
      act(() => {
        result.current.deleteSession('missing');
      });

      expect(result.current.state.sessions).toHaveLength(1);
    });
  });

  describe('selection', () => {
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
      act(() => {
        result.current.addGameToSession(sessionId);
      });
      expect(result.current.state.activeGameId).not.toBeNull();

      act(() => {
        result.current.selectSession(sessionId);
      });

      expect(result.current.state.activeGameId).toBeNull();
    });

    it('can clear the active session', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Session A', 'script-1', ['Alice']);
      });
      act(() => {
        result.current.selectSession(null);
      });

      expect(result.current.state.activeSessionId).toBeNull();
    });

    it('selectGame sets both active session and active game', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Session A', 'script-1', ['Alice']);
      });
      const sessionId = result.current.state.sessions[0].id;
      act(() => {
        result.current.addGameToSession(sessionId);
      });
      const gameId = result.current.state.sessions[0].gameIds[0];
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

  describe('updateSession', () => {
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

    it('preserves roster and template fields not included in the update', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Session', 'script-1', ['Alice', 'Bob']);
      });
      const sessionId = result.current.state.sessions[0].id;
      act(() => {
        result.current.updateSession(sessionId, { name: 'Renamed' });
      });

      expect(result.current.state.sessions[0].defaultScriptId).toBe('script-1');
      expect(result.current.state.sessions[0].players).toHaveLength(2);
      expect(result.current.state.sessions[0].template.slots).toHaveLength(2);
    });
  });

  describe('session roster helpers', () => {
    it('adds a session player without changing template seating', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Session', 'script-1', ['Alice']);
      });
      const sessionId = result.current.state.sessions[0].id;
      let added: Player | undefined;
      act(() => {
        added = result.current.addPlayer(sessionId, 'Bob');
      });

      expect(added).toEqual({ id: 'mock-id-4', name: 'Bob' });
      expect(result.current.state.sessions[0].players.map((p) => p.name)).toEqual(['Alice', 'Bob']);
      expect(result.current.state.sessions[0].template.slots).toHaveLength(1);
    });

    it('renames a session player by stable player id', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Session', 'script-1', ['Alice']);
      });
      const sessionId = result.current.state.sessions[0].id;
      const playerId = result.current.state.sessions[0].players[0].id;
      act(() => {
        result.current.renamePlayer(sessionId, playerId, 'Alicia');
      });

      expect(result.current.state.sessions[0].players[0].name).toBe('Alicia');
    });

    it('removes a session player and clears them from template seats', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Session', 'script-1', ['Alice', 'Bob']);
      });
      const sessionId = result.current.state.sessions[0].id;
      const playerId = result.current.state.sessions[0].players[0].id;
      act(() => {
        result.current.removePlayer(sessionId, playerId);
      });

      expect(result.current.state.sessions[0].players).toEqual([{ id: 'mock-id-3', name: 'Bob' }]);
      expect(result.current.state.sessions[0].template.slots[0]).toEqual({
        kind: 'seat',
        id: 'mock-id-4',
        playerId: null,
      });
    });
  });

  describe('template slot helpers', () => {
    it('adds seat, spacer, and storyteller slots', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Session', 'script-1', []);
      });
      const sessionId = result.current.state.sessions[0].id;
      act(() => {
        result.current.addTemplateSeat(sessionId);
        result.current.addTemplateSpacer(sessionId);
        result.current.addTemplateStoryteller(sessionId);
      });

      expect(result.current.state.sessions[0].template.slots).toEqual([
        { kind: 'seat', id: 'mock-id-2', playerId: null },
        { kind: 'spacer', id: 'mock-id-3' },
        { kind: 'storyteller', id: 'mock-id-4' },
      ]);
    });

    it('removes and moves template slots', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Session', 'script-1', ['Alice', 'Bob', 'Charlie']);
      });
      const sessionId = result.current.state.sessions[0].id;
      const firstSlotId = result.current.state.sessions[0].template.slots[0].id;
      const secondSlotId = result.current.state.sessions[0].template.slots[1].id;

      act(() => {
        result.current.moveTemplateSlot(sessionId, firstSlotId, 2);
      });
      expect(result.current.state.sessions[0].template.slots[2].id).toBe(firstSlotId);

      act(() => {
        result.current.removeTemplateSlot(sessionId, secondSlotId);
      });
      expect(result.current.state.sessions[0].template.slots.map((s) => s.id)).not.toContain(
        secondSlotId,
      );
    });

    it('assigns and clears a player in a template seat', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Session', 'script-1', ['Alice']);
      });
      const sessionId = result.current.state.sessions[0].id;
      const playerId = result.current.state.sessions[0].players[0].id;
      act(() => {
        result.current.addTemplateSeat(sessionId);
      });
      const newSlotId = result.current.state.sessions[0].template.slots[1].id;

      act(() => {
        result.current.assignTemplateSeat(sessionId, newSlotId, playerId);
      });
      expect(result.current.state.sessions[0].template.slots[0]).toEqual({
        kind: 'seat',
        id: 'mock-id-3',
        playerId: null,
      });
      expect(result.current.state.sessions[0].template.slots[1]).toEqual({
        kind: 'seat',
        id: 'mock-id-4',
        playerId,
      });

      act(() => {
        result.current.assignTemplateSeat(sessionId, newSlotId, null);
      });
      expect(result.current.state.sessions[0].template.slots[1]).toEqual({
        kind: 'seat',
        id: 'mock-id-4',
        playerId: null,
      });
    });

    it('updates the propagation default', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Session', 'script-1', []);
      });
      const sessionId = result.current.state.sessions[0].id;
      act(() => {
        result.current.setPropagationDefault(sessionId, { toOtherGames: false });
      });

      expect(result.current.state.sessions[0].propagationDefault).toEqual({
        toTemplate: true,
        toOtherGames: false,
      });
    });
  });

  describe('addGameToSession', () => {
    it('creates and persists a game snapshot from the session template', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Session', 'boozling', ['Alice', 'Bob']);
      });
      const session = result.current.state.sessions[0];
      act(() => {
        result.current.addGameToSession(session.id);
      });

      expect(result.current.state.sessions[0].gameIds).toHaveLength(1);
      expect(result.current.state.activeGameId).toBe(result.current.state.sessions[0].gameIds[0]);
      const game = readGame(result.current.state.sessions[0].gameIds[0]);
      expect(game.sessionId).toBe(session.id);
      expect(game.scriptId).toBe('boozling');
      expect(game.currentPhase).toBe(Phase.Day);
      expect(game.currentDay).toBe(1);
      expect(game.isFirstNight).toBe(true);
      expect(game.slots).toEqual([
        { kind: 'seat', id: 'mock-id-7', playerId: 'mock-id-2' },
        { kind: 'seat', id: 'mock-id-8', playerId: 'mock-id-3' },
      ]);
      expect(game.participants).toEqual([
        { playerId: 'mock-id-2', isTraveller: false },
        { playerId: 'mock-id-3', isTraveller: false },
      ]);
      expect(game.playerState['mock-id-2']).toEqual(
        expect.objectContaining({
          characterId: '',
          alive: true,
          ghostVoteUsed: false,
          visibleAlignment: Alignment.Unknown,
          actualAlignment: Alignment.Unknown,
        }),
      );
      expect(game.playerCountOverride).toBeNull();
      expect(game.nightHistory).toEqual([]);
    });

    it('auto-populates active Loric and Fabled from a stored script', () => {
      const { result } = renderSessionHook();
      localStorage.setItem(
        'storyteller-script-m35-test',
        JSON.stringify({ characterIds: ['stormcatcher', 'djinn', 'imp'] }),
      );

      act(() => {
        result.current.createSession('Session', 'm35-test', ['Alice']);
      });
      const sessionId = result.current.state.sessions[0].id;
      act(() => {
        result.current.addGameToSession(sessionId);
      });

      const game = readGame(result.current.state.sessions[0].gameIds[0]);
      expect(game.activeLoric).toEqual(['stormcatcher']);
      expect(game.activeFabled).toEqual(['djinn']);
    });

    it('does nothing for a non-existent session', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.addGameToSession('missing');
      });

      expect(result.current.state.activeGameId).toBeNull();
    });

    it('can add multiple unique games to one session', () => {
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

      const gameIds = result.current.state.sessions[0].gameIds;
      expect(gameIds).toHaveLength(2);
      expect(gameIds[0]).not.toBe(gameIds[1]);
    });
  });

  describe('getActiveSession and getActiveGame', () => {
    it('returns null when nothing is active', () => {
      const { result } = renderSessionHook();

      expect(result.current.getActiveSession()).toBeNull();
      expect(result.current.getActiveGame()).toBeNull();
    });

    it('returns the active session and game', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Session A', 'boozling', ['Alice']);
      });
      const sessionId = result.current.state.sessions[0].id;
      act(() => {
        result.current.addGameToSession(sessionId);
      });

      expect(result.current.getActiveSession()?.name).toBe('Session A');
      expect(result.current.getActiveGame()?.sessionId).toBe(sessionId);
    });

    it('returns null when active IDs point to removed storage', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Session', 'boozling', ['Alice']);
      });
      const sessionId = result.current.state.sessions[0].id;
      act(() => {
        result.current.addGameToSession(sessionId);
      });
      const gameId = result.current.state.activeGameId!;
      localStorage.removeItem(`storyteller-game-${gameId}`);

      expect(result.current.getActiveGame()).toBeNull();
    });
  });

  describe('localStorage persistence', () => {
    it('persists session state via useLocalStorage', () => {
      const { result } = renderSessionHook();

      act(() => {
        result.current.createSession('Persisted Session', 'script-1', ['Alice']);
      });
      act(() => {
        vi.advanceTimersByTime(350);
      });

      const raw = localStorage.getItem('storyteller-sessions');
      expect(raw).not.toBeNull();
      const persisted = JSON.parse(raw!) as { sessions: Session[] };
      expect(persisted.sessions[0].name).toBe('Persisted Session');
      expect(persisted.sessions[0].players[0].name).toBe('Alice');
    });

    it('loads session state from localStorage on mount', () => {
      const existingState = {
        sessions: [makeSession({ id: 'preloaded', name: 'Preloaded Session' })],
        activeSessionId: 'preloaded',
        activeGameId: null,
      };
      localStorage.setItem('storyteller-sessions', JSON.stringify(existingState));

      const { result } = renderSessionHook();

      expect(result.current.state.sessions[0].name).toBe('Preloaded Session');
      expect(result.current.state.sessions[0].players).toHaveLength(2);
      expect(result.current.state.activeSessionId).toBe('preloaded');
    });

    it('falls back to initial state for corrupted or missing localStorage', () => {
      localStorage.setItem('storyteller-sessions', '{invalid json!!!');
      const { result, unmount } = renderSessionHook();
      expect(result.current.state.sessions).toEqual([]);
      unmount();

      localStorage.clear();
      const next = renderSessionHook();
      expect(next.result.current.state.sessions).toEqual([]);
    });
  });

  describe('sync helpers', () => {
    it('syncSession accepts a newer remote session', () => {
      const { result } = renderSessionHook();
      const remote = makeSession({ id: 'remote-session', version: 2 });

      act(() => {
        result.current.syncSession(remote);
      });

      expect(result.current.state.sessions).toEqual([remote]);
    });

    it('syncSession ignores an older remote session', () => {
      const { result } = renderSessionHook();
      const local = makeSession({ id: 'same-session', name: 'Local', version: 3 });
      const remote = makeSession({ id: 'same-session', name: 'Remote', version: 2 });

      act(() => {
        result.current.syncSession(local);
      });
      act(() => {
        result.current.syncSession(remote);
      });

      expect(result.current.state.sessions[0].name).toBe('Local');
    });
  });

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

      expect(result.current.state.sessions).not.toBe(sessionsBefore);
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

      expect(result.current.state.sessions[0]).not.toBe(sessionBefore);
      expect(sessionBefore.name).toBe('Session');
    });
  });

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
