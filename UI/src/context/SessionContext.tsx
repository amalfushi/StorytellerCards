import { useReducer, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type {
  Session,
  Game,
  Player,
  PlayerId,
  Slot,
  SlotId,
  PropagationPreference,
} from '@/types/index.ts';
import { Phase } from '@/types/index.ts';
import { useLocalStorage } from '@/hooks/useLocalStorage.ts';
import { generateId } from '@/utils/idGenerator.ts';
import { useApiSync, isSyncDisabled } from '@/hooks/useApiSync.ts';
import { getCharacter } from '@/data/characters/index.ts';
import {
  snapshotTemplateSlots,
  initialParticipantsFromSlots,
  makeDefaultPlayerGameState,
  moveSlot,
  setSeatPlayer,
  clearPlayerFromSlots,
  hasGameStarted,
} from '@/utils/seating/index.ts';
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

function getDefaultParticipantIds(session: Session): PlayerId[] {
  const rosterIds = new Set(session.players.map((player) => player.id));
  const storedIds =
    session.defaultParticipantIds ??
    initialParticipantsFromSlots(session.template.slots).map((participant) => participant.playerId);
  return storedIds.filter((playerId) => rosterIds.has(playerId));
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

const DEFAULT_PROPAGATION: PropagationPreference = {
  toTemplate: true,
  toOtherGames: true,
};

// ──────────────────────────────────────────────
// Actions
// ──────────────────────────────────────────────

type SessionAction =
  | { type: 'CREATE_SESSION'; payload: { name: string; scriptId: string; playerNames: string[] } }
  | { type: 'DELETE_SESSION'; payload: { id: string } }
  | { type: 'SET_ACTIVE_SESSION'; payload: { id: string | null } }
  | { type: 'SET_ACTIVE_GAME'; payload: { gameId: string | null } }
  | {
      type: 'UPDATE_SESSION';
      payload: {
        id: string;
        name?: string;
        defaultScriptId?: string;
      };
    }
  | {
      type: 'ADD_PLAYER';
      payload: { sessionId: string; player: Player; slotId: SlotId };
    }
  | { type: 'RENAME_PLAYER'; payload: { sessionId: string; playerId: PlayerId; name: string } }
  | { type: 'REMOVE_PLAYER'; payload: { sessionId: string; playerId: PlayerId } }
  | {
      type: 'SET_DEFAULT_PARTICIPANT';
      payload: { sessionId: string; playerId: PlayerId; included: boolean };
    }
  | { type: 'ADD_TEMPLATE_SEAT'; payload: { sessionId: string; slotId: SlotId } }
  | { type: 'ADD_TEMPLATE_SPACER'; payload: { sessionId: string; slotId: SlotId } }
  | { type: 'ADD_TEMPLATE_STORYTELLER'; payload: { sessionId: string; slotId: SlotId } }
  | { type: 'REMOVE_TEMPLATE_SLOT'; payload: { sessionId: string; slotId: SlotId } }
  | { type: 'MOVE_TEMPLATE_SLOT'; payload: { sessionId: string; slotId: SlotId; toIndex: number } }
  | {
      type: 'ASSIGN_TEMPLATE_SEAT';
      payload: { sessionId: string; slotId: SlotId; playerId: PlayerId | null };
    }
  | { type: 'REPLACE_TEMPLATE_SLOTS'; payload: { sessionId: string; slots: Slot[] } }
  | {
      type: 'SET_PROPAGATION_DEFAULT';
      payload: { sessionId: string; pref: Partial<PropagationPreference> };
    }
  | { type: 'ADD_GAME_TO_SESSION'; payload: { sessionId: string; game: Game } }
  | { type: 'APPLY_TEMPLATE_TO_GAME'; payload: { sessionId: string; game: Game } }
  | { type: 'HYDRATE'; payload: SessionState }
  | { type: 'DELETE_GAME'; payload: { sessionId: string; gameId: string } }
  | { type: 'SYNC_SESSION'; payload: { session: Session } }
  | { type: 'MERGE_REMOTE_SESSIONS'; payload: { sessions: Session[] } };

// ──────────────────────────────────────────────
// Reducer
// ──────────────────────────────────────────────

function mapSession(
  state: SessionState,
  sessionId: string,
  fn: (s: Session) => Session,
): SessionState {
  return {
    ...state,
    sessions: state.sessions.map((s) => (s.id === sessionId ? fn(s) : s)),
  };
}

function buildGameFromTemplate(session: Session, existing: Game): Game | null {
  if (hasGameStarted(existing)) return null;

  const slotIdMap: Record<string, string> = {};
  for (const slot of session.template.slots) slotIdMap[slot.id] = generateId();
  const templateSlots = snapshotTemplateSlots(session.template.slots, slotIdMap);
  const existingParticipants =
    existing.participants ??
    getDefaultParticipantIds(session).map((playerId) => ({
      playerId,
      isTraveller: false,
    }));
  const rosterIds = new Set(session.players.map((player) => player.id));
  const participants = [...existingParticipants];
  const participantIds = new Set(existingParticipants.map((participant) => participant.playerId));
  for (const slot of templateSlots) {
    if (
      slot.kind === 'seat' &&
      slot.playerId !== null &&
      rosterIds.has(slot.playerId) &&
      !participantIds.has(slot.playerId)
    ) {
      participants.push({ playerId: slot.playerId, isTraveller: false });
      participantIds.add(slot.playerId);
    }
  }
  const slots = templateSlots.map((slot) =>
    slot.kind === 'seat' && slot.playerId !== null && !participantIds.has(slot.playerId)
      ? { ...slot, playerId: null }
      : slot,
  );
  const preservedPlayerState: Record<PlayerId, ReturnType<typeof makeDefaultPlayerGameState>> = {};
  for (const participant of participants) {
    preservedPlayerState[participant.playerId] =
      existing.playerState?.[participant.playerId] ?? makeDefaultPlayerGameState();
  }

  return {
    ...existing,
    slots,
    participants,
    playerState: preservedPlayerState,
    seatingConfirmed: false,
  };
}

function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'HYDRATE':
      return action.payload;

    case 'CREATE_SESSION': {
      const { name, scriptId, playerNames } = action.payload;
      const id = generateId();
      const players: Player[] = playerNames.map((n) => ({ id: generateId(), name: n }));
      const slots: Slot[] = players.map(
        (p): Slot => ({ kind: 'seat', id: generateId(), playerId: p.id }),
      );
      const session: Session = {
        id,
        name,
        createdAt: new Date().toISOString(),
        defaultScriptId: scriptId,
        players,
        defaultParticipantIds: players.map((player) => player.id),
        template: { slots },
        propagationDefault: { ...DEFAULT_PROPAGATION },
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
      const { id, name, defaultScriptId } = action.payload;
      return mapSession(state, id, (s) => ({
        ...s,
        ...(name !== undefined && { name }),
        ...(defaultScriptId !== undefined && { defaultScriptId }),
      }));
    }

    case 'ADD_PLAYER': {
      const { sessionId, player, slotId } = action.payload;
      return mapSession(state, sessionId, (s) => {
        const defaultParticipantIds = getDefaultParticipantIds(s);
        return {
          ...s,
          players: [...s.players, player],
          defaultParticipantIds: [...defaultParticipantIds, player.id],
          template: {
            slots: [...s.template.slots, { kind: 'seat', id: slotId, playerId: player.id }],
          },
        };
      });
    }

    case 'RENAME_PLAYER': {
      const { sessionId, playerId, name } = action.payload;
      return mapSession(state, sessionId, (s) => ({
        ...s,
        players: s.players.map((p) => (p.id === playerId ? { ...p, name } : p)),
      }));
    }

    case 'REMOVE_PLAYER': {
      const { sessionId, playerId } = action.payload;
      return mapSession(state, sessionId, (s) => ({
        ...s,
        players: s.players.filter((p) => p.id !== playerId),
        defaultParticipantIds: getDefaultParticipantIds(s).filter((id) => id !== playerId),
        template: { slots: clearPlayerFromSlots(s.template.slots, playerId) },
      }));
    }

    case 'SET_DEFAULT_PARTICIPANT': {
      const { sessionId, playerId, included } = action.payload;
      return mapSession(state, sessionId, (s) => {
        if (included && !s.players.some((player) => player.id === playerId)) return s;
        const current = getDefaultParticipantIds(s);
        const defaultParticipantIds = included
          ? current.includes(playerId)
            ? current
            : [...current, playerId]
          : current.filter((id) => id !== playerId);
        return { ...s, defaultParticipantIds };
      });
    }

    case 'ADD_TEMPLATE_SEAT': {
      const { sessionId, slotId } = action.payload;
      return mapSession(state, sessionId, (s) => ({
        ...s,
        template: {
          slots: [...s.template.slots, { kind: 'seat', id: slotId, playerId: null }],
        },
      }));
    }

    case 'ADD_TEMPLATE_SPACER': {
      const { sessionId, slotId } = action.payload;
      return mapSession(state, sessionId, (s) => ({
        ...s,
        template: { slots: [...s.template.slots, { kind: 'spacer', id: slotId }] },
      }));
    }

    case 'ADD_TEMPLATE_STORYTELLER': {
      const { sessionId, slotId } = action.payload;
      return mapSession(state, sessionId, (s) => ({
        ...s,
        template: { slots: [...s.template.slots, { kind: 'storyteller', id: slotId }] },
      }));
    }

    case 'REMOVE_TEMPLATE_SLOT': {
      const { sessionId, slotId } = action.payload;
      return mapSession(state, sessionId, (s) => ({
        ...s,
        template: { slots: s.template.slots.filter((sl) => sl.id !== slotId) },
      }));
    }

    case 'MOVE_TEMPLATE_SLOT': {
      const { sessionId, slotId, toIndex } = action.payload;
      return mapSession(state, sessionId, (s) => ({
        ...s,
        template: { slots: moveSlot(s.template.slots, slotId, toIndex) },
      }));
    }

    case 'ASSIGN_TEMPLATE_SEAT': {
      const { sessionId, slotId, playerId } = action.payload;
      return mapSession(state, sessionId, (s) => ({
        ...s,
        template: { slots: setSeatPlayer(s.template.slots, slotId, playerId) },
      }));
    }

    case 'REPLACE_TEMPLATE_SLOTS': {
      const { sessionId, slots } = action.payload;
      return mapSession(state, sessionId, (s) => ({
        ...s,
        template: { slots },
      }));
    }

    case 'SET_PROPAGATION_DEFAULT': {
      const { sessionId, pref } = action.payload;
      return mapSession(state, sessionId, (s) => ({
        ...s,
        propagationDefault: { ...s.propagationDefault, ...pref },
      }));
    }

    case 'ADD_GAME_TO_SESSION': {
      const { sessionId, game } = action.payload;
      try {
        localStorage.setItem(`storyteller-game-${game.id}`, JSON.stringify(game));
      } catch {
        // Silently ignore storage errors
      }
      return {
        ...mapSession(state, sessionId, (s) => ({ ...s, gameIds: [...s.gameIds, game.id] })),
        activeGameId: game.id,
      };
    }

    case 'APPLY_TEMPLATE_TO_GAME': {
      const { sessionId, game } = action.payload;
      try {
        localStorage.setItem(`storyteller-game-${game.id}`, JSON.stringify(game));
      } catch {
        // Silently ignore storage errors
      }
      // Bump session version so SSE/sync detects the change.
      return mapSession(state, sessionId, (s) => ({
        ...s,
        version: (s.version ?? 0) + 1,
      }));
    }

    case 'DELETE_GAME': {
      const { sessionId, gameId } = action.payload;
      try {
        localStorage.removeItem(`storyteller-game-${gameId}`);
      } catch {
        // Silently ignore storage errors
      }
      try {
        localStorage.removeItem(`storyteller-setup-checklist-${gameId}`);
      } catch {
        // Silently ignore storage errors
      }
      return {
        ...mapSession(state, sessionId, (s) => ({
          ...s,
          gameIds: s.gameIds.filter((gid) => gid !== gameId),
        })),
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

// ──────────────────────────────────────────────
// Context value shape
// ──────────────────────────────────────────────

export interface SessionContextValue {
  state: SessionState;
  dispatch: React.Dispatch<SessionAction>;
  createSession: (name: string, scriptId: string, playerNames: string[]) => void;
  deleteSession: (id: string) => void;
  selectSession: (id: string | null) => void;
  selectGame: (sessionId: string, gameId: string) => void;
  updateSession: (id: string, updates: { name?: string; defaultScriptId?: string }) => void;
  addPlayer: (sessionId: string, name: string) => Player;
  renamePlayer: (sessionId: string, playerId: PlayerId, name: string) => void;
  removePlayer: (sessionId: string, playerId: PlayerId) => void;
  setDefaultParticipant: (sessionId: string, playerId: PlayerId, included: boolean) => void;
  addTemplateSeat: (sessionId: string) => SlotId;
  addTemplateSpacer: (sessionId: string) => SlotId;
  addTemplateStoryteller: (sessionId: string) => SlotId;
  removeTemplateSlot: (sessionId: string, slotId: SlotId) => void;
  moveTemplateSlot: (sessionId: string, slotId: SlotId, toIndex: number) => void;
  assignTemplateSeat: (sessionId: string, slotId: SlotId, playerId: PlayerId | null) => void;
  setPropagationDefault: (sessionId: string, pref: Partial<PropagationPreference>) => void;
  addGameToSession: (sessionId: string) => void;
  applyTemplateToGame: (sessionId: string, gameId: string) => void;
  deleteGame: (sessionId: string, gameId: string) => void;
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
  const [state, dispatch] = useReducer(sessionReducer, persisted);
  const isSyncingRef = useRef(false);

  const {
    syncSession: apiPushSession,
    syncGame: apiPushGame,
    fetchSessions: apiFetchSessions,
    deleteSession: apiDeleteSession,
    deleteGame: apiDeleteGame,
  } = useApiSync();

  useEffect(() => {
    setPersisted(state);
  }, [state, setPersisted]);

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

  const createSession = useCallback((name: string, scriptId: string, playerNames: string[]) => {
    dispatch({ type: 'CREATE_SESSION', payload: { name, scriptId, playerNames } });
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
    (id: string, updates: { name?: string; defaultScriptId?: string }) => {
      dispatch({ type: 'UPDATE_SESSION', payload: { id, ...updates } });
    },
    [],
  );

  const addPlayer = useCallback((sessionId: string, name: string): Player => {
    const player: Player = { id: generateId(), name };
    dispatch({
      type: 'ADD_PLAYER',
      payload: { sessionId, player, slotId: generateId() },
    });
    return player;
  }, []);

  const renamePlayer = useCallback((sessionId: string, playerId: PlayerId, name: string) => {
    dispatch({ type: 'RENAME_PLAYER', payload: { sessionId, playerId, name } });
  }, []);

  const removePlayer = useCallback((sessionId: string, playerId: PlayerId) => {
    dispatch({ type: 'REMOVE_PLAYER', payload: { sessionId, playerId } });
  }, []);

  const setDefaultParticipant = useCallback(
    (sessionId: string, playerId: PlayerId, included: boolean) => {
      dispatch({
        type: 'SET_DEFAULT_PARTICIPANT',
        payload: { sessionId, playerId, included },
      });
    },
    [],
  );

  const addTemplateSeat = useCallback((sessionId: string): SlotId => {
    const slotId = generateId();
    dispatch({ type: 'ADD_TEMPLATE_SEAT', payload: { sessionId, slotId } });
    return slotId;
  }, []);

  const addTemplateSpacer = useCallback((sessionId: string): SlotId => {
    const slotId = generateId();
    dispatch({ type: 'ADD_TEMPLATE_SPACER', payload: { sessionId, slotId } });
    return slotId;
  }, []);

  const addTemplateStoryteller = useCallback((sessionId: string): SlotId => {
    const slotId = generateId();
    dispatch({ type: 'ADD_TEMPLATE_STORYTELLER', payload: { sessionId, slotId } });
    return slotId;
  }, []);

  const removeTemplateSlot = useCallback((sessionId: string, slotId: SlotId) => {
    dispatch({ type: 'REMOVE_TEMPLATE_SLOT', payload: { sessionId, slotId } });
  }, []);

  const moveTemplateSlot = useCallback((sessionId: string, slotId: SlotId, toIndex: number) => {
    dispatch({ type: 'MOVE_TEMPLATE_SLOT', payload: { sessionId, slotId, toIndex } });
  }, []);

  const assignTemplateSeat = useCallback(
    (sessionId: string, slotId: SlotId, playerId: PlayerId | null) => {
      dispatch({ type: 'ASSIGN_TEMPLATE_SEAT', payload: { sessionId, slotId, playerId } });
    },
    [],
  );

  const setPropagationDefault = useCallback(
    (sessionId: string, pref: Partial<PropagationPreference>) => {
      dispatch({ type: 'SET_PROPAGATION_DEFAULT', payload: { sessionId, pref } });
    },
    [],
  );

  const addGameToSession = useCallback(
    (sessionId: string) => {
      const session = state.sessions.find((s) => s.id === sessionId);
      if (!session) return;

      const gameId = generateId();
      const slotIdMap: Record<string, string> = {};
      for (const s of session.template.slots) slotIdMap[s.id] = generateId();
      const slots = snapshotTemplateSlots(session.template.slots, slotIdMap);
      const participants = getDefaultParticipantIds(session).map((playerId) => ({
        playerId,
        isTraveller: false,
      }));
      const playerState: Record<PlayerId, ReturnType<typeof makeDefaultPlayerGameState>> = {};
      for (const p of participants) {
        playerState[p.playerId] = makeDefaultPlayerGameState();
      }

      const setupPowers = getSetupPowersForScript(session.defaultScriptId);

      const game: Game = {
        id: gameId,
        sessionId,
        scriptId: session.defaultScriptId,
        currentDay: 1,
        currentPhase: Phase.Day,
        isFirstNight: true,
        slots,
        participants,
        playerState,
        playerCountOverride: null,
        seatingConfirmed: false,
        nightHistory: [],
        ...setupPowers,
      };

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

  const applyTemplateToGame = useCallback(
    (sessionId: string, gameId: string) => {
      const session = state.sessions.find((candidate) => candidate.id === sessionId);
      if (!session) return;

      try {
        const raw = localStorage.getItem(`storyteller-game-${gameId}`);
        if (!raw) return;
        const game = buildGameFromTemplate(session, JSON.parse(raw) as Game);
        if (!game) return;
        dispatch({ type: 'APPLY_TEMPLATE_TO_GAME', payload: { sessionId, game } });
        apiPushGame(game);
      } catch {
        // Ignore invalid or unavailable local game state.
      }
    },
    [apiPushGame, state.sessions],
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
    addPlayer,
    renamePlayer,
    removePlayer,
    setDefaultParticipant,
    addTemplateSeat,
    addTemplateSpacer,
    addTemplateStoryteller,
    removeTemplateSlot,
    moveTemplateSlot,
    assignTemplateSeat,
    setPropagationDefault,
    addGameToSession,
    applyTemplateToGame,
    deleteGame,
    getActiveSession,
    getActiveGame,
    syncSession,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
