import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { PlayerSeat } from '@/types/index.ts';

type ShiftMode = 'add-player' | 'shift-all' | 'insert-empty';

export interface ShiftSeatsDialogProps {
  open: boolean;
  players: Pick<PlayerSeat, 'seat' | 'playerName'>[];
  onClose: () => void;
  onAddPlayerAtSeat: (seat: number, playerName: string) => void;
  onShiftSeats: (startSeat: number, shiftBy: number) => void;
  onInsertEmptySeat: (seat: number) => void;
}

function clampSeat(value: number, maxSeat: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(Math.max(1, Math.trunc(value)), maxSeat);
}

export function ShiftSeatsDialog({
  open,
  players,
  onClose,
  onAddPlayerAtSeat,
  onShiftSeats,
  onInsertEmptySeat,
}: ShiftSeatsDialogProps) {
  const maxExistingSeat = useMemo(
    () => Math.max(1, ...players.map((player) => player.seat)),
    [players],
  );
  const maxInsertSeat = maxExistingSeat + 1;
  const [mode, setMode] = useState<ShiftMode>('add-player');
  const [seat, setSeat] = useState(1);
  const [shiftBy, setShiftBy] = useState(1);
  const [playerName, setPlayerName] = useState('New Player');

  const normalizedSeat = clampSeat(seat, mode === 'shift-all' ? maxExistingSeat : maxInsertSeat);
  const normalizedShiftBy = Number.isFinite(shiftBy) ? Math.trunc(shiftBy) : 1;

  const preview = (() => {
    if (mode === 'add-player') {
      return `Add ${playerName || 'New Player'} at seat ${normalizedSeat}; shift seats ${normalizedSeat}+ outward by 1.`;
    }
    if (mode === 'insert-empty') {
      return `Insert an empty seat at position ${normalizedSeat}; shift seats ${normalizedSeat}+ outward by 1.`;
    }
    return `Shift everyone clockwise by ${normalizedShiftBy} seat${Math.abs(normalizedShiftBy) === 1 ? '' : 's'}.`;
  })();

  const handleConfirm = () => {
    if (mode === 'add-player') {
      onAddPlayerAtSeat(normalizedSeat, playerName || `Player ${normalizedSeat}`);
    } else if (mode === 'insert-empty') {
      onInsertEmptySeat(normalizedSeat);
    } else {
      onShiftSeats(1, normalizedShiftBy);
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      aria-labelledby="shift-seats-title"
    >
      <DialogTitle id="shift-seats-title">Shift / Insert seats</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Stack spacing={1}>
          <Button
            variant={mode === 'add-player' ? 'contained' : 'outlined'}
            onClick={() => setMode('add-player')}
          >
            Add player at seat X
          </Button>
          <Button
            variant={mode === 'shift-all' ? 'contained' : 'outlined'}
            onClick={() => setMode('shift-all')}
          >
            Shift everyone clockwise by N
          </Button>
          <Button
            variant={mode === 'insert-empty' ? 'contained' : 'outlined'}
            onClick={() => setMode('insert-empty')}
          >
            Insert empty seat at position X
          </Button>
        </Stack>

        <Divider />

        {mode === 'add-player' && (
          <TextField
            label="Player name"
            size="small"
            value={playerName}
            onChange={(event) => setPlayerName(event.target.value)}
            fullWidth
          />
        )}

        {mode === 'shift-all' ? (
          <TextField
            label="Seats clockwise"
            type="number"
            size="small"
            value={shiftBy}
            onChange={(event) => setShiftBy(Number(event.target.value))}
            fullWidth
          />
        ) : (
          <TextField
            label="Seat position"
            type="number"
            size="small"
            value={seat}
            onChange={(event) => setSeat(Number(event.target.value))}
            slotProps={{ htmlInput: { min: 1, max: maxInsertSeat } }}
            fullWidth
          />
        )}

        <Box sx={{ bgcolor: 'action.hover', borderRadius: 1, p: 1.5 }}>
          <Typography variant="subtitle2" component="div">
            Preview
          </Typography>
          <Typography variant="body2" data-testid="shift-preview">
            {preview}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={mode === 'shift-all' && normalizedShiftBy === 0}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
}
