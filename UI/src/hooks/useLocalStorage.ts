import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Read a value from `localStorage`, returning `fallback` when the key is
 * missing or the stored JSON is unparseable.
 */
function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * A React hook that mirrors state to `localStorage`.
 *
 * - Reads from `localStorage` on first mount (falls back to `initialValue`
 *   when the key is absent or the stored JSON is corrupt).
 * - Writes changes back to `localStorage`, **debounced by 300 ms** so that
 *   rapid successive updates don't thrash the storage API.
 * - The setter accepts either a new value or an updater function, exactly like
 *   `React.useState`.
 *
 * @example
 * ```tsx
 * const [name, setName] = useLocalStorage('player-name', '');
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => readStorage(key, initialValue));

  // Keep a ref to the latest value so the debounced write always persists the
  // most recent state.
  const latestValue = useRef(storedValue);

  // Debounce timer handle.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persist to localStorage (debounced).
  useEffect(() => {
    latestValue.current = storedValue;

    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(latestValue.current));
      } catch {
        // Storage full or unavailable – silently ignore.
      }
    }, 300);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, [key, storedValue]);

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue((prev) => {
      const next = value instanceof Function ? value(prev) : value;
      return next;
    });
  }, []);

  return [storedValue, setValue];
}
