import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { GameProvider, useGame } from './GameContext';
import type { Game, PlayerSeat, NightHistoryEntry, PlayerToken } from '@/types/index.ts';
import { Phase, Alignment } from '@/types/index.ts';

// ──────────────────────────────────────────────
// Factories
// ──────────────────────────────────────────────

const makePlayer = (overrides: Partial<PlayerSeat> = {}): PlayerSeat => ({
  seat: 1,
  playerName: 'Alice',
  characterId: 'imp',
  alive: true,
  ghostVoteUsed: false,
  visibleAlignment: Alignment.Unknown,
  actualAlignment: Alignment.Evil,
  startingAlignment: Alignment.Evil,
  activeReminders: [],
  isTraveller: false,
  tokens: [],
  ...overrides,
});

const makeGame = (overrides: Partial<Game> = {}): Game => ({
  id: 'test-game',
  sessionId: 'test-session',
  scriptId: 'test-script',
  currentDay: 1,
  currentPhase: Phase.Day,
  isFirstNight: true,
  nightHistory: [],
  players: [],
  ...overrides,
});

const makeHistoryEntry = (overrides: Partial<NightHistoryEntry> = {}): NightHistoryEntry => ({
  dayNumber: 1,
  isFirstNight: true,
  completedAt: '2025-01-01T00:00:00.000Z',
  subActionStates: {},
  notes: {},
  selections: {},
  ...overrides,
});

// ──────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────

const wrapper = ({ children }: { children: ReactNode }) => <GameProvider>{children}</GameProvider>;

function renderGameHook() {
  return renderHook(() => useGame(), { wrapper });
}

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe('GameContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  // ── Initial state ──

  describe('initial state', () => {
    it('starts with null game, showCharacters false, nightProgress null', () => {
      const { result } = renderGameHook();
      expect(result.current.state.game).toBeNull();
      expect(result.current.state.showCharacters).toBe(false);
      expect(result.current.state.nightProgress).toBeNull();
    });
  });

  // ── LOAD_GAME ──

  describe('LOAD_GAME', () => {
    it('loads a game into state', () => {
      const { result } = renderGameHook();
      const game = makeGame({ players: [makePlayer()] });

      act(() => {
        result.current.loadGame(game);
      });

      expect(result.current.state.game).toEqual(game);
    });

    it('resets showCharacters to false on load', () => {
      const { result } = renderGameHook();

      // Toggle show characters on first
      act(() => {
        result.current.toggleShowCharacters();
      });
      expect(result.current.state.showCharacters).toBe(true);

      // Load game should reset it
      act(() => {
        result.current.loadGame(makeGame());
      });
      expect(result.current.state.showCharacters).toBe(false);
    });

    it('clears nightProgress on load', () => {
      const { result } = renderGameHook();

      // Load a game and start night
      act(() => {
        result.current.loadGame(makeGame());
      });
      act(() => {
        result.current.startNight(5);
      });
      expect(result.current.state.nightProgress).not.toBeNull();

      // Load new game should clear nightProgress
      act(() => {
        result.current.loadGame(makeGame({ id: 'game-2' }));
      });
      expect(result.current.state.nightProgress).toBeNull();
    });
  });

  // ── SET_PHASE ──

  describe('SET_PHASE', () => {
    it('changes game phase from Day to Night', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.loadGame(makeGame({ currentPhase: Phase.Day }));
      });

      act(() => {
        result.current.setPhase(Phase.Night);
      });

      expect(result.current.state.game!.currentPhase).toBe(Phase.Night);
    });

    it('changes game phase from Night to Day', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.loadGame(makeGame({ currentPhase: Phase.Night }));
      });

      act(() => {
        result.current.setPhase(Phase.Day);
      });

      expect(result.current.state.game!.currentPhase).toBe(Phase.Day);
    });

    it('does nothing when no game is loaded', () => {
      const { result } = renderGameHook();

      act(() => {
        result.current.setPhase(Phase.Night);
      });

      expect(result.current.state.game).toBeNull();
    });
  });

  // ── ADVANCE_DAY ──

  describe('ADVANCE_DAY', () => {
    it('increments currentDay by 1', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.loadGame(makeGame({ currentDay: 2 }));
      });

      act(() => {
        result.current.advanceDay();
      });

      expect(result.current.state.game!.currentDay).toBe(3);
    });

    it('sets isFirstNight to false', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.loadGame(makeGame({ isFirstNight: true }));
      });

      act(() => {
        result.current.advanceDay();
      });

      expect(result.current.state.game!.isFirstNight).toBe(false);
    });

    it('does nothing when no game is loaded', () => {
      const { result } = renderGameHook();

      act(() => {
        result.current.advanceDay();
      });

      expect(result.current.state.game).toBeNull();
    });
  });

  // ── TOGGLE_SHOW_CHARACTERS ──

  describe('TOGGLE_SHOW_CHARACTERS', () => {
    it('toggles showCharacters from false to true', () => {
      const { result } = renderGameHook();

      act(() => {
        result.current.toggleShowCharacters();
      });

      expect(result.current.state.showCharacters).toBe(true);
    });

    it('toggles showCharacters from true to false', () => {
      const { result } = renderGameHook();

      act(() => {
        result.current.toggleShowCharacters();
      });
      act(() => {
        result.current.toggleShowCharacters();
      });

      expect(result.current.state.showCharacters).toBe(false);
    });
  });

  // ── UPDATE_PLAYER ──

  describe('UPDATE_PLAYER', () => {
    it('kills a player (alive → false)', () => {
      const { result } = renderGameHook();
      const player = makePlayer({ seat: 1, alive: true });
      act(() => {
        result.current.loadGame(makeGame({ players: [player] }));
      });

      act(() => {
        result.current.updatePlayer(1, { alive: false });
      });

      expect(result.current.state.game!.players[0].alive).toBe(false);
    });

    it('resurrects a player (alive false → true)', () => {
      const { result } = renderGameHook();
      const player = makePlayer({ seat: 1, alive: false });
      act(() => {
        result.current.loadGame(makeGame({ players: [player] }));
      });

      act(() => {
        result.current.updatePlayer(1, { alive: true });
      });

      expect(result.current.state.game!.players[0].alive).toBe(true);
    });

    it('uses ghost vote', () => {
      const { result } = renderGameHook();
      const player = makePlayer({ seat: 1, ghostVoteUsed: false });
      act(() => {
        result.current.loadGame(makeGame({ players: [player] }));
      });

      act(() => {
        result.current.updatePlayer(1, { ghostVoteUsed: true });
      });

      expect(result.current.state.game!.players[0].ghostVoteUsed).toBe(true);
    });

    it('updates character assignment', () => {
      const { result } = renderGameHook();
      const player = makePlayer({ seat: 1, characterId: 'imp' });
      act(() => {
        result.current.loadGame(makeGame({ players: [player] }));
      });

      act(() => {
        result.current.updatePlayer(1, { characterId: 'monk' });
      });

      expect(result.current.state.game!.players[0].characterId).toBe('monk');
    });

    it('updates player alignment', () => {
      const { result } = renderGameHook();
      const player = makePlayer({ seat: 1 });
      act(() => {
        result.current.loadGame(makeGame({ players: [player] }));
      });

      act(() => {
        result.current.updatePlayer(1, {
          actualAlignment: Alignment.Good,
          visibleAlignment: Alignment.Good,
        });
      });

      expect(result.current.state.game!.players[0].actualAlignment).toBe(Alignment.Good);
      expect(result.current.state.game!.players[0].visibleAlignment).toBe(Alignment.Good);
    });

    it('updates player name', () => {
      const { result } = renderGameHook();
      const player = makePlayer({ seat: 1, playerName: 'Alice' });
      act(() => {
        result.current.loadGame(makeGame({ players: [player] }));
      });

      act(() => {
        result.current.updatePlayer(1, { playerName: 'Bob' });
      });

      expect(result.current.state.game!.players[0].playerName).toBe('Bob');
    });

    it('only updates the targeted seat, leaving others unchanged', () => {
      const { result } = renderGameHook();
      const p1 = makePlayer({ seat: 1, playerName: 'Alice' });
      const p2 = makePlayer({ seat: 2, playerName: 'Bob', characterId: 'monk' });
      act(() => {
        result.current.loadGame(makeGame({ players: [p1, p2] }));
      });

      act(() => {
        result.current.updatePlayer(1, { alive: false });
      });

      expect(result.current.state.game!.players[1].alive).toBe(true);
      expect(result.current.state.game!.players[1].playerName).toBe('Bob');
    });

    it('does nothing when no game is loaded', () => {
      const { result } = renderGameHook();

      act(() => {
        result.current.updatePlayer(1, { alive: false });
      });

      expect(result.current.state.game).toBeNull();
    });

    it('updating a non-existent seat leaves all players unchanged', () => {
      const { result } = renderGameHook();
      const player = makePlayer({ seat: 1 });
      act(() => {
        result.current.loadGame(makeGame({ players: [player] }));
      });

      act(() => {
        result.current.updatePlayer(99, { alive: false });
      });

      expect(result.current.state.game!.players[0].alive).toBe(true);
    });
  });

  // ── ADD_TRAVELLER ──

  describe('ADD_TRAVELLER', () => {
    it('adds a Good traveller to the players array', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.loadGame(makeGame({ players: [makePlayer({ seat: 1 })] }));
      });

      act(() => {
        result.current.addTraveller(2, 'Charlie', 'scapegoat', 'Good');
      });

      const players = result.current.state.game!.players;
      expect(players).toHaveLength(2);
      const traveller = players[1];
      expect(traveller.seat).toBe(2);
      expect(traveller.playerName).toBe('Charlie');
      expect(traveller.characterId).toBe('scapegoat');
      expect(traveller.isTraveller).toBe(true);
      expect(traveller.alive).toBe(true);
      expect(traveller.ghostVoteUsed).toBe(false);
      expect(traveller.actualAlignment).toBe(Alignment.Good);
      expect(traveller.startingAlignment).toBe(Alignment.Good);
      expect(traveller.visibleAlignment).toBe(Alignment.Unknown);
    });

    it('adds an Evil traveller with correct alignment', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.loadGame(makeGame());
      });

      act(() => {
        result.current.addTraveller(1, 'Dave', 'bureaucrat', 'Evil');
      });

      const traveller = result.current.state.game!.players[0];
      expect(traveller.actualAlignment).toBe(Alignment.Evil);
      expect(traveller.startingAlignment).toBe(Alignment.Evil);
    });

    it('does nothing when no game is loaded', () => {
      const { result } = renderGameHook();

      act(() => {
        result.current.addTraveller(1, 'X', 'y', 'Good');
      });

      expect(result.current.state.game).toBeNull();
    });
  });

  // ── REMOVE_TRAVELLER ──

  describe('REMOVE_TRAVELLER', () => {
    it('removes a traveller by seat', () => {
      const { result } = renderGameHook();
      const traveller = makePlayer({ seat: 2, isTraveller: true, characterId: 'scapegoat' });
      act(() => {
        result.current.loadGame(makeGame({ players: [makePlayer({ seat: 1 }), traveller] }));
      });

      act(() => {
        result.current.removeTraveller(2);
      });

      expect(result.current.state.game!.players).toHaveLength(1);
      expect(result.current.state.game!.players[0].seat).toBe(1);
    });

    it('does not remove a non-traveller at the same seat', () => {
      const { result } = renderGameHook();
      const regular = makePlayer({ seat: 2, isTraveller: false });
      act(() => {
        result.current.loadGame(makeGame({ players: [makePlayer({ seat: 1 }), regular] }));
      });

      act(() => {
        result.current.removeTraveller(2);
      });

      // Non-traveller should remain
      expect(result.current.state.game!.players).toHaveLength(2);
    });

    it('does nothing when no game is loaded', () => {
      const { result } = renderGameHook();

      act(() => {
        result.current.removeTraveller(1);
      });

      expect(result.current.state.game).toBeNull();
    });
  });

  // ── START_NIGHT ──

  describe('START_NIGHT', () => {
    it('initializes nightProgress with correct structure', () => {
      const { result } = renderGameHook();

      act(() => {
        result.current.startNight(7);
      });

      const np = result.current.state.nightProgress;
      expect(np).not.toBeNull();
      expect(np!.currentCardIndex).toBe(0);
      expect(np!.totalCards).toBe(7);
      expect(np!.subActionStates).toEqual({});
      expect(np!.notes).toEqual({});
      expect(np!.selections).toEqual({});
    });
  });

  // ── SET_NIGHT_CARD_INDEX ──

  describe('SET_NIGHT_CARD_INDEX', () => {
    it('updates currentCardIndex when nightProgress exists', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.startNight(5);
      });

      act(() => {
        result.current.setNightCardIndex(3);
      });

      expect(result.current.state.nightProgress!.currentCardIndex).toBe(3);
    });

    it('is a no-op when nightProgress is null', () => {
      const { result } = renderGameHook();

      act(() => {
        result.current.setNightCardIndex(3);
      });

      expect(result.current.state.nightProgress).toBeNull();
    });

    it('preserves other nightProgress fields', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.startNight(5);
      });
      act(() => {
        result.current.updateNightProgress('imp', [true, false]);
      });

      act(() => {
        result.current.setNightCardIndex(2);
      });

      const np = result.current.state.nightProgress!;
      expect(np.currentCardIndex).toBe(2);
      expect(np.subActionStates['imp']).toEqual([true, false]);
      expect(np.totalCards).toBe(5);
    });
  });

  // ── UPDATE_NIGHT_PROGRESS ──

  describe('UPDATE_NIGHT_PROGRESS', () => {
    it('updates sub-action states for a character', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.startNight(5);
      });

      act(() => {
        result.current.updateNightProgress('imp', [true, false, true]);
      });

      expect(result.current.state.nightProgress!.subActionStates['imp']).toEqual([
        true,
        false,
        true,
      ]);
    });

    it('updates note for a character', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.startNight(5);
      });

      act(() => {
        result.current.updateNightProgress('monk', undefined, 'Protected Alice');
      });

      expect(result.current.state.nightProgress!.notes['monk']).toBe('Protected Alice');
    });

    it('updates selection (string) for a character', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.startNight(5);
      });

      act(() => {
        result.current.updateNightProgress('fortuneteller', undefined, undefined, 'Alice');
      });

      expect(result.current.state.nightProgress!.selections['fortuneteller']).toBe('Alice');
    });

    it('updates selection (string array) for a character', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.startNight(5);
      });

      act(() => {
        result.current.updateNightProgress('fortuneteller', undefined, undefined, ['Alice', 'Bob']);
      });

      expect(result.current.state.nightProgress!.selections['fortuneteller']).toEqual([
        'Alice',
        'Bob',
      ]);
    });

    it('preserves existing progress for other characters', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.startNight(5);
      });

      act(() => {
        result.current.updateNightProgress('imp', [true]);
      });
      act(() => {
        result.current.updateNightProgress('monk', [false, true]);
      });

      expect(result.current.state.nightProgress!.subActionStates['imp']).toEqual([true]);
      expect(result.current.state.nightProgress!.subActionStates['monk']).toEqual([false, true]);
    });

    it('does nothing when nightProgress is null', () => {
      const { result } = renderGameHook();

      act(() => {
        result.current.updateNightProgress('imp', [true]);
      });

      expect(result.current.state.nightProgress).toBeNull();
    });

    it('can update all fields at once', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.startNight(3);
      });

      act(() => {
        result.current.updateNightProgress('monk', [true, false], 'chose Alice', 'Alice');
      });

      const np = result.current.state.nightProgress!;
      expect(np.subActionStates['monk']).toEqual([true, false]);
      expect(np.notes['monk']).toBe('chose Alice');
      expect(np.selections['monk']).toBe('Alice');
    });
  });

  // ── COMPLETE_NIGHT ──

  describe('COMPLETE_NIGHT', () => {
    it('adds a history entry and advances the game', () => {
      const { result } = renderGameHook();
      const player = makePlayer({ seat: 1, characterId: 'imp' });
      act(() => {
        result.current.loadGame(makeGame({ currentDay: 1, isFirstNight: true, players: [player] }));
      });
      act(() => {
        result.current.startNight(3);
      });
      act(() => {
        result.current.updateNightProgress('imp', [true, true]);
      });

      act(() => {
        result.current.completeNight();
      });

      const game = result.current.state.game!;
      expect(game.nightHistory).toHaveLength(1);
      expect(game.nightHistory[0].dayNumber).toBe(1);
      expect(game.nightHistory[0].isFirstNight).toBe(true);
      expect(game.nightHistory[0].subActionStates['imp']).toEqual([true, true]);
      expect(game.currentPhase).toBe(Phase.Day);
      expect(game.currentDay).toBe(2);
      expect(game.isFirstNight).toBe(false);
    });

    it('clears nightProgress after completion', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.loadGame(makeGame({ players: [makePlayer()] }));
      });
      act(() => {
        result.current.startNight(3);
      });

      act(() => {
        result.current.completeNight();
      });

      expect(result.current.state.nightProgress).toBeNull();
    });

    it('includes token snapshot in history entry', () => {
      const { result } = renderGameHook();
      const token: PlayerToken = {
        id: 'token-1',
        type: 'drunk',
        label: 'Drunk',
        sourceCharacterId: 'drunk',
      };
      const player = makePlayer({ seat: 1, characterId: 'imp', tokens: [token] });
      act(() => {
        result.current.loadGame(makeGame({ players: [player] }));
      });
      act(() => {
        result.current.startNight(1);
      });

      act(() => {
        result.current.completeNight();
      });

      const entry = result.current.state.game!.nightHistory[0];
      expect(entry.tokenSnapshot).toBeDefined();
      expect(entry.tokenSnapshot!['imp']).toEqual([token]);
    });

    it('does not include players without tokens in snapshot', () => {
      const { result } = renderGameHook();
      const player = makePlayer({ seat: 1, characterId: 'monk', tokens: [] });
      act(() => {
        result.current.loadGame(makeGame({ players: [player] }));
      });
      act(() => {
        result.current.startNight(1);
      });

      act(() => {
        result.current.completeNight();
      });

      const entry = result.current.state.game!.nightHistory[0];
      expect(entry.tokenSnapshot!['monk']).toBeUndefined();
    });

    it('does nothing when no game is loaded', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.startNight(3);
      });

      act(() => {
        result.current.completeNight();
      });

      // State unchanged — no game, so no history
      expect(result.current.state.game).toBeNull();
    });

    it('does nothing when nightProgress is null', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.loadGame(makeGame());
      });

      act(() => {
        result.current.completeNight();
      });

      expect(result.current.state.game!.nightHistory).toHaveLength(0);
    });

    it('persists game to localStorage on completion', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.loadGame(makeGame({ id: 'persist-test', players: [makePlayer()] }));
      });
      act(() => {
        result.current.startNight(1);
      });

      act(() => {
        result.current.completeNight();
      });

      const raw = localStorage.getItem('storyteller-game-persist-test');
      expect(raw).not.toBeNull();
      const persisted = JSON.parse(raw!) as Game;
      expect(persisted.nightHistory).toHaveLength(1);
    });
  });

  // ── SAVE_GAME ──

  describe('SAVE_GAME', () => {
    it('persists current game to localStorage', () => {
      const { result } = renderGameHook();
      const game = makeGame({ id: 'save-test' });
      act(() => {
        result.current.loadGame(game);
      });

      act(() => {
        result.current.saveGame();
      });

      const raw = localStorage.getItem('storyteller-game-save-test');
      expect(raw).not.toBeNull();
      const persisted = JSON.parse(raw!) as Game;
      expect(persisted.id).toBe('save-test');
    });

    it('does not throw when no game is loaded', () => {
      const { result } = renderGameHook();

      expect(() => {
        act(() => {
          result.current.saveGame();
        });
      }).not.toThrow();
    });
  });

  // ── ADD_TOKEN ──

  describe('ADD_TOKEN', () => {
    it('adds a token to the specified player', () => {
      const { result } = renderGameHook();
      const player = makePlayer({ seat: 1, tokens: [] });
      act(() => {
        result.current.loadGame(makeGame({ players: [player] }));
      });

      const token: PlayerToken = {
        id: 'tok-1',
        type: 'poisoned',
        label: 'Poisoned',
      };
      act(() => {
        result.current.addToken(1, token);
      });

      expect(result.current.state.game!.players[0].tokens).toHaveLength(1);
      expect(result.current.state.game!.players[0].tokens[0]).toEqual(token);
    });

    it('appends to existing tokens', () => {
      const { result } = renderGameHook();
      const existingToken: PlayerToken = { id: 'tok-1', type: 'drunk', label: 'Drunk' };
      const player = makePlayer({ seat: 1, tokens: [existingToken] });
      act(() => {
        result.current.loadGame(makeGame({ players: [player] }));
      });

      const newToken: PlayerToken = { id: 'tok-2', type: 'poisoned', label: 'Poisoned' };
      act(() => {
        result.current.addToken(1, newToken);
      });

      expect(result.current.state.game!.players[0].tokens).toHaveLength(2);
      expect(result.current.state.game!.players[0].tokens[1]).toEqual(newToken);
    });

    it('does not affect other players', () => {
      const { result } = renderGameHook();
      const p1 = makePlayer({ seat: 1 });
      const p2 = makePlayer({ seat: 2, playerName: 'Bob' });
      act(() => {
        result.current.loadGame(makeGame({ players: [p1, p2] }));
      });

      const token: PlayerToken = { id: 'tok-1', type: 'custom', label: 'Custom' };
      act(() => {
        result.current.addToken(1, token);
      });

      expect(result.current.state.game!.players[1].tokens).toHaveLength(0);
    });

    it('does nothing when no game is loaded', () => {
      const { result } = renderGameHook();
      const token: PlayerToken = { id: 'tok-1', type: 'drunk', label: 'Drunk' };

      act(() => {
        result.current.addToken(1, token);
      });

      expect(result.current.state.game).toBeNull();
    });
  });

  // ── REMOVE_TOKEN ──

  describe('REMOVE_TOKEN', () => {
    it('removes a token by id from the specified player', () => {
      const { result } = renderGameHook();
      const token: PlayerToken = { id: 'tok-1', type: 'drunk', label: 'Drunk' };
      const player = makePlayer({ seat: 1, tokens: [token] });
      act(() => {
        result.current.loadGame(makeGame({ players: [player] }));
      });

      act(() => {
        result.current.removeToken(1, 'tok-1');
      });

      expect(result.current.state.game!.players[0].tokens).toHaveLength(0);
    });

    it('leaves other tokens intact', () => {
      const { result } = renderGameHook();
      const tok1: PlayerToken = { id: 'tok-1', type: 'drunk', label: 'Drunk' };
      const tok2: PlayerToken = { id: 'tok-2', type: 'poisoned', label: 'Poisoned' };
      const player = makePlayer({ seat: 1, tokens: [tok1, tok2] });
      act(() => {
        result.current.loadGame(makeGame({ players: [player] }));
      });

      act(() => {
        result.current.removeToken(1, 'tok-1');
      });

      expect(result.current.state.game!.players[0].tokens).toHaveLength(1);
      expect(result.current.state.game!.players[0].tokens[0].id).toBe('tok-2');
    });

    it('does nothing when token id does not exist', () => {
      const { result } = renderGameHook();
      const token: PlayerToken = { id: 'tok-1', type: 'drunk', label: 'Drunk' };
      const player = makePlayer({ seat: 1, tokens: [token] });
      act(() => {
        result.current.loadGame(makeGame({ players: [player] }));
      });

      act(() => {
        result.current.removeToken(1, 'nonexistent');
      });

      expect(result.current.state.game!.players[0].tokens).toHaveLength(1);
    });

    it('does nothing when no game is loaded', () => {
      const { result } = renderGameHook();

      act(() => {
        result.current.removeToken(1, 'tok-1');
      });

      expect(result.current.state.game).toBeNull();
    });
  });

  // ── UPDATE_NIGHT_HISTORY ──

  describe('UPDATE_NIGHT_HISTORY', () => {
    it('updates a history entry at a valid index', () => {
      const { result } = renderGameHook();
      const entry = makeHistoryEntry({ dayNumber: 1 });
      act(() => {
        result.current.loadGame(makeGame({ nightHistory: [entry] }));
      });

      const updatedEntry = makeHistoryEntry({
        dayNumber: 1,
        notes: { imp: 'killed Alice' },
      });
      act(() => {
        result.current.updateNightHistory(0, updatedEntry);
      });

      expect(result.current.state.game!.nightHistory[0].notes['imp']).toBe('killed Alice');
    });

    it('does not modify history for out-of-range index', () => {
      const { result } = renderGameHook();
      const entry = makeHistoryEntry({ dayNumber: 1 });
      act(() => {
        result.current.loadGame(makeGame({ nightHistory: [entry] }));
      });

      const updatedEntry = makeHistoryEntry({ dayNumber: 99 });
      act(() => {
        result.current.updateNightHistory(5, updatedEntry);
      });

      expect(result.current.state.game!.nightHistory).toHaveLength(1);
      expect(result.current.state.game!.nightHistory[0].dayNumber).toBe(1);
    });

    it('does not modify history for negative index', () => {
      const { result } = renderGameHook();
      const entry = makeHistoryEntry({ dayNumber: 1 });
      act(() => {
        result.current.loadGame(makeGame({ nightHistory: [entry] }));
      });

      const updatedEntry = makeHistoryEntry({ dayNumber: 99 });
      act(() => {
        result.current.updateNightHistory(-1, updatedEntry);
      });

      expect(result.current.state.game!.nightHistory[0].dayNumber).toBe(1);
    });

    it('does nothing when no game is loaded', () => {
      const { result } = renderGameHook();

      act(() => {
        result.current.updateNightHistory(0, makeHistoryEntry());
      });

      expect(result.current.state.game).toBeNull();
    });
  });

  // ── UPDATE_NIGHT_HISTORY_NOTE ──

  describe('UPDATE_NIGHT_HISTORY_NOTE', () => {
    it('updates a note for a specific character in a history entry', () => {
      const { result } = renderGameHook();
      const entry = makeHistoryEntry({ dayNumber: 1, notes: { imp: 'old note' } });
      act(() => {
        result.current.loadGame(makeGame({ nightHistory: [entry] }));
      });

      act(() => {
        result.current.updateNightHistoryNote(0, 'imp', 'updated note');
      });

      expect(result.current.state.game!.nightHistory[0].notes['imp']).toBe('updated note');
    });

    it('adds a new note without removing existing ones', () => {
      const { result } = renderGameHook();
      const entry = makeHistoryEntry({ dayNumber: 1, notes: { imp: 'imp note' } });
      act(() => {
        result.current.loadGame(makeGame({ nightHistory: [entry] }));
      });

      act(() => {
        result.current.updateNightHistoryNote(0, 'fortuneteller', 'ft note');
      });

      expect(result.current.state.game!.nightHistory[0].notes['imp']).toBe('imp note');
      expect(result.current.state.game!.nightHistory[0].notes['fortuneteller']).toBe('ft note');
    });

    it('does not modify history for out-of-range index', () => {
      const { result } = renderGameHook();
      const entry = makeHistoryEntry({ dayNumber: 1, notes: { imp: 'original' } });
      act(() => {
        result.current.loadGame(makeGame({ nightHistory: [entry] }));
      });

      act(() => {
        result.current.updateNightHistoryNote(5, 'imp', 'should not apply');
      });

      expect(result.current.state.game!.nightHistory[0].notes['imp']).toBe('original');
    });

    it('does not modify history for negative index', () => {
      const { result } = renderGameHook();
      const entry = makeHistoryEntry({ dayNumber: 1, notes: {} });
      act(() => {
        result.current.loadGame(makeGame({ nightHistory: [entry] }));
      });

      act(() => {
        result.current.updateNightHistoryNote(-1, 'imp', 'nope');
      });

      expect(result.current.state.game!.nightHistory[0].notes['imp']).toBeUndefined();
    });

    it('does nothing when no game is loaded', () => {
      const { result } = renderGameHook();

      act(() => {
        result.current.updateNightHistoryNote(0, 'imp', 'nope');
      });

      expect(result.current.state.game).toBeNull();
    });
  });

  // ── UPDATE_NIGHT_HISTORY_CHOICE ──

  describe('UPDATE_NIGHT_HISTORY_CHOICE', () => {
    it('updates a selection for a specific character in a history entry', () => {
      const { result } = renderGameHook();
      const entry = makeHistoryEntry({ dayNumber: 1, selections: { imp: 'Alice' } });
      act(() => {
        result.current.loadGame(makeGame({ nightHistory: [entry] }));
      });

      act(() => {
        result.current.updateNightHistoryChoice(0, 'imp', 'Bob');
      });

      expect(result.current.state.game!.nightHistory[0].selections['imp']).toBe('Bob');
    });

    it('handles array selections (multi-select)', () => {
      const { result } = renderGameHook();
      const entry = makeHistoryEntry({ dayNumber: 1, selections: {} });
      act(() => {
        result.current.loadGame(makeGame({ nightHistory: [entry] }));
      });

      act(() => {
        result.current.updateNightHistoryChoice(0, 'fortuneteller', ['Alice', 'Bob']);
      });

      expect(result.current.state.game!.nightHistory[0].selections['fortuneteller']).toEqual([
        'Alice',
        'Bob',
      ]);
    });

    it('adds a new selection without removing existing ones', () => {
      const { result } = renderGameHook();
      const entry = makeHistoryEntry({ dayNumber: 1, selections: { imp: 'Alice' } });
      act(() => {
        result.current.loadGame(makeGame({ nightHistory: [entry] }));
      });

      act(() => {
        result.current.updateNightHistoryChoice(0, 'poisoner', 'Charlie');
      });

      expect(result.current.state.game!.nightHistory[0].selections['imp']).toBe('Alice');
      expect(result.current.state.game!.nightHistory[0].selections['poisoner']).toBe('Charlie');
    });

    it('does not affect other night history entries', () => {
      const { result } = renderGameHook();
      const entry1 = makeHistoryEntry({ dayNumber: 1, selections: { imp: 'Alice' } });
      const entry2 = makeHistoryEntry({
        dayNumber: 2,
        isFirstNight: false,
        selections: { imp: 'Bob' },
      });
      act(() => {
        result.current.loadGame(makeGame({ nightHistory: [entry1, entry2] }));
      });

      act(() => {
        result.current.updateNightHistoryChoice(0, 'imp', 'Charlie');
      });

      expect(result.current.state.game!.nightHistory[0].selections['imp']).toBe('Charlie');
      expect(result.current.state.game!.nightHistory[1].selections['imp']).toBe('Bob');
    });

    it('does not modify history for out-of-range index', () => {
      const { result } = renderGameHook();
      const entry = makeHistoryEntry({ dayNumber: 1, selections: { imp: 'Alice' } });
      act(() => {
        result.current.loadGame(makeGame({ nightHistory: [entry] }));
      });

      act(() => {
        result.current.updateNightHistoryChoice(5, 'imp', 'nope');
      });

      expect(result.current.state.game!.nightHistory[0].selections['imp']).toBe('Alice');
    });

    it('does nothing when no game is loaded', () => {
      const { result } = renderGameHook();

      act(() => {
        result.current.updateNightHistoryChoice(0, 'imp', 'nope');
      });

      expect(result.current.state.game).toBeNull();
    });
  });

  // ── localStorage persistence via useEffect ──

  describe('localStorage persistence', () => {
    it('auto-saves game to localStorage when game state changes', () => {
      const { result } = renderGameHook();
      const game = makeGame({ id: 'auto-save-test' });

      act(() => {
        result.current.loadGame(game);
      });

      const raw = localStorage.getItem('storyteller-game-auto-save-test');
      expect(raw).not.toBeNull();
      const persisted = JSON.parse(raw!) as Game;
      expect(persisted.id).toBe('auto-save-test');
    });

    it('updates localStorage when player is modified', () => {
      const { result } = renderGameHook();
      const player = makePlayer({ seat: 1, alive: true });
      act(() => {
        result.current.loadGame(makeGame({ id: 'update-persist', players: [player] }));
      });

      act(() => {
        result.current.updatePlayer(1, { alive: false });
      });

      const raw = localStorage.getItem('storyteller-game-update-persist');
      expect(raw).not.toBeNull();
      const persisted = JSON.parse(raw!) as Game;
      expect(persisted.players[0].alive).toBe(false);
    });

    it('handles localStorage.setItem failure gracefully', () => {
      const { result } = renderGameHook();

      // Mock setItem to throw
      const originalSetItem = localStorage.setItem.bind(localStorage);
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage full');
      });

      // Should not throw
      expect(() => {
        act(() => {
          result.current.loadGame(makeGame({ id: 'fail-test' }));
        });
      }).not.toThrow();

      // Restore
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(originalSetItem);
    });
  });

  // ── useGame hook guard ──

  describe('useGame hook', () => {
    it('throws when used outside GameProvider', () => {
      // Suppress React error boundary console output
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useGame());
      }).toThrow('useGame must be used within a <GameProvider>');

      consoleSpy.mockRestore();
    });
  });

  // ── ADD_FABLED / REMOVE_FABLED ──

  describe('ADD_FABLED', () => {
    it('adds a fabled character ID to activeFabled', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.loadGame(makeGame());
      });

      act(() => {
        result.current.addFabled('angel');
      });

      expect(result.current.state.game!.activeFabled).toEqual(['angel']);
    });

    it('appends multiple fabled characters', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.loadGame(makeGame());
      });

      act(() => {
        result.current.addFabled('angel');
      });
      act(() => {
        result.current.addFabled('djinn');
      });

      expect(result.current.state.game!.activeFabled).toEqual(['angel', 'djinn']);
    });

    it('does not add duplicate fabled', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.loadGame(makeGame());
      });

      act(() => {
        result.current.addFabled('angel');
      });
      act(() => {
        result.current.addFabled('angel');
      });

      expect(result.current.state.game!.activeFabled).toEqual(['angel']);
    });

    it('does nothing when no game is loaded', () => {
      const { result } = renderGameHook();

      act(() => {
        result.current.addFabled('angel');
      });

      expect(result.current.state.game).toBeNull();
    });
  });

  describe('REMOVE_FABLED', () => {
    it('removes a fabled character from activeFabled', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.loadGame(makeGame({ activeFabled: ['angel', 'djinn'] }));
      });

      act(() => {
        result.current.removeFabled('angel');
      });

      expect(result.current.state.game!.activeFabled).toEqual(['djinn']);
    });

    it('handles removing non-existent fabled gracefully', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.loadGame(makeGame({ activeFabled: ['angel'] }));
      });

      act(() => {
        result.current.removeFabled('nonexistent');
      });

      expect(result.current.state.game!.activeFabled).toEqual(['angel']);
    });

    it('does nothing when no game is loaded', () => {
      const { result } = renderGameHook();

      act(() => {
        result.current.removeFabled('angel');
      });

      expect(result.current.state.game).toBeNull();
    });
  });

  // ── ADD_LORIC / REMOVE_LORIC ──

  describe('ADD_LORIC', () => {
    it('adds a loric character ID to activeLoric', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.loadGame(makeGame());
      });

      act(() => {
        result.current.addLoric('bigwig');
      });

      expect(result.current.state.game!.activeLoric).toEqual(['bigwig']);
    });

    it('does not add duplicate loric', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.loadGame(makeGame());
      });

      act(() => {
        result.current.addLoric('bigwig');
      });
      act(() => {
        result.current.addLoric('bigwig');
      });

      expect(result.current.state.game!.activeLoric).toEqual(['bigwig']);
    });

    it('does nothing when no game is loaded', () => {
      const { result } = renderGameHook();

      act(() => {
        result.current.addLoric('bigwig');
      });

      expect(result.current.state.game).toBeNull();
    });
  });

  describe('REMOVE_LORIC', () => {
    it('removes a loric character from activeLoric', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.loadGame(makeGame({ activeLoric: ['bigwig', 'gardener'] }));
      });

      act(() => {
        result.current.removeLoric('bigwig');
      });

      expect(result.current.state.game!.activeLoric).toEqual(['gardener']);
    });

    it('does nothing when no game is loaded', () => {
      const { result } = renderGameHook();

      act(() => {
        result.current.removeLoric('bigwig');
      });

      expect(result.current.state.game).toBeNull();
    });
  });

  // ── Active Fabled/Loric persistence ──

  describe('activeFabled/activeLoric persistence', () => {
    it('persists activeFabled to localStorage', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.loadGame(makeGame({ id: 'fabled-persist' }));
      });
      act(() => {
        result.current.addFabled('angel');
      });

      const raw = localStorage.getItem('storyteller-game-fabled-persist');
      expect(raw).not.toBeNull();
      const persisted = JSON.parse(raw!) as Game;
      expect(persisted.activeFabled).toEqual(['angel']);
    });

    it('persists activeLoric to localStorage', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.loadGame(makeGame({ id: 'loric-persist' }));
      });
      act(() => {
        result.current.addLoric('bigwig');
      });

      const raw = localStorage.getItem('storyteller-game-loric-persist');
      expect(raw).not.toBeNull();
      const persisted = JSON.parse(raw!) as Game;
      expect(persisted.activeLoric).toEqual(['bigwig']);
    });
  });
});
