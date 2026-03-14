import { useState, useMemo, useCallback } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import type { PlayerSeat } from '@/types/index.ts';
import { CharacterType } from '@/types/index.ts';
import { getCharacterTypeColor } from '@/components/common/characterTypeColor.ts';
import { CharacterIconImage } from '@/components/common/CharacterIconImage.tsx';
import { buildGroupedOptions } from './addPlayerOptions.ts';
import type { CharacterOption } from './addPlayerOptions.ts';

export interface AddPlayerDialogProps {
  open: boolean;
  existingPlayers: PlayerSeat[];
  /** Character IDs from the current script (empty array if no script loaded). */
  scriptCharacterIds: string[];
  /** Character IDs currently in play (selected for the game). */
  inPlayCharacterIds: string[];
  onClose: () => void;
  onAdd: (
    seat: number,
    playerName: string,
    characterId: string,
    alignment: 'Good' | 'Evil',
  ) => void;
}

/** Derive default alignment from character type. */
function defaultAlignmentForType(type: CharacterType): 'Good' | 'Evil' {
  if (type === CharacterType.Minion || type === CharacterType.Demon) return 'Evil';
  return 'Good';
}

/**
 * Dialog for adding a player to the game.
 *
 * Fields: searchable character dropdown, player name, alignment.
 * The seat number is auto-computed to the next available seat.
 */
export function AddPlayerDialog({
  open,
  existingPlayers,
  scriptCharacterIds,
  inPlayCharacterIds,
  onClose,
  onAdd,
}: AddPlayerDialogProps) {
  const nextSeat = useMemo(() => {
    if (existingPlayers.length === 0) return 1;
    const usedSeats = new Set(existingPlayers.map((p) => p.seat));
    let candidate = 1;
    while (usedSeats.has(candidate)) candidate++;
    return candidate;
  }, [existingPlayers]);

  const [selectedCharacter, setSelectedCharacter] = useState<CharacterOption | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [alignment, setAlignment] = useState<'Good' | 'Evil'>('Good');

  const groupedOptions = useMemo(
    () => buildGroupedOptions(scriptCharacterIds, inPlayCharacterIds),
    [scriptCharacterIds, inPlayCharacterIds],
  );

  const handleCharacterChange = useCallback(
    (_event: React.SyntheticEvent, value: CharacterOption | null) => {
      setSelectedCharacter(value);
      if (value) {
        setAlignment(defaultAlignmentForType(value.character.type));
      }
    },
    [],
  );

  const canSave = selectedCharacter !== null && playerName.trim().length > 0;

  const handleConfirm = () => {
    if (!canSave || !selectedCharacter) return;
    onAdd(nextSeat, playerName.trim(), selectedCharacter.character.id, alignment);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Add Player</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        <Autocomplete
          options={groupedOptions}
          groupBy={(option) => option.group}
          getOptionLabel={(option) => option.character.name}
          isOptionEqualToValue={(option, value) => option.character.id === value.character.id}
          value={selectedCharacter}
          onChange={handleCharacterChange}
          renderInput={(params) => (
            <TextField {...params} label="Character" size="small" autoFocus sx={{ mt: 1 }} />
          )}
          renderOption={({ key, ...props }, option) => (
            <Box
              component="li"
              key={key}
              {...props}
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <CharacterIconImage
                characterId={option.character.id}
                characterName={option.character.name}
                typeColor={getCharacterTypeColor(option.character.type)}
                size={28}
                borderColor={getCharacterTypeColor(option.character.type)}
              />
              <span style={{ flex: 1 }}>{option.character.name}</span>
              <Chip
                label={option.character.type}
                size="small"
                sx={{
                  backgroundColor: `${getCharacterTypeColor(option.character.type)}22`,
                  color: getCharacterTypeColor(option.character.type),
                  fontWeight: 500,
                  height: 20,
                  fontSize: '0.7rem',
                }}
              />
            </Box>
          )}
          fullWidth
          size="small"
        />

        <TextField
          label="Player Name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          size="small"
          fullWidth
        />

        <FormControl fullWidth size="small">
          <InputLabel id="player-alignment-label">Alignment</InputLabel>
          <Select
            labelId="player-alignment-label"
            value={alignment}
            label="Alignment"
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
          Add Player
        </Button>
      </DialogActions>
    </Dialog>
  );
}
