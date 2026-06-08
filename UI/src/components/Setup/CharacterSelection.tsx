import { useState, useMemo, useCallback } from 'react';
import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import CasinoIcon from '@mui/icons-material/Casino';
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
import RemoveIcon from '@mui/icons-material/Remove';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import type { CharacterDef, CharacterType } from '@/types/index.ts';
import type { Distribution } from '@/data/playerCountRules.ts';
import { getCharacterTypeColor } from '@/components/common/characterTypeColor.ts';
import { CharacterIconImage } from '@/components/common/CharacterIconImage.tsx';
import { getAlignmentBorderColor } from '@/utils/characterIcon.ts';
import { calculateAdaptiveTargets } from '@/utils/adaptiveDistribution.ts';
import type { AdaptiveDistributionOptions } from '@/utils/adaptiveDistribution.ts';
import { randomizeCharacters } from '@/utils/randomizeCharacters.ts';
import { filterPlayerAssignableCharacters } from '@/utils/characterAssignment.ts';

/** Ordered list of character type groups to display (Travellers omitted). */
const TYPE_GROUP_ORDER: CharacterType[] = ['Townsfolk', 'Outsider', 'Minion', 'Demon'];

/** Map from CharacterType to Distribution key (only for counted types). */
const TYPE_TO_DIST_KEY: Partial<Record<CharacterType, keyof Distribution>> = {
  Townsfolk: 'townsfolk',
  Outsider: 'outsiders',
  Minion: 'minions',
  Demon: 'demons',
};

/** Characters that support duplicate copies in play. */
const DUPLICATE_ALLOWED_IDS = new Set(['villageidiot', 'legion']);

/**
 * Configuration for characters whose outsider-modifier is variable.
 * The stepper lets the Storyteller pick a concrete value within [min, max].
 */
const VARIABLE_MODIFIER_CONFIG: Record<string, { min: number; max: number; label: string }> = {
  balloonist: { min: 0, max: 1, label: 'Balloonist' },
  hermit: { min: -1, max: 0, label: 'Hermit' },
  godfather: { min: -1, max: 1, label: 'Godfather' },
  kazali: { min: -3, max: 5, label: 'Kazali' },
  lordoftyphon: { min: -3, max: 5, label: 'Lord of Typhon' },
  sentinel: { min: 0, max: 2, label: 'Sentinel' },
} as const;

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
 * Uses the adaptive distribution engine for real-time target tracking that
 * responds to setup-affecting characters (Baron, Legion, Atheist, etc.).
 * Supports modifier chips, Xaan X input, and duplicate character selection.
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
  const [xaanX, setXaanX] = useState<number | undefined>(undefined);
  const [extraVillageIdiots, setExtraVillageIdiots] = useState(0);
  const [extraLegionCopies, setExtraLegionCopies] = useState(0);
  const [variableModifiers, setVariableModifiers] = useState<Record<string, number>>({});

  // Filter out non-player setup powers and Travellers from selectable player characters.
  const playerAssignableCharacters = useMemo(
    () => filterPlayerAssignableCharacters(scriptCharacters),
    [scriptCharacters],
  );
  const playerAssignableIdSet = useMemo(
    () => new Set(playerAssignableCharacters.map((character) => character.id)),
    [playerAssignableCharacters],
  );
  const selectedPlayerIds = useMemo(
    () => Array.from(selectedIds).filter((id) => playerAssignableIdSet.has(id)),
    [playerAssignableIdSet, selectedIds],
  );

  // Build adaptive distribution options from current state
  const adaptiveOptions: AdaptiveDistributionOptions = useMemo(
    () => ({
      xaanX,
      extraVillageIdiots,
      extraLegionCopies,
      variableModifierValues: variableModifiers,
    }),
    [xaanX, extraVillageIdiots, extraLegionCopies, variableModifiers],
  );

  // Adaptive distribution engine replaces static getDistribution
  const adaptiveTargets = useMemo(
    () => calculateAdaptiveTargets(playerCount, selectedPlayerIds, adaptiveOptions),
    [playerCount, selectedPlayerIds, adaptiveOptions],
  );

  // Map from AdaptiveTargets to Distribution-like shape for chip rendering
  const distribution = useMemo(
    () => ({
      townsfolk: adaptiveTargets.townsfolk,
      outsiders: adaptiveTargets.outsiders,
      minions: adaptiveTargets.minions,
      demons: adaptiveTargets.demons,
    }),
    [adaptiveTargets],
  );

  // Reset when dialog opens
  const handleEnter = useCallback(() => {
    setSelectedIds(new Set((initialSelected ?? []).filter((id) => playerAssignableIdSet.has(id))));
    setSearchQuery('');
    setXaanX(undefined);
    setExtraVillageIdiots(0);
    setExtraLegionCopies(0);
    setVariableModifiers({});
  }, [initialSelected, playerAssignableIdSet]);

  // Randomize character selection using distribution rules
  const handleRandomize = useCallback(() => {
    const scriptIds = scriptCharacters.map((ch) => ch.id);
    const randomIds = randomizeCharacters(scriptIds, playerCount);
    setSelectedIds(new Set(randomIds));
    // Reset duplicates and variable modifiers since randomize picks fresh
    setExtraVillageIdiots(0);
    setExtraLegionCopies(0);
    setVariableModifiers({});
    setXaanX(undefined);
  }, [scriptCharacters, playerCount]);

  // Group script characters by type (excluding setup powers and Travellers)
  const charsByType = useMemo(() => {
    const groups: Record<string, CharacterDef[]> = {};
    for (const type of TYPE_GROUP_ORDER) {
      groups[type] = [];
    }
    for (const ch of playerAssignableCharacters) {
      if (groups[ch.type]) {
        groups[ch.type].push(ch);
      }
    }
    return groups;
  }, [playerAssignableCharacters]);

  // Count selected by type (only non-Traveller), including duplicates
  const selectedCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const type of TYPE_GROUP_ORDER) {
      counts[type] = 0;
    }
    for (const id of selectedPlayerIds) {
      const ch = playerAssignableCharacters.find((c) => c.id === id);
      if (ch) {
        counts[ch.type] = (counts[ch.type] ?? 0) + 1;
        // Add duplicate copies
        if (ch.id === 'villageidiot') counts[ch.type] += extraVillageIdiots;
        if (ch.id === 'legion') counts[ch.type] += extraLegionCopies;
      }
    }
    return counts;
  }, [selectedPlayerIds, playerAssignableCharacters, extraVillageIdiots, extraLegionCopies]);

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

  const handleToggle = useCallback(
    (characterId: string) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(characterId)) {
          next.delete(characterId);
          // Reset duplicates when deselecting
          if (characterId === 'villageidiot') setExtraVillageIdiots(0);
          if (characterId === 'legion') setExtraLegionCopies(0);
          if (characterId === 'xaan') setXaanX(undefined);
          // Reset variable modifier when deselecting
          if (characterId in VARIABLE_MODIFIER_CONFIG) {
            setVariableModifiers((prev) => {
              const next = { ...prev };
              delete next[characterId];
              return next;
            });
          }
        } else {
          next.add(characterId);
        }
        return next;
      });
    },
    [setExtraVillageIdiots, setExtraLegionCopies, setXaanX],
  );

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
    // Build the full selected list including duplicate copies
    const ids = [...selectedPlayerIds];
    for (let i = 0; i < extraVillageIdiots; i++) {
      ids.push('villageidiot');
    }
    for (let i = 0; i < extraLegionCopies; i++) {
      ids.push('legion');
    }
    onConfirm(ids);
    onClose();
  }, [selectedPlayerIds, extraVillageIdiots, extraLegionCopies, onConfirm, onClose]);

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

  /** Total count of all selected characters including duplicates. */
  const totalSelected = selectedPlayerIds.length + extraVillageIdiots + extraLegionCopies;

  const dialogTitle = gameNumber ? `Game ${gameNumber}: Select Characters` : 'Select Characters';

  /** Render duplicate stepper for Village Idiot or Legion. */
  function renderDuplicateStepper(charId: string) {
    if (!DUPLICATE_ALLOWED_IDS.has(charId) || !selectedIds.has(charId)) return null;

    const isVI = charId === 'villageidiot';
    const count = isVI ? extraVillageIdiots : extraLegionCopies;
    const max = isVI ? 2 : playerCount - 1;
    const setCount = isVI ? setExtraVillageIdiots : setExtraLegionCopies;
    const label = isVI ? 'Village Idiot' : 'Legion';

    return (
      <Box
        sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 5, mb: 0.5 }}
        data-testid={`duplicate-stepper-${charId}`}
      >
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            setCount(Math.max(0, count - 1));
          }}
          disabled={count <= 0}
          aria-label={`Remove extra ${label}`}
        >
          <RemoveIcon fontSize="small" />
        </IconButton>
        <Typography variant="body2" sx={{ minWidth: 24, textAlign: 'center' }}>
          ×{1 + count}
        </Typography>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            setCount(Math.min(max, count + 1));
          }}
          disabled={count >= max}
          aria-label={`Add extra ${label}`}
        >
          <AddIcon fontSize="small" />
        </IconButton>
      </Box>
    );
  }

  /** Render outsider-adjustment stepper for a variable-modifier character. */
  function renderVariableModifierStepper(charId: string) {
    const config = VARIABLE_MODIFIER_CONFIG[charId];
    if (!config || !selectedIds.has(charId)) return null;

    const value = variableModifiers[charId] ?? 0;

    return (
      <Box
        sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 5, mb: 0.5 }}
        data-testid={`variable-stepper-${charId}`}
      >
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            setVariableModifiers((prev) => ({
              ...prev,
              [charId]: Math.max(config.min, value - 1),
            }));
          }}
          disabled={value <= config.min}
          aria-label={`Decrease ${config.label} outsider adjustment`}
        >
          <RemoveIcon fontSize="small" />
        </IconButton>
        <Typography variant="body2" sx={{ minWidth: 40, textAlign: 'center' }}>
          {value > 0 ? '+' : ''}
          {value} Out
        </Typography>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            setVariableModifiers((prev) => ({
              ...prev,
              [charId]: Math.min(config.max, value + 1),
            }));
          }}
          disabled={value >= config.max}
          aria-label={`Increase ${config.label} outsider adjustment`}
        >
          <AddIcon fontSize="small" />
        </IconButton>
      </Box>
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
      <DialogTitle sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography component="span" variant="h6" sx={{ flexGrow: 1 }}>
            {dialogTitle}
          </Typography>
          <Tooltip title="Randomize selection">
            <IconButton
              aria-label="Randomize character selection"
              onClick={handleRandomize}
              size="small"
              data-testid="randomize-button"
            >
              <CasinoIcon />
            </IconButton>
          </Tooltip>
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
        {/* Modifier chips — shown when setup-affecting characters are selected */}
        {adaptiveTargets.modifiers.length > 0 && (
          <Box
            sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1.5 }}
            data-testid="modifier-chips"
          >
            {adaptiveTargets.modifiers.map((mod) => (
              <Chip
                key={`${mod.characterId}-${mod.description}`}
                label={`⚠️ ${mod.characterName}: ${mod.description}`}
                size="small"
                variant="outlined"
                color="warning"
                data-testid={`modifier-chip-${mod.characterId}`}
              />
            ))}
          </Box>
        )}

        {/* Adaptive warnings */}
        {adaptiveTargets.warnings.length > 0 && (
          <Box sx={{ mb: 1.5 }} data-testid="adaptive-warnings">
            {adaptiveTargets.warnings.map((w, i) => (
              <Typography key={i} variant="body2" color="warning.main" sx={{ mb: 0.5 }}>
                ⚠️ {w}
              </Typography>
            ))}
          </Box>
        )}

        {/* Xaan X input — shown when Xaan is selected */}
        {selectedIds.has('xaan') && (
          <Box
            sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}
            data-testid="xaan-input"
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Xaan — Choose X:
            </Typography>
            <TextField
              type="number"
              size="small"
              value={xaanX ?? ''}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setXaanX(isNaN(val) ? undefined : Math.max(0, val));
              }}
              slotProps={{ htmlInput: { min: 0, max: 15, 'aria-label': 'Xaan X value' } }}
              sx={{ width: 80 }}
              placeholder="X"
            />
          </Box>
        )}

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
                          alignment={ch.defaultAlignment}
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
                      {renderDuplicateStepper(ch.id)}
                      {renderVariableModifierStepper(ch.id)}
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
