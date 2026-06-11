import { useReducer, useCallback, useEffect, useRef, useState } from 'react';
import { GameContext } from './useGame.ts';
import type { ReactNode } from 'react';
import type {
  Game,
  PlayerGameState,
  PlayerToken,
  PlayerId,
  PropagationPreference,
  NightProgress,
  NightHistoryEntry,
  SyncStatus,
  ShowToPlayerTemplate,
  GainedAbility,
  SlotId,
  Slot,
} from '@/types/index.ts';
import { Phase, Alignment, CharacterType } from '@/types/index.ts';
import { getCharacter } from '@/data/characters/index.ts';
import { useApiSync } from '@/hooks/useApiSync.ts';
import { useSseSync } from '@/hooks/useSseSync.ts';
import { useSession } from './useSession.ts';
import {
  moveSlot,
  setSeatPlayer,
  clearPlayerFromSlots,
  makeDefaultPlayerGameState,
} from '@/utils/seating/index.ts';
import { generateId } from '@/utils/idGenerator.ts';

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
// Helpers
// ──────────────────────────────────────────────

function deriveAlignmentFromType(type: CharacterType): Alignment | undefined {
  if (type === CharacterType.Demon || type === CharacterType.Minion) return Alignment.Evil;
  if (type === CharacterType.Townsfolk || type === CharacterType.Outsider) return Alignment.Good;
  return undefined;
}

function createShowToPlayerId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeGame(game: Game): Game {
  return {
    ...game,
    showMessages: game.showMessages ?? [],
    showTemplates: game.showTemplates ?? [],
  };
}

function updatePlayerStateInGame(
  game: Game,
  playerId: PlayerId,
  updater: (current: PlayerGameState) => PlayerGameState,
): Game {
  const current = game.playerState[playerId];
  if (!current) return game;
  return {
    ...game,
    playerState: {
      ...game.playerState,
      [playerId]: updater(current),
    },
  };
}

// ──────────────────────────────────────────────
// Actions
// ──────────────────────────────────────────────

type GameAction =
  | { type: 'LOAD_GAME'; payload: { game: Game } }
  | { type: 'SET_PHASE'; payload: { phase: Phase } }
  | { type: 'ADVANCE_DAY' }
  | { type: 'TOGGLE_SHOW_CHARACTERS' }
  | {
      type: 'UPDATE_PLAYER_STATE';
      payload: {
        playerId: PlayerId;
        updates: Partial<
          Pick<
            PlayerGameState,
            | 'characterId'
            | 'alive'
            | 'ghostVoteUsed'
            | 'visibleAlignment'
            | 'actualAlignment'
            | 'startingAlignment'
            | 'activeReminders'
          >
        >;
      };
    }
  | {
      type: 'ADD_PARTICIPANT';
      payload: { playerId: PlayerId; isTraveller?: boolean; characterId?: string };
    }
  | { type: 'REMOVE_PARTICIPANT'; payload: { playerId: PlayerId } }
  | {
      type: 'SET_PARTICIPANT_TRAVELLER';
      payload: { playerId: PlayerId; isTraveller: boolean; alignment?: Alignment };
    }
  | {
      type: 'ADD_GAME_SEAT';
      payload: { slotId: SlotId };
    }
  | {
      type: 'ADD_GAME_SPACER';
      payload: { slotId: SlotId };
    }
  | {
      type: 'ADD_GAME_STORYTELLER';
      payload: { slotId: SlotId };
    }
  | { type: 'REMOVE_GAME_SLOT'; payload: { slotId: SlotId } }
  | { type: 'MOVE_GAME_SLOT'; payload: { slotId: SlotId; toIndex: number } }
  | {
      type: 'ASSIGN_GAME_SEAT';
      payload: { slotId: SlotId; playerId: PlayerId | null };
    }
  | { type: 'SET_PLAYER_COUNT_OVERRIDE'; payload: { count: number | null } }
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
  | { type: 'ADD_TOKEN'; payload: { playerId: PlayerId; token: PlayerToken } }
  | { type: 'REMOVE_TOKEN'; payload: { playerId: PlayerId; tokenId: string } }
  | { type: 'UPDATE_NIGHT_HISTORY'; payload: { index: number; entry: NightHistoryEntry } }
  | {
      type: 'UPDATE_NIGHT_HISTORY_NOTE';
      payload: { nightIndex: number; characterId: string; note: string };
    }
  | {
      type: 'UPDATE_NIGHT_HISTORY_CHOICE';
      payload: { nightIndex: number; characterId: string; choiceValue: string | string[] };
    }
  | { type: 'ADD_FABLED'; payload: { characterId: string } }
  | { type: 'REMOVE_FABLED'; payload: { characterId: string } }
  | { type: 'ADD_LORIC'; payload: { characterId: string } }
  | { type: 'REMOVE_LORIC'; payload: { characterId: string } }
  | { type: 'SET_IN_PLAY_CHARACTERS'; payload: { characterIds: string[] } }
  | { type: 'SET_APPARENT_CHARACTER'; payload: { playerId: PlayerId; apparentCharacterId: string } }
  | { type: 'SET_DEMON_BLUFFS'; payload: { characterIds: string[] } }
  | { type: 'SET_LUNATIC_BLUFFS'; payload: { characterIds: string[] } }
  | { type: 'SET_PLAYER_BLUFFS'; payload: { playerId: PlayerId; bluffIds: string[] } }
  | { type: 'SET_CUSTOM_PLAYER_MESSAGE'; payload: { characterId: string; message: string } }
  | { type: 'CLEAR_CUSTOM_PLAYER_MESSAGE'; payload: { characterId: string } }
  | { type: 'SYNC_GAME'; payload: { game: Game } }
  | {
      type: 'ADD_SHOW_MESSAGE';
      payload: { gameId: string; playerId: PlayerId; text: string; templateId?: string };
    }
  | { type: 'MARK_SHOW_MESSAGE_SHOWN'; payload: { gameId: string; messageId: string } }
  | { type: 'EDIT_SHOW_MESSAGE'; payload: { gameId: string; messageId: string; text: string } }
  | { type: 'DELETE_SHOW_MESSAGE'; payload: { gameId: string; messageId: string } }
  | {
      type: 'PIN_SHOW_TEMPLATE';
      payload: {
        gameId: string;
        text: string;
        scope: ShowToPlayerTemplate['scope'];
        scriptId?: string;
      };
    }
  | { type: 'UNPIN_SHOW_TEMPLATE'; payload: { gameId: string; templateId: string } }
  | { type: 'BUMP_TEMPLATE_USAGE'; payload: { gameId: string; templateId: string } }
  | {
      type: 'RECORD_ALIGNMENT_CHANGE';
      payload: {
        playerId: PlayerId;
        newAlignment: Alignment;
        reason: string;
        day: number;
        nightPhase: 'first' | 'other' | 'day' | 'manual';
      };
    }
  | { type: 'SET_GAINED_ABILITY'; payload: { playerId: PlayerId; gainedAbility: GainedAbility } }
  | { type: 'CLEAR_GAINED_ABILITY'; payload: { playerId: PlayerId } };

// ──────────────────────────────────────────────
// Reducer
// ──────────────────────────────────────────────

function gameReducer(state: GameViewState, action: GameAction): GameViewState {
  switch (action.type) {
    case 'LOAD_GAME':
      return {
        ...state,
        game: normalizeGame(action.payload.game),
        showCharacters: false,
        nightProgress: null,
      };

    case 'SET_PHASE': {
      if (!state.game) return state;
      return { ...state, game: { ...state.game, currentPhase: action.payload.phase } };
    }

    case 'ADVANCE_DAY': {
      if (!state.game) return state;
      return {
        ...state,
        game: { ...state.game, currentDay: state.game.currentDay + 1, isFirstNight: false },
      };
    }

    case 'TOGGLE_SHOW_CHARACTERS':
      return { ...state, showCharacters: !state.showCharacters };

    case 'UPDATE_PLAYER_STATE': {
      if (!state.game) return state;
      const { playerId, updates } = action.payload;
      return {
        ...state,
        game: updatePlayerStateInGame(state.game, playerId, (current) => {
          const merged: PlayerGameState = { ...current, ...updates };
          if (updates.characterId !== undefined && updates.characterId !== current.characterId) {
            const charDef = getCharacter(updates.characterId);
            if (charDef) {
              const newAlignment = deriveAlignmentFromType(charDef.type);
              if (updates.actualAlignment === undefined) {
                merged.actualAlignment = newAlignment ?? merged.actualAlignment;
              }
            }
          }
          return merged;
        }),
      };
    }

    case 'ADD_PARTICIPANT': {
      if (!state.game) return state;
      const { playerId, isTraveller, characterId } = action.payload;
      if (state.game.participants.some((p) => p.playerId === playerId)) return state;
      const baseState = makeDefaultPlayerGameState();
      if (characterId) {
        baseState.characterId = characterId;
        const charDef = getCharacter(characterId);
        if (charDef) {
          const newAlignment = deriveAlignmentFromType(charDef.type);
          if (newAlignment) {
            baseState.actualAlignment = newAlignment;
            baseState.startingAlignment = newAlignment;
          }
        }
      }
      return {
        ...state,
        game: {
          ...state.game,
          participants: [
            ...state.game.participants,
            { playerId, isTraveller: isTraveller ?? false },
          ],
          playerState: { ...state.game.playerState, [playerId]: baseState },
        },
      };
    }

    case 'REMOVE_PARTICIPANT': {
      if (!state.game) return state;
      const { playerId } = action.payload;
      const nextPlayerState = { ...state.game.playerState };
      delete nextPlayerState[playerId];
      const nextBluffs = state.game.playerBluffs ? { ...state.game.playerBluffs } : undefined;
      if (nextBluffs) delete nextBluffs[playerId];
      return {
        ...state,
        game: {
          ...state.game,
          participants: state.game.participants.filter((p) => p.playerId !== playerId),
          playerState: nextPlayerState,
          slots: clearPlayerFromSlots(state.game.slots, playerId),
          playerBluffs: nextBluffs,
        },
      };
    }

    case 'SET_PARTICIPANT_TRAVELLER': {
      if (!state.game) return state;
      const { playerId, isTraveller, alignment } = action.payload;
      const updatedGame: Game = {
        ...state.game,
        participants: state.game.participants.map((p) =>
          p.playerId === playerId ? { ...p, isTraveller } : p,
        ),
      };
      if (alignment !== undefined) {
        return {
          ...state,
          game: updatePlayerStateInGame(updatedGame, playerId, (current) => ({
            ...current,
            actualAlignment: alignment,
            startingAlignment: alignment,
          })),
        };
      }
      return { ...state, game: updatedGame };
    }

    case 'ADD_GAME_SEAT': {
      if (!state.game) return state;
      const slot: Slot = { kind: 'seat', id: action.payload.slotId, playerId: null };
      return { ...state, game: { ...state.game, slots: [...state.game.slots, slot] } };
    }

    case 'ADD_GAME_SPACER': {
      if (!state.game) return state;
      const slot: Slot = { kind: 'spacer', id: action.payload.slotId };
      return { ...state, game: { ...state.game, slots: [...state.game.slots, slot] } };
    }

    case 'ADD_GAME_STORYTELLER': {
      if (!state.game) return state;
      const slot: Slot = { kind: 'storyteller', id: action.payload.slotId };
      return { ...state, game: { ...state.game, slots: [...state.game.slots, slot] } };
    }

    case 'REMOVE_GAME_SLOT': {
      if (!state.game) return state;
      return {
        ...state,
        game: {
          ...state.game,
          slots: state.game.slots.filter((s) => s.id !== action.payload.slotId),
        },
      };
    }

    case 'MOVE_GAME_SLOT': {
      if (!state.game) return state;
      return {
        ...state,
        game: {
          ...state.game,
          slots: moveSlot(state.game.slots, action.payload.slotId, action.payload.toIndex),
        },
      };
    }

    case 'ASSIGN_GAME_SEAT': {
      if (!state.game) return state;
      return {
        ...state,
        game: {
          ...state.game,
          slots: setSeatPlayer(
            state.game.slots,
            action.payload.slotId,
            action.payload.playerId,
          ),
        },
      };
    }

    case 'SET_PLAYER_COUNT_OVERRIDE': {
      if (!state.game) return state;
      return {
        ...state,
        game: { ...state.game, playerCountOverride: action.payload.count },
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
      const tokenSnapshot: Record<string, PlayerToken[]> = {};
      for (const [, ps] of Object.entries(state.game.playerState)) {
        if ((ps.tokens ?? []).length > 0 && ps.characterId) {
          tokenSnapshot[ps.characterId] = [...(ps.tokens ?? [])];
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
      persistGame(updatedGame);
      return { ...state, game: updatedGame, nightProgress: null };
    }

    case 'SAVE_GAME': {
      if (state.game) persistGame(state.game);
      return state;
    }

    case 'ADD_TOKEN': {
      if (!state.game) return state;
      const { playerId, token } = action.payload;
      // Remove the token id from any other player to maintain uniqueness
      const cleanedState: Record<PlayerId, PlayerGameState> = {};
      for (const [pid, ps] of Object.entries(state.game.playerState)) {
        cleanedState[pid] = {
          ...ps,
          tokens: (ps.tokens ?? []).filter((t) => t.id !== token.id),
        };
      }
      if (cleanedState[playerId]) {
        cleanedState[playerId] = {
          ...cleanedState[playerId],
          tokens: [...(cleanedState[playerId].tokens ?? []), token],
        };
      }
      return { ...state, game: { ...state.game, playerState: cleanedState } };
    }

    case 'REMOVE_TOKEN': {
      if (!state.game) return state;
      const { playerId, tokenId } = action.payload;
      return {
        ...state,
        game: updatePlayerStateInGame(state.game, playerId, (current) => ({
          ...current,
          tokens: (current.tokens ?? []).filter((t) => t.id !== tokenId),
        })),
      };
    }

    case 'UPDATE_NIGHT_HISTORY': {
      if (!state.game) return state;
      const { index, entry } = action.payload;
      const updatedHistory = [...state.game.nightHistory];
      if (index >= 0 && index < updatedHistory.length) {
        updatedHistory[index] = entry;
      }
      return { ...state, game: { ...state.game, nightHistory: updatedHistory } };
    }

    case 'UPDATE_NIGHT_HISTORY_NOTE': {
      if (!state.game) return state;
      const { nightIndex, characterId, note } = action.payload;
      const history = [...state.game.nightHistory];
      if (nightIndex < 0 || nightIndex >= history.length) return state;
      const entry = { ...history[nightIndex] };
      entry.notes = { ...entry.notes, [characterId]: note };
      history[nightIndex] = entry;
      return { ...state, game: { ...state.game, nightHistory: history } };
    }

    case 'UPDATE_NIGHT_HISTORY_CHOICE': {
      if (!state.game) return state;
      const { nightIndex, characterId, choiceValue } = action.payload;
      const history = [...state.game.nightHistory];
      if (nightIndex < 0 || nightIndex >= history.length) return state;
      const entry = { ...history[nightIndex] };
      entry.selections = { ...(entry.selections ?? {}), [characterId]: choiceValue };
      history[nightIndex] = entry;
      return { ...state, game: { ...state.game, nightHistory: history } };
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

    case 'ADD_FABLED': {
      if (!state.game) return state;
      const current = state.game.activeFabled ?? [];
      if (current.includes(action.payload.characterId)) return state;
      return {
        ...state,
        game: { ...state.game, activeFabled: [...current, action.payload.characterId] },
      };
    }

    case 'REMOVE_FABLED': {
      if (!state.game) return state;
      return {
        ...state,
        game: {
          ...state.game,
          activeFabled: (state.game.activeFabled ?? []).filter(
            (id) => id !== action.payload.characterId,
          ),
        },
      };
    }

    case 'ADD_LORIC': {
      if (!state.game) return state;
      const current = state.game.activeLoric ?? [];
      if (current.includes(action.payload.characterId)) return state;
      return {
        ...state,
        game: { ...state.game, activeLoric: [...current, action.payload.characterId] },
      };
    }

    case 'REMOVE_LORIC': {
      if (!state.game) return state;
      return {
        ...state,
        game: {
          ...state.game,
          activeLoric: (state.game.activeLoric ?? []).filter(
            (id) => id !== action.payload.characterId,
          ),
        },
      };
    }

    case 'SET_IN_PLAY_CHARACTERS': {
      if (!state.game) return state;
      return { ...state, game: { ...state.game, inPlayCharacterIds: action.payload.characterIds } };
    }

    case 'SET_APPARENT_CHARACTER': {
      if (!state.game) return state;
      const { playerId, apparentCharacterId } = action.payload;
      return {
        ...state,
        game: updatePlayerStateInGame(state.game, playerId, (current) => ({
          ...current,
          apparentCharacterId,
        })),
      };
    }

    case 'SET_DEMON_BLUFFS': {
      if (!state.game) return state;
      return { ...state, game: { ...state.game, demonBluffs: action.payload.characterIds } };
    }

    case 'SET_LUNATIC_BLUFFS': {
      if (!state.game) return state;
      return { ...state, game: { ...state.game, lunaticBluffs: action.payload.characterIds } };
    }

    case 'SET_PLAYER_BLUFFS': {
      if (!state.game) return state;
      const { playerId, bluffIds } = action.payload;
      return {
        ...state,
        game: {
          ...state.game,
          playerBluffs: { ...state.game.playerBluffs, [playerId]: bluffIds },
        },
      };
    }

    case 'SET_CUSTOM_PLAYER_MESSAGE': {
      if (!state.game) return state;
      const { characterId, message } = action.payload;
      return {
        ...state,
        game: {
          ...state.game,
          customPlayerMessages: { ...state.game.customPlayerMessages, [characterId]: message },
        },
      };
    }

    case 'CLEAR_CUSTOM_PLAYER_MESSAGE': {
      if (!state.game) return state;
      const existing = { ...state.game.customPlayerMessages };
      delete existing[action.payload.characterId];
      return {
        ...state,
        game: {
          ...state.game,
          customPlayerMessages: Object.keys(existing).length > 0 ? existing : undefined,
        },
      };
    }

    case 'RECORD_ALIGNMENT_CHANGE': {
      if (!state.game) return state;
      const { playerId, newAlignment, reason, day, nightPhase } = action.payload;
      return {
        ...state,
        game: updatePlayerStateInGame(state.game, playerId, (current) => ({
          ...current,
          actualAlignment: newAlignment,
          alignmentHistory: [
            ...(current.alignmentHistory ?? []),
            {
              id: `${playerId}-${day}-${nightPhase}-${Date.now()}`,
              day,
              nightPhase,
              newAlignment,
              reason,
              timestamp: Date.now(),
            },
          ],
        })),
      };
    }

    case 'SET_GAINED_ABILITY': {
      if (!state.game) return state;
      const { playerId, gainedAbility } = action.payload;
      return {
        ...state,
        game: updatePlayerStateInGame(state.game, playerId, (current) => ({
          ...current,
          gainedAbility,
        })),
      };
    }

    case 'CLEAR_GAINED_ABILITY': {
      if (!state.game) return state;
      const { playerId } = action.payload;
      return {
        ...state,
        game: updatePlayerStateInGame(state.game, playerId, (current) => {
          const { gainedAbility: _g, ...rest } = current;
          return rest;
        }),
      };
    }

    case 'SYNC_GAME': {
      const remote = normalizeGame(action.payload.game);
      if (!state.game || state.game.id !== remote.id) return state;
      return { ...state, game: remote };
    }

    case 'ADD_SHOW_MESSAGE': {
      if (!state.game || state.game.id !== action.payload.gameId) return state;
      const text = action.payload.text.trim();
      if (!text) return state;
      return {
        ...state,
        game: {
          ...state.game,
          showMessages: [
            ...(state.game.showMessages ?? []),
            {
              id: createShowToPlayerId('show-message'),
              playerId: action.payload.playerId,
              text,
              templateId: action.payload.templateId,
              createdAt: new Date().toISOString(),
            },
          ],
        },
      };
    }

    case 'MARK_SHOW_MESSAGE_SHOWN': {
      if (!state.game || state.game.id !== action.payload.gameId) return state;
      return {
        ...state,
        game: {
          ...state.game,
          showMessages: (state.game.showMessages ?? []).map((m) =>
            m.id === action.payload.messageId
              ? { ...m, lastShownAt: new Date().toISOString() }
              : m,
          ),
        },
      };
    }

    case 'EDIT_SHOW_MESSAGE': {
      if (!state.game || state.game.id !== action.payload.gameId) return state;
      const text = action.payload.text.trim();
      if (!text) return state;
      return {
        ...state,
        game: {
          ...state.game,
          showMessages: (state.game.showMessages ?? []).map((m) =>
            m.id === action.payload.messageId ? { ...m, text } : m,
          ),
        },
      };
    }

    case 'DELETE_SHOW_MESSAGE': {
      if (!state.game || state.game.id !== action.payload.gameId) return state;
      return {
        ...state,
        game: {
          ...state.game,
          showMessages: (state.game.showMessages ?? []).filter(
            (m) => m.id !== action.payload.messageId,
          ),
        },
      };
    }

    case 'PIN_SHOW_TEMPLATE': {
      if (!state.game || state.game.id !== action.payload.gameId) return state;
      const text = action.payload.text.trim();
      if (!text) return state;
      const current = state.game.showTemplates ?? [];
      const alreadyPinned = current.some(
        (t) =>
          t.text.localeCompare(text, undefined, { sensitivity: 'accent' }) === 0 &&
          t.scope === action.payload.scope &&
          t.scriptId === action.payload.scriptId,
      );
      if (alreadyPinned) return state;
      return {
        ...state,
        game: {
          ...state.game,
          showTemplates: [
            ...current,
            {
              id: createShowToPlayerId('show-template'),
              text,
              scope: action.payload.scope,
              scriptId: action.payload.scriptId,
              usageCount: 0,
              lastUsedAt: new Date().toISOString(),
            },
          ],
        },
      };
    }

    case 'UNPIN_SHOW_TEMPLATE': {
      if (!state.game || state.game.id !== action.payload.gameId) return state;
      return {
        ...state,
        game: {
          ...state.game,
          showTemplates: (state.game.showTemplates ?? []).filter(
            (t) => t.id !== action.payload.templateId,
          ),
        },
      };
    }

    case 'BUMP_TEMPLATE_USAGE': {
      if (!state.game || state.game.id !== action.payload.gameId) return state;
      return {
        ...state,
        game: {
          ...state.game,
          showTemplates: (state.game.showTemplates ?? []).map((t) =>
            t.id === action.payload.templateId
              ? { ...t, usageCount: t.usageCount + 1, lastUsedAt: new Date().toISOString() }
              : t,
          ),
        },
      };
    }

    default:
      return state;
  }
}

function persistGame(game: Game): void {
  try {
    localStorage.setItem(`storyteller-game-${game.id}`, JSON.stringify(game));
  } catch {
    // Silently ignore storage errors
  }
}

// ──────────────────────────────────────────────
// Context value shape
// ──────────────────────────────────────────────

type PlayerStateUpdates = Partial<
  Pick<
    PlayerGameState,
    | 'characterId'
    | 'alive'
    | 'ghostVoteUsed'
    | 'visibleAlignment'
    | 'actualAlignment'
    | 'startingAlignment'
    | 'activeReminders'
  >
>;

export interface GameContextValue {
  state: GameViewState;
  dispatch: React.Dispatch<GameAction>;
  loadGame: (game: Game) => void;
  setPhase: (phase: Phase) => void;
  advanceDay: () => void;
  toggleShowCharacters: () => void;
  updatePlayerState: (playerId: PlayerId, updates: PlayerStateUpdates) => void;
  addParticipant: (playerId: PlayerId, opts?: { isTraveller?: boolean; characterId?: string }) => void;
  removeParticipant: (playerId: PlayerId) => void;
  setParticipantTraveller: (
    playerId: PlayerId,
    isTraveller: boolean,
    alignment?: Alignment,
  ) => void;
  addGameSeat: (propagation?: Partial<PropagationPreference>) => SlotId;
  addGameSpacer: (propagation?: Partial<PropagationPreference>) => SlotId;
  addGameStoryteller: (propagation?: Partial<PropagationPreference>) => SlotId;
  removeGameSlot: (slotId: SlotId, propagation?: Partial<PropagationPreference>) => void;
  moveGameSlot: (
    slotId: SlotId,
    toIndex: number,
    propagation?: Partial<PropagationPreference>,
  ) => void;
  assignGameSeat: (
    slotId: SlotId,
    playerId: PlayerId | null,
    propagation?: Partial<PropagationPreference>,
  ) => void;
  setPlayerCountOverride: (count: number | null) => void;
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
  addToken: (playerId: PlayerId, token: PlayerToken) => void;
  removeToken: (playerId: PlayerId, tokenId: string) => void;
  updateNightHistory: (index: number, entry: NightHistoryEntry) => void;
  updateNightHistoryNote: (nightIndex: number, characterId: string, note: string) => void;
  updateNightHistoryChoice: (
    nightIndex: number,
    characterId: string,
    choiceValue: string | string[],
  ) => void;
  addFabled: (characterId: string) => void;
  removeFabled: (characterId: string) => void;
  addLoric: (characterId: string) => void;
  removeLoric: (characterId: string) => void;
  setInPlayCharacters: (characterIds: string[]) => void;
  setApparentCharacter: (playerId: PlayerId, apparentCharacterId: string) => void;
  setDemonBluffs: (characterIds: string[]) => void;
  setLunaticBluffs: (characterIds: string[]) => void;
  setPlayerBluffs: (playerId: PlayerId, bluffIds: string[]) => void;
  setCustomPlayerMessage: (characterId: string, message: string) => void;
  clearCustomPlayerMessage: (characterId: string) => void;
  addShowMessage: (gameId: string, playerId: PlayerId, text: string, templateId?: string) => void;
  markShowMessageShown: (gameId: string, messageId: string) => void;
  editShowMessage: (gameId: string, messageId: string, text: string) => void;
  deleteShowMessage: (gameId: string, messageId: string) => void;
  pinShowTemplate: (
    gameId: string,
    text: string,
    scope: ShowToPlayerTemplate['scope'],
    scriptId?: string,
  ) => void;
  unpinShowTemplate: (gameId: string, templateId: string) => void;
  bumpTemplateUsage: (gameId: string, templateId: string) => void;
  recordAlignmentChange: (
    playerId: PlayerId,
    newAlignment: Alignment,
    reason: string,
    day: number,
    nightPhase: 'first' | 'other' | 'day' | 'manual',
  ) => void;
  setGainedAbility: (playerId: PlayerId, gainedAbility: GainedAbility) => void;
  clearGainedAbility: (playerId: PlayerId) => void;
  syncGame: (game: Game) => void;
  syncStatus: SyncStatus;
  forceSync: () => void;
}

// ──────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────

const SELF_ECHO_COOLDOWN_MS = 3_000;

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);
  const isSyncingRef = useRef(false);
  const gameRef = useRef(state.game);
  const lastPushedGameRef = useRef<string | null>(null);
  const lastPushTimestampRef = useRef(0);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');

  const { fetchGame: apiFetchGame, syncGame: apiSyncGame } = useApiSync();
  const session = useSession();

  useEffect(() => {
    gameRef.current = state.game;
  }, [state.game]);

  useEffect(() => {
    if (state.game) persistGame(state.game);
  }, [state.game]);

  useEffect(() => {
    const game = state.game;
    if (game && !isSyncingRef.current) {
      lastPushedGameRef.current = JSON.stringify(game);
      lastPushTimestampRef.current = Date.now();
      apiSyncGame(game);
    }
    isSyncingRef.current = false;
  }, [state.game, apiSyncGame]);

  const handleNewVersion = useCallback(async () => {
    const g = gameRef.current;
    if (!g) return;
    if (Date.now() - lastPushTimestampRef.current < SELF_ECHO_COOLDOWN_MS) return;
    const currentJson = JSON.stringify(g);
    if (lastPushedGameRef.current !== null && currentJson !== lastPushedGameRef.current) return;
    const remoteGame = await apiFetchGame(g.sessionId, g.id);
    if (remoteGame) {
      isSyncingRef.current = true;
      lastPushedGameRef.current = JSON.stringify(remoteGame);
      dispatch({ type: 'SYNC_GAME', payload: { game: remoteGame } });
    }
  }, [apiFetchGame]);

  const { forceSync } = useSseSync({
    enabled: !!state.game,
    sessionId: state.game?.sessionId ?? null,
    gameId: state.game?.id ?? null,
    onVersionChanged: handleNewVersion,
    onStatusChange: setSyncStatus,
  });

  // ── Propagation helpers ──────────────────────────────────────────────────────

  const sessionsRef = useRef(session.state.sessions);
  useEffect(() => {
    sessionsRef.current = session.state.sessions;
  }, [session.state.sessions]);

  /** Resolve effective propagation flags from explicit override or session default. */
  const resolvePropagation = useCallback(
    (override?: Partial<PropagationPreference>): PropagationPreference => {
      const game = gameRef.current;
      const sessionId = game?.sessionId;
      const sess = sessionsRef.current.find((s) => s.id === sessionId);
      const base: PropagationPreference = sess?.propagationDefault ?? {
        toTemplate: true,
        toOtherGames: true,
      };
      return { ...base, ...override };
    },
    [],
  );

  /**
   * Apply a slot mutation to sibling games (not the current game, not the template).
   * Template propagation is handled at each call site via specific session actions
   * because template slot IDs differ from per-game slot IDs.
   */
  const propagateSlotMutation = useCallback(
    (
      pref: Pick<PropagationPreference, 'toOtherGames'>,
      mutator: (slots: Slot[]) => Slot[],
    ) => {
      const game = gameRef.current;
      if (!game) return;
      const sess = sessionsRef.current.find((s) => s.id === game.sessionId);
      if (!sess) return;
      if (!pref.toOtherGames) return;
      for (const gid of sess.gameIds) {
        if (gid === game.id) continue;
        try {
          const raw = localStorage.getItem(`storyteller-game-${gid}`);
          if (!raw) continue;
          const other = JSON.parse(raw) as Game;
          const newSlots = mutator(other.slots);
          const updated: Game = { ...other, slots: newSlots };
          localStorage.setItem(`storyteller-game-${gid}`, JSON.stringify(updated));
          apiSyncGame(updated);
        } catch {
          // Silently ignore storage errors
        }
      }
    },
    [apiSyncGame],
  );

  // ── Helper functions ──

  const loadGame = useCallback((game: Game) => {
    lastPushedGameRef.current = null;
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

  const updatePlayerState = useCallback((playerId: PlayerId, updates: PlayerStateUpdates) => {
    dispatch({ type: 'UPDATE_PLAYER_STATE', payload: { playerId, updates } });
  }, []);

  const addParticipant = useCallback(
    (playerId: PlayerId, opts?: { isTraveller?: boolean; characterId?: string }) => {
      dispatch({
        type: 'ADD_PARTICIPANT',
        payload: { playerId, isTraveller: opts?.isTraveller, characterId: opts?.characterId },
      });
    },
    [],
  );

  const removeParticipant = useCallback((playerId: PlayerId) => {
    dispatch({ type: 'REMOVE_PARTICIPANT', payload: { playerId } });
  }, []);

  const setParticipantTraveller = useCallback(
    (playerId: PlayerId, isTraveller: boolean, alignment?: Alignment) => {
      dispatch({
        type: 'SET_PARTICIPANT_TRAVELLER',
        payload: { playerId, isTraveller, alignment },
      });
    },
    [],
  );

  const addGameSeat = useCallback(
    (propagation?: Partial<PropagationPreference>): SlotId => {
      const slotId = generateId();
      const pref = resolvePropagation(propagation);
      dispatch({ type: 'ADD_GAME_SEAT', payload: { slotId } });
      const game = gameRef.current;
      const sess = sessionsRef.current.find((s) => s.id === game?.sessionId);
      if (sess && pref.toTemplate) {
        session.dispatch({
          type: 'ADD_TEMPLATE_SEAT',
          payload: { sessionId: sess.id, slotId: generateId() },
        });
      }
      if (sess && pref.toOtherGames) {
        propagateSlotMutation({ toOtherGames: true }, (slots) => [
          ...slots,
          { kind: 'seat', id: generateId(), playerId: null },
        ]);
      }
      return slotId;
    },
    [resolvePropagation, session, propagateSlotMutation],
  );

  const addGameSpacer = useCallback(
    (propagation?: Partial<PropagationPreference>): SlotId => {
      const slotId = generateId();
      const pref = resolvePropagation(propagation);
      dispatch({ type: 'ADD_GAME_SPACER', payload: { slotId } });
      const game = gameRef.current;
      const sess = sessionsRef.current.find((s) => s.id === game?.sessionId);
      if (sess && pref.toTemplate) {
        session.dispatch({
          type: 'ADD_TEMPLATE_SPACER',
          payload: { sessionId: sess.id, slotId: generateId() },
        });
      }
      if (sess && pref.toOtherGames) {
        propagateSlotMutation({ toOtherGames: true }, (slots) => [
          ...slots,
          { kind: 'spacer', id: generateId() },
        ]);
      }
      return slotId;
    },
    [resolvePropagation, session, propagateSlotMutation],
  );

  const addGameStoryteller = useCallback(
    (propagation?: Partial<PropagationPreference>): SlotId => {
      const slotId = generateId();
      const pref = resolvePropagation(propagation);
      dispatch({ type: 'ADD_GAME_STORYTELLER', payload: { slotId } });
      const game = gameRef.current;
      const sess = sessionsRef.current.find((s) => s.id === game?.sessionId);
      if (sess && pref.toTemplate) {
        session.dispatch({
          type: 'ADD_TEMPLATE_STORYTELLER',
          payload: { sessionId: sess.id, slotId: generateId() },
        });
      }
      if (sess && pref.toOtherGames) {
        propagateSlotMutation({ toOtherGames: true }, (slots) => [
          ...slots,
          { kind: 'storyteller', id: generateId() },
        ]);
      }
      return slotId;
    },
    [resolvePropagation, session, propagateSlotMutation],
  );

  const removeGameSlot = useCallback(
    (slotId: SlotId, propagation?: Partial<PropagationPreference>) => {
      const game = gameRef.current;
      if (!game) return;
      const targetSlot = game.slots.find((s) => s.id === slotId);
      if (!targetSlot) return;
      const targetIndex = game.slots.findIndex((s) => s.id === slotId);
      const pref = resolvePropagation(propagation);
      dispatch({ type: 'REMOVE_GAME_SLOT', payload: { slotId } });
      const sess = sessionsRef.current.find((s) => s.id === game.sessionId);
      if (sess && pref.toTemplate) {
        // Match by position+kind heuristic, since template slot IDs differ from game.
        const templateSlot = sess.template.slots.filter((s) => s.kind === targetSlot.kind)[
          game.slots.filter((s) => s.kind === targetSlot.kind).findIndex((s) => s.id === slotId)
        ];
        if (templateSlot) {
          session.dispatch({
            type: 'REMOVE_TEMPLATE_SLOT',
            payload: { sessionId: sess.id, slotId: templateSlot.id },
          });
        }
      }
      if (sess && pref.toOtherGames) {
        propagateSlotMutation({ toOtherGames: true }, (slots) => {
          const matching = slots.filter((s) => s.kind === targetSlot.kind);
          const matchAtIdx = matching[targetIndex] ?? matching[matching.length - 1];
          return matchAtIdx ? slots.filter((s) => s.id !== matchAtIdx.id) : slots;
        });
      }
    },
    [resolvePropagation, session, propagateSlotMutation],
  );

  const moveGameSlot = useCallback(
    (slotId: SlotId, toIndex: number, propagation?: Partial<PropagationPreference>) => {
      const game = gameRef.current;
      if (!game) return;
      const targetSlot = game.slots.find((s) => s.id === slotId);
      if (!targetSlot) return;
      const sourceIdx = game.slots.findIndex((s) => s.id === slotId);
      const pref = resolvePropagation(propagation);
      dispatch({ type: 'MOVE_GAME_SLOT', payload: { slotId, toIndex } });
      const sess = sessionsRef.current.find((s) => s.id === game.sessionId);
      if (sess && pref.toTemplate) {
        // Position-based match in the template
        const templateSlot = sess.template.slots[sourceIdx];
        if (templateSlot) {
          session.dispatch({
            type: 'MOVE_TEMPLATE_SLOT',
            payload: { sessionId: sess.id, slotId: templateSlot.id, toIndex },
          });
        }
      }
      if (sess && pref.toOtherGames) {
        propagateSlotMutation({ toOtherGames: true }, (slots) => {
          const other = slots[sourceIdx];
          return other ? moveSlot(slots, other.id, toIndex) : slots;
        });
      }
    },
    [resolvePropagation, session, propagateSlotMutation],
  );

  const assignGameSeat = useCallback(
    (slotId: SlotId, playerId: PlayerId | null, propagation?: Partial<PropagationPreference>) => {
      const game = gameRef.current;
      if (!game) return;
      const sourceIdx = game.slots.findIndex((s) => s.id === slotId);
      const pref = resolvePropagation(propagation);
      dispatch({ type: 'ASSIGN_GAME_SEAT', payload: { slotId, playerId } });
      const sess = sessionsRef.current.find((s) => s.id === game.sessionId);
      if (sess && pref.toTemplate) {
        const templateSlot = sess.template.slots[sourceIdx];
        if (templateSlot && templateSlot.kind === 'seat') {
          session.dispatch({
            type: 'ASSIGN_TEMPLATE_SEAT',
            payload: { sessionId: sess.id, slotId: templateSlot.id, playerId },
          });
        }
      }
      if (sess && pref.toOtherGames) {
        propagateSlotMutation({ toOtherGames: true }, (slots) => {
          const other = slots[sourceIdx];
          if (!other || other.kind !== 'seat') return slots;
          return setSeatPlayer(slots, other.id, playerId);
        });
      }
    },
    [resolvePropagation, session, propagateSlotMutation],
  );

  const setPlayerCountOverride = useCallback((count: number | null) => {
    dispatch({ type: 'SET_PLAYER_COUNT_OVERRIDE', payload: { count } });
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

  const addToken = useCallback((playerId: PlayerId, token: PlayerToken) => {
    dispatch({ type: 'ADD_TOKEN', payload: { playerId, token } });
  }, []);

  const removeToken = useCallback((playerId: PlayerId, tokenId: string) => {
    dispatch({ type: 'REMOVE_TOKEN', payload: { playerId, tokenId } });
  }, []);

  const setNightCardIndex = useCallback((index: number) => {
    dispatch({ type: 'SET_NIGHT_CARD_INDEX', payload: { index } });
  }, []);

  const updateNightHistory = useCallback((index: number, entry: NightHistoryEntry) => {
    dispatch({ type: 'UPDATE_NIGHT_HISTORY', payload: { index, entry } });
  }, []);

  const updateNightHistoryNote = useCallback(
    (nightIndex: number, characterId: string, note: string) => {
      dispatch({ type: 'UPDATE_NIGHT_HISTORY_NOTE', payload: { nightIndex, characterId, note } });
    },
    [],
  );

  const updateNightHistoryChoice = useCallback(
    (nightIndex: number, characterId: string, choiceValue: string | string[]) => {
      dispatch({
        type: 'UPDATE_NIGHT_HISTORY_CHOICE',
        payload: { nightIndex, characterId, choiceValue },
      });
    },
    [],
  );

  const addFabled = useCallback((characterId: string) => {
    dispatch({ type: 'ADD_FABLED', payload: { characterId } });
  }, []);

  const removeFabled = useCallback((characterId: string) => {
    dispatch({ type: 'REMOVE_FABLED', payload: { characterId } });
  }, []);

  const addLoric = useCallback((characterId: string) => {
    dispatch({ type: 'ADD_LORIC', payload: { characterId } });
  }, []);

  const removeLoric = useCallback((characterId: string) => {
    dispatch({ type: 'REMOVE_LORIC', payload: { characterId } });
  }, []);

  const setInPlayCharacters = useCallback((characterIds: string[]) => {
    dispatch({ type: 'SET_IN_PLAY_CHARACTERS', payload: { characterIds } });
  }, []);

  const setApparentCharacter = useCallback((playerId: PlayerId, apparentCharacterId: string) => {
    dispatch({ type: 'SET_APPARENT_CHARACTER', payload: { playerId, apparentCharacterId } });
  }, []);

  const setDemonBluffs = useCallback((characterIds: string[]) => {
    dispatch({ type: 'SET_DEMON_BLUFFS', payload: { characterIds } });
  }, []);

  const setLunaticBluffs = useCallback((characterIds: string[]) => {
    dispatch({ type: 'SET_LUNATIC_BLUFFS', payload: { characterIds } });
  }, []);

  const setPlayerBluffs = useCallback((playerId: PlayerId, bluffIds: string[]) => {
    dispatch({ type: 'SET_PLAYER_BLUFFS', payload: { playerId, bluffIds } });
  }, []);

  const setCustomPlayerMessage = useCallback((characterId: string, message: string) => {
    dispatch({ type: 'SET_CUSTOM_PLAYER_MESSAGE', payload: { characterId, message } });
  }, []);

  const clearCustomPlayerMessage = useCallback((characterId: string) => {
    dispatch({ type: 'CLEAR_CUSTOM_PLAYER_MESSAGE', payload: { characterId } });
  }, []);

  const recordAlignmentChange = useCallback(
    (
      playerId: PlayerId,
      newAlignment: Alignment,
      reason: string,
      day: number,
      nightPhase: 'first' | 'other' | 'day' | 'manual',
    ) => {
      dispatch({
        type: 'RECORD_ALIGNMENT_CHANGE',
        payload: { playerId, newAlignment, reason, day, nightPhase },
      });
    },
    [],
  );

  const setGainedAbility = useCallback((playerId: PlayerId, gainedAbility: GainedAbility) => {
    dispatch({ type: 'SET_GAINED_ABILITY', payload: { playerId, gainedAbility } });
  }, []);

  const clearGainedAbility = useCallback((playerId: PlayerId) => {
    dispatch({ type: 'CLEAR_GAINED_ABILITY', payload: { playerId } });
  }, []);

  const syncGame = useCallback((game: Game) => {
    dispatch({ type: 'SYNC_GAME', payload: { game } });
  }, []);

  const addShowMessage = useCallback(
    (gameId: string, playerId: PlayerId, text: string, templateId?: string) => {
      dispatch({ type: 'ADD_SHOW_MESSAGE', payload: { gameId, playerId, text, templateId } });
    },
    [],
  );

  const markShowMessageShown = useCallback((gameId: string, messageId: string) => {
    dispatch({ type: 'MARK_SHOW_MESSAGE_SHOWN', payload: { gameId, messageId } });
  }, []);

  const editShowMessage = useCallback((gameId: string, messageId: string, text: string) => {
    dispatch({ type: 'EDIT_SHOW_MESSAGE', payload: { gameId, messageId, text } });
  }, []);

  const deleteShowMessage = useCallback((gameId: string, messageId: string) => {
    dispatch({ type: 'DELETE_SHOW_MESSAGE', payload: { gameId, messageId } });
  }, []);

  const pinShowTemplate = useCallback(
    (gameId: string, text: string, scope: ShowToPlayerTemplate['scope'], scriptId?: string) => {
      dispatch({ type: 'PIN_SHOW_TEMPLATE', payload: { gameId, text, scope, scriptId } });
    },
    [],
  );

  const unpinShowTemplate = useCallback((gameId: string, templateId: string) => {
    dispatch({ type: 'UNPIN_SHOW_TEMPLATE', payload: { gameId, templateId } });
  }, []);

  const bumpTemplateUsage = useCallback((gameId: string, templateId: string) => {
    dispatch({ type: 'BUMP_TEMPLATE_USAGE', payload: { gameId, templateId } });
  }, []);

  const value: GameContextValue = {
    state,
    dispatch,
    loadGame,
    setPhase,
    advanceDay,
    toggleShowCharacters,
    updatePlayerState,
    addParticipant,
    removeParticipant,
    setParticipantTraveller,
    addGameSeat,
    addGameSpacer,
    addGameStoryteller,
    removeGameSlot,
    moveGameSlot,
    assignGameSeat,
    setPlayerCountOverride,
    startNight,
    updateNightProgress,
    completeNight,
    saveGame,
    setNightCardIndex,
    addToken,
    removeToken,
    updateNightHistory,
    updateNightHistoryNote,
    updateNightHistoryChoice,
    addFabled,
    removeFabled,
    addLoric,
    removeLoric,
    setInPlayCharacters,
    setApparentCharacter,
    setDemonBluffs,
    setLunaticBluffs,
    setPlayerBluffs,
    setCustomPlayerMessage,
    clearCustomPlayerMessage,
    addShowMessage,
    markShowMessageShown,
    editShowMessage,
    deleteShowMessage,
    pinShowTemplate,
    unpinShowTemplate,
    bumpTemplateUsage,
    recordAlignmentChange,
    setGainedAbility,
    clearGainedAbility,
    syncGame,
    syncStatus,
    forceSync,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
