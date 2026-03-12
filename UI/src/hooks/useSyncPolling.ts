import { useEffect, useRef, useCallback } from 'react';
import type { VersionInfo, SyncStatus } from '@/types/index.ts';

export interface SyncPollingOptions {
  /** Whether polling is enabled. Disabled when there's no active resource to poll. */
  enabled: boolean;
  /** Normal polling interval in ms. Default: 3000 */
  interval?: number;
  /** Polling interval after consecutive failures (3+). Default: 10000 */
  degradedInterval?: number;
  /** Polling interval after many consecutive failures (5+). Default: 30000 */
  offlineInterval?: number;
  /** Fetch the server version. Return null on failure. */
  fetchVersion: () => Promise<VersionInfo | null>;
  /** Called when server version is newer than local. */
  onNewVersion: (serverVersion: VersionInfo) => void;
  /** Called when sync status changes. */
  onStatusChange?: (status: SyncStatus) => void;
  /** Current local version to compare against. */
  localVersion: number;
}

/**
 * Polling loop that checks for remote version changes.
 * Pauses when the tab is hidden, backs off on consecutive failures,
 * and recovers automatically when the API responds again.
 */
export function useSyncPolling(options: SyncPollingOptions): { forceSync: () => void } {
  const {
    enabled,
    interval = 3000,
    degradedInterval = 10000,
    offlineInterval = 30000,
    fetchVersion,
    onNewVersion,
    onStatusChange,
    localVersion,
  } = options;

  const failCountRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isMountedRef = useRef(true);

  // Store latest callback refs to avoid stale closures
  const fetchVersionRef = useRef(fetchVersion);
  const onNewVersionRef = useRef(onNewVersion);
  const onStatusChangeRef = useRef(onStatusChange);
  const localVersionRef = useRef(localVersion);

  useEffect(() => {
    fetchVersionRef.current = fetchVersion;
  }, [fetchVersion]);

  useEffect(() => {
    onNewVersionRef.current = onNewVersion;
  }, [onNewVersion]);

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  useEffect(() => {
    localVersionRef.current = localVersion;
  }, [localVersion]);

  const getInterval = useCallback(() => {
    const fails = failCountRef.current;
    if (fails >= 5) return offlineInterval;
    if (fails >= 3) return degradedInterval;
    return interval;
  }, [interval, degradedInterval, offlineInterval]);

  const poll = useCallback(async () => {
    if (!isMountedRef.current) return;

    const versionInfo = await fetchVersionRef.current();

    if (!isMountedRef.current) return;

    if (versionInfo === null) {
      failCountRef.current++;
      if (failCountRef.current >= 3) {
        onStatusChangeRef.current?.('offline');
      }
    } else {
      const wasOffline = failCountRef.current >= 3;
      failCountRef.current = 0;
      onStatusChangeRef.current?.('idle');

      if (versionInfo.version > localVersionRef.current) {
        onStatusChangeRef.current?.('syncing');
        onNewVersionRef.current(versionInfo);
      } else if (wasOffline) {
        onNewVersionRef.current(versionInfo);
      }
    }
  }, []);

  // Schedule the next poll using a ref to avoid recursive useCallback
  const scheduleRef = useRef<() => void>(() => {});

  const runPollAndReschedule = useCallback(async () => {
    await poll();
    if (isMountedRef.current) {
      scheduleRef.current();
    }
  }, [poll]);

  useEffect(() => {
    scheduleRef.current = () => {
      if (!isMountedRef.current) return;
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(runPollAndReschedule, getInterval());
    };
  }, [runPollAndReschedule, getInterval]);

  // Start/stop polling based on enabled flag
  useEffect(() => {
    isMountedRef.current = true;
    if (enabled) {
      scheduleRef.current();
    }
    return () => {
      isMountedRef.current = false;
      clearTimeout(timerRef.current);
    };
  }, [enabled]);

  // Pause polling when tab is hidden
  useEffect(() => {
    if (!enabled) return;

    const handleVisibility = () => {
      if (document.hidden) {
        clearTimeout(timerRef.current);
      } else {
        runPollAndReschedule();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [enabled, runPollAndReschedule]);

  const forceSync = useCallback(() => {
    clearTimeout(timerRef.current);
    runPollAndReschedule();
  }, [runPollAndReschedule]);

  return { forceSync };
}
