import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import type { PlayerSeat, CharacterDef, Alignment } from '@/types/index.ts';

interface PlayerEditDialogProps {
  open: boolean;
  player: PlayerSeat | null;
  scriptCharacters: CharacterDef[];
  onClose: () => void;
  onSave: (
    seat: number,
    updates: {
      characterId?: string;
      actualAlignment?: Alignment;
      visibleAlignment?: Alignment;
    },
  ) => void;
}

/**
 * Dialog for editing a player's character assignment, alignment, and reminders.
 * Opens when a player row is tapped in night/storyteller mode.
 */
export function PlayerEditDialog({
  open,
  player,
  scriptCharacters,
  onClose,
  onSave,
}: PlayerEditDialogProps) {
  const [characterId, setCharacterId] = useState(player?.characterId ?? '');
  const [actualAlignment, setActualAlignment] = useState<Alignment>(
    player?.actualAlignment ?? 'Unknown',
  );

  const handleSave = () => {
    if (!player) return;
    onSave(player.seat, {
      characterId,
      actualAlignment,
    });
    onClose();
  };

  if (!player) return null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Edit Player — Seat {player.seat}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        <Typography variant="subtitle1" fontWeight={600}>
          {player.playerName}
        </Typography>

        {/* Character assignment */}
        <FormControl fullWidth size="small" sx={{ mt: 1 }}>
          <InputLabel id="char-select-label">Character</InputLabel>
          <Select
            labelId="char-select-label"
            value={characterId}
            label="Character"
            onChange={(e) => setCharacterId(e.target.value)}
          >
            <MenuItem value="">
              <em>Unassigned</em>
            </MenuItem>
            {scriptCharacters.map((ch) => (
              <MenuItem key={ch.id} value={ch.id}>
                {ch.name} ({ch.type})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Alignment toggle */}
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Actual Alignment
          </Typography>
          <ToggleButtonGroup
            value={actualAlignment}
            exclusive
            onChange={(_, val) => {
              if (val !== null) setActualAlignment(val as Alignment);
            }}
            size="small"
            fullWidth
          >
            <ToggleButton value="Good" sx={{ color: '#1976d2' }}>
              Good
            </ToggleButton>
            <ToggleButton value="Evil" sx={{ color: '#b71c1c' }}>
              Evil
            </ToggleButton>
            <ToggleButton value="Unknown" sx={{ color: '#9e9e9e' }}>
              Unknown
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
