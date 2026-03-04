import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { playAlarmBeeps } from './audioAlarm.ts';

describe('playAlarmBeeps', () => {
  // A single shared mock context that the constructor always returns
  const mockContext = {
    createOscillator: vi.fn(() => ({
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      frequency: { setValueAtTime: vi.fn() },
      type: '',
    })),
    createGain: vi.fn(() => ({
      connect: vi.fn(),
      gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
    })),
    destination: {},
    currentTime: 0,
    close: vi.fn(() => Promise.resolve()),
  };

  beforeEach(() => {
    vi.useFakeTimers();
    // Reset all call counts on the shared mock
    mockContext.createOscillator.mockClear();
    mockContext.createGain.mockClear();
    mockContext.close.mockClear();
    // Use a class-style constructor so `new` works properly
    vi.stubGlobal(
      'AudioContext',
      vi.fn(function (this: typeof mockContext) {
        return Object.assign(this, mockContext);
      }),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('is a callable function', () => {
    expect(typeof playAlarmBeeps).toBe('function');
  });

  it('creates AudioContext when called', () => {
    const handle = playAlarmBeeps();
    expect(AudioContext).toHaveBeenCalled();
    handle.stop();
  });

  it('returns a handle with a stop method', () => {
    const handle = playAlarmBeeps();
    expect(handle).toBeDefined();
    expect(typeof handle.stop).toBe('function');
    handle.stop();
  });

  it('creates oscillators and gain nodes for beeps', () => {
    const handle = playAlarmBeeps();
    // loop() runs immediately and schedules 2 groups of 3 beeps = 6 beeps
    expect(mockContext.createOscillator).toHaveBeenCalled();
    expect(mockContext.createGain).toHaveBeenCalled();
    expect(mockContext.createOscillator).toHaveBeenCalledTimes(6);
    expect(mockContext.createGain).toHaveBeenCalledTimes(6);
    handle.stop();
  });

  it('stop() closes the AudioContext', () => {
    const handle = playAlarmBeeps();
    handle.stop();
    expect(mockContext.close).toHaveBeenCalled();
  });

  it('stop() can be called multiple times without error', () => {
    const handle = playAlarmBeeps();
    handle.stop();
    expect(() => handle.stop()).not.toThrow();
  });

  it('handles missing AudioContext gracefully (no-throw)', () => {
    vi.stubGlobal(
      'AudioContext',
      vi.fn(function () {
        throw new Error('AudioContext not available');
      }),
    );
    const handle = playAlarmBeeps();
    expect(handle).toBeDefined();
    expect(typeof handle.stop).toBe('function');
    // stop should be a no-op and not throw
    expect(() => handle.stop()).not.toThrow();
  });

  it('schedules repeating pattern via setTimeout', () => {
    const handle = playAlarmBeeps();
    // The loop function should have scheduled a setTimeout for the next cycle
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    handle.stop();
  });

  it('stop() clears pending timeouts', () => {
    const handle = playAlarmBeeps();
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    handle.stop();
    expect(vi.getTimerCount()).toBe(0);
  });
});
