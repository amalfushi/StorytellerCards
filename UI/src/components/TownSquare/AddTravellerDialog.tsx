import { useState, useMemo } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import type { PlayerSeat } from '@/types/index.ts';

export interface AddTravellerDialogProps {
  open: boolean;
  existingPlayers: PlayerSeat[];
  onClose: () => void;
  onAdd: (
    seat: number,
    playerName: string,
    characterId: string,
    alignment: 'Good' | 'Evil',
  ) => void;
}

/**
 * Dialog for adding a Traveller to the game.
 *
 * Fields: character name (free text), player name, seat number, alignment.
 * The seat number auto-suggests the next available seat.
 */
export function AddTravellerDialog({
  open,
  existingPlayers,
  onClose,
  onAdd,
}: AddTravellerDialogProps) {
  const nextSeat = useMemo(() => {
    if (existingPlayers.length === 0) return 1;
    const usedSeats = new Set(existingPlayers.map((p) => p.seat));
    let candidate = 1;
    while (usedSeats.has(candidate)) candidate++;
    return candidate;
  }, [existingPlayers]);

  const [characterName, setCharacterName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [seat, setSeat] = useState(nextSeat);
  const [alignment, setAlignment] = useState<'Good' | 'Evil'>('Good');

  const canSave = characterName.trim().length > 0 && playerName.trim().length > 0 && seat > 0;

  const handleConfirm = () => {
    if (!canSave) return;
    // Use a simple id derived from the character name (lowercase, no spaces)
    const characterId = characterName.trim().toLowerCase().replace(/\s+/g, '');
    onAdd(seat, playerName.trim(), characterId, alignment);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Add Traveller</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        <TextField
          label="Traveller Character Name"
          value={characterName}
          onChange={(e) => setCharacterName(e.target.value)}
          size="small"
          fullWidth
          autoFocus
          sx={{ mt: 1 }}
          helperText="e.g. Scapegoat, Gunslinger…"
        />
        <TextField
          label="Player Name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          size="small"
          fullWidth
        />
        <TextField
          label="Seat Number"
          type="number"
          value={seat}
          onChange={(e) => setSeat(Number(e.target.value))}
          size="small"
          fullWidth
          inputProps={{ min: 1, max: 50 }}
        />
        <FormControl fullWidth size="small">
          <InputLabel id="traveller-alignment-label">Alignment (secret)</InputLabel>
          <Select
            labelId="traveller-alignment-label"
            value={alignment}
            label="Alignment (secret)"
            onChange={(e) => setAlignment(e.target.value as 'Good' | 'Evil')}
          >
            <MenuItem value="Good">Good</MenuItem>
            <MenuItem value="Evil">Evil</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleConfirm} variant="contained" disabled={!canSave}>
          Add Traveller
        </Button>
      </DialogActions>
    </Dialog>
  );
}
