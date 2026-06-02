import { useReducer, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Session, Game, PlayerSeat } from '@/types/index.ts';
import { Phase, Alignment } from '@/types/index.ts';
import { useLocalStorage } from '@/hooks/useLocalStorage.ts';
import { generateId } from '@/utils/idGenerator.ts';
import { useApiSync, isSyncDisabled } from '@/hooks/useApiSync.ts';
import { getCharacter } from '@/data/characters/index.ts';
import { SessionContext } from './useSession.ts';

function getSetupPowersForScript(scriptId: string): Pick<Game, 'activeFabled' | 'activeLoric'> {
  try {
    const raw = localStorage.getItem(`storyteller-script-${scriptId}`);
    if (!raw) return {};
    const script = JSON.parse(raw) as { characterIds?: string[] };
    const activeFabled: string[] = [];
    const activeLoric: string[] = [];
    for (const characterId of script.characterIds ?? []) {
      const character = getCharacter(characterId);
      if (character?.type === 'Fabled') activeFabled.push(characterId);
      if (character?.type === 'Loric') activeLoric.push(characterId);
    }
    return {
      activeFabled: activeFabled.length > 0 ? activeFabled : undefined,
      activeLoric: activeLoric.length > 0 ? activeLoric : undefined,
    };
  } catch {
    return {};
  }
}

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
  | { type: 'SWAP_SESSION_PLAYERS'; payload: { sessionId: string; seatA: number; seatB: number } }
  | {
      type: 'SHIFT_SESSION_PLAYERS';
      payload: { sessionId: string; startSeat: number; shiftBy: number };
    }
  | {
      type: 'INSERT_SESSION_PLAYER_SLOT';
      payload: { sessionId: string; atSeat: number; playerName: string };
    }
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

    case 'SWAP_SESSION_PLAYERS': {
      const { sessionId, seatA, seatB } = action.payload;
      if (seatA === seatB) return state;
      return {
        ...state,
        sessions: state.sessions.map((session) => {
          if (session.id !== sessionId) return session;
          const playerA = session.defaultPlayers.find((player) => player.seat === seatA);
          const playerB = session.defaultPlayers.find((player) => player.seat === seatB);
          if (!playerA || !playerB) return session;
          return {
            ...session,
            defaultPlayers: session.defaultPlayers.map((player) => {
              if (player.seat === seatA) return { ...playerB, seat: seatA };
              if (player.seat === seatB) return { ...playerA, seat: seatB };
              return player;
            }),
          };
        }),
      };
    }

    case 'SHIFT_SESSION_PLAYERS': {
      const { sessionId, startSeat, shiftBy } = action.payload;
      if (shiftBy === 0) return state;
      return {
        ...state,
        sessions: state.sessions.map((session) => {
          if (session.id !== sessionId) return session;
          return {
            ...session,
            defaultPlayers: shiftDefaultPlayers(session.defaultPlayers, startSeat, shiftBy),
          };
        }),
      };
    }

    case 'INSERT_SESSION_PLAYER_SLOT': {
      const { sessionId, atSeat, playerName } = action.payload;
      if (atSeat < 1) return state;
      return {
        ...state,
        sessions: state.sessions.map((session) => {
          if (session.id !== sessionId) return session;
          return {
            ...session,
            defaultPlayers: insertDefaultPlayer(session.defaultPlayers, atSeat, playerName),
          };
        }),
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

export interface SessionContextValue {
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
  addGameToSession: (sessionId: string, reuseLastSeating?: boolean) => void;
  deleteGame: (sessionId: string, gameId: string) => void;
  swapSessionPlayers: (sessionId: string, seatA: number, seatB: number) => void;
  shiftSessionPlayers: (sessionId: string, startSeat: number, shiftBy: number) => void;
  insertSessionPlayerSlot: (sessionId: string, atSeat: number, playerName: string) => void;
  getActiveSession: () => Session | null;
  getActiveGame: () => Game | null;
  syncSession: (session: Session) => void;
}

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
    (sessionId: string, reuseLastSeating = true) => {
      const session = state.sessions.find((s) => s.id === sessionId);
      if (!session) return;

      const gameId = generateId();
      const gameNumber = session.gameIds.length + 1;

      // If there's a previous game, carry forward its players; else use session defaults
      let players: PlayerSeat[];
      const lastGameId = session.gameIds[session.gameIds.length - 1];

      if (lastGameId && reuseLastSeating) {
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

      const setupPowers = getSetupPowersForScript(session.defaultScriptId);

      const game: Game = {
        id: gameId,
        sessionId,
        scriptId: session.defaultScriptId,
        currentDay: 1,
        currentPhase: Phase.Day,
        isFirstNight: true,
        players,
        nightHistory: [],
        ...setupPowers,
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

  const swapSessionPlayers = useCallback((sessionId: string, seatA: number, seatB: number) => {
    dispatch({ type: 'SWAP_SESSION_PLAYERS', payload: { sessionId, seatA, seatB } });
  }, []);

  const shiftSessionPlayers = useCallback(
    (sessionId: string, startSeat: number, shiftBy: number) => {
      dispatch({ type: 'SHIFT_SESSION_PLAYERS', payload: { sessionId, startSeat, shiftBy } });
    },
    [],
  );

  const insertSessionPlayerSlot = useCallback(
    (sessionId: string, atSeat: number, playerName: string) => {
      dispatch({ type: 'INSERT_SESSION_PLAYER_SLOT', payload: { sessionId, atSeat, playerName } });
    },
    [],
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
    swapSessionPlayers,
    shiftSessionPlayers,
    insertSessionPlayerSlot,
    getActiveSession,
    getActiveGame,
    syncSession,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
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

function shiftDefaultPlayers(
  players: Array<{ seat: number; playerName: string }>,
  startSeat: number,
  shiftBy: number,
): Array<{ seat: number; playerName: string }> {
  const affected = players
    .filter((player) => player.seat >= startSeat)
    .sort((a, b) => a.seat - b.seat);
  if (affected.length <= 1) return players;
  const normalizedShift = ((shiftBy % affected.length) + affected.length) % affected.length;
  if (normalizedShift === 0) return players;
  const seatMap = new Map<number, number>();
  affected.forEach((player, index) => {
    const targetIndex = (index + normalizedShift) % affected.length;
    seatMap.set(player.seat, affected[targetIndex].seat);
  });
  return players
    .map((player) => ({ ...player, seat: seatMap.get(player.seat) ?? player.seat }))
    .sort((a, b) => a.seat - b.seat);
}

function insertDefaultPlayer(
  players: Array<{ seat: number; playerName: string }>,
  atSeat: number,
  playerName: string,
): Array<{ seat: number; playerName: string }> {
  return [
    ...players.map((player) =>
      player.seat >= atSeat ? { ...player, seat: player.seat + 1 } : player,
    ),
    { seat: atSeat, playerName },
  ].sort((a, b) => a.seat - b.seat);
}
