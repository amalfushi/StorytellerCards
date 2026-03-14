import { useEffect, useRef, useCallback } from 'react';
import type { SyncStatus } from '@/types/index.ts';
import { isSyncDisabled } from './useApiSync.ts';

export interface UseSseSyncOptions {
  /** Whether SSE is enabled (needs active game) */
  enabled: boolean;
  /** Session ID of the current game */
  sessionId: string | null;
  /** Game ID of the current game */
  gameId: string | null;
  /** Called when server broadcasts a version change */
  onVersionChanged: () => void;
  /** Called when sync status changes */
  onStatusChange?: (status: SyncStatus) => void;
}

/**
 * SSE-based sync hook that listens for server-sent events instead of polling.
 * Automatically reconnects via EventSource semantics, pauses when the tab
 * is hidden, and resumes + force-syncs when the tab becomes visible again.
 */
export function useSseSync(options: UseSseSyncOptions): { forceSync: () => void } {
  const { enabled, sessionId, gameId, onVersionChanged, onStatusChange } = options;

  const onVersionChangedRef = useRef(onVersionChanged);
  const onStatusChangeRef = useRef(onStatusChange);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    onVersionChangedRef.current = onVersionChanged;
  }, [onVersionChanged]);

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  const closeConnection = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
  }, []);

  const openConnection = useCallback(() => {
    if (!sessionId || !gameId) return;

    closeConnection();

    const url = `/api/sessions/${sessionId}/games/${gameId}/events`;
    const es = new EventSource(url);

    es.addEventListener('connected', () => {
      onStatusChangeRef.current?.('idle');
    });

    es.addEventListener('version-changed', () => {
      onVersionChangedRef.current();
    });

    es.onerror = () => {
      onStatusChangeRef.current?.('offline');
    };

    esRef.current = es;
  }, [sessionId, gameId, closeConnection]);

  // Open/close EventSource based on enabled + IDs
  useEffect(() => {
    if (isSyncDisabled || !enabled || !sessionId || !gameId) {
      closeConnection();
      return;
    }

    openConnection();
    return closeConnection;
  }, [enabled, sessionId, gameId, openConnection, closeConnection]);

  // Pause when tab hidden, resume + sync when visible
  useEffect(() => {
    if (isSyncDisabled || !enabled || !sessionId || !gameId) return;

    const handleVisibility = () => {
      if (document.hidden) {
        closeConnection();
      } else {
        openConnection();
        onVersionChangedRef.current();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [enabled, sessionId, gameId, openConnection, closeConnection]);

  const forceSync = useCallback(() => {
    onVersionChangedRef.current();
  }, []);

  if (isSyncDisabled) {
    return { forceSync: () => {} };
  }

  return { forceSync };
}
