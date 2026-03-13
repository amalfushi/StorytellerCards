/**
 * Version-aware API sync hook for cross-device persistence.
 * Supports push (with X-Expected-Version), pull, version checks,
 * and 409 conflict handling. localStorage is always the primary store.
 *
 * When VITE_SYNC_DISABLED is set, all sync operations become no-ops
 * and the app runs in local-only mode using only localStorage.
 */

import { useCallback, useRef } from 'react';
import type { Session, Game, VersionInfo } from '../types';

const VITE_API_URL: string | undefined = import.meta.env.VITE_API_URL;

export const isSyncDisabled: boolean = import.meta.env.VITE_SYNC_DISABLED === 'true';

function getApiBase(): string {
  if (VITE_API_URL && VITE_API_URL !== 'undefined') {
    console.info(`[API] Using VITE_API_URL: ${VITE_API_URL}`);
    return VITE_API_URL;
  }
  const hostname = window.location.hostname;
  const base = `http://${hostname}:3001`;
  console.info(`[API] Using window.location.hostname="${hostname}" → ${base}`);
  return base;
}

const DEBOUNCE_MS = 1000;

/** Result of a push operation — includes conflict info if applicable. */
export interface PushResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
  conflict?: { serverVersion: number; expectedVersion: number };
}

async function request<T>(path: string, options?: RequestInit): Promise<T | null> {
  const url = `${getApiBase()}${path}`;
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) {
      console.warn(`[API] ${options?.method ?? 'GET'} ${url} → ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.warn(`[API] ${options?.method ?? 'GET'} ${url} → network error:`, err);
    return null;
  }
}

async function pushRequest<T>(path: string, options: RequestInit): Promise<PushResult<T>> {
  const url = `${getApiBase()}${path}`;
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });

    if (res.status === 409) {
      const body = (await res.json()) as { serverVersion: number; expectedVersion: number };
      console.warn(`[API] ${options.method} ${url} → 409 conflict`, body);
      return { ok: false, status: 409, data: null, conflict: body };
    }

    if (!res.ok) {
      console.warn(`[API] ${options.method} ${url} → ${res.status}`);
      return { ok: false, status: res.status, data: null };
    }

    const data = (await res.json()) as T;
    return { ok: true, status: res.status, data };
  } catch (err) {
    console.warn(`[API] ${options.method} ${url} → network error:`, err);
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
  /** Push a game with version-awareness. Returns push result with conflict info.
   *  An explicit expectedVersion overrides game.version for the X-Expected-Version header. */
  pushGame: (game: Game, expectedVersion?: number) => Promise<PushResult<Game>>;
  /** Lightweight version check for a session. */
  pullSessionVersion: (sessionId: string) => Promise<VersionInfo | null>;
  /** Lightweight version check for a game. */
  pullGameVersion: (sessionId: string, gameId: string) => Promise<VersionInfo | null>;
}

export function useApiSync(): ApiSyncHook {
  const syncDisabledLogged = useRef(false);

  if (isSyncDisabled) {
    if (!syncDisabledLogged.current) {
      console.info('[API] Sync disabled — running in local-only mode');
      syncDisabledLogged.current = true;
    }

    const noop = useCallback(() => {}, []);
    const noopAsync = useCallback(async () => null, []);
    const noopPush = useCallback(
      async () => ({ ok: true, status: 0, data: null }) as PushResult<never>,
      [],
    );
    const noopFetchSessions = useCallback(async (): Promise<Session[]> => [], []);

    return {
      syncSession: noop,
      syncGame: noop,
      fetchSession: noopAsync as (id: string) => Promise<Session | null>,
      fetchSessions: noopFetchSessions,
      fetchGame: noopAsync as (sessionId: string, gameId: string) => Promise<Game | null>,
      pushSession: noopPush as unknown as (session: Session) => Promise<PushResult<Session>>,
      pushGame: noopPush as unknown as (game: Game) => Promise<PushResult<Game>>,
      pullSessionVersion: noopAsync as (sessionId: string) => Promise<VersionInfo | null>,
      pullGameVersion: noopAsync as (
        sessionId: string,
        gameId: string,
      ) => Promise<VersionInfo | null>,
    };
  }

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

  const pushGameDirect = useCallback(
    async (game: Game, expectedVersion?: number): Promise<PushResult<Game>> => {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const version = expectedVersion ?? game.version;
      if (version !== undefined) {
        headers['X-Expected-Version'] = String(version);
      }
      return pushRequest<Game>(`/api/sessions/${game.sessionId}/games/${game.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(game),
      });
    },
    [],
  );

  const syncSessionImmediate = useCallback(async (session: Session) => {
    // Fire-and-forget push — no version header, server assigns version
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    await pushRequest<Session>(`/api/sessions/${session.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(session),
    });
  }, []);

  const syncGameImmediate = useCallback(async (game: Game) => {
    // Fire-and-forget push — no version header, server assigns version
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    await pushRequest<Game>(`/api/sessions/${game.sessionId}/games/${game.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(game),
    });
  }, []);

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

  if (isSyncDisabled) {
    return SYNC_DISABLED_HOOK;
  }

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
