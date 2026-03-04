import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DayTimerFab } from '@/components/Timer/DayTimerFab.tsx';
import type { UseTimerReturn } from '@/hooks/useTimer.ts';

// ──────────────────────────────────────────────
// Mock DayTimer to avoid its complexity
// ──────────────────────────────────────────────

vi.mock('@/components/Timer/DayTimer.tsx', () => ({
  DayTimer: ({ timer }: { timer: UseTimerReturn }) => (
    <div data-testid="day-timer-panel">Timer: {timer.formatTime()}</div>
  ),
}));

// Mock audioAlarm (imported transitively)
vi.mock('@/utils/audioAlarm.ts', () => ({
  playAlarmBeeps: vi.fn(() => ({ stop: vi.fn() })),
}));

// ──────────────────────────────────────────────
// Helper to create mock timer
// ──────────────────────────────────────────────

function createMockTimer(overrides: Partial<UseTimerReturn> = {}): UseTimerReturn {
  return {
    timeRemaining: 0,
    totalDuration: 0,
    isRunning: false,
    isPaused: false,
    isExpired: false,
    start: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    reset: vi.fn(),
    formatTime: () => '00:00',
    ...overrides,
  };
}

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe('DayTimerFab', () => {
  it('renders floating action button', () => {
    const timer = createMockTimer();
    render(<DayTimerFab timer={timer} />);
    expect(screen.getByLabelText('day timer')).toBeInTheDocument();
  });

  it('shows timer icon when idle', () => {
    const timer = createMockTimer();
    render(<DayTimerFab timer={timer} />);
    const fab = screen.getByLabelText('day timer');
    // Should contain an SVG icon (TimerIcon), not text
    expect(fab.querySelector('svg')).toBeTruthy();
  });

  it('shows compact time when running', () => {
    const timer = createMockTimer({
      isRunning: true,
      timeRemaining: 300,
      totalDuration: 300,
      formatTime: () => '05:00',
    });
    render(<DayTimerFab timer={timer} />);
    // Compact time strips leading zero: "5:00" not "05:00"
    expect(screen.getByText('5:00')).toBeInTheDocument();
  });

  it('shows compact time when paused', () => {
    const timer = createMockTimer({
      isPaused: true,
      timeRemaining: 200,
      totalDuration: 300,
      formatTime: () => '03:20',
    });
    render(<DayTimerFab timer={timer} />);
    expect(screen.getByText('3:20')).toBeInTheDocument();
  });

  it('shows compact time when expired', () => {
    const timer = createMockTimer({
      isExpired: true,
      timeRemaining: 0,
      totalDuration: 300,
      formatTime: () => '00:00',
    });
    render(<DayTimerFab timer={timer} />);
    // "00:00" → compact is "0:00"
    expect(screen.getByText('0:00')).toBeInTheDocument();
  });

  it('click opens the DayTimer panel in a drawer', () => {
    const timer = createMockTimer();
    render(<DayTimerFab timer={timer} />);

    // DayTimer panel should not be visible initially
    expect(screen.queryByTestId('day-timer-panel')).not.toBeInTheDocument();

    // Click the FAB
    fireEvent.click(screen.getByLabelText('day timer'));

    // DayTimer panel should now be visible
    expect(screen.getByTestId('day-timer-panel')).toBeInTheDocument();
  });

  it('passes timer prop through to DayTimer panel', () => {
    const timer = createMockTimer({ formatTime: () => '07:30' });
    render(<DayTimerFab timer={timer} />);

    fireEvent.click(screen.getByLabelText('day timer'));

    expect(screen.getByText('Timer: 07:30')).toBeInTheDocument();
  });
});
