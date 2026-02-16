/**
 * Fire-and-forget API sync hook for cross-device persistence.
 * All operations are silent on error — localStorage is the primary store.
 */

import { useCallback, useRef } from 'react';
import type { Session, Game } from '../types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
const DEBOUNCE_MS = 1000;

async function request<T>(path: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    // Silent — API is secondary sync layer
    return null;
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

export function useApiSync() {
  const syncSessionImmediate = useCallback(async (session: Session) => {
    await request(`/api/sessions/${session.id}`, {
      method: 'PUT',
      body: JSON.stringify(session),
    });
  }, []);

  const syncGameImmediate = useCallback(async (game: Game) => {
    await request(`/api/sessions/${game.sessionId}/games/${game.id}`, {
      method: 'PUT',
      body: JSON.stringify(game),
    });
  }, []);

  const syncSession = useDebouncedFn(syncSessionImmediate, DEBOUNCE_MS);
  const syncGame = useDebouncedFn(syncGameImmediate, DEBOUNCE_MS);

  const fetchSession = useCallback((id: string) => request<Session>(`/api/sessions/${id}`), []);

  const fetchGame = useCallback(
    (sessionId: string, gameId: string) =>
      request<Game>(`/api/sessions/${sessionId}/games/${gameId}`),
    [],
  );

  return { syncSession, syncGame, fetchSession, fetchGame };
}
