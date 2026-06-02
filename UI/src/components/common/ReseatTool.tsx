import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import type { PlayerSeat } from '@/types/index.ts';

export interface ReseatToolProps {
  open: boolean;
  players: Pick<PlayerSeat, 'seat' | 'playerName'>[];
  initialSeat?: number | null;
  onClose: () => void;
  onConfirmSwap: (seatA: number, seatB: number) => void;
}

function getPlayerLabel(player: Pick<PlayerSeat, 'seat' | 'playerName'>): string {
  return player.playerName.trim() || `Seat ${player.seat}`;
}

export function ReseatTool({
  open,
  players,
  initialSeat = null,
  onClose,
  onConfirmSwap,
}: ReseatToolProps) {
  return (
    <ReseatToolContent
      key={`${open ? 'open' : 'closed'}-${initialSeat ?? 'none'}`}
      open={open}
      players={players}
      initialSeat={initialSeat}
      onClose={onClose}
      onConfirmSwap={onConfirmSwap}
    />
  );
}

function ReseatToolContent({
  open,
  players,
  initialSeat,
  onClose,
  onConfirmSwap,
}: Required<ReseatToolProps>) {
  const sortedPlayers = useMemo(() => [...players].sort((a, b) => a.seat - b.seat), [players]);
  const [firstSeat, setFirstSeat] = useState<number | null>(initialSeat);
  const [secondSeat, setSecondSeat] = useState<number | null>(null);

  const firstPlayer = sortedPlayers.find((player) => player.seat === firstSeat) ?? null;
  const secondPlayer = sortedPlayers.find((player) => player.seat === secondSeat) ?? null;

  const instruction = firstPlayer ? 'Tap second player' : 'Tap first player';
  const preview =
    firstPlayer && secondPlayer
      ? `${getPlayerLabel(firstPlayer)} (seat ${firstPlayer.seat}) ⇄ ${getPlayerLabel(secondPlayer)} (seat ${secondPlayer.seat})`
      : null;

  const handlePlayerClick = (seat: number) => {
    if (firstSeat === null) {
      setFirstSeat(seat);
      return;
    }
    if (seat === firstSeat) {
      setFirstSeat(null);
      setSecondSeat(null);
      return;
    }
    setSecondSeat(seat);
  };

  const handleConfirm = () => {
    if (firstSeat === null || secondSeat === null) return;
    onConfirmSwap(firstSeat, secondSeat);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="reseat-tool-title"
    >
      <DialogTitle id="reseat-tool-title">Reseat players</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {instruction}. Pick two players to swap their seats while keeping character and status
          data attached to each player.
        </Typography>

        {preview ? (
          <Chip
            icon={<SwapHorizIcon />}
            color="primary"
            label={preview}
            data-testid="reseat-preview"
          />
        ) : (
          <Chip
            label={firstPlayer ? `${getPlayerLabel(firstPlayer)} selected` : 'No player selected'}
          />
        )}

        <Grid container spacing={1}>
          {sortedPlayers.map((player) => {
            const selected = player.seat === firstSeat || player.seat === secondSeat;
            return (
              <Grid key={player.seat} size={{ xs: 6, sm: 4 }}>
                <Button
                  variant={selected ? 'contained' : 'outlined'}
                  color={player.seat === firstSeat ? 'primary' : 'inherit'}
                  fullWidth
                  onClick={() => handlePlayerClick(player.seat)}
                >
                  <Box sx={{ textAlign: 'left', width: '100%' }}>
                    <Typography variant="caption" component="div">
                      Seat {player.seat}
                    </Typography>
                    <Typography variant="body2" noWrap>
                      {getPlayerLabel(player)}
                    </Typography>
                  </Box>
                </Button>
              </Grid>
            );
          })}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleConfirm} disabled={!preview}>
          Confirm swap
        </Button>
      </DialogActions>
    </Dialog>
  );
}
