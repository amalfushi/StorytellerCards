import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DayTimer } from '@/components/Timer/DayTimer.tsx';
import type { UseTimerReturn } from '@/hooks/useTimer.ts';

// ──────────────────────────────────────────────
// Mock audioAlarm
// ──────────────────────────────────────────────

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

describe('DayTimer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const timer = createMockTimer();
    const { container } = render(<DayTimer timer={timer} />);
    expect(container).toBeTruthy();
  });

  it('shows idle state with title', () => {
    const timer = createMockTimer();
    render(<DayTimer timer={timer} />);
    expect(screen.getByText(/Day Discussion Timer/)).toBeInTheDocument();
  });

  it('has preset duration buttons', () => {
    const timer = createMockTimer();
    render(<DayTimer timer={timer} />);
    expect(screen.getByText('3 min')).toBeInTheDocument();
    expect(screen.getByText('5 min')).toBeInTheDocument();
    expect(screen.getByText('7 min')).toBeInTheDocument();
    expect(screen.getByText('10 min')).toBeInTheDocument();
    expect(screen.getByText('15 min')).toBeInTheDocument();
  });

  it('clicking preset calls start with correct seconds', () => {
    const start = vi.fn();
    const timer = createMockTimer({ start });
    render(<DayTimer timer={timer} />);

    fireEvent.click(screen.getByText('5 min'));
    expect(start).toHaveBeenCalledWith(300); // 5 * 60
  });

  it('clicking 3 min preset calls start with 180 seconds', () => {
    const start = vi.fn();
    const timer = createMockTimer({ start });
    render(<DayTimer timer={timer} />);

    fireEvent.click(screen.getByText('3 min'));
    expect(start).toHaveBeenCalledWith(180);
  });

  it('has custom duration input and start button', () => {
    const timer = createMockTimer();
    render(<DayTimer timer={timer} />);
    expect(screen.getByLabelText(/Custom/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start/i })).toBeInTheDocument();
  });

  it('start button is disabled when custom input is empty', () => {
    const timer = createMockTimer();
    render(<DayTimer timer={timer} />);
    const startButton = screen.getByRole('button', { name: /Start/i });
    expect(startButton).toBeDisabled();
  });

  it('shows timer display when running', () => {
    const timer = createMockTimer({
      isRunning: true,
      timeRemaining: 300,
      totalDuration: 300,
      formatTime: () => '05:00',
    });
    render(<DayTimer timer={timer} />);
    expect(screen.getByText('05:00')).toBeInTheDocument();
  });

  it('shows "Running…" status when timer is running', () => {
    const timer = createMockTimer({
      isRunning: true,
      timeRemaining: 300,
      totalDuration: 300,
      formatTime: () => '05:00',
    });
    render(<DayTimer timer={timer} />);
    expect(screen.getByText('Running…')).toBeInTheDocument();
  });

  it('shows pause button when running', () => {
    const timer = createMockTimer({
      isRunning: true,
      timeRemaining: 300,
      totalDuration: 300,
      formatTime: () => '05:00',
    });
    render(<DayTimer timer={timer} />);
    expect(screen.getByLabelText('pause timer')).toBeInTheDocument();
  });

  it('clicking pause calls pause', () => {
    const pause = vi.fn();
    const timer = createMockTimer({
      isRunning: true,
      timeRemaining: 300,
      totalDuration: 300,
      formatTime: () => '05:00',
      pause,
    });
    render(<DayTimer timer={timer} />);
    fireEvent.click(screen.getByLabelText('pause timer'));
    expect(pause).toHaveBeenCalledTimes(1);
  });

  it('shows resume and reset buttons when paused', () => {
    const timer = createMockTimer({
      isPaused: true,
      timeRemaining: 200,
      totalDuration: 300,
      formatTime: () => '03:20',
    });
    render(<DayTimer timer={timer} />);
    expect(screen.getByLabelText('resume timer')).toBeInTheDocument();
    expect(screen.getByLabelText('reset timer')).toBeInTheDocument();
  });

  it('shows "Paused" status when timer is paused', () => {
    const timer = createMockTimer({
      isPaused: true,
      timeRemaining: 200,
      totalDuration: 300,
      formatTime: () => '03:20',
    });
    render(<DayTimer timer={timer} />);
    expect(screen.getByText('Paused')).toBeInTheDocument();
  });

  it('clicking resume calls resume', () => {
    const resume = vi.fn();
    const timer = createMockTimer({
      isPaused: true,
      timeRemaining: 200,
      totalDuration: 300,
      formatTime: () => '03:20',
      resume,
    });
    render(<DayTimer timer={timer} />);
    fireEvent.click(screen.getByLabelText('resume timer'));
    expect(resume).toHaveBeenCalledTimes(1);
  });

  it('clicking reset calls reset', () => {
    const reset = vi.fn();
    const timer = createMockTimer({
      isPaused: true,
      timeRemaining: 200,
      totalDuration: 300,
      formatTime: () => '03:20',
      reset,
    });
    render(<DayTimer timer={timer} />);
    fireEvent.click(screen.getByLabelText('reset timer'));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('shows 00:00 when expired', () => {
    const timer = createMockTimer({
      isExpired: true,
      timeRemaining: 0,
      totalDuration: 300,
      formatTime: () => '00:00',
    });
    render(<DayTimer timer={timer} />);
    expect(screen.getByText('00:00')).toBeInTheDocument();
  });

  it('shows dismiss alarm button when expired', () => {
    const timer = createMockTimer({
      isExpired: true,
      timeRemaining: 0,
      totalDuration: 300,
      formatTime: () => '00:00',
    });
    render(<DayTimer timer={timer} />);
    expect(screen.getByRole('button', { name: /Dismiss Alarm/i })).toBeInTheDocument();
  });

  it('shows reset button when expired', () => {
    const timer = createMockTimer({
      isExpired: true,
      timeRemaining: 0,
      totalDuration: 300,
      formatTime: () => '00:00',
    });
    render(<DayTimer timer={timer} />);
    expect(screen.getByLabelText('reset timer')).toBeInTheDocument();
  });

  it('has accessible aria-label on container', () => {
    const timer = createMockTimer();
    render(<DayTimer timer={timer} />);
    expect(screen.getByLabelText('Day phase timer')).toBeInTheDocument();
  });

  it('timer display uses correct MM:SS formatting', () => {
    const timer = createMockTimer({
      isRunning: true,
      timeRemaining: 65,
      totalDuration: 300,
      formatTime: () => '01:05',
    });
    render(<DayTimer timer={timer} />);
    expect(screen.getByText('01:05')).toBeInTheDocument();
  });
});
