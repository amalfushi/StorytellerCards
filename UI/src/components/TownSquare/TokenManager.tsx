import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { PlayerSeat, PlayerToken } from '@/types/index.ts';
import { generateId } from '@/utils/idGenerator.ts';

export interface TokenManagerProps {
  open: boolean;
  player: PlayerSeat | null;
  onClose: () => void;
  onAddToken: (seat: number, token: PlayerToken) => void;
  onRemoveToken: (seat: number, tokenId: string) => void;
}

/**
 * Dialog to add/remove status tokens (Drunk, Poisoned, custom) from a player.
 */
export function TokenManager({
  open,
  player,
  onClose,
  onAddToken,
  onRemoveToken,
}: TokenManagerProps) {
  const [customLabel, setCustomLabel] = useState('');

  if (!player) return null;

  const tokens = player.tokens ?? [];

  const handleAddPreset = (type: 'drunk' | 'poisoned', label: string, color: string) => {
    onAddToken(player.seat, {
      id: generateId(),
      type,
      label,
      color,
    });
  };

  const handleAddCustom = () => {
    if (!customLabel.trim()) return;
    onAddToken(player.seat, {
      id: generateId(),
      type: 'custom',
      label: customLabel.trim(),
      color: '#ff9800',
    });
    setCustomLabel('');
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>
        <Typography component="span" variant="h6">
          Tokens — {player.playerName} (Seat {player.seat})
        </Typography>
      </DialogTitle>
      <DialogContent>
        {/* Current tokens */}
        {tokens.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Active Tokens
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {tokens.map((t) => (
                <Chip
                  key={t.id}
                  label={t.label}
                  size="small"
                  onDelete={() => onRemoveToken(player.seat, t.id)}
                  sx={{
                    bgcolor: t.color ?? '#9e9e9e',
                    color: '#fff',
                    fontWeight: 600,
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Preset buttons */}
        <Typography variant="subtitle2" gutterBottom>
          Add Token
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleAddPreset('drunk', 'Drunk', '#7b1fa2')}
            sx={{ textTransform: 'none' }}
          >
            🍺 Drunk
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleAddPreset('poisoned', 'Poisoned', '#388e3c')}
            sx={{ textTransform: 'none' }}
          >
            ☠️ Poisoned
          </Button>
        </Box>

        {/* Custom token input */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField
            label="Custom token"
            size="small"
            fullWidth
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddCustom();
            }}
          />
          <Button
            variant="contained"
            size="small"
            onClick={handleAddCustom}
            disabled={!customLabel.trim()}
          >
            Add
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
