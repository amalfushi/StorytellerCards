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
    expect(typeof result.current.syncScript).toBe('function');
    expect(typeof result.current.fetchSession).toBe('function');
    expect(typeof result.current.fetchSessions).toBe('function');
    expect(typeof result.current.fetchGame).toBe('function');
    expect(typeof result.current.fetchScript).toBe('function');
    expect(typeof result.current.pushSession).toBe('function');
    expect(typeof result.current.pushGame).toBe('function');
    expect(typeof result.current.pullSessionVersion).toBe('function');
    expect(typeof result.current.pullGameVersion).toBe('function');
    expect(typeof result.current.deleteSession).toBe('function');
    expect(typeof result.current.deleteGame).toBe('function');
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

  describe('pushSession (version-aware)', () => {
    it('sends X-Expected-Version header when session has version', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ version: 2 }),
      });

      const { result } = renderHook(() => useApiSync());
      const session = makeSession({ version: 1 });

      await act(async () => {
        await result.current.pushSession(session);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/sessions/session-1'),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'X-Expected-Version': '1',
          }),
        }),
      );
    });

    it('returns conflict info on 409', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ serverVersion: 5, expectedVersion: 3 }),
      });

      const { result } = renderHook(() => useApiSync());
      const session = makeSession({ version: 3 });

      let pushResult: Awaited<ReturnType<typeof result.current.pushSession>> | null = null;
      await act(async () => {
        pushResult = await result.current.pushSession(session);
      });

      expect(pushResult).toEqual({
        ok: false,
        status: 409,
        data: null,
        conflict: { serverVersion: 5, expectedVersion: 3 },
      });
    });

    it('returns ok result on success', async () => {
      const updatedSession = makeSession({ version: 2 });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(updatedSession),
      });

      const { result } = renderHook(() => useApiSync());
      const session = makeSession({ version: 1 });

      let pushResult: Awaited<ReturnType<typeof result.current.pushSession>> | null = null;
      await act(async () => {
        pushResult = await result.current.pushSession(session);
      });

      expect(pushResult?.ok).toBe(true);
      expect(pushResult?.data).toEqual(updatedSession);
    });

    it('handles network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useApiSync());

      let pushResult: Awaited<ReturnType<typeof result.current.pushSession>> | null = null;
      await act(async () => {
        pushResult = await result.current.pushSession(makeSession());
      });

      expect(pushResult?.ok).toBe(false);
      expect(pushResult?.status).toBe(0);
    });
  });

  describe('pushGame (version-aware)', () => {
    it('sends X-Expected-Version header when game has version', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ version: 2 }),
      });

      const { result } = renderHook(() => useApiSync());
      const game = makeGame({ version: 1 });

      await act(async () => {
        await result.current.pushGame(game);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/sessions/session-1/games/game-1'),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'X-Expected-Version': '1',
          }),
        }),
      );
    });

    it('uses explicit expectedVersion over game.version for X-Expected-Version header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ version: 4 }),
      });

      const { result } = renderHook(() => useApiSync());
      const game = makeGame({ version: 1 });

      await act(async () => {
        await result.current.pushGame(game, 3);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/sessions/session-1/games/game-1'),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'X-Expected-Version': '3',
          }),
        }),
      );
    });

    it('returns conflict info on 409', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ serverVersion: 5, expectedVersion: 3 }),
      });

      const { result } = renderHook(() => useApiSync());
      const game = makeGame({ version: 3 });

      let pushResult: Awaited<ReturnType<typeof result.current.pushGame>> | null = null;
      await act(async () => {
        pushResult = await result.current.pushGame(game);
      });

      expect(pushResult?.conflict).toEqual({ serverVersion: 5, expectedVersion: 3 });
    });
  });

  describe('pullSessionVersion', () => {
    it('calls the version endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ version: 3, updatedAt: '2024-01-01T00:00:00Z' }),
      });

      const { result } = renderHook(() => useApiSync());

      await act(async () => {
        const info = await result.current.pullSessionVersion('session-1');
        expect(info).toEqual({ version: 3, updatedAt: '2024-01-01T00:00:00Z' });
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/sessions/session-1/version'),
        expect.anything(),
      );
    });

    it('returns null on failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('fail'));

      const { result } = renderHook(() => useApiSync());

      let info = undefined;
      await act(async () => {
        info = await result.current.pullSessionVersion('session-1');
      });

      expect(info).toBeNull();
    });
  });

  describe('pullGameVersion', () => {
    it('calls the version endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ version: 5, updatedAt: '2024-06-01T00:00:00Z' }),
      });

      const { result } = renderHook(() => useApiSync());

      await act(async () => {
        const info = await result.current.pullGameVersion('session-1', 'game-1');
        expect(info).toEqual({ version: 5, updatedAt: '2024-06-01T00:00:00Z' });
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/sessions/session-1/games/game-1/version'),
        expect.anything(),
      );
    });
  });

  describe('syncScript (fire-and-forget)', () => {
    it('sends a POST to /api/scripts/import with the script data', async () => {
      const { result } = renderHook(() => useApiSync());
      const script = makeScript();

      act(() => {
        result.current.syncScript(script);
      });

      // Allow the fire-and-forget promise to settle
      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/scripts/import'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(script),
        }),
      );
    });

    it('handles network errors gracefully (no throw)', () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      const { result } = renderHook(() => useApiSync());

      expect(() => {
        act(() => {
          result.current.syncScript(makeScript());
        });
      }).not.toThrow();
    });
  });

  describe('fetchScript', () => {
    it('makes a GET request to the correct endpoint', async () => {
      const { result } = renderHook(() => useApiSync());

      await act(async () => {
        await result.current.fetchScript('my-script');
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/scripts/my-script'),
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });

    it('returns parsed JSON on success', async () => {
      const scriptData = makeScript({ id: 'trouble-brewing' });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(scriptData),
      });

      const { result } = renderHook(() => useApiSync());

      let response: Script | null = null;
      await act(async () => {
        response = await result.current.fetchScript('trouble-brewing');
      });

      expect(response).toEqual(scriptData);
    });

    it('returns null on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const { result } = renderHook(() => useApiSync());

      let response: Script | null = null;
      await act(async () => {
        response = await result.current.fetchScript('nonexistent');
      });

      expect(response).toBeNull();
    });

    it('returns null on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useApiSync());

      let response: Script | null = null;
      await act(async () => {
        response = await result.current.fetchScript('my-script');
      });

      expect(response).toBeNull();
    });
  });

  describe('deleteSession', () => {
    it('sends DELETE request to the correct endpoint', async () => {
      const { result } = renderHook(() => useApiSync());

      act(() => {
        result.current.deleteSession('session-1');
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/sessions/session-1'),
        expect.objectContaining({ method: 'DELETE' }),
      );
    });

    it('handles network errors gracefully (no throw)', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      const { result } = renderHook(() => useApiSync());

      expect(() => {
        act(() => {
          result.current.deleteSession('session-1');
        });
      }).not.toThrow();
    });
  });

  describe('deleteGame', () => {
    it('sends DELETE request to the correct endpoint', async () => {
      const { result } = renderHook(() => useApiSync());

      act(() => {
        result.current.deleteGame('session-1', 'game-1');
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/sessions/session-1/games/game-1'),
        expect.objectContaining({ method: 'DELETE' }),
      );
    });

    it('handles network errors gracefully (no throw)', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      const { result } = renderHook(() => useApiSync());

      expect(() => {
        act(() => {
          result.current.deleteGame('session-1', 'game-1');
        });
      }).not.toThrow();
    });
  });
});
