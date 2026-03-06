import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import LightModeIcon from '@mui/icons-material/LightMode';
import NightlightRoundIcon from '@mui/icons-material/NightlightRound';

/** Phase metadata: label, icon, and background colour. */
const PHASE_CONFIG = [
  {
    phase: 'Day' as const,
    label: 'Day',
    icon: <LightModeIcon fontSize="small" />,
    color: '#fdd835',
  },
  {
    phase: 'Night' as const,
    label: 'Night',
    icon: <NightlightRoundIcon fontSize="small" />,
    color: '#1a237e',
  },
] as const;

export interface PhaseBarProps {
  /** Which view is currently displayed (controls visual active chip) */
  activeView: 'Day' | 'Night';
  /** Whether a night is in progress (shows badge dot on Night chip) */
  nightInProgress: boolean;
  /** Called when the user clicks the Day chip */
  onDayClick: () => void;
  /** Called when the user clicks the Night chip */
  onNightClick: () => void;
}

/**
 * Horizontal stepper showing the 2 game phases: Day ↔ Night.
 *
 * Pure presentation + callback component — no dialog, no state management.
 * The parent (GameViewPage) controls phase switching and view mode.
 */
export function PhaseBar({ activeView, nightInProgress, onDayClick, onNightClick }: PhaseBarProps) {
  const handleChipClick = (phase: 'Day' | 'Night') => {
    if (phase === 'Day') {
      onDayClick();
    } else {
      onNightClick();
    }
  };

  return (
    <Box
      aria-label="Game phase selector"
      role="navigation"
      sx={{
        display: 'flex',
        justifyContent: 'center',
        gap: 0.5,
        py: 1,
        px: 1,
        bgcolor: 'grey.100',
        borderBottom: 1,
        borderColor: 'divider',
        overflowX: 'auto',
      }}
    >
      {PHASE_CONFIG.map(({ phase, label, icon, color }) => {
        const isActive = phase === activeView;
        const textColor = phase === 'Day' ? 'rgba(0,0,0,0.87)' : '#fff';
        const showDot = phase === 'Night' && nightInProgress && activeView !== 'Night';

        return (
          <Box key={phase} sx={{ position: 'relative', display: 'inline-flex' }}>
            <Chip
              icon={icon}
              label={label}
              onClick={() => handleChipClick(phase)}
              sx={{
                fontWeight: isActive ? 700 : 400,
                bgcolor: isActive ? color : 'grey.300',
                color: isActive ? textColor : 'text.secondary',
                border: isActive ? `2px solid ${color}` : '2px solid transparent',
                opacity: isActive ? 1 : 0.7,
                transition: 'all 0.2s ease',
                '& .MuiChip-icon': {
                  color: isActive ? textColor : 'text.secondary',
                },
                cursor: 'pointer',
                minWidth: 72,
              }}
            />
            {showDot && (
              <Box
                data-testid="night-in-progress-dot"
                sx={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: '#ff5722',
                }}
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
}
