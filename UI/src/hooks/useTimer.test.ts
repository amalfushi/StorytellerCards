import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimer } from './useTimer.ts';

describe('useTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('returns timer state with all expected properties', () => {
      const { result } = renderHook(() => useTimer());
      expect(result.current).toEqual(
        expect.objectContaining({
          timeRemaining: 0,
          isRunning: false,
          isPaused: false,
          isExpired: false,
          totalDuration: 0,
        }),
      );
      expect(typeof result.current.start).toBe('function');
      expect(typeof result.current.pause).toBe('function');
      expect(typeof result.current.resume).toBe('function');
      expect(typeof result.current.reset).toBe('function');
      expect(typeof result.current.formatTime).toBe('function');
    });

    it('formatTime returns "00:00" initially', () => {
      const { result } = renderHook(() => useTimer());
      expect(result.current.formatTime()).toBe('00:00');
    });
  });

  describe('start', () => {
    it('begins countdown with the given duration', () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start(60);
      });

      expect(result.current.timeRemaining).toBe(60);
      expect(result.current.totalDuration).toBe(60);
      expect(result.current.isRunning).toBe(true);
      expect(result.current.isPaused).toBe(false);
      expect(result.current.isExpired).toBe(false);
    });

    it('clamps negative durations to 0', () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start(-5);
      });

      expect(result.current.timeRemaining).toBe(0);
      expect(result.current.isRunning).toBe(false);
      expect(result.current.isExpired).toBe(true);
    });

    it('floors fractional durations', () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start(10.7);
      });

      expect(result.current.timeRemaining).toBe(10);
      expect(result.current.totalDuration).toBe(10);
    });

    it('immediately expires if duration is 0', () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start(0);
      });

      expect(result.current.isRunning).toBe(false);
      expect(result.current.isExpired).toBe(true);
      expect(result.current.timeRemaining).toBe(0);
    });
  });

  describe('countdown', () => {
    it('counts down correctly after 1 second', () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start(10);
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.timeRemaining).toBe(9);
      expect(result.current.isRunning).toBe(true);
    });

    it('counts down correctly after multiple seconds', () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start(10);
      });

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.timeRemaining).toBe(5);
      expect(result.current.isRunning).toBe(true);
    });

    it('stops at 0 and sets isExpired', () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start(3);
      });

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(result.current.timeRemaining).toBe(0);
      expect(result.current.isRunning).toBe(false);
      expect(result.current.isExpired).toBe(true);
    });

    it('does not go below 0', () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start(2);
      });

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.timeRemaining).toBe(0);
    });
  });

  describe('pause', () => {
    it('stops the countdown', () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start(10);
      });

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      act(() => {
        result.current.pause();
      });

      expect(result.current.timeRemaining).toBe(8);
      expect(result.current.isRunning).toBe(false);
      expect(result.current.isPaused).toBe(true);

      // Time should not continue after pause
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(result.current.timeRemaining).toBe(8);
    });

    it('does nothing when timer is not running', () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.pause();
      });

      expect(result.current.isPaused).toBe(false);
      expect(result.current.isRunning).toBe(false);
    });

    it('does nothing when timer is already expired', () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start(1);
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.isExpired).toBe(true);

      act(() => {
        result.current.pause();
      });

      expect(result.current.isPaused).toBe(false);
    });
  });

  describe('resume', () => {
    it('resumes a paused countdown', () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start(10);
      });

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      act(() => {
        result.current.pause();
      });

      expect(result.current.timeRemaining).toBe(7);

      act(() => {
        result.current.resume();
      });

      expect(result.current.isRunning).toBe(true);
      expect(result.current.isPaused).toBe(false);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.timeRemaining).toBe(5);
    });

    it('does nothing when timer is not paused', () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start(10);
      });

      // Not paused, so resume should be a no-op
      const timeBefore = result.current.timeRemaining;
      act(() => {
        result.current.resume();
      });
      expect(result.current.timeRemaining).toBe(timeBefore);
    });

    it('does nothing when expired', () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start(1);
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.isExpired).toBe(true);

      act(() => {
        result.current.resume();
      });

      expect(result.current.isRunning).toBe(false);
      expect(result.current.isExpired).toBe(true);
    });
  });

  describe('reset', () => {
    it('returns all state to initial values', () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start(60);
      });

      act(() => {
        vi.advanceTimersByTime(10000);
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.timeRemaining).toBe(0);
      expect(result.current.totalDuration).toBe(0);
      expect(result.current.isRunning).toBe(false);
      expect(result.current.isPaused).toBe(false);
      expect(result.current.isExpired).toBe(false);
    });

    it('stops the countdown interval', () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start(60);
      });

      act(() => {
        result.current.reset();
      });

      // Advancing time should not change anything
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.timeRemaining).toBe(0);
    });

    it('can start a new timer after reset', () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start(10);
      });

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      act(() => {
        result.current.reset();
      });

      act(() => {
        result.current.start(30);
      });

      expect(result.current.timeRemaining).toBe(30);
      expect(result.current.totalDuration).toBe(30);
      expect(result.current.isRunning).toBe(true);
    });
  });

  describe('formatTime', () => {
    it('formats minutes and seconds with leading zeros', () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start(305); // 5:05
      });

      expect(result.current.formatTime()).toBe('05:05');
    });

    it('formats sub-minute times correctly', () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start(45);
      });

      expect(result.current.formatTime()).toBe('00:45');
    });

    it('formats exactly one minute', () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start(60);
      });

      expect(result.current.formatTime()).toBe('01:00');
    });

    it('formats large values correctly', () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start(600); // 10:00
      });

      expect(result.current.formatTime()).toBe('10:00');
    });
  });

  describe('duration changes (restarting with different value)', () => {
    it('can restart with a different duration while running', () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start(60);
      });

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.timeRemaining).toBe(55);

      // Restart with a new duration
      act(() => {
        result.current.start(120);
      });

      expect(result.current.timeRemaining).toBe(120);
      expect(result.current.totalDuration).toBe(120);
      expect(result.current.isRunning).toBe(true);
    });
  });

  describe('cleanup on unmount', () => {
    it('clears interval when component unmounts', () => {
      const { result, unmount } = renderHook(() => useTimer());

      act(() => {
        result.current.start(60);
      });

      // Should not throw on unmount
      expect(() => unmount()).not.toThrow();
    });
  });
});
