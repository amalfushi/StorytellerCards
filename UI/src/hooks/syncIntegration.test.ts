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

  describe('version check detects new version', () => {
    it('pullGameVersion returns newer version info', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ version: 5, updatedAt: '2024-06-01T00:00:00Z' }),
      });

      const { result } = renderHook(() => useApiSync());

      let info = null;
      await act(async () => {
        info = await result.current.pullGameVersion('session-1', 'game-1');
      });

      expect(info).toEqual({ version: 5, updatedAt: '2024-06-01T00:00:00Z' });
    });

    it('version check → full fetch → state update workflow', async () => {
      // Step 1: Version check returns newer version
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ version: 3, updatedAt: '2024-06-01T00:00:00Z' }),
      });

      const { result } = renderHook(() => useApiSync());

      let versionInfo = null;
      await act(async () => {
        versionInfo = await result.current.pullGameVersion('session-1', 'game-1');
      });

      expect(versionInfo).not.toBeNull();

      // Step 2: Full fetch returns updated game data
      const updatedGame = makeGame({ version: 3, currentDay: 5 });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(updatedGame),
      });

      let game = null;
      await act(async () => {
        game = await result.current.fetchGame('session-1', 'game-1');
      });

      expect(game).toEqual(updatedGame);
    });
  });

  describe('409 conflict handling', () => {
    it('stale push returns conflict → fetch latest → re-push succeeds', async () => {
      // Step 1: Stale push returns 409
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ serverVersion: 3, expectedVersion: 1 }),
      });

      const { result } = renderHook(() => useApiSync());
      const staleGame = makeGame({ version: 1 });

      let pushResult = null;
      await act(async () => {
        pushResult = await result.current.pushGame(staleGame);
      });

      expect(pushResult).toMatchObject({
        ok: false,
        status: 409,
        conflict: { serverVersion: 3, expectedVersion: 1 },
      });

      // Step 2: Fetch latest
      const serverGame = makeGame({ version: 3, currentDay: 4 });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(serverGame),
      });

      let latestGame = null;
      await act(async () => {
        latestGame = await result.current.fetchGame('session-1', 'game-1');
      });

      expect(latestGame).toEqual(serverGame);

      // Step 3: Re-push with correct version
      const updatedGame = makeGame({ ...serverGame, currentDay: 5, version: 3 });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ ...updatedGame, version: 4 }),
      });

      let retryResult = null;
      await act(async () => {
        retryResult = await result.current.pushGame(updatedGame);
      });

      expect(retryResult).toMatchObject({ ok: true, status: 200 });
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
      // localStorage would still work — tested at context level
    });

    it('push returns failure on network error — no data loss', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useApiSync());
      const game = makeGame();

      let pushResult = null;
      await act(async () => {
        pushResult = await result.current.pushGame(game);
      });

      expect(pushResult).toMatchObject({ ok: false, status: 0 });
    });

    it('version check returns null on network failure', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useApiSync());

      let info = null;
      await act(async () => {
        info = await result.current.pullSessionVersion('session-1');
      });

      expect(info).toBeNull();
    });
  });

  describe('session sync scenarios', () => {
    it('push session with version → successful update', async () => {
      const updatedSession = makeSession({ version: 2 });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(updatedSession),
      });

      const { result } = renderHook(() => useApiSync());
      const session = makeSession({ version: 1 });

      let pushResult = null;
      await act(async () => {
        pushResult = await result.current.pushSession(session);
      });

      expect(pushResult).toMatchObject({
        ok: true,
        data: updatedSession,
      });
    });

    it('session version poll → new version detected → full fetch', async () => {
      // Version check
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ version: 4, updatedAt: '2024-12-01T00:00:00Z' }),
      });

      const { result } = renderHook(() => useApiSync());

      let versionInfo = null;
      await act(async () => {
        versionInfo = await result.current.pullSessionVersion('session-1');
      });

      expect(versionInfo).toEqual({ version: 4, updatedAt: '2024-12-01T00:00:00Z' });

      // Full fetch
      const updatedSession = makeSession({ version: 4, name: 'Updated Session' });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(updatedSession),
      });

      let session = null;
      await act(async () => {
        session = await result.current.fetchSession('session-1');
      });

      expect(session).toEqual(updatedSession);
    });
  });
});
