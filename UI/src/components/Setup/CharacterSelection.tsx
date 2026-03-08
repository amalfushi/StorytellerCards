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
import InputAdornment from '@mui/material/InputAdornment';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import type { CharacterDef, CharacterType } from '@/types/index.ts';
import { getDistribution } from '@/data/playerCountRules.ts';
import type { Distribution } from '@/data/playerCountRules.ts';
import { getCharacterTypeColor } from '@/components/common/characterTypeColor.ts';
import { CharacterIconImage } from '@/components/common/CharacterIconImage.tsx';
import { getAlignmentBorderColor } from '@/utils/characterIcon.ts';

/** Ordered list of character type groups to display (Travellers omitted). */
const TYPE_GROUP_ORDER: CharacterType[] = [
  'Townsfolk',
  'Outsider',
  'Minion',
  'Demon',
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
  /** Optional game number for the dialog title (e.g. "Game 2: Select Characters"). */
  gameNumber?: number;
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
  gameNumber,
}: CharacterSelectionProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(initialSelected ?? []));
  const [searchQuery, setSearchQuery] = useState('');

  const distribution = useMemo(() => getDistribution(playerCount), [playerCount]);

  // Reset when dialog opens
  const handleEnter = useCallback(() => {
    setSelectedIds(new Set(initialSelected ?? []));
    setSearchQuery('');
  }, [initialSelected]);

  // Filter out Travellers from script characters
  const nonTravellerCharacters = useMemo(
    () => scriptCharacters.filter((ch) => ch.type !== 'Traveller'),
    [scriptCharacters],
  );

  // Group script characters by type (excluding Travellers)
  const charsByType = useMemo(() => {
    const groups: Record<string, CharacterDef[]> = {};
    for (const type of TYPE_GROUP_ORDER) {
      groups[type] = [];
    }
    for (const ch of nonTravellerCharacters) {
      if (groups[ch.type]) {
        groups[ch.type].push(ch);
      }
    }
    return groups;
  }, [nonTravellerCharacters]);

  // Count selected by type (only non-Traveller)
  const selectedCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const type of TYPE_GROUP_ORDER) {
      counts[type] = 0;
    }
    for (const id of selectedIds) {
      const ch = nonTravellerCharacters.find((c) => c.id === id);
      if (ch) {
        counts[ch.type] = (counts[ch.type] ?? 0) + 1;
      }
    }
    return counts;
  }, [selectedIds, nonTravellerCharacters]);

  // Filter characters by search query
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredCharsByType = useMemo(() => {
    if (!normalizedQuery) return charsByType;
    const filtered: Record<string, CharacterDef[]> = {};
    for (const type of TYPE_GROUP_ORDER) {
      filtered[type] = (charsByType[type] ?? []).filter(
        (ch) =>
          ch.name.toLowerCase().includes(normalizedQuery) ||
          (ch.abilityShort !== '<TODO>' && ch.abilityShort.toLowerCase().includes(normalizedQuery)),
      );
    }
    return filtered;
  }, [charsByType, normalizedQuery]);

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

  /** Total count of all selected characters. */
  const totalSelected = selectedIds.size;

  const dialogTitle = gameNumber ? `Game ${gameNumber}: Select Characters` : 'Select Characters';

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
            {dialogTitle}
          </Typography>
          <IconButton aria-label="close" onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        {/* Per-type count chips (full type names, no total chip) */}
        <Box
          data-testid="sticky-count-header"
          sx={{
            display: 'flex',
            gap: 0.5,
            flexWrap: 'wrap',
            alignItems: 'center',
            pt: 0.5,
          }}
        >
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
                  fontSize: '0.7rem',
                }}
              />
            );
          })}
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Search filter */}
        <TextField
          fullWidth
          size="small"
          placeholder="Search characters…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          sx={{ mb: 2 }}
          data-testid="character-search"
        />

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Select which characters are in play for this {playerCount}-player game.
        </Typography>

        {/* Character groups */}
        {TYPE_GROUP_ORDER.map((type) => {
          const chars = filteredCharsByType[type];
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
                        <CharacterIconImage
                          characterId={ch.id}
                          characterName={ch.name}
                          typeColor={typeColor}
                          size={32}
                          borderColor={getAlignmentBorderColor(ch.defaultAlignment, typeColor)}
                        />
                        <ListItemText
                          primary={ch.name}
                          secondary={ch.abilityShort !== '<TODO>' ? ch.abilityShort : undefined}
                          primaryTypographyProps={{
                            sx: { color: typeColor, fontWeight: checked ? 600 : 400, ml: 1 },
                          }}
                          secondaryTypographyProps={{ sx: { ml: 1 } }}
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
          Confirm ({totalSelected} selected)
        </Button>
      </DialogActions>
    </Dialog>
  );
}
