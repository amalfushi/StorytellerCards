import { useMemo } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import type { PlayerSeat, CharacterDef } from '@/types/index.ts';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export type NightChoiceType =
  | 'player'
  | 'livingPlayer'
  | 'deadPlayer'
  | 'character'
  | 'alignment'
  | 'yesno';

export interface NightChoiceSelectorProps {
  type: NightChoiceType;
  multiple?: boolean;
  maxSelections?: number;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  players: PlayerSeat[];
  characters?: CharacterDef[];
  previousValue?: string | string[];
  label?: string;
  readOnly?: boolean;
}

// ──────────────────────────────────────────────
// Helper: parse helpText to detect choice type
// ──────────────────────────────────────────────

export interface ParsedChoice {
  type: NightChoiceType;
  multiple: boolean;
  maxSelections: number;
  label: string;
}

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────

/**
 * Reusable night-phase choice dropdown/toggle. Renders the appropriate control
 * based on `type`:
 * - player/livingPlayer/deadPlayer → dropdown of players
 * - character → dropdown of script characters
 * - alignment → Good/Evil toggle
 * - yesno → Nod/Shake toggle
 */
export function NightChoiceSelector({
  type,
  multiple = false,
  maxSelections,
  value,
  onChange,
  players,
  characters = [],
  previousValue,
  label = 'Choose',
  readOnly = false,
}: NightChoiceSelectorProps) {
  // Build player options filtered by type
  const playerOptions = useMemo(() => {
    switch (type) {
      case 'livingPlayer':
        return players.filter((p) => p.alive);
      case 'deadPlayer':
        return players.filter((p) => !p.alive);
      case 'player':
        return players;
      default:
        return [];
    }
  }, [players, type]);

  const isPlayerType = type === 'player' || type === 'livingPlayer' || type === 'deadPlayer';

  // Previous value display
  const prevDisplay = previousValue
    ? Array.isArray(previousValue)
      ? previousValue.join(', ')
      : previousValue
    : null;

  return (
    <Box sx={{ mt: 1.5 }}>
      {/* Previous value chip */}
      {prevDisplay && (
        <Chip
          label={`Last night: ${prevDisplay}`}
          size="small"
          sx={{
            mb: 1,
            bgcolor: 'rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.45)',
            fontStyle: 'italic',
            fontSize: '0.75rem',
          }}
        />
      )}

      {/* ── Player dropdown ── */}
      {isPlayerType && !multiple && (
        <FormControl fullWidth size="small" disabled={readOnly}>
          <InputLabel id="night-choice-label" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            {label}
          </InputLabel>
          <Select
            labelId="night-choice-label"
            value={typeof value === 'string' ? value : ''}
            label={label}
            onChange={(e) => onChange(e.target.value)}
            sx={{
              color: 'rgba(255,255,255,0.9)',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255,255,255,0.2)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255,255,255,0.4)',
              },
            }}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {playerOptions.map((p) => (
              <MenuItem key={p.seat} value={p.playerName}>
                {p.playerName} (Seat {p.seat})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {/* ── Multiple player autocomplete ── */}
      {isPlayerType && multiple && (
        <Autocomplete
          multiple
          disabled={readOnly}
          options={playerOptions.map((p) => p.playerName)}
          value={Array.isArray(value) ? value : []}
          onChange={(_, newValue) => {
            if (maxSelections && newValue.length > maxSelections) return;
            onChange(newValue);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={label}
              size="small"
              sx={{
                '& .MuiInputBase-root': { color: 'rgba(255,255,255,0.9)' },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255,255,255,0.2)',
                },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
              }}
            />
          )}
          renderTags={(tagValue, getTagProps) =>
            tagValue.map((option, index) => {
              const { key, ...chipProps } = getTagProps({ index });
              return (
                <Chip
                  key={key}
                  label={option}
                  size="small"
                  {...chipProps}
                  sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.15)' }}
                />
              );
            })
          }
        />
      )}

      {/* ── Character dropdown ── */}
      {type === 'character' && (
        <FormControl fullWidth size="small" disabled={readOnly}>
          <InputLabel id="night-choice-char-label" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            {label}
          </InputLabel>
          <Select
            labelId="night-choice-char-label"
            value={typeof value === 'string' ? value : ''}
            label={label}
            onChange={(e) => onChange(e.target.value)}
            sx={{
              color: 'rgba(255,255,255,0.9)',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255,255,255,0.2)',
              },
            }}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {characters.map((c) => (
              <MenuItem key={c.id} value={c.name}>
                {c.name} ({c.type})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {/* ── Alignment toggle ── */}
      {type === 'alignment' && (
        <Box>
          <Typography
            variant="caption"
            sx={{ color: 'rgba(255,255,255,0.5)', mb: 0.5, display: 'block' }}
          >
            {label}
          </Typography>
          <ToggleButtonGroup
            value={typeof value === 'string' ? value : ''}
            exclusive
            onChange={(_, val) => {
              if (val !== null && !readOnly) onChange(val);
            }}
            size="small"
            fullWidth
          >
            <ToggleButton value="Good" sx={{ color: '#42a5f5' }}>
              Good
            </ToggleButton>
            <ToggleButton value="Evil" sx={{ color: '#ef5350' }}>
              Evil
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}

      {/* ── Yes/No toggle ── */}
      {type === 'yesno' && (
        <Box>
          <Typography
            variant="caption"
            sx={{ color: 'rgba(255,255,255,0.5)', mb: 0.5, display: 'block' }}
          >
            {label}
          </Typography>
          <ToggleButtonGroup
            value={typeof value === 'string' ? value : ''}
            exclusive
            onChange={(_, val) => {
              if (val !== null && !readOnly) onChange(val);
            }}
            size="small"
            fullWidth
          >
            <ToggleButton value="Nod" sx={{ color: '#66bb6a' }}>
              👍 Nod (Yes)
            </ToggleButton>
            <ToggleButton value="Shake" sx={{ color: '#ef5350' }}>
              👎 Shake (No)
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}
    </Box>
  );
}
