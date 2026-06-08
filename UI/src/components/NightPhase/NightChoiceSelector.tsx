import { useMemo } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import type { CharacterDef, NightChoiceType } from '@/types/index.ts';
import type { NightOrderPlayer } from '@/utils/nightOrderFilter.ts';
import { getCharacterIconPath } from '@/utils/characterIcon.ts';
import { filterPlayerAssignableCharacters } from '@/utils/characterAssignment.ts';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface NightChoiceSelectorProps {
  type: NightChoiceType;
  multiple?: boolean;
  maxSelections?: number;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  players: NightOrderPlayer[];
  characters?: CharacterDef[];
  previousValue?: string | string[];
  label?: string;
  filter?: string;
  readOnly?: boolean;
  /** Label for the empty player/character option. */
  emptyOptionLabel?: string;
  /** Lookup function to resolve character definitions by ID (for inline icons). */
  characterLookup?: (id: string) => CharacterDef | undefined;
  /** When false, unassigned character options show only the character name. */
  showUnassignedCharacterType?: boolean;
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
  filter,
  readOnly = false,
  emptyOptionLabel = 'None',
  characterLookup,
  showUnassignedCharacterType = true,
}: NightChoiceSelectorProps) {
  // Build player options filtered by type
  const playerOptions = useMemo(() => {
    const base = (() => {
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
    })();
    if (filter === 'good-alive') {
      return base.filter((p) => p.alive && p.actualAlignment === 'Good');
    }
    return base;
  }, [filter, players, type]);

  const isPlayerType = type === 'player' || type === 'livingPlayer' || type === 'deadPlayer';

  // Build a quick lookup: characterId → player for character dropdowns
  const playersByCharId = useMemo(() => {
    const map = new Map<string, NightOrderPlayer>();
    for (const p of players) {
      if (p.characterId) map.set(p.characterId, p);
    }
    return map;
  }, [players]);

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
            renderValue={(selected) => {
              const p = playerOptions.find((pl) => pl.playerName === selected);
              if (!p) return selected;
              const charDef =
                p.characterId && characterLookup ? characterLookup(p.characterId) : undefined;
              return charDef
                ? `${p.playerName} (${charDef.name})`
                : `${p.playerName} (Seat ${p.seat})`;
            }}
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
              <em>{emptyOptionLabel}</em>
            </MenuItem>
            {playerOptions.map((p) => {
              const charDef =
                p.characterId && characterLookup ? characterLookup(p.characterId) : undefined;
              return (
                <MenuItem key={p.seat} value={p.playerName}>
                  {charDef && (
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <Avatar
                        src={getCharacterIconPath(charDef.id)}
                        alt={charDef.name}
                        sx={{ width: 20, height: 20 }}
                      />
                    </ListItemIcon>
                  )}
                  <ListItemText
                    primary={
                      charDef
                        ? `${p.playerName} (${charDef.name})`
                        : `${p.playerName} (Seat ${p.seat})`
                    }
                  />
                </MenuItem>
              );
            })}
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
          getOptionLabel={(option) => {
            const p = playerOptions.find((pl) => pl.playerName === option);
            if (!p) return option;
            const charDef =
              p.characterId && characterLookup ? characterLookup(p.characterId) : undefined;
            return charDef
              ? `${p.playerName} (${charDef.name})`
              : `${p.playerName} (Seat ${p.seat})`;
          }}
          renderOption={(props, option) => {
            const p = playerOptions.find((pl) => pl.playerName === option);
            const charDef =
              p?.characterId && characterLookup ? characterLookup(p.characterId) : undefined;
            return (
              <li {...props} key={p?.seat ?? option}>
                {charDef && (
                  <Avatar
                    src={getCharacterIconPath(charDef.id)}
                    alt={charDef.name}
                    sx={{ width: 20, height: 20, mr: 1 }}
                  />
                )}
                {charDef ? `${option} (${charDef.name})` : `${option} (Seat ${p?.seat ?? '?'})`}
              </li>
            );
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
            renderValue={(selected) => {
              const c = characters.find((ch) => ch.name === selected);
              if (!c) return selected;
              const p = playersByCharId.get(c.id);
              if (p) return `${c.name} (${p.playerName})`;
              return showUnassignedCharacterType ? `${c.name} (${c.type})` : c.name;
            }}
            sx={{
              color: 'rgba(255,255,255,0.9)',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255,255,255,0.2)',
              },
            }}
          >
            <MenuItem value="">
              <em>{emptyOptionLabel}</em>
            </MenuItem>
            {filterPlayerAssignableCharacters(characters).map((c) => {
              const p = playersByCharId.get(c.id);
              return (
                <MenuItem key={c.id} value={c.name}>
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    <Avatar
                      src={getCharacterIconPath(c.id)}
                      alt={c.name}
                      sx={{ width: 20, height: 20 }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      p
                        ? `${c.name} (${p.playerName})`
                        : showUnassignedCharacterType
                          ? `${c.name} (${c.type})`
                          : c.name
                    }
                  />
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      )}

      {/* ── Alignment toggle ── */}
      {(type === 'alignment' || type === 'alignment-change') && (
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
            {type === 'alignment-change' && (
              <ToggleButton value="Unchanged" sx={{ color: 'rgba(255,255,255,0.65)' }}>
                Unchanged
              </ToggleButton>
            )}
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
