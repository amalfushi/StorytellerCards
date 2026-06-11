/**
 * ApparentCharacterDialog — lets the Storyteller set which character a
 * concealed player (Drunk or Marionette) believes they are.
 *
 * - Drunk: pick any Townsfolk (the Drunk thinks they are this character)
 * - Marionette: pick any good character (they think they are this character)
 */

import { useState, useMemo, useCallback } from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import type { CharacterDef, PlayerId } from '@/types/index.ts';
import { CharacterType } from '@/types/index.ts';
import { getCharacterIconPath } from '@/utils/characterIcon.ts';
import { getCharacterTypeColor } from '@/components/common/characterTypeColor.ts';

export interface ApparentCharacterDialogProps {
  open: boolean;
  onClose: () => void;
  playerId: PlayerId;
  playerName: string;
  currentApparentCharacterId?: string;
  /** The actual character assigned (Drunk or Marionette). */
  actualCharacter: CharacterDef;
  /** All script characters to pick from. */
  scriptCharacters: CharacterDef[];
  /** Callback with the selected apparent character ID. */
  onConfirm: (playerId: PlayerId, apparentCharacterId: string) => void;
}

export function ApparentCharacterDialog({
  open,
  onClose,
  playerId,
  playerName,
  currentApparentCharacterId,
  actualCharacter,
  scriptCharacters,
  onConfirm,
}: ApparentCharacterDialogProps) {
  const [selected, setSelected] = useState<string>(currentApparentCharacterId ?? '');

  const handleEnter = useCallback(() => {
    setSelected(currentApparentCharacterId ?? '');
  }, [currentApparentCharacterId]);

  const candidates = useMemo(() => {
    if (actualCharacter.id === 'drunk') {
      return scriptCharacters.filter((c) => c.type === CharacterType.Townsfolk && c.id !== 'drunk');
    }
    if (actualCharacter.id === 'marionette') {
      return scriptCharacters.filter(
        (c) =>
          (c.type === CharacterType.Townsfolk || c.type === CharacterType.Outsider) &&
          c.id !== 'marionette',
      );
    }
    return scriptCharacters.filter(
      (c) => c.type === CharacterType.Townsfolk || c.type === CharacterType.Outsider,
    );
  }, [actualCharacter.id, scriptCharacters]);

  const handleConfirm = () => {
    if (selected) {
      onConfirm(playerId, selected);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      slotProps={{ transition: { onEnter: handleEnter } }}
    >
      <DialogTitle>
        <Typography variant="h6" component="span">
          Identity Concealment — {playerName}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {actualCharacter.id === 'drunk'
            ? 'The Drunk thinks they are a Townsfolk. Choose which character they believe they are.'
            : actualCharacter.id === 'marionette'
              ? 'The Marionette thinks they are a good character. Choose their believed identity.'
              : `Choose which character ${playerName} believes they are.`}
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        <List dense sx={{ maxHeight: 400, overflow: 'auto' }}>
          {candidates.map((c) => {
            const typeColor = getCharacterTypeColor(c.type);
            return (
              <ListItemButton
                key={c.id}
                selected={selected === c.id}
                onClick={() => setSelected(c.id)}
                data-testid={`candidate-${c.id}`}
              >
                <ListItemAvatar>
                  <Avatar
                    src={getCharacterIconPath(c.id)}
                    alt={c.name}
                    sx={{
                      width: 36,
                      height: 36,
                      border: `2px solid ${typeColor}`,
                      bgcolor: '#fff',
                    }}
                  />
                </ListItemAvatar>
                <ListItemText
                  primary={c.name}
                  secondary={c.type}
                  secondaryTypographyProps={{ sx: { color: typeColor } }}
                />
              </ListItemButton>
            );
          })}
        </List>
        {candidates.length === 0 && (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No eligible characters available
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleConfirm} disabled={!selected}>
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
}
