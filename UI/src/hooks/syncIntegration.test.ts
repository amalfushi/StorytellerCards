import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useApiSync } from './useApiSync.ts';
import type { Game, Session } from '@/types/index.ts';

/** Minimal Session for testing. */
const makeSession = (overrides?: Partial<Session>): Session => ({
  id: 'session-1',
  name: 'Test Session',
  createdAt: '2024-01-01T00:00:00Z',
  defaultScriptId: 'script-1',
  defaultPlayers: [],
  gameIds: [],
  version: 1,
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

/** Minimal Game for testing. */
const makeGame = (overrides?: Partial<Game>): Game => ({
  id: 'game-1',
  sessionId: 'session-1',
  scriptId: 'script-1',
  currentDay: 1,
  currentPhase: 'Day',
  isFirstNight: true,
  players: [],
  nightHistory: [],
  version: 1,
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

describe('Sync Integration Scenarios', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('fetch game returns updated data', () => {
    it('fetchGame returns full game data', async () => {
      const updatedGame = makeGame({ version: 3, currentDay: 5 });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(updatedGame),
      });

      const { result } = renderHook(() => useApiSync());

      let game = null;
      await act(async () => {
        game = await result.current.fetchGame('session-1', 'game-1');
      });

      expect(game).toEqual(updatedGame);
    });
  });

  describe('offline behavior', () => {
    it('fetch returns null on network failure — localStorage continues', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useApiSync());

      let game = null;
      await act(async () => {
        game = await result.current.fetchGame('session-1', 'game-1');
      });

      expect(game).toBeNull();
    });
  });

  describe('session fetch scenarios', () => {
    it('fetchSession returns full session data', async () => {
      const updatedSession = makeSession({ version: 4, name: 'Updated Session' });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(updatedSession),
      });

      const { result } = renderHook(() => useApiSync());

      let session = null;
      await act(async () => {
        session = await result.current.fetchSession('session-1');
      });

      expect(session).toEqual(updatedSession);
    });
  });
});
