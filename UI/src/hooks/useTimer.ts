import { useState, useRef, useCallback, useEffect } from 'react';

// ──────────────────────────────────────────────
// useTimer — reusable countdown timer hook
// ──────────────────────────────────────────────

export interface UseTimerReturn {
  /** Seconds remaining on the countdown. */
  timeRemaining: number;
  /** `true` while the timer is actively counting down. */
  isRunning: boolean;
  /** `true` when the timer has been paused (but not expired). */
  isPaused: boolean;
  /** `true` when the timer has reached 0. */
  isExpired: boolean;
  /** The total duration that was set (seconds). */
  totalDuration: number;
  /** Start (or restart) the countdown with the given duration in seconds. */
  start: (durationSeconds: number) => void;
  /** Pause the running countdown. */
  pause: () => void;
  /** Resume a paused countdown. */
  resume: () => void;
  /** Reset to idle state (no timer running). */
  reset: () => void;
  /** Format `timeRemaining` as "MM:SS" (e.g. "05:00", "00:05"). */
  formatTime: () => string;
}

export function useTimer(): UseTimerReturn {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  // Store the interval ID in a ref to avoid stale closures
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /** Clear the current interval if one exists. */
  const clearTick = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /** Start the 1-second countdown interval. */
  const startTick = useCallback(() => {
    clearTick();
    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Timer expired
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          setIsRunning(false);
          setIsPaused(false);
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearTick]);

  const start = useCallback(
    (durationSeconds: number) => {
      clearTick();
      const clamped = Math.max(0, Math.floor(durationSeconds));
      setTotalDuration(clamped);
      setTimeRemaining(clamped);
      setIsExpired(false);

      if (clamped > 0) {
        setIsRunning(true);
        setIsPaused(false);
        startTick();
      } else {
        setIsRunning(false);
        setIsPaused(false);
        setIsExpired(true);
      }
    },
    [clearTick, startTick],
  );

  const pause = useCallback(() => {
    if (!isRunning || isExpired) return;
    clearTick();
    setIsRunning(false);
    setIsPaused(true);
  }, [isRunning, isExpired, clearTick]);

  const resume = useCallback(() => {
    if (!isPaused || isExpired) return;
    setIsRunning(true);
    setIsPaused(false);
    startTick();
  }, [isPaused, isExpired, startTick]);

  const reset = useCallback(() => {
    clearTick();
    setTimeRemaining(0);
    setTotalDuration(0);
    setIsRunning(false);
    setIsPaused(false);
    setIsExpired(false);
  }, [clearTick]);

  const formatTime = useCallback((): string => {
    const mins = Math.floor(timeRemaining / 60);
    const secs = timeRemaining % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [timeRemaining]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      clearTick();
    };
  }, [clearTick]);

  return {
    timeRemaining,
    isRunning,
    isPaused,
    isExpired,
    totalDuration,
    start,
    pause,
    resume,
    reset,
    formatTime,
  };
}
