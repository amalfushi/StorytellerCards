import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useApiSync } from './useApiSync.ts';
import type { Session, Game } from '@/types/index.ts';

describe('useApiSync', () => {
  const mockFetch = vi.fn();

  /** Minimal Session for testing. */
  const makeSession = (overrides?: Partial<Session>): Session => ({
    id: 'session-1',
    name: 'Test Session',
    createdAt: '2024-01-01T00:00:00Z',
    defaultScriptId: 'script-1',
    defaultPlayers: [],
    gameIds: [],
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
    ...overrides,
  });

  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('can be initialized without errors', () => {
    const { result } = renderHook(() => useApiSync());
    expect(result.current).toBeDefined();
    expect(typeof result.current.syncSession).toBe('function');
    expect(typeof result.current.syncGame).toBe('function');
    expect(typeof result.current.fetchSession).toBe('function');
    expect(typeof result.current.fetchGame).toBe('function');
  });

  describe('fetchSession', () => {
    it('makes a GET request to the correct endpoint', async () => {
      const { result } = renderHook(() => useApiSync());

      await act(async () => {
        await result.current.fetchSession('session-1');
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/sessions/session-1'),
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });

    it('returns parsed JSON on success', async () => {
      const sessionData = makeSession();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(sessionData),
      });

      const { result } = renderHook(() => useApiSync());

      let response: Session | null = null;
      await act(async () => {
        response = await result.current.fetchSession('session-1');
      });

      expect(response).toEqual(sessionData);
    });

    it('returns null on API error (non-ok response)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const { result } = renderHook(() => useApiSync());

      let response: Session | null = null;
      await act(async () => {
        response = await result.current.fetchSession('nonexistent');
      });

      expect(response).toBeNull();
    });

    it('returns null on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useApiSync());

      let response: Session | null = null;
      await act(async () => {
        response = await result.current.fetchSession('session-1');
      });

      expect(response).toBeNull();
    });
  });

  describe('fetchGame', () => {
    it('makes a GET request to the correct endpoint', async () => {
      const { result } = renderHook(() => useApiSync());

      await act(async () => {
        await result.current.fetchGame('session-1', 'game-1');
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/sessions/session-1/games/game-1'),
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });

    it('returns parsed JSON on success', async () => {
      const gameData = makeGame();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(gameData),
      });

      const { result } = renderHook(() => useApiSync());

      let response: Game | null = null;
      await act(async () => {
        response = await result.current.fetchGame('session-1', 'game-1');
      });

      expect(response).toEqual(gameData);
    });

    it('returns null on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useApiSync());

      let response: Game | null = null;
      await act(async () => {
        response = await result.current.fetchGame('session-1', 'game-1');
      });

      expect(response).toBeNull();
    });
  });

  describe('syncSession (debounced)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      mockFetch.mockReset();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('debounces sync calls — only the last call within the window fires', async () => {
      const { result } = renderHook(() => useApiSync());
      const session = makeSession();

      act(() => {
        result.current.syncSession(session);
        result.current.syncSession(session);
        result.current.syncSession(session);
      });

      // Before debounce window expires, fetch should not have been called
      expect(mockFetch).not.toHaveBeenCalled();

      // Advance past the 1000ms debounce and flush microtasks
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1100);
      });

      // Should only have been called once (the last debounced call)
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/sessions/${session.id}`),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(session),
        }),
      );
    });

    it('handles API errors gracefully (no throw)', async () => {
      mockFetch.mockRejectedValue(new Error('Server down'));
      const { result } = renderHook(() => useApiSync());

      act(() => {
        result.current.syncSession(makeSession());
      });

      // Should not throw
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1100);
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('syncGame (debounced)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      mockFetch.mockReset();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('debounces sync calls — only fires after the debounce window', async () => {
      const { result } = renderHook(() => useApiSync());
      const game = makeGame();

      act(() => {
        result.current.syncGame(game);
      });

      expect(mockFetch).not.toHaveBeenCalled();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1100);
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/sessions/${game.sessionId}/games/${game.id}`),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(game),
        }),
      );
    });

    it('resets the debounce timer on subsequent calls', async () => {
      const { result } = renderHook(() => useApiSync());
      const game1 = makeGame({ id: 'game-1' });
      const game2 = makeGame({ id: 'game-2' });

      act(() => {
        result.current.syncGame(game1);
      });

      // Advance 500ms (half the debounce window)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });

      // Another call resets the timer
      act(() => {
        result.current.syncGame(game2);
      });

      // Advance another 500ms — should NOT have fired yet (timer was reset)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });

      expect(mockFetch).not.toHaveBeenCalled();

      // Advance the remaining 600ms for the reset timer
      await act(async () => {
        await vi.advanceTimersByTimeAsync(600);
      });

      // Should fire with the second game only
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/sessions/${game2.sessionId}/games/${game2.id}`),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(game2),
        }),
      );
    });
  });
});
