import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSyncPolling } from './useSyncPolling.ts';
import type { VersionInfo, SyncStatus } from '@/types/index.ts';

describe('useSyncPolling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns a forceSync function', () => {
    const { result } = renderHook(() =>
      useSyncPolling({
        enabled: false,
        fetchVersion: vi.fn(),
        onNewVersion: vi.fn(),
        localVersion: 0,
      }),
    );
    expect(typeof result.current.forceSync).toBe('function');
  });

  it('does not poll when disabled', async () => {
    const fetchVersion = vi.fn();

    renderHook(() =>
      useSyncPolling({
        enabled: false,
        interval: 100,
        fetchVersion,
        onNewVersion: vi.fn(),
        localVersion: 0,
      }),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(fetchVersion).not.toHaveBeenCalled();
  });

  it('polls at the specified interval when enabled', async () => {
    const fetchVersion = vi.fn().mockResolvedValue({ version: 1, updatedAt: '' });

    renderHook(() =>
      useSyncPolling({
        enabled: true,
        interval: 200,
        fetchVersion,
        onNewVersion: vi.fn(),
        localVersion: 1,
      }),
    );

    // First poll fires after interval
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });
    const firstCount = fetchVersion.mock.calls.length;
    expect(firstCount).toBeGreaterThanOrEqual(1);

    // More polls fire over time
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(fetchVersion.mock.calls.length).toBeGreaterThan(firstCount);
  });

  it('calls onNewVersion when server version is newer', async () => {
    const serverInfo: VersionInfo = { version: 5, updatedAt: '2024-01-01T00:00:00Z' };
    const fetchVersion = vi.fn().mockResolvedValue(serverInfo);
    const onNewVersion = vi.fn();

    renderHook(() =>
      useSyncPolling({
        enabled: true,
        interval: 100,
        fetchVersion,
        onNewVersion,
        localVersion: 3,
      }),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });

    expect(onNewVersion).toHaveBeenCalledWith(serverInfo);
  });

  it('does not call onNewVersion when versions match', async () => {
    const fetchVersion = vi.fn().mockResolvedValue({ version: 3, updatedAt: '' });
    const onNewVersion = vi.fn();

    renderHook(() =>
      useSyncPolling({
        enabled: true,
        interval: 100,
        fetchVersion,
        onNewVersion,
        localVersion: 3,
      }),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });

    expect(onNewVersion).not.toHaveBeenCalled();
  });

  it('reports offline status after 3 consecutive failures', async () => {
    const fetchVersion = vi.fn().mockResolvedValue(null);
    const onStatusChange = vi.fn();

    renderHook(() =>
      useSyncPolling({
        enabled: true,
        interval: 100,
        fetchVersion,
        onNewVersion: vi.fn(),
        onStatusChange,
        localVersion: 1,
      }),
    );

    // 3 consecutive failures
    for (let i = 0; i < 3; i++) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(150);
      });
    }

    const statusCalls = onStatusChange.mock.calls.map((call: [SyncStatus]) => call[0]);
    expect(statusCalls).toContain('offline');
  });

  it('recovers to idle after failures when API responds', async () => {
    const fetchVersion = vi
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValue({ version: 1, updatedAt: '' });
    const onStatusChange = vi.fn();

    renderHook(() =>
      useSyncPolling({
        enabled: true,
        interval: 100,
        degradedInterval: 100,
        offlineInterval: 100,
        fetchVersion,
        onNewVersion: vi.fn(),
        onStatusChange,
        localVersion: 1,
      }),
    );

    // 3 failures
    for (let i = 0; i < 3; i++) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(150);
      });
    }

    // Recovery
    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });

    const statusCalls = onStatusChange.mock.calls.map((call: [SyncStatus]) => call[0]);
    expect(statusCalls[statusCalls.length - 1]).toBe('idle');
  });

  it('forceSync triggers an immediate poll', async () => {
    const fetchVersion = vi.fn().mockResolvedValue({ version: 2, updatedAt: '' });
    const onNewVersion = vi.fn();

    const { result } = renderHook(() =>
      useSyncPolling({
        enabled: true,
        interval: 10000,
        fetchVersion,
        onNewVersion,
        localVersion: 1,
      }),
    );

    // Force sync before the normal interval fires
    await act(async () => {
      result.current.forceSync();
      await vi.advanceTimersByTimeAsync(10);
    });

    expect(fetchVersion).toHaveBeenCalledTimes(1);
    expect(onNewVersion).toHaveBeenCalled();
  });

  it('cleans up timer on unmount', async () => {
    const fetchVersion = vi.fn().mockResolvedValue({ version: 1, updatedAt: '' });

    const { unmount } = renderHook(() =>
      useSyncPolling({
        enabled: true,
        interval: 100,
        fetchVersion,
        onNewVersion: vi.fn(),
        localVersion: 1,
      }),
    );

    unmount();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    // After unmount, no new polls should occur
    expect(fetchVersion).toHaveBeenCalledTimes(0);
  });
});
