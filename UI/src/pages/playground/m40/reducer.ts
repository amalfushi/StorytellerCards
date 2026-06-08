/**
 * M40 Playground reducer. Pure; ids are passed in by the caller so tests are deterministic.
 * UI layer uses crypto.randomUUID() to mint ids.
 */
import type {
  GameId,
  PgGame,
  PgPropagationPreference,
  PgSession,
  PgSlot,
  PlayerId,
  SlotId,
} from './types.ts';

export type PgAction =
  // -- players -----------------------------------------------------------------
  | { type: 'ADD_PLAYER'; playerId: PlayerId; name: string }
  | { type: 'RENAME_PLAYER'; playerId: PlayerId; name: string }
  | { type: 'REMOVE_PLAYER'; playerId: PlayerId }
  // -- template ----------------------------------------------------------------
  | {
      type: 'ADD_TEMPLATE_SEAT';
      slotId: SlotId;
      /** When provided, also append a seat slot to each existing game using the
       * supplied fresh ids (one per gameId). */
      gameSlotIds?: Record<GameId, SlotId>;
    }
  | {
      type: 'ADD_TEMPLATE_SPACER';
      slotId: SlotId;
      gameSlotIds?: Record<GameId, SlotId>;
    }
  | {
      type: 'ADD_TEMPLATE_STORYTELLER';
      slotId: SlotId;
      gameSlotIds?: Record<GameId, SlotId>;
    }
  | { type: 'REMOVE_TEMPLATE_SLOT'; slotId: SlotId }
  | { type: 'MOVE_TEMPLATE_SLOT'; slotId: SlotId; toIndex: number }
  | { type: 'MOVE_GAME_SLOT'; gameId: GameId; slotId: SlotId; toIndex: number }
  | {
      type: 'REMOVE_GAME_SLOT';
      gameId: GameId;
      slotId: SlotId;
      /** Defaults to session.propagationDefault when omitted. */
      propagation?: Partial<PgPropagationPreference>;
    }
  | {
      type: 'ASSIGN_TEMPLATE_SEAT';
      slotId: SlotId;
      playerId: PlayerId | null;
    }
  // -- games -------------------------------------------------------------------
  | {
      type: 'CREATE_GAME';
      gameId: GameId;
      name: string;
      /** Fresh slot ids minted by the caller, one per template slot, in order. */
      slotIdMap: Record<SlotId, SlotId>;
    }
  | { type: 'RENAME_GAME'; gameId: GameId; name: string }
  | { type: 'REMOVE_GAME'; gameId: GameId }
  | { type: 'SELECT_GAME'; gameId: GameId | null }
  // -- participants ------------------------------------------------------------
  | { type: 'ADD_PARTICIPANT'; gameId: GameId; playerId: PlayerId; isTraveller?: boolean }
  | { type: 'REMOVE_PARTICIPANT'; gameId: GameId; playerId: PlayerId }
  | {
      type: 'SET_PARTICIPANT_TRAVELLER';
      gameId: GameId;
      playerId: PlayerId;
      isTraveller: boolean;
    }
  // -- seat assignment within a game (with optional propagation) --------------
  | {
      type: 'ASSIGN_GAME_SEAT';
      gameId: GameId;
      slotId: SlotId;
      playerId: PlayerId | null;
      /** Defaults to session.propagationDefault when omitted. */
      propagation?: Partial<PgPropagationPreference>;
    }
  // -- character assignment ---------------------------------------------------
  | { type: 'SET_PLAYER_COUNT_OVERRIDE'; gameId: GameId; count: number | null }
  | {
      type: 'ASSIGN_CHARACTER';
      gameId: GameId;
      playerId: PlayerId;
      characterId: string | null;
    }
  // -- preferences ------------------------------------------------------------
  | { type: 'SET_PROPAGATION_DEFAULT'; pref: Partial<PgPropagationPreference> };

// ---------------------------------------------------------------------------
// helpers (pure)
// ---------------------------------------------------------------------------

function clearPlayerFromSlots(slots: PgSlot[], playerId: PlayerId): PgSlot[] {
  return slots.map((s) =>
    s.kind === 'seat' && s.playerId === playerId ? { ...s, playerId: null } : s,
  );
}

/** Assign player to slot, clearing any prior seat in the same collection. */
function setSeatPlayer(slots: PgSlot[], slotId: SlotId, playerId: PlayerId | null): PgSlot[] {
  let cleared = slots;
  if (playerId !== null) cleared = clearPlayerFromSlots(slots, playerId);
  return cleared.map((s) => (s.kind === 'seat' && s.id === slotId ? { ...s, playerId } : s));
}

function moveSlot(slots: PgSlot[], slotId: SlotId, toIndex: number): PgSlot[] {
  const from = slots.findIndex((s) => s.id === slotId);
  if (from === -1) return slots;
  const clamped = Math.max(0, Math.min(toIndex, slots.length - 1));
  if (from === clamped) return slots;
  const next = slots.slice();
  const [moved] = next.splice(from, 1);
  next.splice(clamped, 0, moved);
  return next;
}

function updateGame(session: PgSession, gameId: GameId, fn: (g: PgGame) => PgGame): PgSession {
  let touched = false;
  const games = session.games.map((g) => {
    if (g.id !== gameId) return g;
    touched = true;
    return fn(g);
  });
  return touched ? { ...session, games } : session;
}

// ---------------------------------------------------------------------------

export function playgroundReducer(state: PgSession, action: PgAction): PgSession {
  switch (action.type) {
    // -- players -------------------------------------------------------------
    case 'ADD_PLAYER': {
      if (state.players.some((p) => p.id === action.playerId)) return state;
      return {
        ...state,
        players: [...state.players, { id: action.playerId, name: action.name }],
      };
    }

    case 'RENAME_PLAYER': {
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === action.playerId ? { ...p, name: action.name } : p,
        ),
      };
    }

    case 'REMOVE_PLAYER': {
      const pid = action.playerId;
      return {
        ...state,
        players: state.players.filter((p) => p.id !== pid),
        template: { slots: clearPlayerFromSlots(state.template.slots, pid) },
        games: state.games.map((g) => {
          const { [pid]: _removed, ...rest } = g.characterAssignments;
          return {
            ...g,
            slots: clearPlayerFromSlots(g.slots, pid),
            participants: g.participants.filter((pp) => pp.playerId !== pid),
            characterAssignments: rest,
          };
        }),
      };
    }

    // -- template -----------------------------------------------------------
    case 'ADD_TEMPLATE_SEAT': {
      const gameSlotIds = action.gameSlotIds;
      return {
        ...state,
        template: {
          slots: [...state.template.slots, { kind: 'seat', id: action.slotId, playerId: null }],
        },
        games: gameSlotIds
          ? state.games.map((g) =>
              gameSlotIds[g.id]
                ? {
                    ...g,
                    slots: [...g.slots, { kind: 'seat', id: gameSlotIds[g.id], playerId: null }],
                  }
                : g,
            )
          : state.games,
      };
    }

    case 'ADD_TEMPLATE_SPACER': {
      const gameSlotIds = action.gameSlotIds;
      return {
        ...state,
        template: {
          slots: [...state.template.slots, { kind: 'spacer', id: action.slotId }],
        },
        games: gameSlotIds
          ? state.games.map((g) =>
              gameSlotIds[g.id]
                ? {
                    ...g,
                    slots: [...g.slots, { kind: 'spacer', id: gameSlotIds[g.id] }],
                  }
                : g,
            )
          : state.games,
      };
    }

    case 'ADD_TEMPLATE_STORYTELLER': {
      // UI gates this to a singleton, but the reducer is permissive — duplicate
      // calls just append; callers can guard if they need to.
      const gameSlotIds = action.gameSlotIds;
      return {
        ...state,
        template: {
          slots: [...state.template.slots, { kind: 'storyteller', id: action.slotId }],
        },
        games: gameSlotIds
          ? state.games.map((g) =>
              gameSlotIds[g.id]
                ? {
                    ...g,
                    slots: [...g.slots, { kind: 'storyteller', id: gameSlotIds[g.id] }],
                  }
                : g,
            )
          : state.games,
      };
    }

    case 'REMOVE_TEMPLATE_SLOT': {
      return {
        ...state,
        template: {
          slots: state.template.slots.filter((s) => s.id !== action.slotId),
        },
      };
    }

    case 'MOVE_TEMPLATE_SLOT': {
      return {
        ...state,
        template: {
          slots: moveSlot(state.template.slots, action.slotId, action.toIndex),
        },
      };
    }

    case 'MOVE_GAME_SLOT': {
      return updateGame(state, action.gameId, (g) => ({
        ...g,
        slots: moveSlot(g.slots, action.slotId, action.toIndex),
      }));
    }

    case 'REMOVE_GAME_SLOT': {
      const pref: PgPropagationPreference = {
        toTemplate: action.propagation?.toTemplate ?? state.propagationDefault.toTemplate,
        toOtherGames: action.propagation?.toOtherGames ?? state.propagationDefault.toOtherGames,
      };
      const game = state.games.find((g) => g.id === action.gameId);
      if (!game) return state;
      const slotIndex = game.slots.findIndex((s) => s.id === action.slotId);
      if (slotIndex === -1) return state;

      let nextState: PgSession = {
        ...state,
        games: state.games.map((g) =>
          g.id === action.gameId
            ? { ...g, slots: g.slots.filter((s) => s.id !== action.slotId) }
            : g,
        ),
      };

      if (pref.toTemplate) {
        const tplSlot = nextState.template.slots[slotIndex];
        if (tplSlot) {
          nextState = {
            ...nextState,
            template: {
              slots: nextState.template.slots.filter((s) => s.id !== tplSlot.id),
            },
          };
        }
      }

      if (pref.toOtherGames) {
        nextState = {
          ...nextState,
          games: nextState.games.map((g) => {
            if (g.id === action.gameId) return g;
            const target = g.slots[slotIndex];
            if (!target) return g;
            return { ...g, slots: g.slots.filter((s) => s.id !== target.id) };
          }),
        };
      }

      return nextState;
    }

    case 'ASSIGN_TEMPLATE_SEAT': {
      return {
        ...state,
        template: {
          slots: setSeatPlayer(state.template.slots, action.slotId, action.playerId),
        },
      };
    }

    // -- games --------------------------------------------------------------
    case 'CREATE_GAME': {
      if (state.games.some((g) => g.id === action.gameId)) return state;
      const snapshotSlots: PgSlot[] = state.template.slots.map((s) => {
        const newId = action.slotIdMap[s.id] ?? s.id;
        if (s.kind === 'seat') return { kind: 'seat', id: newId, playerId: s.playerId };
        if (s.kind === 'spacer') return { kind: 'spacer', id: newId };
        return { kind: 'storyteller', id: newId };
      });
      // Initial participants = currently seated players (sensible default).
      const seatedIds = new Set<PlayerId>();
      for (const s of snapshotSlots) {
        if (s.kind === 'seat' && s.playerId) seatedIds.add(s.playerId);
      }
      const game: PgGame = {
        id: action.gameId,
        name: action.name,
        slots: snapshotSlots,
        participants: [...seatedIds].map((playerId) => ({ playerId, isTraveller: false })),
        playerCountOverride: null,
        characterAssignments: {},
      };
      return {
        ...state,
        games: [...state.games, game],
        activeGameId: state.activeGameId ?? game.id,
      };
    }

    case 'RENAME_GAME':
      return updateGame(state, action.gameId, (g) => ({ ...g, name: action.name }));

    case 'REMOVE_GAME': {
      const games = state.games.filter((g) => g.id !== action.gameId);
      const activeGameId =
        state.activeGameId === action.gameId ? (games[0]?.id ?? null) : state.activeGameId;
      return { ...state, games, activeGameId };
    }

    case 'SELECT_GAME':
      return { ...state, activeGameId: action.gameId };

    // -- participants -------------------------------------------------------
    case 'ADD_PARTICIPANT':
      return updateGame(state, action.gameId, (g) => {
        if (g.participants.some((p) => p.playerId === action.playerId)) return g;
        return {
          ...g,
          participants: [
            ...g.participants,
            { playerId: action.playerId, isTraveller: action.isTraveller ?? false },
          ],
        };
      });

    case 'REMOVE_PARTICIPANT':
      return updateGame(state, action.gameId, (g) => {
        const { [action.playerId]: _removed, ...rest } = g.characterAssignments;
        return {
          ...g,
          participants: g.participants.filter((p) => p.playerId !== action.playerId),
          slots: clearPlayerFromSlots(g.slots, action.playerId),
          characterAssignments: rest,
        };
      });

    case 'SET_PARTICIPANT_TRAVELLER':
      return updateGame(state, action.gameId, (g) => ({
        ...g,
        participants: g.participants.map((p) =>
          p.playerId === action.playerId ? { ...p, isTraveller: action.isTraveller } : p,
        ),
      }));

    // -- seat assignment within a game (with propagation) -------------------
    case 'ASSIGN_GAME_SEAT': {
      const pref: PgPropagationPreference = {
        toTemplate: action.propagation?.toTemplate ?? state.propagationDefault.toTemplate,
        toOtherGames: action.propagation?.toOtherGames ?? state.propagationDefault.toOtherGames,
      };

      // Locate the game and the slot index there.
      const game = state.games.find((g) => g.id === action.gameId);
      if (!game) return state;
      const slotIndex = game.slots.findIndex((s) => s.id === action.slotId && s.kind === 'seat');
      if (slotIndex === -1) return state;

      const updatedGameSlots = setSeatPlayer(game.slots, action.slotId, action.playerId);

      // Build a player auto-add for the active game if needed (assigning a seat
      // implies the player participates).
      let updatedParticipants = game.participants;
      if (action.playerId && !updatedParticipants.some((p) => p.playerId === action.playerId)) {
        updatedParticipants = [
          ...updatedParticipants,
          { playerId: action.playerId, isTraveller: false },
        ];
      }

      let nextState: PgSession = {
        ...state,
        games: state.games.map((g) =>
          g.id === action.gameId
            ? { ...g, slots: updatedGameSlots, participants: updatedParticipants }
            : g,
        ),
      };

      // Propagate to template (same index).
      if (pref.toTemplate) {
        const tplSlot = nextState.template.slots[slotIndex];
        if (tplSlot && tplSlot.kind === 'seat') {
          nextState = {
            ...nextState,
            template: {
              slots: setSeatPlayer(nextState.template.slots, tplSlot.id, action.playerId),
            },
          };
        }
      }

      // Propagate to other games (same index).
      if (pref.toOtherGames) {
        nextState = {
          ...nextState,
          games: nextState.games.map((g) => {
            if (g.id === action.gameId) return g;
            const target = g.slots[slotIndex];
            if (!target || target.kind !== 'seat') return g;
            return { ...g, slots: setSeatPlayer(g.slots, target.id, action.playerId) };
          }),
        };
      }

      return nextState;
    }

    // -- character assignment ----------------------------------------------
    case 'SET_PLAYER_COUNT_OVERRIDE':
      return updateGame(state, action.gameId, (g) => ({
        ...g,
        playerCountOverride: action.count,
      }));

    case 'ASSIGN_CHARACTER':
      return updateGame(state, action.gameId, (g) => {
        if (action.characterId === null) {
          const { [action.playerId]: _drop, ...rest } = g.characterAssignments;
          return { ...g, characterAssignments: rest };
        }
        return {
          ...g,
          characterAssignments: {
            ...g.characterAssignments,
            [action.playerId]: action.characterId,
          },
        };
      });

    // -- preferences --------------------------------------------------------
    case 'SET_PROPAGATION_DEFAULT':
      return {
        ...state,
        propagationDefault: { ...state.propagationDefault, ...action.pref },
      };

    default:
      return ((_: never) => state)(action);
  }
}
