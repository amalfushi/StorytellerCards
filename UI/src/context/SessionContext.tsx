import { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Session, Game, PlayerSeat } from '@/types/index.ts';
import { Phase, Alignment } from '@/types/index.ts';
import { useLocalStorage } from '@/hooks/useLocalStorage.ts';
import { generateId } from '@/utils/idGenerator.ts';
import { useApiSync, isSyncDisabled } from '@/hooks/useApiSync.ts';

// ──────────────────────────────────────────────
// State
// ──────────────────────────────────────────────

export interface SessionState {
  sessions: Session[];
  activeSessionId: string | null;
  activeGameId: string | null;
}

const INITIAL_STATE: SessionState = {
  sessions: [],
  activeSessionId: null,
  activeGameId: null,
};

// ──────────────────────────────────────────────
// Actions
// ──────────────────────────────────────────────

type SessionAction =
  | { type: 'CREATE_SESSION'; payload: { name: string; scriptId: string; players: string[] } }
  | { type: 'DELETE_SESSION'; payload: { id: string } }
  | { type: 'SET_ACTIVE_SESSION'; payload: { id: string | null } }
  | { type: 'SET_ACTIVE_GAME'; payload: { gameId: string | null } }
  | {
      type: 'UPDATE_SESSION';
      payload: {
        id: string;
        name?: string;
        defaultPlayers?: Array<{ seat: number; playerName: string }>;
        defaultScriptId?: string;
      };
    }
  | { type: 'ADD_GAME_TO_SESSION'; payload: { sessionId: string; game: Game } }
  | { type: 'HYDRATE'; payload: SessionState }
  | { type: 'DELETE_GAME'; payload: { sessionId: string; gameId: string } }
  | { type: 'SYNC_SESSION'; payload: { session: Session } }
  | { type: 'MERGE_REMOTE_SESSIONS'; payload: { sessions: Session[] } };

// ──────────────────────────────────────────────
// Reducer
// ──────────────────────────────────────────────

function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'HYDRATE':
      return action.payload;

    case 'CREATE_SESSION': {
      const { name, scriptId, players } = action.payload;
      const id = generateId();
      const defaultPlayers = players.map((pName, i) => ({
        seat: i + 1,
        playerName: pName,
      }));
      const session: Session = {
        id,
        name,
        createdAt: new Date().toISOString(),
        defaultScriptId: scriptId,
        defaultPlayers,
        gameIds: [],
      };
      return {
        ...state,
        sessions: [...state.sessions, session],
        activeSessionId: id,
      };
    }

    case 'DELETE_SESSION': {
      const { id } = action.payload;
      // Clean up game data from localStorage
      const session = state.sessions.find((s) => s.id === id);
      if (session) {
        for (const gameId of session.gameIds) {
          try {
            localStorage.removeItem(`storyteller-game-${gameId}`);
          } catch {
            // Silently ignore storage errors
          }
        }
      }
      return {
        ...state,
        sessions: state.sessions.filter((s) => s.id !== id),
        activeSessionId: state.activeSessionId === id ? null : state.activeSessionId,
        activeGameId: state.activeSessionId === id ? null : state.activeGameId,
      };
    }

    case 'SET_ACTIVE_SESSION':
      return {
        ...state,
        activeSessionId: action.payload.id,
        activeGameId: null,
      };

    case 'SET_ACTIVE_GAME':
      return {
        ...state,
        activeGameId: action.payload.gameId,
      };

    case 'UPDATE_SESSION': {
      const { id, ...updates } = action.payload;
      return {
        ...state,
        sessions: state.sessions.map((s) => {
          if (s.id !== id) return s;
          return {
            ...s,
            ...(updates.name !== undefined && { name: updates.name }),
            ...(updates.defaultPlayers !== undefined && {
              defaultPlayers: updates.defaultPlayers,
            }),
            ...(updates.defaultScriptId !== undefined && {
              defaultScriptId: updates.defaultScriptId,
            }),
          };
        }),
      };
    }

    case 'ADD_GAME_TO_SESSION': {
      const { sessionId, game } = action.payload;
      // Persist the game itself
      try {
        localStorage.setItem(`storyteller-game-${game.id}`, JSON.stringify(game));
      } catch {
        // Silently ignore storage errors
      }
      return {
        ...state,
        sessions: state.sessions.map((s) => {
          if (s.id !== sessionId) return s;
          return { ...s, gameIds: [...s.gameIds, game.id] };
        }),
        activeGameId: game.id,
      };
    }

    case 'DELETE_GAME': {
      const { sessionId, gameId } = action.payload;
      // Remove game data from localStorage
      try {
        localStorage.removeItem(`storyteller-game-${gameId}`);
      } catch {
        // Silently ignore storage errors
      }
      // Remove setup checklist data
      try {
        localStorage.removeItem(`storyteller-setup-checklist-${gameId}`);
      } catch {
        // Silently ignore storage errors
      }
      return {
        ...state,
        sessions: state.sessions.map((s) => {
          if (s.id !== sessionId) return s;
          return { ...s, gameIds: s.gameIds.filter((gid) => gid !== gameId) };
        }),
        activeGameId: state.activeGameId === gameId ? null : state.activeGameId,
      };
    }

    case 'SYNC_SESSION': {
      const remote = action.payload.session;
      const localSession = state.sessions.find((s) => s.id === remote.id);
      const localVersion = localSession?.version ?? 0;
      const remoteVersion = remote.version ?? 0;
      if (remoteVersion <= localVersion) return state;
      return {
        ...state,
        sessions: localSession
          ? state.sessions.map((s) => (s.id === remote.id ? remote : s))
          : [...state.sessions, remote],
      };
    }

    case 'MERGE_REMOTE_SESSIONS': {
      const remoteSessions = action.payload.sessions;
      let merged = [...state.sessions];
      for (const remote of remoteSessions) {
        const localIdx = merged.findIndex((s) => s.id === remote.id);
        if (localIdx >= 0) {
          const localVersion = merged[localIdx].version ?? 0;
          const remoteVersion = remote.version ?? 0;
          if (remoteVersion > localVersion) {
            merged[localIdx] = remote;
          }
        } else {
          merged = [...merged, remote];
        }
      }
      if (
        merged.length === state.sessions.length &&
        merged.every((s, i) => s === state.sessions[i])
      ) {
        return state;
      }
      return { ...state, sessions: merged };
    }

    default:
      return state;
  }
}

/**
 * Wraps the base reducer. Version is managed by the server — the client
 * does not increment version locally.
 */
function sessionReducerWithVersion(state: SessionState, action: SessionAction): SessionState {
  return sessionReducer(state, action);
}

// ──────────────────────────────────────────────
// Context value shape
// ──────────────────────────────────────────────

interface SessionContextValue {
  state: SessionState;
  dispatch: React.Dispatch<SessionAction>;
  createSession: (name: string, scriptId: string, players: string[]) => void;
  deleteSession: (id: string) => void;
  selectSession: (id: string | null) => void;
  selectGame: (sessionId: string, gameId: string) => void;
  updateSession: (
    id: string,
    updates: {
      name?: string;
      defaultPlayers?: Array<{ seat: number; playerName: string }>;
      defaultScriptId?: string;
    },
  ) => void;
  addGameToSession: (sessionId: string) => void;
  deleteGame: (sessionId: string, gameId: string) => void;
  getActiveSession: () => Session | null;
  getActiveGame: () => Game | null;
  syncSession: (session: Session) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

// ──────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────

export function SessionProvider({ children }: { children: ReactNode }) {
  const [persisted, setPersisted] = useLocalStorage<SessionState>(
    'storyteller-sessions',
    INITIAL_STATE,
  );
  const [state, dispatch] = useReducer(sessionReducerWithVersion, persisted);
  const isSyncingRef = useRef(false);

  const {
    syncSession: apiPushSession,
    fetchSessions: apiFetchSessions,
    deleteSession: apiDeleteSession,
    deleteGame: apiDeleteGame,
  } = useApiSync();

  // Sync reducer state → localStorage whenever it changes
  useEffect(() => {
    setPersisted(state);
  }, [state, setPersisted]);

  // Fetch sessions from API on startup and merge with local state
  // Skipped when sync is disabled (local-only mode)
  useEffect(() => {
    if (isSyncDisabled) {
      console.info('[SessionContext] Sync disabled — skipping API fetch on startup');
      return;
    }
    let cancelled = false;
    console.info('[SessionContext] Fetching sessions from API on startup...');
    apiFetchSessions().then((remoteSessions) => {
      console.info(`[SessionContext] API returned ${remoteSessions.length} sessions`);
      if (cancelled || remoteSessions.length === 0) return;
      isSyncingRef.current = true;
      dispatch({ type: 'MERGE_REMOTE_SESSIONS', payload: { sessions: remoteSessions } });
    });
    return () => {
      cancelled = true;
    };
  }, [apiFetchSessions]);

  // Push active session to API when sessions change
  useEffect(() => {
    if (isSyncingRef.current) {
      isSyncingRef.current = false;
      return;
    }
    const activeSession = state.sessions.find((s) => s.id === state.activeSessionId);
    if (activeSession) {
      apiPushSession(activeSession);
    }
  }, [state.sessions, state.activeSessionId, apiPushSession]);

  // ── Helper functions ──

  const createSession = useCallback((name: string, scriptId: string, players: string[]) => {
    dispatch({ type: 'CREATE_SESSION', payload: { name, scriptId, players } });
  }, []);

  const deleteSession = useCallback(
    (id: string) => {
      dispatch({ type: 'DELETE_SESSION', payload: { id } });
      apiDeleteSession(id);
    },
    [apiDeleteSession],
  );

  const selectSession = useCallback((id: string | null) => {
    dispatch({ type: 'SET_ACTIVE_SESSION', payload: { id } });
  }, []);

  const selectGame = useCallback((sessionId: string, gameId: string) => {
    dispatch({ type: 'SET_ACTIVE_SESSION', payload: { id: sessionId } });
    dispatch({ type: 'SET_ACTIVE_GAME', payload: { gameId } });
  }, []);

  const updateSession = useCallback(
    (
      id: string,
      updates: {
        name?: string;
        defaultPlayers?: Array<{ seat: number; playerName: string }>;
        defaultScriptId?: string;
      },
    ) => {
      dispatch({ type: 'UPDATE_SESSION', payload: { id, ...updates } });
    },
    [],
  );

  const addGameToSession = useCallback(
    (sessionId: string) => {
      const session = state.sessions.find((s) => s.id === sessionId);
      if (!session) return;

      const gameId = generateId();
      const gameNumber = session.gameIds.length + 1;

      // If there's a previous game, carry forward its players; else use session defaults
      let players: PlayerSeat[];
      const lastGameId = session.gameIds[session.gameIds.length - 1];

      if (lastGameId) {
        try {
          const raw = localStorage.getItem(`storyteller-game-${lastGameId}`);
          if (raw) {
            const lastGame = JSON.parse(raw) as Game;
            players = lastGame.players
              .filter((p) => !p.isTraveller)
              .map((p) => ({
                ...p,
                characterId: '',
                alive: true,
                ghostVoteUsed: false,
                visibleAlignment: Alignment.Unknown,
                actualAlignment: Alignment.Unknown,
                startingAlignment: Alignment.Unknown,
                activeReminders: [],
                isTraveller: false,
                tokens: [],
              }));
          } else {
            players = buildPlayersFromDefaults(session);
          }
        } catch {
          players = buildPlayersFromDefaults(session);
        }
      } else {
        players = buildPlayersFromDefaults(session);
      }

      // Ensure players are always in sequential seat order
      players.sort((a, b) => a.seat - b.seat);

      const game: Game = {
        id: gameId,
        sessionId,
        scriptId: session.defaultScriptId,
        currentDay: 1,
        currentPhase: Phase.Day,
        isFirstNight: true,
        players,
        nightHistory: [],
      };

      // Also store a display label (Game 1, Game 2, etc.) — not part of Game type,
      // but the gameNumber can be derived from index in session.gameIds
      void gameNumber;

      dispatch({ type: 'ADD_GAME_TO_SESSION', payload: { sessionId, game } });
    },
    [state.sessions],
  );

  const deleteGame = useCallback(
    (sessionId: string, gameId: string) => {
      dispatch({ type: 'DELETE_GAME', payload: { sessionId, gameId } });
      apiDeleteGame(sessionId, gameId);
    },
    [apiDeleteGame],
  );

  const getActiveSession = useCallback((): Session | null => {
    if (!state.activeSessionId) return null;
    return state.sessions.find((s) => s.id === state.activeSessionId) ?? null;
  }, [state.sessions, state.activeSessionId]);

  const getActiveGame = useCallback((): Game | null => {
    if (!state.activeGameId) return null;
    try {
      const raw = localStorage.getItem(`storyteller-game-${state.activeGameId}`);
      if (!raw) return null;
      return JSON.parse(raw) as Game;
    } catch {
      return null;
    }
  }, [state.activeGameId]);

  const syncSession = useCallback((session: Session) => {
    isSyncingRef.current = true;
    dispatch({ type: 'SYNC_SESSION', payload: { session } });
  }, []);

  const value: SessionContextValue = {
    state,
    dispatch,
    createSession,
    deleteSession,
    selectSession,
    selectGame,
    updateSession,
    addGameToSession,
    deleteGame,
    getActiveSession,
    getActiveGame,
    syncSession,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

// ──────────────────────────────────────────────
// Hook
// ──────────────────────────────────────────────

// eslint-disable-next-line react-refresh/only-export-components
export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used within a <SessionProvider>');
  }
  return ctx;
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function buildPlayersFromDefaults(session: Session): PlayerSeat[] {
  return session.defaultPlayers.map((dp) => ({
    seat: dp.seat,
    playerName: dp.playerName,
    characterId: '',
    alive: true,
    ghostVoteUsed: false,
    visibleAlignment: Alignment.Unknown,
    actualAlignment: Alignment.Unknown,
    startingAlignment: Alignment.Unknown,
    activeReminders: [],
    isTraveller: false,
    tokens: [],
  }));
}
