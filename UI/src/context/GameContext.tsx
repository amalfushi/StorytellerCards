import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import type {
  Game,
  PlayerSeat,
  PlayerToken,
  NightProgress,
  NightHistoryEntry,
} from '@/types/index.ts';
import { Phase, Alignment } from '@/types/index.ts';

// ──────────────────────────────────────────────
// State
// ──────────────────────────────────────────────

export interface GameViewState {
  game: Game | null;
  /** false = day (safe view), true = night (storyteller view) */
  showCharacters: boolean;
  /** Non-null only during an active night phase walkthrough. */
  nightProgress: NightProgress | null;
}

const INITIAL_STATE: GameViewState = {
  game: null,
  showCharacters: false,
  nightProgress: null,
};

// ──────────────────────────────────────────────
// Actions
// ──────────────────────────────────────────────

type GameAction =
  | { type: 'LOAD_GAME'; payload: { game: Game } }
  | { type: 'SET_PHASE'; payload: { phase: Phase } }
  | { type: 'ADVANCE_DAY' }
  | { type: 'TOGGLE_SHOW_CHARACTERS' }
  | {
      type: 'UPDATE_PLAYER';
      payload: {
        seat: number;
        updates: Partial<
          Pick<
            PlayerSeat,
            | 'characterId'
            | 'alive'
            | 'ghostVoteUsed'
            | 'visibleAlignment'
            | 'actualAlignment'
            | 'startingAlignment'
            | 'activeReminders'
            | 'playerName'
          >
        >;
      };
    }
  | {
      type: 'ADD_TRAVELLER';
      payload: {
        seat: number;
        playerName: string;
        characterId: string;
        alignment: 'Good' | 'Evil';
      };
    }
  | { type: 'REMOVE_TRAVELLER'; payload: { seat: number } }
  | { type: 'START_NIGHT'; payload: { totalCards: number } }
  | {
      type: 'UPDATE_NIGHT_PROGRESS';
      payload: {
        characterId: string;
        subActionStates?: boolean[];
        note?: string;
        selection?: string | string[];
      };
    }
  | { type: 'COMPLETE_NIGHT' }
  | { type: 'SET_NIGHT_CARD_INDEX'; payload: { index: number } }
  | { type: 'SAVE_GAME' }
  | { type: 'ADD_TOKEN'; payload: { seat: number; token: PlayerToken } }
  | { type: 'REMOVE_TOKEN'; payload: { seat: number; tokenId: string } }
  | { type: 'UPDATE_NIGHT_HISTORY'; payload: { index: number; entry: NightHistoryEntry } };

// ──────────────────────────────────────────────
// Reducer
// ──────────────────────────────────────────────

function gameReducer(state: GameViewState, action: GameAction): GameViewState {
  switch (action.type) {
    case 'LOAD_GAME':
      return {
        ...state,
        game: action.payload.game,
        showCharacters: false,
        nightProgress: null,
      };

    case 'SET_PHASE': {
      if (!state.game) return state;
      return {
        ...state,
        game: { ...state.game, currentPhase: action.payload.phase },
      };
    }

    case 'ADVANCE_DAY': {
      if (!state.game) return state;
      return {
        ...state,
        game: {
          ...state.game,
          currentDay: state.game.currentDay + 1,
          isFirstNight: false,
        },
      };
    }

    case 'TOGGLE_SHOW_CHARACTERS':
      return { ...state, showCharacters: !state.showCharacters };

    case 'UPDATE_PLAYER': {
      if (!state.game) return state;
      const { seat, updates } = action.payload;
      return {
        ...state,
        game: {
          ...state.game,
          players: state.game.players.map((p) => (p.seat === seat ? { ...p, ...updates } : p)),
        },
      };
    }

    case 'ADD_TRAVELLER': {
      if (!state.game) return state;
      const { seat, playerName, characterId, alignment } = action.payload;
      const alignmentValue = alignment === 'Good' ? Alignment.Good : Alignment.Evil;
      const traveller: PlayerSeat = {
        seat,
        playerName,
        characterId,
        alive: true,
        ghostVoteUsed: false,
        visibleAlignment: Alignment.Unknown,
        actualAlignment: alignmentValue,
        startingAlignment: alignmentValue,
        activeReminders: [],
        isTraveller: true,
        tokens: [],
      };
      return {
        ...state,
        game: {
          ...state.game,
          players: [...state.game.players, traveller],
        },
      };
    }

    case 'REMOVE_TRAVELLER': {
      if (!state.game) return state;
      return {
        ...state,
        game: {
          ...state.game,
          players: state.game.players.filter(
            (p) => !(p.seat === action.payload.seat && p.isTraveller),
          ),
        },
      };
    }

    case 'START_NIGHT': {
      return {
        ...state,
        nightProgress: {
          currentCardIndex: 0,
          subActionStates: {},
          notes: {},
          selections: {},
          totalCards: action.payload.totalCards,
        },
      };
    }

    case 'UPDATE_NIGHT_PROGRESS': {
      if (!state.nightProgress) return state;
      const { characterId, subActionStates, note, selection } = action.payload;
      return {
        ...state,
        nightProgress: {
          ...state.nightProgress,
          subActionStates: subActionStates
            ? { ...state.nightProgress.subActionStates, [characterId]: subActionStates }
            : state.nightProgress.subActionStates,
          notes:
            note !== undefined
              ? { ...state.nightProgress.notes, [characterId]: note }
              : state.nightProgress.notes,
          selections:
            selection !== undefined
              ? { ...state.nightProgress.selections, [characterId]: selection }
              : state.nightProgress.selections,
        },
      };
    }

    case 'COMPLETE_NIGHT': {
      if (!state.game || !state.nightProgress) return state;
      // Snapshot each player's tokens keyed by characterId
      const tokenSnapshot: Record<string, PlayerToken[]> = {};
      for (const player of state.game.players) {
        if (player.tokens && player.tokens.length > 0) {
          tokenSnapshot[player.characterId] = [...player.tokens];
        }
      }
      const historyEntry: NightHistoryEntry = {
        dayNumber: state.game.currentDay,
        isFirstNight: state.game.isFirstNight,
        completedAt: new Date().toISOString(),
        subActionStates: { ...state.nightProgress.subActionStates },
        notes: { ...state.nightProgress.notes },
        selections: { ...state.nightProgress.selections },
        tokenSnapshot,
      };
      const updatedGame: Game = {
        ...state.game,
        nightHistory: [...state.game.nightHistory, historyEntry],
        currentPhase: Phase.Day,
        currentDay: state.game.currentDay + 1,
        isFirstNight: false,
      };
      // Persist completed game
      persistGame(updatedGame);
      return {
        ...state,
        game: updatedGame,
        nightProgress: null,
      };
    }

    case 'SAVE_GAME': {
      if (state.game) {
        persistGame(state.game);
      }
      return state;
    }

    case 'ADD_TOKEN': {
      if (!state.game) return state;
      const { seat: tokenSeat, token } = action.payload;
      return {
        ...state,
        game: {
          ...state.game,
          players: state.game.players.map((p) =>
            p.seat === tokenSeat ? { ...p, tokens: [...(p.tokens ?? []), token] } : p,
          ),
        },
      };
    }

    case 'REMOVE_TOKEN': {
      if (!state.game) return state;
      const { seat: rmSeat, tokenId } = action.payload;
      return {
        ...state,
        game: {
          ...state.game,
          players: state.game.players.map((p) =>
            p.seat === rmSeat
              ? { ...p, tokens: (p.tokens ?? []).filter((t) => t.id !== tokenId) }
              : p,
          ),
        },
      };
    }

    case 'UPDATE_NIGHT_HISTORY': {
      if (!state.game) return state;
      const { index, entry } = action.payload;
      const updatedHistory = [...state.game.nightHistory];
      if (index >= 0 && index < updatedHistory.length) {
        updatedHistory[index] = entry;
      }
      return {
        ...state,
        game: { ...state.game, nightHistory: updatedHistory },
      };
    }

    case 'SET_NIGHT_CARD_INDEX': {
      if (!state.nightProgress) return state;
      return {
        ...state,
        nightProgress: {
          ...state.nightProgress,
          currentCardIndex: action.payload.index,
        },
      };
    }

    default:
      return state;
  }
}

/** Write a game object to localStorage. */
function persistGame(game: Game): void {
  try {
    localStorage.setItem(`storyteller-game-${game.id}`, JSON.stringify(game));
  } catch {
    // Storage full or unavailable – silently ignore.
  }
}

// ──────────────────────────────────────────────
// Context value shape
// ──────────────────────────────────────────────

interface GameContextValue {
  state: GameViewState;
  dispatch: React.Dispatch<GameAction>;
  loadGame: (game: Game) => void;
  setPhase: (phase: Phase) => void;
  advanceDay: () => void;
  toggleShowCharacters: () => void;
  updatePlayer: (
    seat: number,
    updates: Partial<
      Pick<
        PlayerSeat,
        | 'characterId'
        | 'alive'
        | 'ghostVoteUsed'
        | 'visibleAlignment'
        | 'actualAlignment'
        | 'startingAlignment'
        | 'activeReminders'
        | 'playerName'
      >
    >,
  ) => void;
  addTraveller: (
    seat: number,
    playerName: string,
    characterId: string,
    alignment: 'Good' | 'Evil',
  ) => void;
  removeTraveller: (seat: number) => void;
  startNight: (totalCards: number) => void;
  updateNightProgress: (
    characterId: string,
    subActionStates?: boolean[],
    note?: string,
    selection?: string | string[],
  ) => void;
  completeNight: () => void;
  saveGame: () => void;
  setNightCardIndex: (index: number) => void;
  addToken: (seat: number, token: PlayerToken) => void;
  removeToken: (seat: number, tokenId: string) => void;
  updateNightHistory: (index: number, entry: NightHistoryEntry) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

// ──────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);

  // Auto-save game to localStorage whenever it changes
  useEffect(() => {
    if (state.game) {
      persistGame(state.game);
    }
  }, [state.game]);

  // ── Helper functions ──

  const loadGame = useCallback((game: Game) => {
    dispatch({ type: 'LOAD_GAME', payload: { game } });
  }, []);

  const setPhase = useCallback((phase: Phase) => {
    dispatch({ type: 'SET_PHASE', payload: { phase } });
  }, []);

  const advanceDay = useCallback(() => {
    dispatch({ type: 'ADVANCE_DAY' });
  }, []);

  const toggleShowCharacters = useCallback(() => {
    dispatch({ type: 'TOGGLE_SHOW_CHARACTERS' });
  }, []);

  const updatePlayer = useCallback(
    (
      seat: number,
      updates: Partial<
        Pick<
          PlayerSeat,
          | 'characterId'
          | 'alive'
          | 'ghostVoteUsed'
          | 'visibleAlignment'
          | 'actualAlignment'
          | 'startingAlignment'
          | 'activeReminders'
          | 'playerName'
        >
      >,
    ) => {
      dispatch({ type: 'UPDATE_PLAYER', payload: { seat, updates } });
    },
    [],
  );

  const addTraveller = useCallback(
    (seat: number, playerName: string, characterId: string, alignment: 'Good' | 'Evil') => {
      dispatch({
        type: 'ADD_TRAVELLER',
        payload: { seat, playerName, characterId, alignment },
      });
    },
    [],
  );

  const removeTraveller = useCallback((seat: number) => {
    dispatch({ type: 'REMOVE_TRAVELLER', payload: { seat } });
  }, []);

  const startNight = useCallback((totalCards: number) => {
    dispatch({ type: 'START_NIGHT', payload: { totalCards } });
  }, []);

  const updateNightProgress = useCallback(
    (
      characterId: string,
      subActionStates?: boolean[],
      note?: string,
      selection?: string | string[],
    ) => {
      dispatch({
        type: 'UPDATE_NIGHT_PROGRESS',
        payload: { characterId, subActionStates, note, selection },
      });
    },
    [],
  );

  const completeNight = useCallback(() => {
    dispatch({ type: 'COMPLETE_NIGHT' });
  }, []);

  const saveGame = useCallback(() => {
    dispatch({ type: 'SAVE_GAME' });
  }, []);

  const addToken = useCallback((seat: number, token: PlayerToken) => {
    dispatch({ type: 'ADD_TOKEN', payload: { seat, token } });
  }, []);

  const removeToken = useCallback((seat: number, tokenId: string) => {
    dispatch({ type: 'REMOVE_TOKEN', payload: { seat, tokenId } });
  }, []);

  const setNightCardIndex = useCallback((index: number) => {
    dispatch({ type: 'SET_NIGHT_CARD_INDEX', payload: { index } });
  }, []);

  const updateNightHistory = useCallback((index: number, entry: NightHistoryEntry) => {
    dispatch({ type: 'UPDATE_NIGHT_HISTORY', payload: { index, entry } });
  }, []);

  const value: GameContextValue = {
    state,
    dispatch,
    loadGame,
    setPhase,
    advanceDay,
    toggleShowCharacters,
    updatePlayer,
    addTraveller,
    removeTraveller,
    startNight,
    updateNightProgress,
    completeNight,
    saveGame,
    setNightCardIndex,
    addToken,
    removeToken,
    updateNightHistory,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

// ──────────────────────────────────────────────
// Hook
// ──────────────────────────────────────────────

// eslint-disable-next-line react-refresh/only-export-components
export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error('useGame must be used within a <GameProvider>');
  }
  return ctx;
}
