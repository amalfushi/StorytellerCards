// ──────────────────────────────────────────────
// Web Audio API alarm — generates attention-getting beeps
// without requiring any external audio files.
// ──────────────────────────────────────────────

interface AlarmHandle {
  /** Stop the alarm immediately and release audio resources. */
  stop: () => void;
}

/**
 * Plays a repeating alarm pattern: 3 short beeps, a pause, then 3 more beeps.
 * The pattern repeats until {@link AlarmHandle.stop} is called.
 *
 * Uses an 880 Hz sine wave (A5) — pleasant but attention-getting.
 * Each beep is 200 ms on, 100 ms off. The gap between groups is 600 ms.
 *
 * @returns A handle with a `stop()` method to silence the alarm.
 */
export function playAlarmBeeps(): AlarmHandle {
  let stopped = false;
  let ctx: AudioContext | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  // Lazily create the AudioContext (required for Web Audio API)
  try {
    ctx = new AudioContext();
  } catch {
    // AudioContext not available (e.g. SSR or very old browser)
    return { stop: () => {} };
  }

  const FREQ = 880; // Hz — A5
  const BEEP_ON = 0.2; // seconds
  const BEEP_OFF = 0.1; // seconds
  const GROUP_GAP = 0.6; // seconds between groups
  const BEEPS_PER_GROUP = 3;

  /** Schedule a single beep at the given AudioContext time. */
  function scheduleBeep(audioCtx: AudioContext, startTime: number): void {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(FREQ, startTime);
    gain.gain.setValueAtTime(0.5, startTime);

    // Fade out slightly before stopping to avoid clicks
    gain.gain.setValueAtTime(0.5, startTime + BEEP_ON - 0.02);
    gain.gain.linearRampToValueAtTime(0, startTime + BEEP_ON);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(startTime);
    osc.stop(startTime + BEEP_ON);
  }

  /** Schedule one full group of beeps and return the duration consumed. */
  function scheduleGroup(audioCtx: AudioContext, groupStart: number): number {
    let t = groupStart;
    for (let i = 0; i < BEEPS_PER_GROUP; i++) {
      scheduleBeep(audioCtx, t);
      t += BEEP_ON + BEEP_OFF;
    }
    return t - groupStart;
  }

  /** Kick off the repeating pattern. */
  function loop() {
    if (stopped || !ctx) return;

    const now = ctx.currentTime;
    const groupDuration = scheduleGroup(ctx, now);
    // After the first group, schedule the second group
    scheduleGroup(ctx, now + groupDuration + GROUP_GAP);

    // Total cycle length: 2 groups + 2 gaps
    const cycleDuration = (groupDuration + GROUP_GAP) * 2;
    timeoutId = setTimeout(loop, cycleDuration * 1000);
  }

  // Start the first cycle
  loop();

  return {
    stop() {
      stopped = true;
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (ctx) {
        ctx.close().catch(() => {});
        ctx = null;
      }
    },
  };
}
