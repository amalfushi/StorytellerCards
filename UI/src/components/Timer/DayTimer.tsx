import { useState, useEffect, useRef, useCallback } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import type { UseTimerReturn } from '@/hooks/useTimer.ts';
import { playAlarmBeeps } from '@/utils/audioAlarm.ts';

// ──────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────

export interface DayTimerProps {
  /** Timer state + controls from the useTimer hook (lifted to parent). */
  timer: UseTimerReturn;
}

// ──────────────────────────────────────────────
// Duration presets (minutes)
// ──────────────────────────────────────────────

const PRESETS = [3, 5, 7, 10, 15] as const;

// ──────────────────────────────────────────────
// Colour helpers
// ──────────────────────────────────────────────

/** Get the progress bar colour based on remaining percentage. */
function timerColor(pct: number, expired: boolean): string {
  if (expired) return '#d32f2f'; // red
  if (pct < 25) return '#d32f2f'; // red — urgent
  if (pct < 50) return '#ff9800'; // amber/orange
  return '#4caf50'; // green
}

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────

/**
 * Day Timer panel — shows inside a Dialog / bottom-sheet.
 *
 * States:
 * 1. **Idle** — duration presets + custom input
 * 2. **Running** — countdown, progress bar, pause button
 * 3. **Paused** — paused time, resume + reset buttons
 * 4. **Expired** — "00:00" flashing red, alarm, dismiss button
 */
export function DayTimer({ timer }: DayTimerProps) {
  const {
    timeRemaining,
    totalDuration,
    isRunning,
    isPaused,
    isExpired,
    start,
    pause,
    resume,
    reset,
    formatTime,
  } = timer;

  // ── Custom duration input ──
  const [customMinutes, setCustomMinutes] = useState('');

  // ── Alarm management ──
  const alarmRef = useRef<{ stop: () => void } | null>(null);
  const [alarmDismissed, setAlarmDismissed] = useState(false);
  const alarmActive = isExpired && !alarmDismissed;

  // Start alarm when timer expires
  useEffect(() => {
    if (isExpired && !alarmRef.current) {
      alarmRef.current = playAlarmBeeps();
    }
  }, [isExpired]);

  // Clean up alarm on unmount
  useEffect(() => {
    return () => {
      alarmRef.current?.stop();
      alarmRef.current = null;
    };
  }, []);

  const dismissAlarm = useCallback(() => {
    alarmRef.current?.stop();
    alarmRef.current = null;
    setAlarmDismissed(true);
  }, []);

  const handleReset = useCallback(() => {
    alarmRef.current?.stop();
    alarmRef.current = null;
    setAlarmDismissed(false);
    reset();
  }, [reset]);

  const handleStart = useCallback(
    (minutes: number) => {
      alarmRef.current?.stop();
      alarmRef.current = null;
      setAlarmDismissed(false);
      start(minutes * 60);
    },
    [start],
  );

  const handleCustomStart = useCallback(() => {
    const mins = parseFloat(customMinutes);
    if (!Number.isFinite(mins) || mins <= 0) return;
    handleStart(mins);
    setCustomMinutes('');
  }, [customMinutes, handleStart]);

  // ── Derived values ──
  const pct = totalDuration > 0 ? (timeRemaining / totalDuration) * 100 : 0;
  const color = timerColor(pct, isExpired);
  const isIdle = !isRunning && !isPaused && !isExpired;

  return (
    <Box sx={{ p: 2, minWidth: 300 }} aria-label="Day phase timer">
      {/* ── Idle state: presets + custom ── */}
      {isIdle && (
        <Stack spacing={2} alignItems="center">
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            ⏱ Day Discussion Timer
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Choose a duration:
          </Typography>

          <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center">
            {PRESETS.map((m) => (
              <Chip
                key={m}
                label={`${m} min`}
                onClick={() => handleStart(m)}
                color="primary"
                variant="outlined"
                clickable
                sx={{ fontWeight: 'bold', fontSize: '0.9rem', px: 1 }}
              />
            ))}
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              label="Custom (min)"
              type="number"
              size="small"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCustomStart();
              }}
              slotProps={{
                htmlInput: { min: 0.5, max: 60, step: 0.5 },
              }}
              sx={{ width: 120 }}
            />
            <Button
              variant="contained"
              size="small"
              onClick={handleCustomStart}
              disabled={!customMinutes}
              startIcon={<PlayArrowIcon />}
            >
              Start
            </Button>
          </Stack>
        </Stack>
      )}

      {/* ── Running / Paused / Expired state ── */}
      {!isIdle && (
        <Stack spacing={2} alignItems="center">
          {/* Time display */}
          <Typography
            variant="h2"
            component="div"
            aria-live="polite"
            aria-label={`Time remaining: ${formatTime()}`}
            sx={{
              fontWeight: 'bold',
              fontFamily: '"Roboto Mono", monospace',
              color,
              textAlign: 'center',
              // Flashing effect when expired
              ...(isExpired && {
                animation: 'timerFlash 0.6s ease-in-out infinite',
                '@keyframes timerFlash': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.2 },
                },
              }),
            }}
          >
            {formatTime()}
          </Typography>

          {/* Status label */}
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            {isRunning && 'Running…'}
            {isPaused && 'Paused'}
            {isExpired && (alarmActive ? '⏰ Time\u2019s up!' : 'Expired')}
          </Typography>

          {/* Progress bar */}
          <LinearProgress
            variant="determinate"
            value={pct}
            sx={{
              width: '100%',
              height: 8,
              borderRadius: 4,
              backgroundColor: 'rgba(0,0,0,0.1)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: color,
                borderRadius: 4,
                transition: 'transform 1s linear',
              },
            }}
          />

          {/* Controls */}
          <Stack direction="row" spacing={1} justifyContent="center">
            {isRunning && (
              <IconButton onClick={pause} color="warning" size="large" aria-label="pause timer">
                <PauseIcon fontSize="large" />
              </IconButton>
            )}

            {isPaused && (
              <>
                <IconButton onClick={resume} color="success" size="large" aria-label="resume timer">
                  <PlayArrowIcon fontSize="large" />
                </IconButton>
                <IconButton
                  onClick={handleReset}
                  color="default"
                  size="large"
                  aria-label="reset timer"
                >
                  <RestartAltIcon fontSize="large" />
                </IconButton>
              </>
            )}

            {isExpired && (
              <>
                {alarmActive && (
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<NotificationsOffIcon />}
                    onClick={dismissAlarm}
                    size="large"
                  >
                    Dismiss Alarm
                  </Button>
                )}
                <IconButton
                  onClick={handleReset}
                  color="default"
                  size="large"
                  aria-label="reset timer"
                >
                  <RestartAltIcon fontSize="large" />
                </IconButton>
              </>
            )}
          </Stack>
        </Stack>
      )}
    </Box>
  );
}
