import { useMemo, useState } from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import ListSubheader from '@mui/material/ListSubheader';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { Alignment, CharacterDef, Player, PlayerId, Slot, SlotId } from '@/types/index.ts';
import { Alignment as AlignmentValue } from '@/types/index.ts';
import { getDefaultCharacterIconPath } from '@/utils/characterIcon.ts';
import { buildDisplaySeatNumberMap } from '@/utils/seating/index.ts';
import { buildTravellerOptions } from './addPlayerOptions.ts';

const NEW_PLAYER_VALUE = '__new-player__';
const NEW_SEAT_VALUE = '__new-seat__';

export interface AddTravellerRequest {
  playerId?: PlayerId;
  newPlayerName?: string;
  characterId: string;
  alignment: Alignment;
  seatSlotId?: SlotId;
}

export interface AddTravellerDialogProps {
  open: boolean;
  players: Player[];
  slots: Slot[];
  scriptCharacterIds: string[];
  characters: CharacterDef[];
  unavailableCharacterIds?: string[];
  onClose: () => void;
  onAdd: (request: AddTravellerRequest) => void;
}

export function AddTravellerDialog({ open, ...props }: AddTravellerDialogProps) {
  if (!open) return null;
  return <AddTravellerDialogInner {...props} />;
}

function AddTravellerDialogInner({
  players,
  slots,
  scriptCharacterIds,
  characters,
  unavailableCharacterIds = [],
  onClose,
  onAdd,
}: Omit<AddTravellerDialogProps, 'open'>) {
  const characterOptions = useMemo(() => {
    const unavailableIds = new Set(unavailableCharacterIds);
    return buildTravellerOptions(scriptCharacterIds, characters).filter(
      (option) => !unavailableIds.has(option.character.id),
    );
  }, [scriptCharacterIds, characters, unavailableCharacterIds]);
  const emptySeats = useMemo(
    () => slots.filter((slot) => slot.kind === 'seat' && slot.playerId === null),
    [slots],
  );
  const displaySeatNumbers = useMemo(() => buildDisplaySeatNumberMap(slots), [slots]);
  const [playerValue, setPlayerValue] = useState(players[0]?.id ?? NEW_PLAYER_VALUE);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [characterId, setCharacterId] = useState(characterOptions[0]?.character.id ?? '');
  const [alignment, setAlignment] = useState<Alignment>(AlignmentValue.Good);
  const [seatValue, setSeatValue] = useState(emptySeats[0]?.id ?? NEW_SEAT_VALUE);

  const isNewPlayer = playerValue === NEW_PLAYER_VALUE;
  const canSubmit =
    characterId.length > 0 &&
    (isNewPlayer ? newPlayerName.trim().length > 0 : playerValue.length > 0);

  const handleAdd = () => {
    if (!canSubmit) return;
    onAdd({
      playerId: isNewPlayer ? undefined : playerValue,
      newPlayerName: isNewPlayer ? newPlayerName.trim() : undefined,
      characterId,
      alignment,
      seatSlotId: seatValue === NEW_SEAT_VALUE ? undefined : seatValue,
    });
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Add Traveller</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <FormControl fullWidth>
            <InputLabel id="traveller-player-label">Player</InputLabel>
            <Select
              labelId="traveller-player-label"
              label="Player"
              value={playerValue}
              onChange={(event) => setPlayerValue(event.target.value)}
            >
              {players.map((player) => (
                <MenuItem key={player.id} value={player.id}>
                  {player.name}
                </MenuItem>
              ))}
              <MenuItem value={NEW_PLAYER_VALUE}>New player</MenuItem>
            </Select>
          </FormControl>

          {isNewPlayer && (
            <TextField
              autoFocus
              label="Player name"
              value={newPlayerName}
              onChange={(event) => setNewPlayerName(event.target.value)}
              fullWidth
            />
          )}

          <FormControl fullWidth>
            <InputLabel id="traveller-character-label">Traveller character</InputLabel>
            <Select
              labelId="traveller-character-label"
              label="Traveller character"
              value={characterId}
              disabled={characterOptions.length === 0}
              onChange={(event) => setCharacterId(event.target.value)}
              renderValue={(selectedId) =>
                characterOptions.find((option) => option.character.id === selectedId)?.character
                  .name ?? ''
              }
            >
              {characterOptions.flatMap((option, index) => {
                const showGroup =
                  index === 0 || option.group !== characterOptions[index - 1]?.group;
                return [
                  showGroup ? (
                    <ListSubheader key={`${option.group}-header`}>{option.group}</ListSubheader>
                  ) : null,
                  <MenuItem key={option.character.id} value={option.character.id}>
                    <Avatar
                      src={getDefaultCharacterIconPath(option.character.id, option.character.type)}
                      alt={option.character.name}
                      sx={{ width: 32, height: 32, mr: 1, flexShrink: 0 }}
                    />
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 1,
                        minWidth: 0,
                        width: '100%',
                      }}
                    >
                      <Typography variant="body2" fontWeight={600} sx={{ flexShrink: 0 }}>
                        {option.character.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        noWrap
                        sx={{ minWidth: 0 }}
                      >
                        {option.character.abilityShort}
                      </Typography>
                    </Box>
                  </MenuItem>,
                ];
              })}
            </Select>
            {characterOptions.length === 0 && (
              <FormHelperText>All Traveller characters are already in play.</FormHelperText>
            )}
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="traveller-alignment-label">Alignment</InputLabel>
            <Select
              labelId="traveller-alignment-label"
              label="Alignment"
              value={alignment}
              onChange={(event) => setAlignment(event.target.value as Alignment)}
            >
              <MenuItem value={AlignmentValue.Good}>Good</MenuItem>
              <MenuItem value={AlignmentValue.Evil}>Evil</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="traveller-seat-label">Seat</InputLabel>
            <Select
              labelId="traveller-seat-label"
              label="Seat"
              value={seatValue}
              onChange={(event) => setSeatValue(event.target.value)}
            >
              {emptySeats.map((seat) => (
                <MenuItem key={seat.id} value={seat.id}>
                  Empty seat {displaySeatNumbers.get(seat.id)}
                </MenuItem>
              ))}
              <MenuItem value={NEW_SEAT_VALUE}>Add a new seat</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleAdd} variant="contained" disabled={!canSubmit}>
          Add Traveller
        </Button>
      </DialogActions>
    </Dialog>
  );
}
