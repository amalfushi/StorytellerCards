/**
 * Version-aware API sync hook for cross-device persistence.
 * Supports push (with X-Expected-Version), pull, version checks,
 * and 409 conflict handling. localStorage is always the primary store.
 */

import { useCallback, useRef } from 'react';
import type { Session, Game, VersionInfo } from '../types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
const DEBOUNCE_MS = 1000;

/** Result of a push operation — includes conflict info if applicable. */
export interface PushResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
  conflict?: { serverVersion: number; expectedVersion: number };
}

async function request<T>(path: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function pushRequest<T>(path: string, options: RequestInit): Promise<PushResult<T>> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });

    if (res.status === 409) {
      const body = (await res.json()) as { serverVersion: number; expectedVersion: number };
      return { ok: false, status: 409, data: null, conflict: body };
    }

    if (!res.ok) {
      return { ok: false, status: res.status, data: null };
    }

    const data = (await res.json()) as T;
    return { ok: true, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}

function useDebouncedFn<Args extends unknown[]>(fn: (...args: Args) => void, delay: number) {
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  return useCallback(
    (...args: Args) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay],
  );
}

export interface ApiSyncHook {
  /** Debounced fire-and-forget session push (backward compat). */
  syncSession: (session: Session) => void;
  /** Debounced fire-and-forget game push (backward compat). */
  syncGame: (game: Game) => void;
  /** Fetch a full session from the API. */
  fetchSession: (id: string) => Promise<Session | null>;
  /** Fetch all sessions from the API. */
  fetchSessions: () => Promise<Session[]>;
  /** Fetch a full game from the API. */
  fetchGame: (sessionId: string, gameId: string) => Promise<Game | null>;
  /** Push a session with version-awareness. Returns push result with conflict info. */
  pushSession: (session: Session) => Promise<PushResult<Session>>;
  /** Push a game with version-awareness. Returns push result with conflict info. */
  pushGame: (game: Game) => Promise<PushResult<Game>>;
  /** Lightweight version check for a session. */
  pullSessionVersion: (sessionId: string) => Promise<VersionInfo | null>;
  /** Lightweight version check for a game. */
  pullGameVersion: (sessionId: string, gameId: string) => Promise<VersionInfo | null>;
}

export function useApiSync(): ApiSyncHook {
  const pushSessionDirect = useCallback(async (session: Session): Promise<PushResult<Session>> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session.version !== undefined) {
      headers['X-Expected-Version'] = String(session.version);
    }
    return pushRequest<Session>(`/api/sessions/${session.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(session),
    });
  }, []);

  const pushGameDirect = useCallback(async (game: Game): Promise<PushResult<Game>> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (game.version !== undefined) {
      headers['X-Expected-Version'] = String(game.version);
    }
    return pushRequest<Game>(`/api/sessions/${game.sessionId}/games/${game.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(game),
    });
  }, []);

  const syncSessionImmediate = useCallback(
    async (session: Session) => {
      await pushSessionDirect(session);
    },
    [pushSessionDirect],
  );

  const syncGameImmediate = useCallback(
    async (game: Game) => {
      await pushGameDirect(game);
    },
    [pushGameDirect],
  );

  const syncSession = useDebouncedFn(syncSessionImmediate, DEBOUNCE_MS);
  const syncGame = useDebouncedFn(syncGameImmediate, DEBOUNCE_MS);

  const fetchSession = useCallback((id: string) => request<Session>(`/api/sessions/${id}`), []);

  const fetchSessions = useCallback(async (): Promise<Session[]> => {
    const result = await request<Session[]>('/api/sessions');
    return result ?? [];
  }, []);

  const fetchGame = useCallback(
    (sessionId: string, gameId: string) =>
      request<Game>(`/api/sessions/${sessionId}/games/${gameId}`),
    [],
  );

  const pullSessionVersion = useCallback(
    (sessionId: string) => request<VersionInfo>(`/api/sessions/${sessionId}/version`),
    [],
  );

  const pullGameVersion = useCallback(
    (sessionId: string, gameId: string) =>
      request<VersionInfo>(`/api/sessions/${sessionId}/games/${gameId}/version`),
    [],
  );

  return {
    syncSession,
    syncGame,
    fetchSession,
    fetchSessions,
    fetchGame,
    pushSession: pushSessionDirect,
    pushGame: pushGameDirect,
    pullSessionVersion,
    pullGameVersion,
  };
}
