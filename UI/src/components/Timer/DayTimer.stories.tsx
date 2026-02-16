import type { Meta, StoryObj } from '@storybook/react-vite';
import { DayTimer } from './DayTimer';
import type { UseTimerReturn } from '@/hooks/useTimer';

// ──────────────────────────────────────────────
// Helper: build a mock timer with sensible defaults
// ──────────────────────────────────────────────

const noop = () => {};

function mockTimer(overrides: Partial<UseTimerReturn> = {}): UseTimerReturn {
  const timeRemaining = overrides.timeRemaining ?? 0;
  const mins = Math.floor(timeRemaining / 60);
  const secs = timeRemaining % 60;
  const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return {
    timeRemaining,
    totalDuration: overrides.totalDuration ?? 0,
    isRunning: false,
    isPaused: false,
    isExpired: false,
    start: noop,
    pause: noop,
    resume: noop,
    reset: noop,
    formatTime: () => formatted,
    ...overrides,
  };
}

// ──────────────────────────────────────────────
// Meta
// ──────────────────────────────────────────────

const meta: Meta<typeof DayTimer> = {
  title: 'Timer/DayTimer',
  component: DayTimer,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 360, border: '1px solid #ccc', borderRadius: 16 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof DayTimer>;

// ──────────────────────────────────────────────
// Stories
// ──────────────────────────────────────────────

/** Initial state — shows duration presets and custom input. */
export const Idle: Story = {
  args: {
    timer: mockTimer(),
  },
};

/** Timer running at 3:45 with > 50 % remaining — green progress bar. */
export const Running: Story = {
  args: {
    timer: mockTimer({
      timeRemaining: 225, // 3:45
      totalDuration: 300, // 5:00
      isRunning: true,
    }),
  },
};

/** Timer running at 0:45 with < 25 % remaining — red progress bar (urgent). */
export const RunningUrgent: Story = {
  args: {
    timer: mockTimer({
      timeRemaining: 45, // 0:45
      totalDuration: 300, // 5:00
      isRunning: true,
    }),
  },
};

/** Timer paused at 2:30. */
export const Paused: Story = {
  args: {
    timer: mockTimer({
      timeRemaining: 150, // 2:30
      totalDuration: 300, // 5:00
      isPaused: true,
    }),
  },
};

/** Timer expired at 0:00 — flashing red. (Alarm won't play in Storybook.) */
export const Expired: Story = {
  args: {
    timer: mockTimer({
      timeRemaining: 0,
      totalDuration: 300,
      isExpired: true,
    }),
  },
};
