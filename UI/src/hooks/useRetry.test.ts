import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRetry } from './useRetry.ts';

describe('useRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns execute and cancel functions', () => {
    const { result } = renderHook(() => useRetry());
    expect(typeof result.current.execute).toBe('function');
    expect(typeof result.current.cancel).toBe('function');
  });

  it('resolves immediately when fn succeeds on first try', async () => {
    const { result } = renderHook(() => useRetry());
    const fn = vi.fn().mockResolvedValue('success');

    let value: string | null = null;
    await act(async () => {
      value = await result.current.execute(fn);
    });

    expect(value).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure with exponential backoff', async () => {
    const { result } = renderHook(() =>
      useRetry({ maxRetries: 2, baseDelay: 100, maxDelay: 1000 }),
    );

    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('success');

    let value: string | null = null;
    const promise = act(async () => {
      const executePromise = result.current.execute<string>(fn);

      // First retry: 100ms delay
      await vi.advanceTimersByTimeAsync(150);
      // Second retry: 200ms delay
      await vi.advanceTimersByTimeAsync(250);

      value = await executePromise;
    });

    await promise;
    expect(value).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('calls onGiveUp when all retries are exhausted', async () => {
    const onGiveUp = vi.fn();
    const { result } = renderHook(() =>
      useRetry({ maxRetries: 1, baseDelay: 50, maxDelay: 1000, onGiveUp }),
    );

    const error = new Error('persistent failure');
    const fn = vi.fn().mockRejectedValue(error);

    await act(async () => {
      const executePromise = result.current.execute(fn);
      await vi.advanceTimersByTimeAsync(100);
      await executePromise;
    });

    expect(onGiveUp).toHaveBeenCalledWith(error);
    expect(fn).toHaveBeenCalledTimes(2); // initial + 1 retry
  });

  it('returns null when all retries fail', async () => {
    const { result } = renderHook(() => useRetry({ maxRetries: 1, baseDelay: 50 }));

    const fn = vi.fn().mockRejectedValue(new Error('fail'));

    let value: unknown = 'not-null';
    await act(async () => {
      const executePromise = result.current.execute(fn);
      await vi.advanceTimersByTimeAsync(100);
      value = await executePromise;
    });

    expect(value).toBeNull();
  });

  it('caps delay at maxDelay', async () => {
    const { result } = renderHook(() =>
      useRetry({ maxRetries: 5, baseDelay: 1000, maxDelay: 2000 }),
    );

    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('1'))
      .mockRejectedValueOnce(new Error('2'))
      .mockRejectedValueOnce(new Error('3'))
      .mockResolvedValue('done');

    await act(async () => {
      const executePromise = result.current.execute(fn);
      // delay 1: min(1000 * 2^0, 2000) = 1000ms
      await vi.advanceTimersByTimeAsync(1100);
      // delay 2: min(1000 * 2^1, 2000) = 2000ms
      await vi.advanceTimersByTimeAsync(2100);
      // delay 3: min(1000 * 2^2, 2000) = 2000ms (capped)
      await vi.advanceTimersByTimeAsync(2100);
      await executePromise;
    });

    expect(fn).toHaveBeenCalledTimes(4);
  });

  it('cancel aborts in-flight retry chain', async () => {
    const { result } = renderHook(() => useRetry({ maxRetries: 3, baseDelay: 1000 }));

    const fn = vi.fn().mockRejectedValue(new Error('fail'));

    await act(async () => {
      const executePromise = result.current.execute(fn);
      // Cancel before any retry fires
      result.current.cancel();
      await vi.advanceTimersByTimeAsync(5000);
      await executePromise;
    });

    // Should have been called once (the initial attempt), then cancelled
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('passes abort signal to the function', async () => {
    const { result } = renderHook(() => useRetry());
    const fn = vi.fn().mockImplementation((signal: AbortSignal) => {
      expect(signal).toBeInstanceOf(AbortSignal);
      return Promise.resolve('ok');
    });

    await act(async () => {
      await result.current.execute(fn);
    });

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('uses default options when none provided', () => {
    const { result } = renderHook(() => useRetry());
    expect(result.current.execute).toBeDefined();
    expect(result.current.cancel).toBeDefined();
  });
});
