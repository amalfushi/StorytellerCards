import { useState, useMemo, useCallback } from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import type { CharacterDef, CharacterType } from '@/types/index.ts';
import { getCharacterTypeColor } from '@/components/common/characterTypeColor.ts';
import { getCharacterIconPath } from '@/utils/characterIcon.ts';

/** Maximum number of demon bluffs. */
const MAX_BLUFFS = 3;

/** Type groups shown in the bluff selection (only good characters). */
const BLUFF_TYPE_ORDER: CharacterType[] = ['Townsfolk', 'Outsider'];

export interface DemonBluffSelectionProps {
  open: boolean;
  onClose: () => void;
  /** All characters on the script. */
  scriptCharacters: CharacterDef[];
  /** Character IDs currently selected as in-play. */
  inPlayCharacterIds: string[];
  /** Previously selected bluff IDs (for re-editing). */
  initialSelected?: string[];
  /** Called with the 3 selected bluff character IDs. */
  onConfirm: (bluffIds: string[]) => void;
}

/**
 * Dialog for selecting exactly 3 demon bluffs from the unselected good characters
 * on the script (Townsfolk + Outsiders not in play).
 */
export function DemonBluffSelection({
  open,
  onClose,
  scriptCharacters,
  inPlayCharacterIds,
  initialSelected,
  onConfirm,
}: DemonBluffSelectionProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(initialSelected ?? []));

  // Reset when dialog opens
  const handleEnter = useCallback(() => {
    setSelectedIds(new Set(initialSelected ?? []));
  }, [initialSelected]);

  // Available bluff candidates: good characters on the script that are NOT in play
  const availableByType = useMemo(() => {
    const inPlay = new Set(inPlayCharacterIds);
    const groups: Record<string, CharacterDef[]> = {};
    for (const type of BLUFF_TYPE_ORDER) {
      groups[type] = [];
    }
    for (const ch of scriptCharacters) {
      if ((ch.type === 'Townsfolk' || ch.type === 'Outsider') && !inPlay.has(ch.id)) {
        groups[ch.type].push(ch);
      }
    }
    return groups;
  }, [scriptCharacters, inPlayCharacterIds]);

  const handleToggle = useCallback((characterId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(characterId)) {
        next.delete(characterId);
      } else if (next.size < MAX_BLUFFS) {
        next.add(characterId);
      }
      return next;
    });
  }, []);

  const handleConfirm = useCallback(() => {
    onConfirm(Array.from(selectedIds));
    onClose();
  }, [selectedIds, onConfirm, onClose]);

  const totalAvailable = Object.values(availableByType).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      TransitionProps={{ onEnter: handleEnter }}
    >
      <DialogTitle sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography component="span" variant="h6" sx={{ flexGrow: 1 }}>
            Select Demon Bluffs
          </Typography>
          <IconButton aria-label="close" onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Chip
          label={`${selectedIds.size}/${MAX_BLUFFS} selected`}
          size="small"
          color={selectedIds.size === MAX_BLUFFS ? 'success' : 'default'}
          variant={selectedIds.size === MAX_BLUFFS ? 'filled' : 'outlined'}
          sx={{ fontWeight: 700, alignSelf: 'flex-start' }}
          data-testid="bluff-count-chip"
        />
      </DialogTitle>

      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Choose {MAX_BLUFFS} not-in-play good characters to show the Demon as bluffs.
          {totalAvailable === 0 && ' No unselected good characters available.'}
        </Typography>

        {BLUFF_TYPE_ORDER.map((type) => {
          const chars = availableByType[type];
          if (!chars || chars.length === 0) return null;
          const typeColor = getCharacterTypeColor(type);

          return (
            <Box key={type} sx={{ mb: 1 }} data-testid={`bluff-group-${type}`}>
              <Typography
                variant="subtitle2"
                sx={{ color: typeColor, fontWeight: 700, px: 1, py: 0.5 }}
              >
                {type} ({chars.length})
              </Typography>

              <List dense disablePadding>
                {chars.map((ch) => {
                  const checked = selectedIds.has(ch.id);
                  const disabled = !checked && selectedIds.size >= MAX_BLUFFS;
                  return (
                    <ListItem key={ch.id} disablePadding>
                      <ListItemButton
                        onClick={() => handleToggle(ch.id)}
                        dense
                        disabled={disabled}
                        data-testid={`bluff-toggle-${ch.id}`}
                      >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <Checkbox
                            edge="start"
                            checked={checked}
                            disabled={disabled}
                            tabIndex={-1}
                            disableRipple
                            inputProps={{ 'aria-label': ch.name }}
                          />
                        </ListItemIcon>
                        <Avatar
                          src={getCharacterIconPath(ch.id)}
                          alt={ch.name}
                          sx={{ width: 28, height: 28, mr: 1 }}
                        />
                        <ListItemText
                          primary={ch.name}
                          primaryTypographyProps={{
                            sx: { color: typeColor, fontWeight: checked ? 600 : 400 },
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
              <Divider />
            </Box>
          );
        })}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={selectedIds.size !== MAX_BLUFFS}
          data-testid="confirm-bluffs"
        >
          Confirm Bluffs ({selectedIds.size}/{MAX_BLUFFS})
        </Button>
      </DialogActions>
    </Dialog>
  );
}
