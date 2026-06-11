import { useState, useMemo, useCallback } from 'react';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
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
import type {
  CharacterDef,
  Participant,
  Player,
  PlayerGameState,
  PlayerId,
  Slot,
} from '@/types/index.ts';
import { Alignment, CharacterType } from '@/types/index.ts';
import {
  getDistribution,
  getDistributionWarnings,
  getDistributionSuggestions,
} from '@/data/playerCountRules.ts';
import { getCharacterTypeColor } from '@/components/common/characterTypeColor.ts';
import { getSetupModifiers, getNetAdjustment } from '@/utils/setupModifiers.ts';
import { getRequiredCharacters, getSetupPrompts } from '@/utils/requiredCharacters.ts';
import { getSeatingWarnings, getMarionetteValidSeats } from '@/utils/seatingConstraints.ts';
import { getDefaultCharacterIconPath } from '@/utils/characterIcon.ts';
import {
  filterPlayerAssignableCharacters,
  randomlyAssignCharacters,
} from '@/utils/characterAssignment.ts';
import { buildDisplaySeatNumberMap } from '@/utils/seating/index.ts';
import { ApparentCharacterDialog } from '@/components/Setup/ApparentCharacterDialog.tsx';

/** Characters that trigger identity concealment prompts on assignment. */
const CONCEALMENT_CHARACTERS = new Set(['marionette', 'drunk']);

/** Sort order for character types in chips and dropdowns. */
const TYPE_SORT_ORDER: Record<string, number> = {
  Townsfolk: 0,
  Outsider: 1,
  Minion: 2,
  Demon: 3,
};

interface AssignmentParticipant {
  playerId: PlayerId;
  isTraveller: boolean;
  name: string;
  seatNumber: number | null;
  state: PlayerGameState;
}

/** Sort characters by type (Townsfolk→Outsider→Minion→Demon) then alphabetically. */
function sortByTypeAndName(a: CharacterDef, b: CharacterDef): number {
  const typeA = TYPE_SORT_ORDER[a.type] ?? 99;
  const typeB = TYPE_SORT_ORDER[b.type] ?? 99;
  if (typeA !== typeB) return typeA - typeB;
  return a.name.localeCompare(b.name);
}

function alignmentForCharacter(character: CharacterDef): Alignment {
  return character.type === CharacterType.Minion || character.type === CharacterType.Demon
    ? Alignment.Evil
    : Alignment.Good;
}

function sanitizePlayersForCharacterPool(
  playerState: Record<PlayerId, PlayerGameState>,
  availableCharacters: CharacterDef[],
): Record<PlayerId, PlayerGameState> {
  const allowedIds = new Set(availableCharacters.map((character) => character.id));
  const sanitized: Record<PlayerId, PlayerGameState> = {};
  for (const [playerId, state] of Object.entries(playerState)) {
    sanitized[playerId] =
      state.characterId && !allowedIds.has(state.characterId)
        ? { ...state, characterId: '' }
        : { ...state };
  }
  return sanitized;
}

export interface CharacterAssignmentDialogProps {
  open: boolean;
  onClose: () => void;
  slots: Slot[];
  participants: Participant[];
  playerState: Record<PlayerId, PlayerGameState>;
  sessionPlayers: Player[];
  playerCountOverride: number | null;
  scriptCharacters: CharacterDef[];
  onConfirm: (updatedPlayerState: Record<PlayerId, PlayerGameState>) => void;
  onPlayerCountChange: (value: number | null) => void;
  /** Character IDs selected as in-play (from CharacterSelection). */
  inPlayCharacterIds?: string[];
}

/**
 * Full-screen dialog for assigning characters to participants before the first night.
 */
export function CharacterAssignmentDialog({
  open,
  onClose,
  slots,
  participants,
  playerState,
  sessionPlayers,
  playerCountOverride,
  scriptCharacters,
  onConfirm,
  onPlayerCountChange,
  inPlayCharacterIds,
}: CharacterAssignmentDialogProps) {
  const [localPlayerState, setLocalPlayerState] = useState<Record<PlayerId, PlayerGameState>>({});
  const [error, setError] = useState<string | null>(null);
  const [selectedChipId, setSelectedChipId] = useState<string | null>(null);
  const [apparentDialogPlayerId, setApparentDialogPlayerId] = useState<PlayerId | null>(null);

  const participantCount = participants.length;
  const effectivePlayerCount = playerCountOverride ?? participantCount;
  const distribution = useMemo(() => getDistribution(effectivePlayerCount), [effectivePlayerCount]);

  const availableCharacters = useMemo(() => {
    if (inPlayCharacterIds && inPlayCharacterIds.length > 0) {
      return filterPlayerAssignableCharacters(
        inPlayCharacterIds
          .map((id) => scriptCharacters.find((c) => c.id === id))
          .filter((c): c is CharacterDef => c !== undefined),
      );
    }
    return filterPlayerAssignableCharacters(scriptCharacters);
  }, [scriptCharacters, inPlayCharacterIds]);

  const handleEnter = useCallback(() => {
    setLocalPlayerState(sanitizePlayersForCharacterPool(playerState, availableCharacters));
    setError(null);
    setSelectedChipId(null);
    setApparentDialogPlayerId(null);
  }, [playerState, availableCharacters]);

  const sessionPlayerById = useMemo(
    () => new Map(sessionPlayers.map((player) => [player.id, player])),
    [sessionPlayers],
  );

  const seatNumberByPlayerId = useMemo(() => {
    const displayMap = buildDisplaySeatNumberMap(slots);
    const map = new Map<PlayerId, number>();
    for (const slot of slots) {
      if (slot.kind === 'seat' && slot.playerId) {
        const displayNumber = displayMap.get(slot.id);
        if (displayNumber !== undefined) map.set(slot.playerId, displayNumber);
      }
    }
    return map;
  }, [slots]);

  const assignmentParticipants = useMemo<AssignmentParticipant[]>(
    () =>
      participants
        .map((participant) => ({
          ...participant,
          name: sessionPlayerById.get(participant.playerId)?.name ?? 'Unknown player',
          seatNumber: seatNumberByPlayerId.get(participant.playerId) ?? null,
          state: localPlayerState[participant.playerId] ?? playerState[participant.playerId],
        }))
        .sort((a, b) => {
          if (a.seatNumber !== null && b.seatNumber !== null) return a.seatNumber - b.seatNumber;
          if (a.seatNumber !== null) return -1;
          if (b.seatNumber !== null) return 1;
          return (
            indexForParticipant(participants, a.playerId) -
            indexForParticipant(participants, b.playerId)
          );
        }),
    [participants, sessionPlayerById, seatNumberByPlayerId, localPlayerState, playerState],
  );

  const nonTravellerParticipants = useMemo(
    () => assignmentParticipants.filter((participant) => !participant.isTraveller),
    [assignmentParticipants],
  );

  const duplicateAllowedIds = useMemo(() => {
    const ids = new Set<string>();
    if (inPlayCharacterIds) {
      const seen = new Set<string>();
      for (const id of inPlayCharacterIds) {
        if (seen.has(id)) ids.add(id);
        seen.add(id);
      }
    }
    for (const ch of scriptCharacters) {
      if (ch.id === 'legion') ids.add(ch.id);
    }
    return ids;
  }, [scriptCharacters, inPlayCharacterIds]);

  const scriptCharacterIds = useMemo(() => scriptCharacters.map((c) => c.id), [scriptCharacters]);

  const suggestions = useMemo(
    () => getDistributionSuggestions(scriptCharacterIds, distribution),
    [scriptCharacterIds, distribution],
  );

  const distWarnings = useMemo(
    () => getDistributionWarnings(distribution, scriptCharacterIds),
    [distribution, scriptCharacterIds],
  );

  const setupModifiers = useMemo(() => getSetupModifiers(scriptCharacterIds), [scriptCharacterIds]);
  const netAdjustment = useMemo(() => getNetAdjustment(setupModifiers), [setupModifiers]);

  const requiredCharacters = useMemo(
    () => getRequiredCharacters(scriptCharacterIds),
    [scriptCharacterIds],
  );

  const setupPrompts = useMemo(() => getSetupPrompts(scriptCharacterIds), [scriptCharacterIds]);

  const seatingWarnings = useMemo(
    () => getSeatingWarnings(slots, localPlayerState),
    [slots, localPlayerState],
  );

  const marionetteSeats = useMemo(() => {
    const hasMarionette = availableCharacters.some((c) => c.id === 'marionette');
    if (!hasMarionette) return [];
    return getMarionetteValidSeats(slots, localPlayerState);
  }, [slots, localPlayerState, availableCharacters]);

  const assignedCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const participant of nonTravellerParticipants) {
      const characterId = participant.state?.characterId;
      if (characterId) counts.set(characterId, (counts.get(characterId) ?? 0) + 1);
    }
    return counts;
  }, [nonTravellerParticipants]);

  const unassignedPool = useMemo(() => {
    const pool: CharacterDef[] = [];
    const remainingCounts = new Map<string, number>();

    for (const ch of availableCharacters) {
      remainingCounts.set(ch.id, (remainingCounts.get(ch.id) ?? 0) + 1);
    }

    for (const [id, assigned] of assignedCounts) {
      const remaining = (remainingCounts.get(id) ?? 0) - assigned;
      if (remaining <= 0) {
        remainingCounts.delete(id);
      } else {
        remainingCounts.set(id, remaining);
      }
    }

    const seen = new Map<string, number>();
    for (const ch of availableCharacters) {
      const remaining = remainingCounts.get(ch.id) ?? 0;
      const alreadyAdded = seen.get(ch.id) ?? 0;
      if (alreadyAdded < remaining) {
        pool.push(ch);
        seen.set(ch.id, alreadyAdded + 1);
      }
    }

    return [...pool].sort(sortByTypeAndName);
  }, [availableCharacters, assignedCounts]);

  const totalAvailableCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const ch of availableCharacters) {
      counts.set(ch.id, (counts.get(ch.id) ?? 0) + 1);
    }
    return counts;
  }, [availableCharacters]);

  const dropdownCharacters = useMemo(() => {
    const source = inPlayCharacterIds
      ? availableCharacters
      : filterPlayerAssignableCharacters(scriptCharacters);
    const seen = new Set<string>();
    const deduped = source.filter((c) => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
    return [...deduped].sort(sortByTypeAndName);
  }, [inPlayCharacterIds, availableCharacters, scriptCharacters]);

  const handleRandomize = () => {
    setError(null);
    try {
      setLocalPlayerState((prev) =>
        randomlyAssignCharacters(participants, prev, availableCharacters, distribution),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to randomize characters');
    }
  };

  const handleClearAll = () => {
    setError(null);
    setLocalPlayerState((prev) => {
      const next = { ...prev };
      for (const participant of participants) {
        const current = next[participant.playerId];
        if (current) {
          next[participant.playerId] = {
            ...current,
            characterId: '',
            apparentCharacterId: '',
          };
        }
      }
      return next;
    });
  };

  const handleCharacterChange = useCallback(
    (playerId: PlayerId, characterId: string) => {
      const charDef = scriptCharacters.find((c) => c.id === characterId);
      setLocalPlayerState((prev) => {
        const current = prev[playerId];
        if (!current) return prev;
        if (!characterId || !charDef) {
          return { ...prev, [playerId]: { ...current, characterId, apparentCharacterId: '' } };
        }
        const alignment = alignmentForCharacter(charDef);
        return {
          ...prev,
          [playerId]: {
            ...current,
            characterId,
            actualAlignment: alignment,
            startingAlignment: alignment,
            apparentCharacterId: CONCEALMENT_CHARACTERS.has(characterId)
              ? current.apparentCharacterId
              : '',
          },
        };
      });
    },
    [scriptCharacters],
  );

  const handleChipClick = useCallback((characterId: string) => {
    setSelectedChipId((prev) => (prev === characterId ? null : characterId));
  }, []);

  const handleSeatClick = useCallback(
    (playerId: PlayerId) => {
      if (!selectedChipId) return;
      handleCharacterChange(playerId, selectedChipId);
      setSelectedChipId(null);
    },
    [selectedChipId, handleCharacterChange],
  );

  const handleApparentConfirm = useCallback((playerId: PlayerId, apparentCharacterId: string) => {
    setLocalPlayerState((prev) => {
      const current = prev[playerId];
      if (!current) return prev;
      return { ...prev, [playerId]: { ...current, apparentCharacterId } };
    });
  }, []);

  const handlePlayerCountChange = (rawValue: string) => {
    const parsed = Number.parseInt(rawValue, 10);
    if (!Number.isFinite(parsed) || parsed < 0) return;
    onPlayerCountChange(parsed);
  };

  const handleConfirm = () => {
    onConfirm(localPlayerState);
    onClose();
  };

  const apparentDialogParticipant = apparentDialogPlayerId
    ? (assignmentParticipants.find(
        (participant) => participant.playerId === apparentDialogPlayerId,
      ) ?? null)
    : null;
  const apparentDialogCharacter = apparentDialogParticipant?.state.characterId
    ? scriptCharacters.find(
        (character) => character.id === apparentDialogParticipant.state.characterId,
      )
    : undefined;

  const totalAssigned =
    distribution.townsfolk + distribution.outsiders + distribution.minions + distribution.demons;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{ transition: { onEnter: handleEnter } }}
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

        {marionetteSeats.length > 0 && selectedChipId === 'marionette' && (
          <Alert severity="info" sx={{ mb: 1 }} data-testid="marionette-hint">
            💡 Seats adjacent to Demon: {marionetteSeats.join(', ')}
          </Alert>
        )}

        {nonTravellerParticipants
          .filter(
            (participant) =>
              CONCEALMENT_CHARACTERS.has(participant.state.characterId) &&
              !participant.state.apparentCharacterId,
          )
          .map((participant) => (
            <Alert
              key={`conceal-${participant.playerId}`}
              severity="info"
              sx={{ mb: 1 }}
              data-testid={`concealment-prompt-${participant.state.characterId}`}
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => setApparentDialogPlayerId(participant.playerId)}
                >
                  Set
                </Button>
              }
            >
              📋 {participant.name}
              {participant.seatNumber !== null ? ` (Seat ${participant.seatNumber})` : ''}:{' '}
              {participant.state.characterId === 'marionette'
                ? 'Choose which good character the Marionette believes they are'
                : 'Choose which Townsfolk the Drunk believes they are'}
            </Alert>
          ))}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <TextField
            label="Player Count"
            type="number"
            size="small"
            value={effectivePlayerCount}
            onChange={(event) => handlePlayerCountChange(event.target.value)}
            inputProps={{ min: 0 }}
            sx={{ width: 140 }}
          />
          {playerCountOverride !== null && (
            <Button size="small" onClick={() => onPlayerCountChange(null)}>
              Reset
            </Button>
          )}
          <Typography variant="body2" color="text.secondary">
            Default: {participantCount} participants
          </Typography>
        </Box>

        <Typography variant="subtitle2" gutterBottom>
          Distribution ({effectivePlayerCount} players)
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

        {totalAssigned !== effectivePlayerCount && (
          <Typography variant="body2" color="warning.main" sx={{ mb: 1 }}>
            Distribution total ({totalAssigned}) ≠ player count ({effectivePlayerCount})
          </Typography>
        )}

        {suggestions.map((s, i) => (
          <Alert key={`suggestion-${i}`} severity="info" sx={{ mb: 1 }}>
            {s.reason}
          </Alert>
        ))}

        {distWarnings.map((w, i) => (
          <Alert key={`warning-${i}`} severity={w.severity} sx={{ mb: 1 }}>
            {w.message}
          </Alert>
        ))}

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

        {requiredCharacters.map((req) => (
          <Alert key={`req-${req.sourceCharacterId}`} severity="warning" sx={{ mb: 1 }}>
            ⚠️ {req.reason}
          </Alert>
        ))}

        {setupPrompts.map((sp) => (
          <Alert key={`prompt-${sp.characterId}`} severity="info" sx={{ mb: 1 }}>
            📋 {sp.characterName}: {sp.prompt}
          </Alert>
        ))}

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button variant="outlined" startIcon={<CasinoIcon />} onClick={handleRandomize}>
            Randomize
          </Button>
          <Button variant="outlined" color="warning" onClick={handleClearAll}>
            Clear All
          </Button>
        </Box>

        {error && (
          <Typography variant="body2" color="error" sx={{ mb: 1 }}>
            {error}
          </Typography>
        )}

        <Divider sx={{ mb: 2 }} />

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
                  avatar={
                    <Avatar
                      src={getDefaultCharacterIconPath(ch.id, ch.type)}
                      alt={ch.name}
                      sx={{ width: 24, height: 24 }}
                    />
                  }
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
                Tap a player below to assign{' '}
                {scriptCharacters.find((c) => c.id === selectedChipId)?.name ?? selectedChipId}
              </Typography>
            )}
            <Divider sx={{ mb: 2 }} />
          </>
        )}

        <Typography variant="subtitle2" gutterBottom>
          Player Assignments
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {nonTravellerParticipants.map((participant) => {
            const characterId = participant.state.characterId;
            const isMarionetteValid =
              selectedChipId === 'marionette' &&
              participant.seatNumber !== null &&
              marionetteSeats.includes(participant.seatNumber);
            const selectValue = dropdownCharacters.some((character) => character.id === characterId)
              ? characterId
              : '';
            return (
              <Box
                key={participant.playerId}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  cursor: selectedChipId ? 'pointer' : 'default',
                  borderRadius: 1,
                  p: 0.5,
                  backgroundColor: isMarionetteValid ? 'success.light' : undefined,
                  border: selectedChipId && !characterId ? '1px dashed' : undefined,
                  borderColor: selectedChipId ? 'primary.main' : undefined,
                  '&:hover': selectedChipId ? { backgroundColor: 'action.hover' } : undefined,
                }}
                onClick={() => handleSeatClick(participant.playerId)}
                data-testid={`seat-row-${participant.seatNumber ?? participant.playerId}`}
              >
                <Chip
                  label={participant.seatNumber ?? '—'}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ minWidth: 32 }}
                />
                <Typography variant="body2" sx={{ minWidth: 90, flexShrink: 0 }} noWrap>
                  {participant.name}
                </Typography>
                <FormControl size="small" fullWidth>
                  <InputLabel id={`char-select-${participant.playerId}`}>Character</InputLabel>
                  <Select
                    labelId={`char-select-${participant.playerId}`}
                    value={selectValue}
                    label="Character"
                    onChange={(e) => handleCharacterChange(participant.playerId, e.target.value)}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {dropdownCharacters.map((c) => {
                      const assignedCount = assignedCounts.get(c.id) ?? 0;
                      const isCurrentPlayer = characterId === c.id;
                      const isDisabled = inPlayCharacterIds
                        ? !isCurrentPlayer && assignedCount >= (totalAvailableCounts.get(c.id) ?? 0)
                        : assignedCount > 0 && !isCurrentPlayer && !duplicateAllowedIds.has(c.id);
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
                {CONCEALMENT_CHARACTERS.has(characterId) && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={(event) => {
                      event.stopPropagation();
                      setApparentDialogPlayerId(participant.playerId);
                    }}
                  >
                    Apparent
                  </Button>
                )}
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

      {apparentDialogParticipant && apparentDialogCharacter && (
        <ApparentCharacterDialog
          open={apparentDialogPlayerId !== null}
          onClose={() => setApparentDialogPlayerId(null)}
          playerId={apparentDialogParticipant.playerId}
          playerName={apparentDialogParticipant.name}
          currentApparentCharacterId={apparentDialogParticipant.state.apparentCharacterId}
          actualCharacter={apparentDialogCharacter}
          scriptCharacters={scriptCharacters}
          onConfirm={handleApparentConfirm}
        />
      )}
    </Dialog>
  );
}

function indexForParticipant(participants: Participant[], playerId: PlayerId): number {
  return participants.findIndex((participant) => participant.playerId === playerId);
}
