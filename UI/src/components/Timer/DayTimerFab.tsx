import { useState, useCallback } from 'react';
import Drawer from '@mui/material/Drawer';
import Fab from '@mui/material/Fab';
import TimerIcon from '@mui/icons-material/Timer';
import Typography from '@mui/material/Typography';
import type { UseTimerReturn } from '@/hooks/useTimer.ts';
import { DayTimer } from '@/components/Timer/DayTimer.tsx';

// ──────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────

export interface DayTimerFabProps {
  /** Timer state + controls from the useTimer hook (lifted to parent). */
  timer: UseTimerReturn;
}

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────

/**
 * Floating Action Button that:
 * - Shows a timer icon when idle
 * - Shows the remaining time (compact, e.g. "5:00") when running/paused
 * - Pulses red when expired
 * - Opens the {@link DayTimer} panel in a bottom-sheet Drawer on tap
 */
export function DayTimerFab({ timer }: DayTimerFabProps) {
  const [open, setOpen] = useState(false);

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);

  const { isRunning, isPaused, isExpired, formatTime } = timer;
  const isActive = isRunning || isPaused || isExpired;

  /** Compact time: strip the leading zero for the FAB label (e.g. "5:00" not "05:00"). */
  const compactTime = formatTime().replace(/^0/, '');

  return (
    <>
      <Fab
        size="medium"
        aria-label="day timer"
        onClick={handleOpen}
        sx={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          zIndex: 10,
          // Colour based on state
          bgcolor: isExpired ? 'error.main' : isActive ? 'success.main' : 'primary.main',
          color: '#fff',
          '&:hover': {
            bgcolor: isExpired ? 'error.dark' : isActive ? 'success.dark' : 'primary.dark',
          },
          // Pulsing animation when expired
          ...(isExpired && {
            animation: 'fabPulse 0.8s ease-in-out infinite',
            '@keyframes fabPulse': {
              '0%, 100%': { transform: 'scale(1)', opacity: 1 },
              '50%': { transform: 'scale(1.1)', opacity: 0.7 },
            },
          }),
          // Slightly wider when showing time text
          ...(isActive && {
            width: 'auto',
            minWidth: 56,
            borderRadius: '28px',
            px: 2,
          }),
        }}
      >
        {isActive ? (
          <Typography
            variant="body1"
            sx={{ fontWeight: 'bold', fontFamily: '"Roboto Mono", monospace', lineHeight: 1 }}
          >
            {compactTime}
          </Typography>
        ) : (
          <TimerIcon />
        )}
      </Fab>

      {/* Bottom-sheet Drawer containing the full DayTimer panel */}
      <Drawer
        anchor="bottom"
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: {
            sx: {
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              maxHeight: '70vh',
            },
          },
        }}
      >
        <DayTimer timer={timer} />
      </Drawer>
    </>
  );
}
