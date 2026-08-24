/**
 * API sync hook for cross-device persistence.
 * Supports debounced fire-and-forget pushes and fetches.
 * localStorage is always the primary store.
 *
 * When VITE_SYNC_DISABLED is set, all sync operations become no-ops
 * and the app runs in local-only mode using only localStorage.
 */

import { useCallback, useRef } from 'react';
import type { Session, Game, Script } from '../types';

export const isSyncDisabled: boolean = import.meta.env.VITE_SYNC_DISABLED === 'true';

function getApiBase(): string {
  // In test environment (jsdom), relative URLs aren't valid for fetch — use localhost
  if (typeof import.meta.env.VITEST !== 'undefined') return 'http://localhost:3001';
  return ''; // Same-origin via Vite proxy (dev) or Go static serving (prod)
}

const DEBOUNCE_MS = 1000;

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
    if (res.status === 204) return null;
    return (await res.json()) as T;
  } catch (err) {
    console.warn(`[API] ${options?.method ?? 'GET'} ${url} → network error:`, err);
    return null;
  }
}

async function fireAndForgetPut(path: string, body: string): Promise<void> {
  const url = `${getApiBase()}${path}`;
  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    if (!res.ok) {
      console.warn(`[API] PUT ${url} → ${res.status}`);
    }
  } catch (err) {
    console.warn(`[API] PUT ${url} → network error:`, err);
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

function useDebouncedFnByKey<Args extends unknown[]>(
  fn: (...args: Args) => void,
  getKey: (...args: Args) => string,
  delay: number,
) {
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  return useCallback(
    (...args: Args) => {
      const key = getKey(...args);
      const existing = timers.current.get(key);
      if (existing) clearTimeout(existing);
      timers.current.set(
        key,
        setTimeout(() => {
          timers.current.delete(key);
          fn(...args);
        }, delay),
      );
    },
    [fn, getKey, delay],
  );
}

export interface ApiSyncHook {
  /** Debounced fire-and-forget session push. */
  syncSession: (session: Session) => void;
  /** Debounced fire-and-forget game push. */
  syncGame: (game: Game) => void;
  /** Fire-and-forget script push to API. */
  syncScript: (script: Script) => void;
  /** Fetch a full session from the API. */
  fetchSession: (id: string) => Promise<Session | null>;
  /** Fetch all sessions from the API. */
  fetchSessions: () => Promise<Session[]>;
  /** Fetch a full game from the API. */
  fetchGame: (sessionId: string, gameId: string) => Promise<Game | null>;
  /** Fetch a script from the API by ID. */
  fetchScript: (id: string) => Promise<Script | null>;
  /** Fire-and-forget DELETE for a session (and all its games). */
  deleteSession: (id: string) => void;
  /** Fire-and-forget DELETE for a single game. */
  deleteGame: (sessionId: string, gameId: string) => void;
}

export function useApiSync(): ApiSyncHook {
  const syncSessionImmediate = useCallback(async (session: Session) => {
    if (isSyncDisabled) return;
    await fireAndForgetPut(`/api/sessions/${session.id}`, JSON.stringify(session));
  }, []);

  const syncGameImmediate = useCallback(async (game: Game) => {
    if (isSyncDisabled) return;
    await fireAndForgetPut(
      `/api/sessions/${game.sessionId}/games/${game.id}`,
      JSON.stringify(game),
    );
  }, []);

  const syncSession = useDebouncedFn(syncSessionImmediate, DEBOUNCE_MS);
  const getGameSyncKey = useCallback((game: Game) => game.id, []);
  const syncGame = useDebouncedFnByKey(syncGameImmediate, getGameSyncKey, DEBOUNCE_MS);

  const fetchSession = useCallback((id: string) => {
    if (isSyncDisabled) return Promise.resolve(null);
    return request<Session>(`/api/sessions/${id}`);
  }, []);

  const fetchSessions = useCallback(async (): Promise<Session[]> => {
    if (isSyncDisabled) return [];
    const result = await request<Session[]>('/api/sessions');
    return result ?? [];
  }, []);

  const fetchGame = useCallback((sessionId: string, gameId: string) => {
    if (isSyncDisabled) return Promise.resolve(null);
    return request<Game>(`/api/sessions/${sessionId}/games/${gameId}`);
  }, []);

  const deleteSessionDirect = useCallback((id: string) => {
    if (isSyncDisabled) return;
    void request(`/api/sessions/${id}`, { method: 'DELETE' });
  }, []);

  const deleteGameDirect = useCallback((sessionId: string, gameId: string) => {
    if (isSyncDisabled) return;
    void request(`/api/sessions/${sessionId}/games/${gameId}`, { method: 'DELETE' });
  }, []);

  const syncScriptDirect = useCallback((script: Script) => {
    if (isSyncDisabled) return;
    void request<Script>('/api/scripts/import', {
      method: 'POST',
      body: JSON.stringify(script),
    });
  }, []);

  const fetchScriptDirect = useCallback((id: string) => {
    if (isSyncDisabled) return Promise.resolve(null);
    return request<Script>(`/api/scripts/${id}`);
  }, []);

  return {
    syncSession,
    syncGame,
    syncScript: syncScriptDirect,
    fetchSession,
    fetchSessions,
    fetchGame,
    fetchScript: fetchScriptDirect,
    deleteSession: deleteSessionDirect,
    deleteGame: deleteGameDirect,
  };
}
