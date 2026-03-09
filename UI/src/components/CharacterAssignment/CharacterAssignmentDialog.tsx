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
import Typography from '@mui/material/Typography';
import CasinoIcon from '@mui/icons-material/Casino';
import CloseIcon from '@mui/icons-material/Close';
import PersonPinIcon from '@mui/icons-material/PersonPin';
import type { PlayerSeat, CharacterDef } from '@/types/index.ts';
import {
  getDistribution,
  getDistributionWarnings,
  getDistributionSuggestions,
} from '@/data/playerCountRules.ts';
import type { Distribution } from '@/data/playerCountRules.ts';
import { randomlyAssignCharacters } from '@/utils/characterAssignment.ts';
import { getCharacterTypeColor } from '@/components/common/characterTypeColor.ts';
import { getSetupModifiers, getNetAdjustment } from '@/utils/setupModifiers.ts';
import { getRequiredCharacters, getSetupPrompts } from '@/utils/requiredCharacters.ts';
import { getSeatingWarnings, getMarionetteValidSeats } from '@/utils/seatingConstraints.ts';

/** Characters that trigger identity concealment prompts on assignment. */
const CONCEALMENT_CHARACTERS = new Set(['marionette', 'drunk']);

export interface CharacterAssignmentDialogProps {
  open: boolean;
  onClose: () => void;
  players: PlayerSeat[];
  scriptCharacters: CharacterDef[];
  onConfirm: (updatedPlayers: PlayerSeat[]) => void;
  /** Character IDs selected as in-play (from CharacterSelection). */
  inPlayCharacterIds?: string[];
}

/**
 * Full-screen dialog for assigning characters to players before the first night.
 *
 * Features:
 * - Character pool at top: unassigned characters shown as tappable chips
 * - Tap-to-assign: tap a chip then tap a seat to assign
 * - Dropdown fallback for accessibility
 * - Seating constraint warnings (Marionette adjacency, Lord of Typhon line)
 * - Identity concealment prompts (Marionette, Drunk)
 * - Randomize with best-effort constraint awareness
 */
export function CharacterAssignmentDialog({
  open,
  onClose,
  players,
  scriptCharacters,
  onConfirm,
  inPlayCharacterIds,
}: CharacterAssignmentDialogProps) {
  const nonTravellers = useMemo(() => players.filter((p) => !p.isTraveller), [players]);
  const baseDistribution = useMemo(
    () => getDistribution(nonTravellers.length),
    [nonTravellers.length],
  );

  const [distribution, setDistribution] = useState<Distribution>(baseDistribution);
  const [localPlayers, setLocalPlayers] = useState<PlayerSeat[]>([...players]);
  const [error, setError] = useState<string | null>(null);
  const [selectedChipId, setSelectedChipId] = useState<string | null>(null);

  // Characters available for assignment (in-play or all script chars)
  const availableCharacters = useMemo(() => {
    if (inPlayCharacterIds && inPlayCharacterIds.length > 0) {
      // Use in-play character list (which may contain duplicates)
      return inPlayCharacterIds
        .map((id) => scriptCharacters.find((c) => c.id === id))
        .filter((c): c is CharacterDef => c !== undefined);
    }
    return scriptCharacters.filter(
      (c) => c.type !== 'Traveller' && c.type !== 'Fabled' && c.type !== 'Loric',
    );
  }, [scriptCharacters, inPlayCharacterIds]);

  // IDs of characters that allow duplicates (from inPlayCharacterIds duplicates)
  const duplicateAllowedIds = useMemo(() => {
    const ids = new Set<string>();
    if (inPlayCharacterIds) {
      const seen = new Set<string>();
      for (const id of inPlayCharacterIds) {
        if (seen.has(id)) ids.add(id);
        seen.add(id);
      }
    }
    // Always allow Legion duplicates
    for (const ch of scriptCharacters) {
      if (ch.id === 'legion') ids.add(ch.id);
    }
    return ids;
  }, [scriptCharacters, inPlayCharacterIds]);

  const scriptCharacterIds = useMemo(() => scriptCharacters.map((c) => c.id), [scriptCharacters]);

  // Script-aware distribution suggestions
  const suggestions = useMemo(
    () => getDistributionSuggestions(scriptCharacterIds, baseDistribution),
    [scriptCharacterIds, baseDistribution],
  );

  // Distribution warnings (soft, not blocking)
  const distWarnings = useMemo(
    () => getDistributionWarnings(distribution, scriptCharacterIds),
    [distribution, scriptCharacterIds],
  );

  // Setup modifiers (Baron +2 Outsiders, etc.)
  const setupModifiers = useMemo(() => getSetupModifiers(scriptCharacterIds), [scriptCharacterIds]);
  const netAdjustment = useMemo(() => getNetAdjustment(setupModifiers), [setupModifiers]);

  // Required character detection (Choirboy → King, etc.)
  const requiredCharacters = useMemo(
    () => getRequiredCharacters(scriptCharacterIds),
    [scriptCharacterIds],
  );

  // Setup prompts (Bounty Hunter evil townsfolk designation, etc.)
  const setupPrompts = useMemo(() => getSetupPrompts(scriptCharacterIds), [scriptCharacterIds]);

  // Seating constraint warnings
  const seatingWarnings = useMemo(() => getSeatingWarnings(localPlayers), [localPlayers]);

  // Marionette valid seats (for highlighting)
  const marionetteSeats = useMemo(() => {
    const hasMarionette = availableCharacters.some((c) => c.id === 'marionette');
    if (!hasMarionette) return [];
    return getMarionetteValidSeats(localPlayers);
  }, [localPlayers, availableCharacters]);

  // Track which characters are assigned (as a count map for duplicate support)
  const assignedCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of localPlayers) {
      if (p.characterId && !p.isTraveller) {
        counts.set(p.characterId, (counts.get(p.characterId) ?? 0) + 1);
      }
    }
    return counts;
  }, [localPlayers]);

  // Unassigned character pool (chips)
  const unassignedPool = useMemo(() => {
    const pool: CharacterDef[] = [];
    const remainingCounts = new Map<string, number>();

    // Count how many of each character should be in pool
    for (const ch of availableCharacters) {
      remainingCounts.set(ch.id, (remainingCounts.get(ch.id) ?? 0) + 1);
    }

    // Subtract assigned counts
    for (const [id, assigned] of assignedCounts) {
      const remaining = (remainingCounts.get(id) ?? 0) - assigned;
      if (remaining <= 0) {
        remainingCounts.delete(id);
      } else {
        remainingCounts.set(id, remaining);
      }
    }

    // Build pool
    const seen = new Map<string, number>();
    for (const ch of availableCharacters) {
      const remaining = remainingCounts.get(ch.id) ?? 0;
      const alreadyAdded = seen.get(ch.id) ?? 0;
      if (alreadyAdded < remaining) {
        pool.push(ch);
        seen.set(ch.id, alreadyAdded + 1);
      }
    }

    return pool;
  }, [availableCharacters, assignedCounts]);

  // Reset state when dialog opens
  const handleEnter = useCallback(() => {
    setDistribution(getDistribution(players.filter((p) => !p.isTraveller).length));
    setLocalPlayers([...players]);
    setError(null);
    setSelectedChipId(null);
  }, [players]);

  // Group script characters by type (for dropdown)
  const charsByType = useMemo(() => {
    const groups: Record<string, CharacterDef[]> = {
      Townsfolk: [],
      Outsider: [],
      Minion: [],
      Demon: [],
    };
    for (const ch of availableCharacters) {
      if (groups[ch.type]) {
        groups[ch.type].push(ch);
      }
    }
    return groups;
  }, [availableCharacters]);

  const handleRandomize = () => {
    setError(null);
    try {
      const result = randomlyAssignCharacters(localPlayers, scriptCharacters, distribution);
      setLocalPlayers(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to randomize');
    }
  };

  const handleCharacterChange = useCallback(
    (seat: number, characterId: string) => {
      const charDef = scriptCharacters.find((c) => c.id === characterId);
      setLocalPlayers((prev) =>
        prev.map((p) => {
          if (p.seat !== seat || p.isTraveller) return p;
          const alignment =
            charDef?.type === 'Minion' || charDef?.type === 'Demon' ? 'Evil' : 'Good';
          return {
            ...p,
            characterId,
            actualAlignment: alignment,
            startingAlignment: alignment,
          };
        }),
      );
    },
    [scriptCharacters],
  );

  // Tap-to-assign: select a chip, then assign to seat
  const handleChipClick = useCallback((characterId: string) => {
    setSelectedChipId((prev) => (prev === characterId ? null : characterId));
  }, []);

  const handleSeatClick = useCallback(
    (seat: number) => {
      if (!selectedChipId) return;
      handleCharacterChange(seat, selectedChipId);
      setSelectedChipId(null);
    },
    [selectedChipId, handleCharacterChange],
  );

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
        {/* Character Pool — unassigned characters as tappable chips */}
        {unassignedPool.length > 0 && (
          <>
            <Typography variant="subtitle2" gutterBottom>
              Unassigned Characters
            </Typography>
            <Box
              sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1.5 }}
              data-testid="character-pool"
            >
              {unassignedPool.map((ch, idx) => (
                <Chip
                  key={`${ch.id}-${idx}`}
                  label={ch.name}
                  size="small"
                  icon={<PersonPinIcon />}
                  onClick={() => handleChipClick(ch.id)}
                  variant={selectedChipId === ch.id ? 'filled' : 'outlined'}
                  color={selectedChipId === ch.id ? 'primary' : 'default'}
                  data-testid={`pool-chip-${ch.id}`}
                  sx={{
                    borderColor: getCharacterTypeColor(ch.type),
                    color: selectedChipId === ch.id ? undefined : getCharacterTypeColor(ch.type),
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                />
              ))}
            </Box>
            {selectedChipId && (
              <Typography variant="body2" color="primary" sx={{ mb: 1 }}>
                Tap a seat below to assign{' '}
                {scriptCharacters.find((c) => c.id === selectedChipId)?.name ?? selectedChipId}
              </Typography>
            )}
            <Divider sx={{ mb: 2 }} />
          </>
        )}

        {/* Seating constraint warnings */}
        {seatingWarnings.map((w, i) => (
          <Alert
            key={`seat-warning-${i}`}
            severity="warning"
            sx={{ mb: 1 }}
            data-testid={`seating-warning-${w.characterId}`}
          >
            ⚠️ {w.characterName}: {w.message}
          </Alert>
        ))}

        {/* Marionette valid seats hint */}
        {marionetteSeats.length > 0 && selectedChipId === 'marionette' && (
          <Alert severity="info" sx={{ mb: 1 }} data-testid="marionette-hint">
            💡 Seats adjacent to Demon: {marionetteSeats.join(', ')}
          </Alert>
        )}

        {/* Identity concealment prompts */}
        {localPlayers
          .filter((p) => CONCEALMENT_CHARACTERS.has(p.characterId) && !p.apparentCharacterId)
          .map((p) => (
            <Alert
              key={`conceal-${p.seat}`}
              severity="info"
              sx={{ mb: 1 }}
              data-testid={`concealment-prompt-${p.characterId}`}
            >
              📋 {p.playerName} (Seat {p.seat}):{' '}
              {p.characterId === 'marionette'
                ? 'Choose which good character the Marionette believes they are'
                : 'Choose which Townsfolk the Drunk believes they are'}
            </Alert>
          ))}

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
            <Chip
              key={key}
              label={`${label}: ${distribution[key]}`}
              size="small"
              sx={{
                backgroundColor: `${getCharacterTypeColor(label)}22`,
                color: getCharacterTypeColor(label),
                fontWeight: 600,
              }}
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
        {distWarnings.map((w, i) => (
          <Alert key={`warning-${i}`} severity={w.severity} sx={{ mb: 1 }}>
            {w.message}
          </Alert>
        ))}

        {/* Setup distribution modifiers */}
        {setupModifiers.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1.5 }}>
            {setupModifiers.map((m) => (
              <Chip
                key={`${m.characterId}-${m.type}`}
                label={`${m.characterName}: ${m.description}`}
                size="small"
                variant="outlined"
                color="warning"
              />
            ))}
          </Box>
        )}

        {/* Net adjustments */}
        {typeof netAdjustment.outsiders === 'number' && netAdjustment.outsiders !== 0 && (
          <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600 }}>
            Net Outsider adjustment: {netAdjustment.outsiders > 0 ? '+' : ''}
            {netAdjustment.outsiders}
          </Typography>
        )}
        {netAdjustment.outsiders === 'variable' && (
          <Typography variant="body2" sx={{ mb: 0.5, fontStyle: 'italic' }}>
            Net Outsider adjustment is variable — Storyteller decides
          </Typography>
        )}
        {typeof netAdjustment.minions === 'number' && netAdjustment.minions !== 0 && (
          <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600 }}>
            Net Minion adjustment: {netAdjustment.minions > 0 ? '+' : ''}
            {netAdjustment.minions}
          </Typography>
        )}
        {netAdjustment.minions === 'variable' && (
          <Typography variant="body2" sx={{ mb: 0.5, fontStyle: 'italic' }}>
            Net Minion adjustment is variable — Storyteller decides
          </Typography>
        )}

        {/* Required character warnings */}
        {requiredCharacters.map((req) => (
          <Alert key={`req-${req.sourceCharacterId}`} severity="warning" sx={{ mb: 1 }}>
            ⚠️ {req.reason}
          </Alert>
        ))}

        {/* Setup prompts (e.g. Bounty Hunter evil townsfolk) */}
        {setupPrompts.map((sp) => (
          <Alert key={`prompt-${sp.characterId}`} severity="info" sx={{ mb: 1 }}>
            📋 {sp.characterName}: {sp.prompt}
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
            .map((player) => {
              const isMarionetteValid =
                selectedChipId === 'marionette' && marionetteSeats.includes(player.seat);
              return (
                <Box
                  key={player.seat}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    cursor: selectedChipId ? 'pointer' : 'default',
                    borderRadius: 1,
                    p: 0.5,
                    backgroundColor: isMarionetteValid ? 'success.light' : undefined,
                    border: selectedChipId && !player.characterId ? '1px dashed' : undefined,
                    borderColor: selectedChipId ? 'primary.main' : undefined,
                    '&:hover': selectedChipId ? { backgroundColor: 'action.hover' } : undefined,
                  }}
                  onClick={() => handleSeatClick(player.seat)}
                  data-testid={`seat-row-${player.seat}`}
                >
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
                          (c) =>
                            c.type !== 'Traveller' && c.type !== 'Fabled' && c.type !== 'Loric',
                        )
                        .map((c) => {
                          const assignedCount = assignedCounts.get(c.id) ?? 0;
                          const isCurrentPlayer = player.characterId === c.id;
                          const isDuplicate = duplicateAllowedIds.has(c.id);
                          const isDisabled = assignedCount > 0 && !isCurrentPlayer && !isDuplicate;
                          return (
                            <MenuItem
                              key={c.id}
                              value={c.id}
                              disabled={isDisabled}
                              sx={{
                                color: getCharacterTypeColor(c.type),
                                opacity: isDisabled ? 0.4 : 1,
                              }}
                            >
                              {c.name} ({c.type})
                            </MenuItem>
                          );
                        })}
                    </Select>
                  </FormControl>
                </Box>
              );
            })}
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
