import { useState, useMemo, useCallback } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CasinoIcon from '@mui/icons-material/Casino';
import CloseIcon from '@mui/icons-material/Close';
import type { PlayerSeat, CharacterDef } from '@/types/index.ts';
import {
  getDistribution,
  getDistributionWarnings,
  getDistributionSuggestions,
} from '@/data/playerCountRules.ts';
import type { Distribution } from '@/data/playerCountRules.ts';
import { randomlyAssignCharacters } from '@/utils/characterAssignment.ts';
import { getCharacterTypeColor } from '@/components/common/characterTypeColor.ts';

export interface CharacterAssignmentDialogProps {
  open: boolean;
  onClose: () => void;
  players: PlayerSeat[];
  scriptCharacters: CharacterDef[];
  onConfirm: (updatedPlayers: PlayerSeat[]) => void;
}

/**
 * Full-screen dialog for assigning characters to players before the first night.
 *
 * Shows:
 * - The current player list with seats
 * - The distribution rule for the current player count
 * - Manual override inputs for the distribution
 * - "Randomize" button for auto-assignment
 * - Per-player dropdown for manual character selection
 * - "Confirm" button to save assignments
 */
export function CharacterAssignmentDialog({
  open,
  onClose,
  players,
  scriptCharacters,
  onConfirm,
}: CharacterAssignmentDialogProps) {
  const nonTravellers = useMemo(() => players.filter((p) => !p.isTraveller), [players]);
  const baseDistribution = useMemo(
    () => getDistribution(nonTravellers.length),
    [nonTravellers.length],
  );

  const [distribution, setDistribution] = useState<Distribution>(baseDistribution);
  const [localPlayers, setLocalPlayers] = useState<PlayerSeat[]>([...players]);
  const [error, setError] = useState<string | null>(null);

  // IDs of characters that allow duplicates (e.g. Legion)
  const duplicateAllowedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const ch of scriptCharacters) {
      if (ch.id === 'legion') ids.add(ch.id);
    }
    return ids;
  }, [scriptCharacters]);

  const scriptCharacterIds = useMemo(() => scriptCharacters.map((c) => c.id), [scriptCharacters]);

  // Script-aware distribution suggestions
  const suggestions = useMemo(
    () => getDistributionSuggestions(scriptCharacterIds, baseDistribution),
    [scriptCharacterIds, baseDistribution],
  );

  // Distribution warnings (soft, not blocking)
  const warnings = useMemo(
    () => getDistributionWarnings(distribution, scriptCharacterIds),
    [distribution, scriptCharacterIds],
  );

  // Reset state when dialog opens
  const handleEnter = useCallback(() => {
    setDistribution(getDistribution(players.filter((p) => !p.isTraveller).length));
    setLocalPlayers([...players]);
    setError(null);
  }, [players]);

  // Group script characters by type
  const charsByType = useMemo(() => {
    const groups: Record<string, CharacterDef[]> = {
      Townsfolk: [],
      Outsider: [],
      Minion: [],
      Demon: [],
    };
    for (const ch of scriptCharacters) {
      if (groups[ch.type]) {
        groups[ch.type].push(ch);
      }
    }
    return groups;
  }, [scriptCharacters]);

  // Track which characters are already assigned (excluding duplicate-allowed ones)
  const assignedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const p of localPlayers) {
      if (p.characterId && !duplicateAllowedIds.has(p.characterId)) {
        ids.add(p.characterId);
      }
    }
    return ids;
  }, [localPlayers, duplicateAllowedIds]);

  const handleDistributionChange = (key: keyof Distribution, value: number) => {
    setDistribution((prev) => ({ ...prev, [key]: Math.max(0, value) }));
  };

  const handleRandomize = () => {
    setError(null);
    try {
      const result = randomlyAssignCharacters(localPlayers, scriptCharacters, distribution);
      setLocalPlayers(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to randomize');
    }
  };

  const handleCharacterChange = (seat: number, characterId: string) => {
    const charDef = scriptCharacters.find((c) => c.id === characterId);
    setLocalPlayers((prev) =>
      prev.map((p) => {
        if (p.seat !== seat || p.isTraveller) return p;
        const alignment = charDef?.type === 'Minion' || charDef?.type === 'Demon' ? 'Evil' : 'Good';
        return {
          ...p,
          characterId,
          actualAlignment: alignment,
          startingAlignment: alignment,
        };
      }),
    );
  };

  const handleConfirm = () => {
    onConfirm(localPlayers);
    onClose();
  };

  const totalAssigned =
    distribution.townsfolk + distribution.outsiders + distribution.minions + distribution.demons;
  const expectedCount = nonTravellers.length;

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
          Assign Characters
        </Typography>
        <IconButton aria-label="close" onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* Distribution Rule */}
        <Typography variant="subtitle2" gutterBottom>
          Distribution ({nonTravellers.length} players)
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          {(
            [
              ['townsfolk', 'Townsfolk'],
              ['outsiders', 'Outsider'],
              ['minions', 'Minion'],
              ['demons', 'Demon'],
            ] as const
          ).map(([key, label]) => (
            <TextField
              key={key}
              label={label}
              type="number"
              size="small"
              value={distribution[key]}
              onChange={(e) => handleDistributionChange(key, parseInt(e.target.value, 10) || 0)}
              slotProps={{ htmlInput: { min: 0, max: 20 } }}
              sx={{ width: 90 }}
            />
          ))}
        </Box>

        {totalAssigned !== expectedCount && (
          <Typography variant="body2" color="warning.main" sx={{ mb: 1 }}>
            Distribution total ({totalAssigned}) ≠ player count ({expectedCount})
          </Typography>
        )}

        {/* Script-aware distribution suggestions */}
        {suggestions.map((s, i) => (
          <Alert key={`suggestion-${i}`} severity="info" sx={{ mb: 1 }}>
            {s.reason}
          </Alert>
        ))}

        {/* Distribution warnings (soft, not blocking) */}
        {warnings.map((w, i) => (
          <Alert key={`warning-${i}`} severity={w.severity} sx={{ mb: 1 }}>
            {w.message}
          </Alert>
        ))}

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button variant="outlined" startIcon={<CasinoIcon />} onClick={handleRandomize}>
            Randomize
          </Button>
        </Box>

        {error && (
          <Typography variant="body2" color="error" sx={{ mb: 1 }}>
            {error}
          </Typography>
        )}

        <Divider sx={{ mb: 2 }} />

        {/* Available Characters Summary */}
        <Typography variant="subtitle2" gutterBottom>
          Available Characters
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
          {(['Townsfolk', 'Outsider', 'Minion', 'Demon'] as const).map((type) => (
            <Chip
              key={type}
              label={`${type}: ${charsByType[type]?.length ?? 0}`}
              size="small"
              sx={{
                backgroundColor: `${getCharacterTypeColor(type)}22`,
                color: getCharacterTypeColor(type),
                fontWeight: 600,
              }}
            />
          ))}
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Player Assignments */}
        <Typography variant="subtitle2" gutterBottom>
          Player Assignments
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {localPlayers
            .filter((p) => !p.isTraveller)
            .map((player) => (
              <Box key={player.seat} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={player.seat}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ minWidth: 32 }}
                />
                <Typography variant="body2" sx={{ minWidth: 90, flexShrink: 0 }} noWrap>
                  {player.playerName}
                </Typography>
                <FormControl size="small" fullWidth>
                  <InputLabel id={`char-select-${player.seat}`}>Character</InputLabel>
                  <Select
                    labelId={`char-select-${player.seat}`}
                    value={player.characterId}
                    label="Character"
                    onChange={(e) => handleCharacterChange(player.seat, e.target.value)}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {scriptCharacters
                      .filter(
                        (c) => c.type !== 'Traveller' && c.type !== 'Fabled' && c.type !== 'Loric',
                      )
                      .map((c) => (
                        <MenuItem
                          key={c.id}
                          value={c.id}
                          disabled={
                            assignedIds.has(c.id) &&
                            player.characterId !== c.id &&
                            !duplicateAllowedIds.has(c.id)
                          }
                          sx={{
                            color: getCharacterTypeColor(c.type),
                            opacity:
                              assignedIds.has(c.id) &&
                              player.characterId !== c.id &&
                              !duplicateAllowedIds.has(c.id)
                                ? 0.4
                                : 1,
                          }}
                        >
                          {c.name} ({c.type})
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Box>
            ))}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleConfirm}>
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
}
