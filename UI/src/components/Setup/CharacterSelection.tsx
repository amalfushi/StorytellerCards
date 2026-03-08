import { useState, useMemo, useCallback } from 'react';
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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import type { CharacterDef, CharacterType } from '@/types/index.ts';
import { getDistribution } from '@/data/playerCountRules.ts';
import type { Distribution } from '@/data/playerCountRules.ts';
import { getCharacterTypeColor } from '@/components/common/characterTypeColor.ts';

/** Ordered list of character type groups to display. */
const TYPE_GROUP_ORDER: CharacterType[] = [
  'Townsfolk',
  'Outsider',
  'Minion',
  'Demon',
  'Traveller',
  'Fabled',
  'Loric',
];

/** Map from CharacterType to Distribution key (only for counted types). */
const TYPE_TO_DIST_KEY: Partial<Record<CharacterType, keyof Distribution>> = {
  Townsfolk: 'townsfolk',
  Outsider: 'outsiders',
  Minion: 'minions',
  Demon: 'demons',
};

export interface CharacterSelectionProps {
  open: boolean;
  onClose: () => void;
  scriptCharacters: CharacterDef[];
  playerCount: number;
  initialSelected?: string[];
  onConfirm: (selectedIds: string[]) => void;
}

/**
 * Full-screen dialog for selecting which characters from the script are in-play.
 *
 * Shows characters grouped by type with toggle checkboxes and
 * distribution target tracking based on player count.
 */
export function CharacterSelection({
  open,
  onClose,
  scriptCharacters,
  playerCount,
  initialSelected,
  onConfirm,
}: CharacterSelectionProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(initialSelected ?? []));

  const distribution = useMemo(() => getDistribution(playerCount), [playerCount]);

  // Reset when dialog opens
  const handleEnter = useCallback(() => {
    setSelectedIds(new Set(initialSelected ?? []));
  }, [initialSelected]);

  // Group script characters by type
  const charsByType = useMemo(() => {
    const groups: Record<string, CharacterDef[]> = {};
    for (const type of TYPE_GROUP_ORDER) {
      groups[type] = [];
    }
    for (const ch of scriptCharacters) {
      if (groups[ch.type]) {
        groups[ch.type].push(ch);
      }
    }
    return groups;
  }, [scriptCharacters]);

  // Count selected by type
  const selectedCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const type of TYPE_GROUP_ORDER) {
      counts[type] = 0;
    }
    for (const id of selectedIds) {
      const ch = scriptCharacters.find((c) => c.id === id);
      if (ch) {
        counts[ch.type] = (counts[ch.type] ?? 0) + 1;
      }
    }
    return counts;
  }, [selectedIds, scriptCharacters]);

  const handleToggle = useCallback((characterId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(characterId)) {
        next.delete(characterId);
      } else {
        next.add(characterId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(
    (type: CharacterType) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        const chars = charsByType[type] ?? [];
        const allSelected = chars.every((ch) => next.has(ch.id));
        for (const ch of chars) {
          if (allSelected) {
            next.delete(ch.id);
          } else {
            next.add(ch.id);
          }
        }
        return next;
      });
    },
    [charsByType],
  );

  const handleConfirm = useCallback(() => {
    onConfirm(Array.from(selectedIds));
    onClose();
  }, [selectedIds, onConfirm, onClose]);

  /** Render a distribution status chip for a counted type. */
  function renderDistChip(type: CharacterType) {
    const distKey = TYPE_TO_DIST_KEY[type];
    if (!distKey) return null;
    const target = distribution[distKey];
    const current = selectedCounts[type] ?? 0;
    const met = current === target;
    const over = current > target;

    return (
      <Chip
        size="small"
        icon={met ? <CheckCircleIcon /> : <WarningAmberIcon />}
        label={`${current}/${target}`}
        color={met ? 'success' : over ? 'warning' : 'default'}
        variant={met ? 'filled' : 'outlined'}
        sx={{ ml: 1 }}
        data-testid={`dist-chip-${type}`}
      />
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      TransitionProps={{ onEnter: handleEnter }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography component="span" variant="h6" sx={{ flexGrow: 1 }}>
          Select In-Play Characters
        </Typography>
        <IconButton aria-label="close" onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* Distribution summary */}
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
          {TYPE_GROUP_ORDER.filter((t) => TYPE_TO_DIST_KEY[t]).map((type) => {
            const distKey = TYPE_TO_DIST_KEY[type]!;
            const target = distribution[distKey];
            const current = selectedCounts[type] ?? 0;
            const met = current === target;
            return (
              <Chip
                key={type}
                label={`${type}: ${current}/${target}`}
                size="small"
                data-testid={`summary-chip-${type}`}
                sx={{
                  backgroundColor: met
                    ? `${getCharacterTypeColor(type)}22`
                    : 'action.disabledBackground',
                  color: met ? getCharacterTypeColor(type) : 'text.secondary',
                  fontWeight: 600,
                }}
              />
            );
          })}
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Select which characters are in play for this {playerCount}-player game.
        </Typography>

        {/* Character groups */}
        {TYPE_GROUP_ORDER.map((type) => {
          const chars = charsByType[type];
          if (!chars || chars.length === 0) return null;
          const typeColor = getCharacterTypeColor(type);

          return (
            <Box key={type} sx={{ mb: 1 }} data-testid={`char-group-${type}`}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  px: 1,
                  py: 0.5,
                  cursor: 'pointer',
                }}
                onClick={() => handleSelectAll(type)}
                role="button"
                aria-label={`Toggle all ${type}`}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ color: typeColor, fontWeight: 700, flexGrow: 1 }}
                >
                  {type} ({chars.length})
                </Typography>
                {renderDistChip(type)}
              </Box>

              <List dense disablePadding>
                {chars.map((ch) => {
                  const checked = selectedIds.has(ch.id);
                  return (
                    <ListItem key={ch.id} disablePadding>
                      <ListItemButton
                        onClick={() => handleToggle(ch.id)}
                        dense
                        data-testid={`char-toggle-${ch.id}`}
                      >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <Checkbox
                            edge="start"
                            checked={checked}
                            tabIndex={-1}
                            disableRipple
                            inputProps={{ 'aria-label': ch.name }}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={ch.name}
                          secondary={ch.abilityShort !== '<TODO>' ? ch.abilityShort : undefined}
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
        <Button variant="contained" onClick={handleConfirm} data-testid="confirm-selection">
          Confirm ({selectedIds.size} selected)
        </Button>
      </DialogActions>
    </Dialog>
  );
}
