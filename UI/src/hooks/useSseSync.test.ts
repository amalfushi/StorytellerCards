import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSseSync } from './useSseSync.ts';

// ── MockEventSource ──

type EventCallback = (event: { data: string }) => void;
type ErrorCallback = () => void;

class MockEventSource {
  static instances: MockEventSource[] = [];

  url: string;
  close = vi.fn();
  private listeners: Record<string, (EventCallback | ErrorCallback)[]> = {};

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  addEventListener(event: string, fn: EventCallback | ErrorCallback) {
    (this.listeners[event] ??= []).push(fn);
  }

  removeEventListener(event: string, fn: EventCallback | ErrorCallback) {
    this.listeners[event] = this.listeners[event]?.filter((f) => f !== fn) ?? [];
  }

  emit(event: string, data?: unknown) {
    this.listeners[event]?.forEach((fn) => {
      if (event === 'error') {
        (fn as ErrorCallback)();
      } else {
        (fn as EventCallback)({ data: JSON.stringify(data) });
      }
    });
  }

  set onerror(fn: ErrorCallback) {
    this.addEventListener('error', fn);
  }
}

// ── Helpers ──

vi.mock('./useApiSync.ts', () => ({ isSyncDisabled: false }));

function setIsSyncDisabled(value: boolean) {
  vi.doMock('./useApiSync.ts', () => ({ isSyncDisabled: value }));
}

function latestES(): MockEventSource {
  return MockEventSource.instances[MockEventSource.instances.length - 1];
}

// ── Tests ──

describe('useSseSync', () => {
  beforeEach(() => {
    MockEventSource.instances = [];
    vi.stubGlobal('EventSource', MockEventSource);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('creates EventSource when enabled with valid IDs', () => {
    renderHook(() =>
      useSseSync({
        enabled: true,
        sessionId: 's1',
        gameId: 'g1',
        onVersionChanged: vi.fn(),
      }),
    );

    expect(MockEventSource.instances).toHaveLength(1);
    expect(latestES().url).toBe('/api/sessions/s1/games/g1/events');
  });

  it('does not create EventSource when disabled', () => {
    renderHook(() =>
      useSseSync({
        enabled: false,
        sessionId: 's1',
        gameId: 'g1',
        onVersionChanged: vi.fn(),
      }),
    );

    expect(MockEventSource.instances).toHaveLength(0);
  });

  it('does not create EventSource when sessionId is null', () => {
    renderHook(() =>
      useSseSync({
        enabled: true,
        sessionId: null,
        gameId: 'g1',
        onVersionChanged: vi.fn(),
      }),
    );

    expect(MockEventSource.instances).toHaveLength(0);
  });

  it('does not create EventSource when gameId is null', () => {
    renderHook(() =>
      useSseSync({
        enabled: true,
        sessionId: 's1',
        gameId: null,
        onVersionChanged: vi.fn(),
      }),
    );

    expect(MockEventSource.instances).toHaveLength(0);
  });

  it('calls onVersionChanged on version-changed event', () => {
    const onVersionChanged = vi.fn();

    renderHook(() =>
      useSseSync({
        enabled: true,
        sessionId: 's1',
        gameId: 'g1',
        onVersionChanged,
      }),
    );

    act(() => latestES().emit('version-changed', { version: 2 }));

    expect(onVersionChanged).toHaveBeenCalledTimes(1);
  });

  it('calls onStatusChange with idle on connected event', () => {
    const onStatusChange = vi.fn();

    renderHook(() =>
      useSseSync({
        enabled: true,
        sessionId: 's1',
        gameId: 'g1',
        onVersionChanged: vi.fn(),
        onStatusChange,
      }),
    );

    act(() => latestES().emit('connected'));

    expect(onStatusChange).toHaveBeenCalledWith('idle');
  });

  it('calls onStatusChange with offline on error', () => {
    const onStatusChange = vi.fn();

    renderHook(() =>
      useSseSync({
        enabled: true,
        sessionId: 's1',
        gameId: 'g1',
        onVersionChanged: vi.fn(),
        onStatusChange,
      }),
    );

    act(() => latestES().emit('error'));

    expect(onStatusChange).toHaveBeenCalledWith('offline');
  });

  it('closes EventSource on unmount', () => {
    const { unmount } = renderHook(() =>
      useSseSync({
        enabled: true,
        sessionId: 's1',
        gameId: 'g1',
        onVersionChanged: vi.fn(),
      }),
    );

    const es = latestES();
    unmount();

    expect(es.close).toHaveBeenCalled();
  });

  it('forceSync calls onVersionChanged', () => {
    const onVersionChanged = vi.fn();

    const { result } = renderHook(() =>
      useSseSync({
        enabled: true,
        sessionId: 's1',
        gameId: 'g1',
        onVersionChanged,
      }),
    );

    act(() => result.current.forceSync());

    expect(onVersionChanged).toHaveBeenCalledTimes(1);
  });

  it('closes old and opens new EventSource when IDs change', () => {
    const { rerender } = renderHook(
      (props) =>
        useSseSync({
          enabled: true,
          sessionId: props.sessionId,
          gameId: props.gameId,
          onVersionChanged: vi.fn(),
        }),
      { initialProps: { sessionId: 's1', gameId: 'g1' } },
    );

    const firstES = latestES();
    rerender({ sessionId: 's2', gameId: 'g2' });

    expect(firstES.close).toHaveBeenCalled();
    expect(MockEventSource.instances).toHaveLength(2);
    expect(latestES().url).toBe('/api/sessions/s2/games/g2/events');
  });

  it('does not create EventSource when sync is disabled', async () => {
    setIsSyncDisabled(true);
    const { useSseSync: useSseSyncReloaded } = await import('./useSseSync.ts');

    const { result } = renderHook(() =>
      useSseSyncReloaded({
        enabled: true,
        sessionId: 's1',
        gameId: 'g1',
        onVersionChanged: vi.fn(),
      }),
    );

    expect(MockEventSource.instances).toHaveLength(0);
    expect(typeof result.current.forceSync).toBe('function');
  });
});
