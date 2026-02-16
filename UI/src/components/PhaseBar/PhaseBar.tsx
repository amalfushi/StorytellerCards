import { useState } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import WbTwilightIcon from '@mui/icons-material/WbTwilight';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import NightlightRoundIcon from '@mui/icons-material/NightlightRound';
import { Phase } from '@/types/index.ts';
import { useGame } from '@/context/GameContext.tsx';

/** Phase metadata: label, icon, and background colour. */
const PHASE_CONFIG = [
  { phase: Phase.Dawn, label: 'Dawn', icon: <WbTwilightIcon fontSize="small" />, color: '#ff8f00' },
  { phase: Phase.Day, label: 'Day', icon: <LightModeIcon fontSize="small" />, color: '#fdd835' },
  { phase: Phase.Dusk, label: 'Dusk', icon: <DarkModeIcon fontSize="small" />, color: '#7b1fa2' },
  {
    phase: Phase.Night,
    label: 'Night',
    icon: <NightlightRoundIcon fontSize="small" />,
    color: '#1a237e',
  },
] as const;

/**
 * Horizontal stepper showing the 4 game phases: Dawn → Day → Dusk → Night.
 * Tapping a phase opens a confirmation dialog before advancing.
 *
 * - Dusk → Night triggers `START_NIGHT` on GameContext.
 * - Night → Dawn is NOT handled here (that's the "Complete Night" flow).
 */
export function PhaseBar() {
  const { state, setPhase, startNight } = useGame();
  const [pendingPhase, setPendingPhase] = useState<Phase | null>(null);

  const currentPhase = state.game?.currentPhase ?? Phase.Dawn;

  const handleChipClick = (targetPhase: Phase) => {
    if (targetPhase === currentPhase) return;

    // Block advancing from Night — that requires the Complete Night flow
    if (currentPhase === Phase.Night && targetPhase === Phase.Dawn) return;

    setPendingPhase(targetPhase);
  };

  const confirmAdvance = () => {
    if (!pendingPhase) return;

    // When moving to Night phase, also trigger START_NIGHT
    if (pendingPhase === Phase.Night) {
      // We need to know how many night order cards there are —
      // the parent / night order hook will handle exact count.
      // For now we set phase first; the night overlay (Phase 4) will call startNight with the real count.
      setPhase(pendingPhase);
      startNight(0); // Placeholder — Phase 4 will supply the real totalCards value
    } else {
      setPhase(pendingPhase);
    }

    setPendingPhase(null);
  };

  const cancelAdvance = () => {
    setPendingPhase(null);
  };

  return (
    <>
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
          const isActive = phase === currentPhase;
          const textColor = phase === Phase.Day ? 'rgba(0,0,0,0.87)' : '#fff';

          return (
            <Chip
              key={phase}
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
                cursor: phase === currentPhase ? 'default' : 'pointer',
                minWidth: 72,
              }}
            />
          );
        })}
      </Box>

      {/* Confirmation dialog */}
      <Dialog open={pendingPhase !== null} onClose={cancelAdvance}>
        <DialogTitle>Change Phase</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Advance from <strong>{currentPhase}</strong> to <strong>{pendingPhase}</strong>?
            {pendingPhase === Phase.Night && ' This will start the night phase.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelAdvance}>Cancel</Button>
          <Button onClick={confirmAdvance} variant="contained" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
