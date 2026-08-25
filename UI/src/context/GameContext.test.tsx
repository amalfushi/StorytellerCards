import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { GameProvider } from './GameContext';
import { SessionProvider } from './SessionContext';
import { useGame } from './useGame';
import { useSession } from './useSession';
import type {
  Game,
  GainedAbility,
  NightHistoryEntry,
  Participant,
  Player,
  PlayerGameState,
  PlayerToken,
  Session,
  Slot,
} from '@/types/index.ts';
import { Alignment, Phase } from '@/types/index.ts';

const apiFetchGame = vi.fn<() => Promise<Game | null>>(() => Promise.resolve(null));
const apiSyncGame = vi.fn();
const apiFetchSessions = vi.fn<() => Promise<Session[]>>(() => Promise.resolve([]));
const forceSync = vi.fn();

vi.mock('@/hooks/useApiSync.ts', () => ({
  isSyncDisabled: true,
  useApiSync: () => ({
    fetchGame: apiFetchGame,
    syncGame: apiSyncGame,
    syncSession: vi.fn(),
    fetchSessions: apiFetchSessions,
    deleteSession: vi.fn(),
    deleteGame: vi.fn(),
    syncScript: vi.fn(),
    fetchSession: vi.fn(),
    fetchScript: vi.fn(),
  }),
}));

vi.mock('@/hooks/useSseSync.ts', () => ({
  useSseSync: () => ({ forceSync }),
}));

let idCounter = 0;
vi.mock('@/utils/idGenerator.ts', () => ({
  generateId: () => `mock-id-${++idCounter}`,
}));

const localOnly = { toTemplate: false, toOtherGames: false };

const makePlayer = (id: string, name: string): Player => ({ id, name });

const makePlayerState = (overrides: Partial<PlayerGameState> = {}): PlayerGameState => ({
  characterId: 'imp',
  alive: true,
  ghostVoteUsed: false,
  visibleAlignment: Alignment.Unknown,
  actualAlignment: Alignment.Evil,
  startingAlignment: Alignment.Evil,
  activeReminders: [],
  tokens: [],
  ...overrides,
});

const makeSeat = (id: string, playerId: string | null): Slot => ({ kind: 'seat', id, playerId });

const makeGame = (overrides: Partial<Game> = {}): Game => ({
  id: 'test-game',
  sessionId: 'test-session',
  scriptId: 'test-script',
  currentDay: 1,
  currentPhase: Phase.Day,
  isFirstNight: true,
  slots: [],
  participants: [],
  playerState: {},
  playerCountOverride: null,
  nightHistory: [],
  ...overrides,
});

const makeGameWithPlayers = (
  players: Player[] = [makePlayer('player-1', 'Alice')],
  stateOverrides: Record<string, Partial<PlayerGameState>> = {},
): Game => {
  const slots: Slot[] = players.map((player, index) => makeSeat(`slot-${index + 1}`, player.id));
  const participants: Participant[] = players.map((player) => ({
    playerId: player.id,
    isTraveller: false,
  }));
  const playerState: Record<string, PlayerGameState> = {};
  for (const player of players) {
    playerState[player.id] = makePlayerState(stateOverrides[player.id]);
  }
  return makeGame({ slots, participants, playerState });
};

const makeHistoryEntry = (overrides: Partial<NightHistoryEntry> = {}): NightHistoryEntry => ({
  dayNumber: 1,
  isFirstNight: true,
  completedAt: '2025-01-01T00:00:00.000Z',
  subActionStates: {},
  notes: {},
  selections: {},
  ...overrides,
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <SessionProvider>
    <GameProvider>{children}</GameProvider>
  </SessionProvider>
);

function renderGameHook() {
  return renderHook(() => useGame(), { wrapper });
}

function renderContextsHook() {
  return renderHook(() => ({ game: useGame(), session: useSession() }), { wrapper });
}

function persistedGame(id: string): Game {
  const raw = localStorage.getItem(`storyteller-game-${id}`);
  expect(raw).not.toBeNull();
  return JSON.parse(raw!) as Game;
}

/*
 * Removed M41-incompatible legacy tests:
 * - `updatePlayer` name/seat tests: names now live on `Session.players`; game updates target `playerState[playerId]` only.
 * - `addTraveller`/`removeTraveller`: travellers are now participants toggled by `addParticipant`, `removeParticipant`, and `setParticipantTraveller`.
 * - `swapPlayerSeats`, `shiftPlayerSeats`, and `insertEmptySeat`: seat-number reseating actions were removed; slot layout is changed with add/move/remove/assign slot actions.
 * - Legacy custom-message migration from character keyed messages to seat keyed messages: the production normalizer now only ensures M36 arrays exist, and show messages are keyed by playerId.
 */
describe('GameContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    idCounter = 0;
    apiFetchGame.mockResolvedValue(null);
    apiFetchSessions.mockResolvedValue([]);
    apiSyncGame.mockClear();
    forceSync.mockClear();
  });

  describe('initial state', () => {
    it('starts with null game, showCharacters false, and nightProgress null', () => {
      const { result } = renderGameHook();

      expect(result.current.state.game).toBeNull();
      expect(result.current.state.showCharacters).toBe(false);
      expect(result.current.state.nightProgress).toBeNull();
    });

    describe('character drafting', () => {
      it('persists progress and atomically applies a completed draft', () => {
        const { result } = renderGameHook();
        const game = makeGameWithPlayers([
          makePlayer('player-1', 'Alice'),
          makePlayer('player-2', 'Bob'),
        ]);
        const draft: NonNullable<Game['characterDraft']> = {
          status: 'complete',
          setupMode: 'lilmonsta',
          presentationMode: 'open',
          playerOrder: ['player-2', 'player-1'],
          currentPlayerIndex: 2,
          entries: [
            {
              playerId: 'player-2',
              offer: {
                offeredCharacterIds: ['imp'],
                mulliganCharacterId: null,
                rolledCharacterTypes: [],
                legalCandidateCount: 1,
              },
              selectedCharacterId: 'imp',
              actualCharacterId: 'imp',
              apparentCharacterId: 'imp',
              resolution: 'choice',
            },
            {
              playerId: 'player-1',
              offer: {
                offeredCharacterIds: ['washerwoman'],
                mulliganCharacterId: null,
                rolledCharacterTypes: [],
                legalCandidateCount: 1,
              },
              selectedCharacterId: 'washerwoman',
              actualCharacterId: 'washerwoman',
              apparentCharacterId: 'washerwoman',
              resolution: 'choice',
            },
          ],
          revision: 3,
        };
        const randomizedSlots = [makeSeat('slot-1', 'player-2'), makeSeat('slot-2', 'player-1')];

        act(() => result.current.loadGame(game));
        act(() => result.current.setCharacterDraft({ ...draft, status: 'drafting' }));
        expect(result.current.state.game?.characterDraft?.status).toBe('drafting');

        act(() => result.current.completeCharacterDraft(draft, randomizedSlots));

        expect(result.current.state.game?.slots).toEqual(randomizedSlots);
        expect(result.current.state.game?.inPlayCharacterIds).toEqual([
          'lilmonsta',
          'imp',
          'washerwoman',
        ]);
        expect(result.current.state.game?.playerState['player-2'].characterId).toBe('imp');
        expect(result.current.state.game?.playerState['player-1'].characterId).toBe('washerwoman');
        expect(result.current.state.game?.seatingConfirmed).toBe(false);
        expect(result.current.state.game?.characterDraft).toEqual(draft);
      });
    });
  });

  describe('loadGame', () => {
    it('loads a game and normalizes M36 arrays', () => {
      const { result } = renderGameHook();
      const game = makeGameWithPlayers();

      act(() => {
        result.current.loadGame(game);
      });

      expect(result.current.state.game).toEqual({
        ...game,
        seatingConfirmed: false,
        showMessages: [],
        showTemplates: [],
      });
    });

    it('resets showCharacters and nightProgress on load', () => {
      const { result } = renderGameHook();

      act(() => {
        result.current.toggleShowCharacters();
        result.current.startNight(5);
      });
      expect(result.current.state.showCharacters).toBe(true);
      expect(result.current.state.nightProgress).not.toBeNull();

      act(() => {
        result.current.loadGame(makeGame({ id: 'game-2' }));
      });

      expect(result.current.state.showCharacters).toBe(false);
      expect(result.current.state.nightProgress).toBeNull();
    });
  });

  describe('phase and day actions', () => {
    it('changes game phase', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.loadGame(makeGame({ currentPhase: Phase.Day }));
      });

      act(() => {
        result.current.setPhase(Phase.Night);
      });
      expect(result.current.state.game?.currentPhase).toBe(Phase.Night);

      act(() => {
        result.current.setPhase(Phase.Day);
      });
      expect(result.current.state.game?.currentPhase).toBe(Phase.Day);
    });

    it('does nothing when setting phase with no loaded game', () => {
      const { result } = renderGameHook();

      act(() => {
        result.current.setPhase(Phase.Night);
      });

      expect(result.current.state.game).toBeNull();
    });

    it('advances the day and marks first night complete', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.loadGame(makeGame({ currentDay: 2, isFirstNight: true }));
      });

      act(() => {
        result.current.advanceDay();
      });

      expect(result.current.state.game?.currentDay).toBe(3);
      expect(result.current.state.game?.isFirstNight).toBe(false);
    });

    it('toggles showCharacters', () => {
      const { result } = renderGameHook();

      act(() => {
        result.current.toggleShowCharacters();
      });
      expect(result.current.state.showCharacters).toBe(true);

      act(() => {
        result.current.toggleShowCharacters();
      });
      expect(result.current.state.showCharacters).toBe(false);
    });
  });

  describe('playerState updates', () => {
    it('updates life, ghost vote, and reminders for one playerId', () => {
      const { result } = renderGameHook();
      const game = makeGameWithPlayers([
        makePlayer('player-1', 'Alice'),
        makePlayer('player-2', 'Bob'),
      ]);
      act(() => {
        result.current.loadGame(game);
      });

      act(() => {
        result.current.updatePlayerState('player-1', {
          alive: false,
          ghostVoteUsed: true,
          activeReminders: ['poisoned'],
        });
      });

      expect(result.current.state.game?.playerState['player-1']).toEqual(
        expect.objectContaining({
          alive: false,
          ghostVoteUsed: true,
          activeReminders: ['poisoned'],
        }),
      );
      expect(result.current.state.game?.playerState['player-2'].alive).toBe(true);
    });

    it('updates character and derives alignment from character type', () => {
      const { result } = renderGameHook();
      const game = makeGameWithPlayers([makePlayer('player-1', 'Alice')], {
        'player-1': { characterId: 'washerwoman', actualAlignment: Alignment.Good },
      });
      act(() => {
        result.current.loadGame(game);
      });

      act(() => {
        result.current.updatePlayerState('player-1', { characterId: 'imp' });
      });
      expect(result.current.state.game?.playerState['player-1'].actualAlignment).toBe(
        Alignment.Evil,
      );

      act(() => {
        result.current.updatePlayerState('player-1', { characterId: 'washerwoman' });
      });
      expect(result.current.state.game?.playerState['player-1'].actualAlignment).toBe(
        Alignment.Good,
      );
    });

    it('allows explicit alignment override when character changes', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.loadGame(makeGameWithPlayers([makePlayer('player-1', 'Alice')]));
      });

      act(() => {
        result.current.updatePlayerState('player-1', {
          characterId: 'imp',
          actualAlignment: Alignment.Good,
        });
      });

      expect(result.current.state.game?.playerState['player-1'].actualAlignment).toBe(
        Alignment.Good,
      );
    });

    it('ignores missing player ids and no-game updates', () => {
      const { result } = renderGameHook();

      act(() => {
        result.current.updatePlayerState('player-1', { alive: false });
      });
      expect(result.current.state.game).toBeNull();

      const game = makeGameWithPlayers([makePlayer('player-1', 'Alice')]);
      act(() => {
        result.current.loadGame(game);
      });
      act(() => {
        result.current.updatePlayerState('missing', { alive: false });
      });
      expect(result.current.state.game?.playerState['player-1'].alive).toBe(true);
    });
  });

  describe('participants', () => {
    it('adds a participant with default player state', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.loadGame(makeGame());
      });

      act(() => {
        result.current.addParticipant('player-1');
      });

      expect(result.current.state.game?.participants).toEqual([
        { playerId: 'player-1', isTraveller: false },
      ]);
      expect(result.current.state.game?.playerState['player-1']).toEqual(
        expect.objectContaining({ characterId: '', alive: true }),
      );
    });

    it('adds a traveller participant with character state', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.loadGame(makeGame());
      });

      act(() => {
        result.current.addParticipant('traveller-1', {
          isTraveller: true,
          characterId: 'scapegoat',
        });
      });

      expect(result.current.state.game?.participants).toEqual([
        { playerId: 'traveller-1', isTraveller: true },
      ]);
      expect(result.current.state.game?.playerState['traveller-1']).toEqual(
        expect.objectContaining({
          characterId: 'scapegoat',
          alive: true,
          actualAlignment: Alignment.Unknown,
          startingAlignment: Alignment.Unknown,
        }),
      );
    });

    it('does not add duplicate participants', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.loadGame(makeGameWithPlayers([makePlayer('player-1', 'Alice')]));
      });

      act(() => {
        result.current.addParticipant('player-1');
      });

      expect(result.current.state.game?.participants).toHaveLength(1);
    });

    it('toggles traveller status and optional alignment', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.loadGame(makeGameWithPlayers([makePlayer('player-1', 'Alice')]));
      });

      act(() => {
        result.current.setParticipantTraveller('player-1', true, Alignment.Good);
      });

      expect(result.current.state.game?.participants[0].isTraveller).toBe(true);
      expect(result.current.state.game?.playerState['player-1'].actualAlignment).toBe(
        Alignment.Good,
      );
    });

    it('removes a participant, their state, bluffs, and seating assignment', () => {
      const { result } = renderGameHook();
      const game = makeGameWithPlayers([makePlayer('player-1', 'Alice')]);
      act(() => {
        result.current.loadGame({ ...game, playerBluffs: { 'player-1': ['washerwoman'] } });
      });

      act(() => {
        result.current.removeParticipant('player-1');
      });

      expect(result.current.state.game?.participants).toEqual([]);
      expect(result.current.state.game?.playerState['player-1']).toBeUndefined();
      expect(result.current.state.game?.playerBluffs).toEqual({});
      expect(result.current.state.game?.slots[0]).toEqual({
        kind: 'seat',
        id: 'slot-1',
        playerId: null,
      });
    });
  });

  describe('game slots', () => {
    it('adds seat, spacer, and storyteller slots locally', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.loadGame(makeGame());
      });

      act(() => {
        result.current.addGameSeat(localOnly);
        result.current.addGameSpacer(localOnly);
        result.current.addGameStoryteller(localOnly);
      });

      expect(result.current.state.game?.slots).toEqual([
        { kind: 'seat', id: 'mock-id-1', playerId: null },
        { kind: 'spacer', id: 'mock-id-2' },
        { kind: 'storyteller', id: 'mock-id-3' },
      ]);
    });

    it('removes and moves game slots', () => {
      const { result } = renderGameHook();
      const game = makeGame({
        slots: [
          makeSeat('slot-1', null),
          { kind: 'spacer', id: 'slot-2' },
          makeSeat('slot-3', null),
        ],
      });
      act(() => {
        result.current.loadGame(game);
      });

      act(() => {
        result.current.moveGameSlot('slot-1', 2, localOnly);
      });
      expect(result.current.state.game?.slots.map((s) => s.id)).toEqual([
        'slot-2',
        'slot-3',
        'slot-1',
      ]);

      act(() => {
        result.current.removeGameSlot('slot-2', localOnly);
      });
      expect(result.current.state.game?.slots.map((s) => s.id)).toEqual(['slot-3', 'slot-1']);
    });

    it('assigns a player to a seat and clears the previous seat for that player', () => {
      const { result } = renderGameHook();
      const game = makeGame({
        slots: [makeSeat('slot-1', 'player-1'), makeSeat('slot-2', null)],
      });
      act(() => {
        result.current.loadGame(game);
      });

      act(() => {
        result.current.assignGameSeat('slot-2', 'player-1', localOnly);
      });

      expect(result.current.state.game?.slots).toEqual([
        { kind: 'seat', id: 'slot-1', playerId: null },
        { kind: 'seat', id: 'slot-2', playerId: 'player-1' },
      ]);
    });

    it('sets and clears playerCountOverride', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.loadGame(makeGame());
      });

      act(() => {
        result.current.setPlayerCountOverride(9);
      });
      expect(result.current.state.game?.playerCountOverride).toBe(9);

      act(() => {
        result.current.setPlayerCountOverride(null);
      });
      expect(result.current.state.game?.playerCountOverride).toBeNull();
    });

    it('invalidates pre-game seating confirmation after lineup or slot changes', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.loadGame({
          ...makeGameWithPlayers([makePlayer('player-1', 'Alice')]),
          seatingConfirmed: true,
        });
      });

      act(() => {
        result.current.addParticipant('player-2');
      });
      expect(result.current.state.game?.seatingConfirmed).toBe(false);

      act(() => {
        result.current.setSeatingConfirmed(true);
        result.current.addGameSpacer(localOnly);
      });
      expect(result.current.state.game?.seatingConfirmed).toBe(false);
    });

    it('keeps seating confirmation during live-game corrections', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.loadGame({
          ...makeGameWithPlayers([makePlayer('player-1', 'Alice')]),
          currentPhase: Phase.Night,
          seatingConfirmed: true,
        });
      });

      act(() => {
        result.current.addGameSpacer(localOnly);
        result.current.assignGameSeat('slot-1', null, localOnly);
      });

      expect(result.current.state.game?.seatingConfirmed).toBe(true);
    });

    it('applies a reviewed setup draft atomically', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.loadGame({
          ...makeGameWithPlayers([makePlayer('player-1', 'Alice')]),
          seatingConfirmed: true,
        });
      });
      const nextState = {
        'player-2': makePlayerState({ characterId: 'washerwoman' }),
      };

      act(() => {
        result.current.applyGameSetupDraft(
          [makeSeat('slot-2', 'player-2')],
          [{ playerId: 'player-2', isTraveller: false }],
          nextState,
        );
      });

      expect(result.current.state.game).toEqual(
        expect.objectContaining({
          slots: [makeSeat('slot-2', 'player-2')],
          participants: [{ playerId: 'player-2', isTraveller: false }],
          playerState: nextState,
          seatingConfirmed: false,
        }),
      );
    });

    it('propagates seating-only drafts only to compatible unstarted sibling games', () => {
      const { result } = renderContextsHook();
      act(() => {
        result.current.session.createSession('Session', 'boozling', ['Alice', 'Bob']);
      });
      const sessionId = result.current.session.state.sessions[0].id;
      act(() => {
        result.current.session.addGameToSession(sessionId);
        result.current.session.addGameToSession(sessionId);
      });
      const [currentGameId, siblingGameId] = result.current.session.state.sessions[0].gameIds;
      const current = persistedGame(currentGameId);
      act(() => {
        result.current.game.loadGame(current);
      });

      act(() => {
        result.current.game.applyGameSetupDraft(
          [...current.slots, { kind: 'spacer', id: 'draft-spacer' }],
          current.participants,
          current.playerState,
          { toTemplate: false, toOtherGames: true },
        );
      });

      expect(persistedGame(siblingGameId).slots.at(-1)?.kind).toBe('spacer');

      const startedSibling = {
        ...persistedGame(siblingGameId),
        currentPhase: Phase.Night,
      };
      localStorage.setItem(`storyteller-game-${siblingGameId}`, JSON.stringify(startedSibling));
      const currentAfterFirstSave = result.current.game.state.game!;
      act(() => {
        result.current.game.applyGameSetupDraft(
          [...currentAfterFirstSave.slots, { kind: 'storyteller', id: 'draft-storyteller' }],
          currentAfterFirstSave.participants,
          currentAfterFirstSave.playerState,
          { toTemplate: false, toOtherGames: true },
        );
      });

      expect(persistedGame(siblingGameId).slots).toEqual(startedSibling.slots);
    });

    it('does not propagate drafts that change lineup or player state', () => {
      const { result } = renderContextsHook();
      act(() => {
        result.current.session.createSession('Session', 'boozling', ['Alice', 'Bob']);
      });
      const sessionId = result.current.session.state.sessions[0].id;
      act(() => {
        result.current.session.addGameToSession(sessionId);
        result.current.session.addGameToSession(sessionId);
      });
      const [currentGameId, siblingGameId] = result.current.session.state.sessions[0].gameIds;
      const current = persistedGame(currentGameId);
      const siblingBefore = persistedGame(siblingGameId);
      act(() => {
        result.current.game.loadGame(current);
      });

      const participants = current.participants.slice(0, 1);
      const playerState = {
        [participants[0].playerId]: current.playerState[participants[0].playerId],
      };
      act(() => {
        result.current.game.applyGameSetupDraft([current.slots[0]], participants, playerState, {
          toTemplate: false,
          toOtherGames: true,
        });
      });

      expect(persistedGame(siblingGameId)).toEqual(siblingBefore);
    });

    it('skips unstarted siblings with a different participant lineup', () => {
      const { result } = renderContextsHook();
      act(() => {
        result.current.session.createSession('Session', 'boozling', ['Alice', 'Bob']);
      });
      const sessionId = result.current.session.state.sessions[0].id;
      act(() => {
        result.current.session.addGameToSession(sessionId);
        result.current.session.addGameToSession(sessionId);
      });
      const [currentGameId, siblingGameId] = result.current.session.state.sessions[0].gameIds;
      const current = persistedGame(currentGameId);
      const sibling = persistedGame(siblingGameId);
      const divergentSibling = {
        ...sibling,
        participants: sibling.participants.slice(0, 1),
        playerState: {
          [sibling.participants[0].playerId]: sibling.playerState[sibling.participants[0].playerId],
        },
      };
      localStorage.setItem(`storyteller-game-${siblingGameId}`, JSON.stringify(divergentSibling));
      act(() => {
        result.current.game.loadGame(current);
      });
      act(() => {
        result.current.game.applyGameSetupDraft(
          [...current.slots, { kind: 'spacer', id: 'draft-spacer' }],
          current.participants,
          current.playerState,
          { toTemplate: false, toOtherGames: true },
        );
      });

      expect(persistedGame(siblingGameId)).toEqual(divergentSibling);
    });
  });

  describe('night progress and completion', () => {
    it('starts night progress and updates all progress fields', () => {
      const { result } = renderGameHook();

      act(() => {
        result.current.startNight(7);
      });
      act(() => {
        result.current.updateNightProgress('imp', [true, false], 'Killed Alice', 'Alice');
      });
      act(() => {
        result.current.setNightCardIndex(3);
      });

      expect(result.current.state.nightProgress).toEqual({
        currentCardIndex: 3,
        totalCards: 7,
        subActionStates: { imp: [true, false] },
        notes: { imp: 'Killed Alice' },
        selections: { imp: 'Alice' },
      });
    });

    it('ignores night progress updates when not started', () => {
      const { result } = renderGameHook();

      act(() => {
        result.current.updateNightProgress('imp', [true]);
        result.current.setNightCardIndex(2);
      });

      expect(result.current.state.nightProgress).toBeNull();
    });

    it('completes night, snapshots tokens by character, and advances day', () => {
      const { result } = renderGameHook();
      const token: PlayerToken = { id: 'token-1', type: 'drunk', label: 'Drunk' };
      const game = makeGameWithPlayers([makePlayer('player-1', 'Alice')], {
        'player-1': { characterId: 'imp', tokens: [token] },
      });
      act(() => {
        result.current.loadGame(game);
      });
      act(() => {
        result.current.startNight(1);
        result.current.updateNightProgress('imp', [true], 'note', ['Alice', 'Bob']);
      });

      act(() => {
        result.current.completeNight();
      });

      const completed = result.current.state.game!;
      expect(completed.nightHistory).toHaveLength(1);
      expect(completed.nightHistory[0]).toEqual(
        expect.objectContaining({
          dayNumber: 1,
          isFirstNight: true,
          subActionStates: { imp: [true] },
          notes: { imp: 'note' },
          selections: { imp: ['Alice', 'Bob'] },
          tokenSnapshot: { imp: [token] },
        }),
      );
      expect(completed.currentPhase).toBe(Phase.Day);
      expect(completed.currentDay).toBe(2);
      expect(completed.isFirstNight).toBe(false);
      expect(result.current.state.nightProgress).toBeNull();
    });

    it('does nothing when completing without a game or without progress', () => {
      const { result } = renderGameHook();

      act(() => {
        result.current.startNight(1);
        result.current.completeNight();
      });
      expect(result.current.state.game).toBeNull();

      act(() => {
        result.current.loadGame(makeGame());
        result.current.completeNight();
      });
      expect(result.current.state.game?.nightHistory).toEqual([]);
    });
  });

  describe('tokens', () => {
    it('adds and removes tokens for the specified playerId', () => {
      const { result } = renderGameHook();
      const token: PlayerToken = { id: 'tok-1', type: 'poisoned', label: 'Poisoned' };
      act(() => {
        result.current.loadGame(makeGameWithPlayers([makePlayer('player-1', 'Alice')]));
      });

      act(() => {
        result.current.addToken('player-1', token);
      });
      expect(result.current.state.game?.playerState['player-1'].tokens).toEqual([token]);

      act(() => {
        result.current.removeToken('player-1', 'tok-1');
      });
      expect(result.current.state.game?.playerState['player-1'].tokens).toEqual([]);
    });

    it('reassigns an existing token id from another player', () => {
      const { result } = renderGameHook();
      const token: PlayerToken = { id: 'tok-1', type: 'custom', label: 'Know' };
      const game = makeGameWithPlayers(
        [makePlayer('player-1', 'Alice'), makePlayer('player-2', 'Bob')],
        { 'player-1': { tokens: [token] }, 'player-2': { tokens: [] } },
      );
      act(() => {
        result.current.loadGame(game);
      });

      act(() => {
        result.current.addToken('player-2', token);
      });

      expect(result.current.state.game?.playerState['player-1'].tokens).toEqual([]);
      expect(result.current.state.game?.playerState['player-2'].tokens).toEqual([token]);
    });

    it('ignores token changes with no loaded game', () => {
      const { result } = renderGameHook();
      const token: PlayerToken = { id: 'tok-1', type: 'drunk', label: 'Drunk' };

      act(() => {
        result.current.addToken('player-1', token);
        result.current.removeToken('player-1', 'tok-1');
      });

      expect(result.current.state.game).toBeNull();
    });
  });

  describe('night history editing', () => {
    it('updates a history entry, note, and choice', () => {
      const { result } = renderGameHook();
      const entry = makeHistoryEntry({ notes: { imp: 'old' }, selections: { imp: 'Alice' } });
      act(() => {
        result.current.loadGame(makeGame({ nightHistory: [entry] }));
      });

      act(() => {
        result.current.updateNightHistory(0, makeHistoryEntry({ dayNumber: 2 }));
      });
      expect(result.current.state.game?.nightHistory[0].dayNumber).toBe(2);

      act(() => {
        result.current.updateNightHistoryNote(0, 'imp', 'updated');
        result.current.updateNightHistoryChoice(0, 'imp', ['Bob', 'Charlie']);
      });
      expect(result.current.state.game?.nightHistory[0].notes.imp).toBe('updated');
      expect(result.current.state.game?.nightHistory[0].selections.imp).toEqual(['Bob', 'Charlie']);
    });

    it('ignores out-of-range history edits and no-game edits', () => {
      const { result } = renderGameHook();
      const entry = makeHistoryEntry({ dayNumber: 1, notes: { imp: 'old' } });
      act(() => {
        result.current.loadGame(makeGame({ nightHistory: [entry] }));
      });

      act(() => {
        result.current.updateNightHistory(3, makeHistoryEntry({ dayNumber: 99 }));
        result.current.updateNightHistoryNote(-1, 'imp', 'nope');
        result.current.updateNightHistoryChoice(4, 'imp', 'nope');
      });
      expect(result.current.state.game?.nightHistory[0]).toEqual(entry);

      const noGame = renderGameHook();
      act(() => {
        noGame.result.current.updateNightHistory(0, makeHistoryEntry());
        noGame.result.current.updateNightHistoryNote(0, 'imp', 'nope');
        noGame.result.current.updateNightHistoryChoice(0, 'imp', 'nope');
      });
      expect(noGame.result.current.state.game).toBeNull();
    });
  });

  describe('Fabled, Loric, and script-level fields', () => {
    it('adds and removes active Fabled without duplicates', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.loadGame(makeGame());
      });

      act(() => {
        result.current.addFabled('angel');
        result.current.addFabled('angel');
        result.current.addFabled('djinn');
      });
      expect(result.current.state.game?.activeFabled).toEqual(['angel', 'djinn']);

      act(() => {
        result.current.removeFabled('angel');
      });
      expect(result.current.state.game?.activeFabled).toEqual(['djinn']);
    });

    it('adds and removes active Loric without duplicates', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.loadGame(makeGame());
      });

      act(() => {
        result.current.addLoric('bigwig');
        result.current.addLoric('bigwig');
      });
      expect(result.current.state.game?.activeLoric).toEqual(['bigwig']);

      act(() => {
        result.current.removeLoric('bigwig');
      });
      expect(result.current.state.game?.activeLoric).toEqual([]);
    });

    it('sets in-play characters and demon/lunatic bluffs', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.loadGame(makeGame());
      });

      act(() => {
        result.current.setInPlayCharacters(['washerwoman', 'imp']);
        result.current.setDemonBluffs(['chef', 'butler', 'drunk']);
        result.current.setLunaticBluffs(['empath', 'fortune_teller', 'monk']);
      });

      expect(result.current.state.game?.inPlayCharacterIds).toEqual(['washerwoman', 'imp']);
      expect(result.current.state.game?.demonBluffs).toEqual(['chef', 'butler', 'drunk']);
      expect(result.current.state.game?.lunaticBluffs).toEqual([
        'empath',
        'fortune_teller',
        'monk',
      ]);
    });

    it('sets player-specific bluffs by playerId', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.loadGame(makeGame({ playerBluffs: { 'player-2': ['chef'] } }));
      });

      act(() => {
        result.current.setPlayerBluffs('player-1', ['washerwoman', 'librarian']);
      });

      expect(result.current.state.game?.playerBluffs).toEqual({
        'player-1': ['washerwoman', 'librarian'],
        'player-2': ['chef'],
      });
    });
  });

  describe('custom player messages', () => {
    it('sets, overwrites, and clears character-scoped custom messages', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.loadGame(makeGame({ customPlayerMessages: { empath: 'World' } }));
      });

      act(() => {
        result.current.setCustomPlayerMessage('imp', 'You were chosen');
        result.current.setCustomPlayerMessage('imp', 'New message');
      });
      expect(result.current.state.game?.customPlayerMessages).toEqual({
        empath: 'World',
        imp: 'New message',
      });

      act(() => {
        result.current.clearCustomPlayerMessage('imp');
      });
      expect(result.current.state.game?.customPlayerMessages).toEqual({ empath: 'World' });

      act(() => {
        result.current.clearCustomPlayerMessage('empath');
      });
      expect(result.current.state.game?.customPlayerMessages).toBeUndefined();
    });
  });

  describe('M35 generalized primitives', () => {
    it('records alignment changes by playerId', () => {
      const { result } = renderGameHook();
      const game = makeGameWithPlayers([makePlayer('player-1', 'Alice')], {
        'player-1': { actualAlignment: Alignment.Good },
      });
      act(() => {
        result.current.loadGame(game);
      });

      act(() => {
        result.current.recordAlignmentChange(
          'player-1',
          Alignment.Evil,
          'Mezepheles whispered the word',
          2,
          'other',
        );
      });

      const state = result.current.state.game?.playerState['player-1'];
      expect(state?.actualAlignment).toBe(Alignment.Evil);
      expect(state?.alignmentHistory).toHaveLength(1);
      expect(state?.alignmentHistory?.[0].reason).toBe('Mezepheles whispered the word');
    });

    it('sets and clears gained abilities by playerId', () => {
      const { result } = renderGameHook();
      const gainedAbility: GainedAbility = {
        characterId: 'philosopher',
        source: 'cannibal',
        hostSeat: 1,
        grantedDay: 2,
      };
      act(() => {
        result.current.loadGame(makeGameWithPlayers([makePlayer('player-1', 'Alice')]));
      });

      act(() => {
        result.current.setGainedAbility('player-1', gainedAbility);
      });
      expect(result.current.state.game?.playerState['player-1'].gainedAbility).toEqual(
        gainedAbility,
      );

      act(() => {
        result.current.clearGainedAbility('player-1');
      });
      expect(result.current.state.game?.playerState['player-1'].gainedAbility).toBeUndefined();
    });

    it('sets apparent character by playerId', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.loadGame(makeGameWithPlayers([makePlayer('player-1', 'Alice')]));
      });

      act(() => {
        result.current.setApparentCharacter('player-1', 'washerwoman');
      });

      expect(result.current.state.game?.playerState['player-1'].apparentCharacterId).toBe(
        'washerwoman',
      );
    });
  });

  describe('M36 show-to-player messages', () => {
    it('adds, marks shown, edits, and deletes a show message keyed by playerId', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.loadGame(makeGame());
      });

      act(() => {
        result.current.addShowMessage('test-game', 'player-1', ' Original ');
      });
      const message = result.current.state.game?.showMessages?.[0];
      expect(message).toEqual(expect.objectContaining({ playerId: 'player-1', text: 'Original' }));

      act(() => {
        result.current.markShowMessageShown('test-game', message!.id);
      });
      expect(result.current.state.game?.showMessages?.[0].lastShownAt).toEqual(expect.any(String));

      act(() => {
        result.current.editShowMessage('test-game', message!.id, 'Edited');
      });
      expect(result.current.state.game?.showMessages?.[0].text).toBe('Edited');

      act(() => {
        result.current.deleteShowMessage('test-game', message!.id);
      });
      expect(result.current.state.game?.showMessages).toEqual([]);
    });

    it('ignores blank show messages and wrong game ids', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.loadGame(makeGame());
      });

      act(() => {
        result.current.addShowMessage('test-game', 'player-1', '   ');
        result.current.addShowMessage('other-game', 'player-1', 'Hello');
      });

      expect(result.current.state.game?.showMessages).toEqual([]);
    });

    it('pins, bumps, and unpins template usage', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.loadGame(makeGame());
      });

      act(() => {
        result.current.pinShowTemplate('test-game', 'Choose a player', 'script', 'test-script');
        result.current.pinShowTemplate('test-game', 'Choose a player', 'script', 'test-script');
      });
      const template = result.current.state.game?.showTemplates?.[0];
      expect(result.current.state.game?.showTemplates).toHaveLength(1);
      expect(template).toEqual(
        expect.objectContaining({
          text: 'Choose a player',
          scope: 'script',
          scriptId: 'test-script',
          usageCount: 0,
        }),
      );

      act(() => {
        result.current.bumpTemplateUsage('test-game', template!.id);
      });
      expect(result.current.state.game?.showTemplates?.[0].usageCount).toBe(1);
      expect(result.current.state.game?.showTemplates?.[0].lastUsedAt).toEqual(expect.any(String));

      act(() => {
        result.current.unpinShowTemplate('test-game', template!.id);
      });
      expect(result.current.state.game?.showTemplates).toEqual([]);
    });
  });

  describe('persistence and sync', () => {
    it('auto-saves game changes to localStorage', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.loadGame(makeGameWithPlayers([makePlayer('player-1', 'Alice')]));
      });

      act(() => {
        result.current.updatePlayerState('player-1', { alive: false });
      });

      expect(persistedGame('test-game').playerState['player-1'].alive).toBe(false);
    });

    it('saveGame persists current game without throwing', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.loadGame(makeGame({ id: 'save-test' }));
      });

      act(() => {
        result.current.saveGame();
      });

      expect(persistedGame('save-test').id).toBe('save-test');
    });

    it('handles localStorage.setItem failure gracefully', () => {
      const { result } = renderGameHook();
      const originalSetItem = localStorage.setItem.bind(localStorage);
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage full');
      });

      expect(() => {
        act(() => {
          result.current.loadGame(makeGame({ id: 'fail-test' }));
        });
      }).not.toThrow();

      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(originalSetItem);
    });

    it('syncGame replaces the loaded game with a remote copy for the same id', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.loadGame(makeGame({ id: 'sync-test', currentDay: 1 }));
      });

      act(() => {
        result.current.syncGame(makeGame({ id: 'sync-test', currentDay: 4 }));
      });

      expect(result.current.state.game?.currentDay).toBe(4);
    });

    it('syncGame ignores remote copies for another game id', () => {
      const { result } = renderGameHook();
      act(() => {
        result.current.loadGame(makeGame({ id: 'sync-test', currentDay: 1 }));
      });

      act(() => {
        result.current.syncGame(makeGame({ id: 'other', currentDay: 4 }));
      });

      expect(result.current.state.game?.id).toBe('sync-test');
      expect(result.current.state.game?.currentDay).toBe(1);
    });

    it('exposes forceSync and syncStatus', () => {
      const { result } = renderGameHook();

      expect(result.current.syncStatus).toBe('idle');
      act(() => {
        result.current.forceSync();
      });
      expect(forceSync).toHaveBeenCalled();
    });
  });

  describe('useGame hook', () => {
    it('throws when used outside GameProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useGame());
      }).toThrow('useGame must be used within a <GameProvider>');

      consoleSpy.mockRestore();
    });
  });
});
