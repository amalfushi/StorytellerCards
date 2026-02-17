import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  it('returns initial value when localStorage is empty', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));

    expect(result.current[0]).toBe('default');
  });

  it('reads an existing value from localStorage', () => {
    localStorage.setItem('test-key', JSON.stringify('saved-value'));

    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));

    expect(result.current[0]).toBe('saved-value');
  });

  it('updates value via setter', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    act(() => {
      result.current[1]('updated');
    });

    expect(result.current[0]).toBe('updated');
  });

  it('persists updated value to localStorage after debounce', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    act(() => {
      result.current[1]('persisted');
    });

    // Advance past the 300ms debounce
    act(() => {
      vi.advanceTimersByTime(350);
    });

    const stored = JSON.parse(localStorage.getItem('test-key')!);
    expect(stored).toBe('persisted');
  });

  it('falls back to initial value on JSON parse error', () => {
    localStorage.setItem('test-key', 'not-valid-json{{{');

    const { result } = renderHook(() => useLocalStorage('test-key', 'fallback'));

    expect(result.current[0]).toBe('fallback');
  });

  it('works with complex object values', () => {
    const initial = { players: [], count: 0 };
    const { result } = renderHook(() => useLocalStorage('obj-key', initial));

    expect(result.current[0]).toEqual(initial);

    act(() => {
      result.current[1]({ players: ['Alice'] as never, count: 1 });
    });

    expect(result.current[0]).toEqual({ players: ['Alice'], count: 1 });
  });

  it('accepts an updater function', () => {
    const { result } = renderHook(() => useLocalStorage('counter', 0));

    act(() => {
      result.current[1]((prev) => prev + 1);
    });

    expect(result.current[0]).toBe(1);

    act(() => {
      result.current[1]((prev) => prev + 5);
    });

    expect(result.current[0]).toBe(6);
  });
});
