import { useCallback, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import ChecklistIcon from '@mui/icons-material/Checklist';
import CloseIcon from '@mui/icons-material/Close';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonIcon from '@mui/icons-material/Person';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import type {
  CharacterDef,
  Game,
  Participant,
  Player,
  PlayerGameState,
  PlayerId,
  PropagationPreference,
  Slot,
  SlotId,
} from '@/types/index.ts';
import { Alignment, CharacterType } from '@/types/index.ts';
import { generateId } from '@/utils/idGenerator.ts';
import {
  buildDisplaySeatNumberMap,
  arePlayerStatesEqual,
  clearPlayerFromSlots,
  hasGameStarted,
  makeDefaultPlayerGameState,
  moveSlot,
  setSeatPlayer,
  validateGameSeating,
} from '@/utils/seating/index.ts';
import {
  apparentCharacterIdAfterAssignment,
  countCharacterCopies,
  filterPlayerAssignableCharacters,
  isCharacterUnavailableForAssignment,
} from '@/utils/characterAssignment.ts';
import {
  SEAT_DROPPABLE_PREFIX,
  SLOT_DRAGGABLE_PREFIX,
  SLOT_POSITION_DROPPABLE_PREFIX,
  SeatingTemplateCircle,
} from '@/components/Setup/SeatingTemplateCircle.tsx';
import { randomizeConstrainedDraftSeating } from '@/utils/drafting/draftSeating.ts';

export interface TownSquareEditModeProps {
  game: Game;
  sessionPlayers: Player[];
  scriptCharacters: CharacterDef[];
  onCancel: () => void;
  onSave: (
    slots: Slot[],
    participants: Participant[],
    playerState: Record<PlayerId, PlayerGameState>,
    propagation: PropagationPreference,
  ) => void;
  propagationDefault: PropagationPreference;
  onOpenCharacterSelection: () => void;
  onOpenCharacterAssignment: () => void;
}

function alignmentForCharacter(character: CharacterDef): Alignment {
  if (character.type === CharacterType.Traveller) return character.defaultAlignment;
  return character.type === CharacterType.Minion || character.type === CharacterType.Demon
    ? Alignment.Evil
    : Alignment.Good;
}

/**
 * Draft editor embedded directly in the Town Square. Changes stay local until
 * the Storyteller reviews and saves them, which keeps live-play taps safe.
 */
export function TownSquareEditMode({
  game,
  sessionPlayers,
  scriptCharacters,
  onCancel,
  onSave,
  propagationDefault,
  onOpenCharacterSelection,
  onOpenCharacterAssignment,
}: TownSquareEditModeProps) {
  const [draftSlots, setDraftSlots] = useState<Slot[]>(() =>
    game.slots.map((slot) => ({ ...slot })),
  );
  const [draftParticipants, setDraftParticipants] = useState<Participant[]>(() =>
    game.participants.map((participant) => ({ ...participant })),
  );
  const [draftPlayerState, setDraftPlayerState] = useState<Record<PlayerId, PlayerGameState>>(() =>
    Object.fromEntries(
      Object.entries(game.playerState).map(([playerId, state]) => [
        playerId,
        { ...state, tokens: [...(state.tokens ?? [])] },
      ]),
    ),
  );
  const [focusedPlayerId, setFocusedPlayerId] = useState<PlayerId | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [seatingRandomizationWarning, setSeatingRandomizationWarning] = useState(false);
  const [propagation, setPropagation] = useState<PropagationPreference>(propagationDefault);
  const theme = useTheme();
  const isSmallViewport = useMediaQuery(theme.breakpoints.down('sm'));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const rosterById = useMemo(
    () => new Map(sessionPlayers.map((player) => [player.id, player])),
    [sessionPlayers],
  );
  const characterById = useMemo(
    () => new Map(scriptCharacters.map((character) => [character.id, character])),
    [scriptCharacters],
  );
  const playerCharacterDisplays = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(draftPlayerState).flatMap(([playerId, state]) => {
          if (!state.characterId) return [];
          const character = characterById.get(state.characterId);
          if (!character) return [];
          const actualName = characterById.get(state.characterId)?.name ?? state.characterId;
          const apparentName = state.apparentCharacterId
            ? (characterById.get(state.apparentCharacterId)?.name ?? state.apparentCharacterId)
            : '';
          return [
            [
              playerId,
              {
                characterId: state.characterId,
                characterName: actualName,
                label:
                  apparentName && state.apparentCharacterId !== state.characterId
                    ? `${actualName} (appears ${apparentName})`
                    : actualName,
                type: character.type,
                alignment:
                  state.actualAlignment === Alignment.Unknown
                    ? alignmentForCharacter(character)
                    : state.actualAlignment,
              },
            ],
          ];
        }),
      ),
    [characterById, draftPlayerState],
  );
  const participantIds = useMemo(
    () => new Set(draftParticipants.map((participant) => participant.playerId)),
    [draftParticipants],
  );
  const participatingPlayers = useMemo(
    () => sessionPlayers.filter((player) => participantIds.has(player.id)),
    [participantIds, sessionPlayers],
  );
  const seatedPlayerIds = useMemo(
    () =>
      new Set(
        draftSlots.flatMap((slot) =>
          slot.kind === 'seat' && slot.playerId ? [slot.playerId] : [],
        ),
      ),
    [draftSlots],
  );
  const parkedParticipants = useMemo(
    () => draftParticipants.filter((participant) => !seatedPlayerIds.has(participant.playerId)),
    [draftParticipants, seatedPlayerIds],
  );
  const displaySeatNumbers = useMemo(() => buildDisplaySeatNumberMap(draftSlots), [draftSlots]);
  const validation = useMemo(
    () => validateGameSeating(draftSlots, draftParticipants, sessionPlayers),
    [draftParticipants, draftSlots, sessionPlayers],
  );
  const focusedPlayer = focusedPlayerId ? rosterById.get(focusedPlayerId) : undefined;
  const focusedParticipant = focusedPlayerId
    ? draftParticipants.find((participant) => participant.playerId === focusedPlayerId)
    : undefined;
  const focusedState = focusedPlayerId ? draftPlayerState[focusedPlayerId] : undefined;

  const selectedCharacterPool = useMemo(() => {
    return filterPlayerAssignableCharacters(
      (game.inPlayCharacterIds ?? [])
        .map((characterId) => scriptCharacters.find((character) => character.id === characterId))
        .filter((character): character is CharacterDef => character !== undefined),
    );
  }, [game.inPlayCharacterIds, scriptCharacters]);
  const travellerCharacterPool = useMemo(
    () => scriptCharacters.filter((character) => character.type === CharacterType.Traveller),
    [scriptCharacters],
  );
  const focusedCharacterPool = focusedParticipant?.isTraveller
    ? travellerCharacterPool
    : selectedCharacterPool;
  const focusedCharacterOptions = useMemo(() => {
    const seen = new Set<string>();
    return focusedCharacterPool.filter((character) => {
      if (seen.has(character.id)) return false;
      seen.add(character.id);
      return true;
    });
  }, [focusedCharacterPool]);
  const focusedAvailableCounts = useMemo(
    () => countCharacterCopies(focusedCharacterPool),
    [focusedCharacterPool],
  );
  const draftChangesLineupOrState = useMemo(
    () =>
      JSON.stringify(draftParticipants) !== JSON.stringify(game.participants) ||
      !arePlayerStatesEqual(draftPlayerState, game.playerState),
    [draftParticipants, draftPlayerState, game.participants, game.playerState],
  );
  const effectivePropagation = useMemo<PropagationPreference>(
    () => ({
      ...propagation,
      toOtherGames: propagation.toOtherGames && !draftChangesLineupOrState,
    }),
    [draftChangesLineupOrState, propagation],
  );
  const gameStarted = hasGameStarted(game);
  const needsCharacterSelection = (game.inPlayCharacterIds?.length ?? 0) === 0;
  const needsCharacterAssignment =
    !needsCharacterSelection &&
    draftParticipants.some(
      (participant) =>
        !participant.isTraveller && !draftPlayerState[participant.playerId]?.characterId,
    );

  const handleAssignSeat = useCallback((slotId: SlotId, playerId: PlayerId | null) => {
    setDraftSlots((current) => setSeatPlayer(current, slotId, playerId));
  }, []);

  const handleMoveSlot = useCallback((slotId: SlotId, toIndex: number) => {
    setDraftSlots((current) => moveSlot(current, slotId, toIndex));
  }, []);

  const handleRandomizeSeating = useCallback(() => {
    const participatingPlayerIds = draftParticipants.map((participant) => participant.playerId);
    const characterIdByPlayer = Object.fromEntries(
      Object.entries(draftPlayerState).flatMap(([playerId, state]) =>
        state.characterId ? [[playerId, state.characterId]] : [],
      ),
    );
    const randomized = randomizeConstrainedDraftSeating(
      draftSlots,
      participatingPlayerIds,
      characterIdByPlayer,
      scriptCharacters,
    );
    setDraftSlots(randomized.slots);
    setSeatingRandomizationWarning(!randomized.constraintsSatisfied);
  }, [draftParticipants, draftPlayerState, draftSlots, scriptCharacters]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (!activeId.startsWith(SLOT_DRAGGABLE_PREFIX)) return;

    const slotId = activeId.slice(SLOT_DRAGGABLE_PREFIX.length);
    const targetSlotId = overId.startsWith(SLOT_POSITION_DROPPABLE_PREFIX)
      ? overId.slice(SLOT_POSITION_DROPPABLE_PREFIX.length)
      : overId.startsWith(SEAT_DROPPABLE_PREFIX)
        ? overId.slice(SEAT_DROPPABLE_PREFIX.length)
        : null;
    if (!targetSlotId || targetSlotId === slotId) return;
    setDraftSlots((current) => {
      const targetIndex = current.findIndex((slot) => slot.id === targetSlotId);
      return targetIndex < 0 ? current : moveSlot(current, slotId, targetIndex);
    });
  }, []);

  const handleParticipationChange = useCallback((playerId: PlayerId, included: boolean) => {
    if (included) {
      setDraftParticipants((current) =>
        current.some((participant) => participant.playerId === playerId)
          ? current
          : [...current, { playerId, isTraveller: false }],
      );
      setDraftPlayerState((current) =>
        current[playerId] ? current : { ...current, [playerId]: makeDefaultPlayerGameState() },
      );
      setDraftSlots((current) => {
        if (current.some((slot) => slot.kind === 'seat' && slot.playerId === playerId)) {
          return current;
        }
        const emptySeat = current.find((slot) => slot.kind === 'seat' && slot.playerId === null);
        return emptySeat
          ? setSeatPlayer(current, emptySeat.id, playerId)
          : [...current, { kind: 'seat', id: generateId(), playerId }];
      });
      return;
    }

    setDraftParticipants((current) =>
      current.filter((participant) => participant.playerId !== playerId),
    );
    setDraftSlots((current) => clearPlayerFromSlots(current, playerId));
    setDraftPlayerState((current) => {
      const next = { ...current };
      delete next[playerId];
      return next;
    });
  }, []);

  const handleTravellerChange = useCallback(
    (playerId: PlayerId, isTraveller: boolean) => {
      setDraftParticipants((current) =>
        current.map((participant) =>
          participant.playerId === playerId ? { ...participant, isTraveller } : participant,
        ),
      );
      setDraftPlayerState((current) => {
        const state = current[playerId];
        if (!state?.characterId) return current;
        const character = scriptCharacters.find((candidate) => candidate.id === state.characterId);
        if (character && (character.type === CharacterType.Traveller) === isTraveller) {
          return current;
        }
        return {
          ...current,
          [playerId]: {
            ...state,
            characterId: '',
            apparentCharacterId: '',
          },
        };
      });
    },
    [scriptCharacters],
  );

  const handleCharacterChange = useCallback(
    (playerId: PlayerId, characterId: string) => {
      const character = focusedCharacterPool.find((option) => option.id === characterId);
      setDraftPlayerState((current) => {
        const state = current[playerId];
        if (!state) return current;
        if (!character) {
          return {
            ...current,
            [playerId]: {
              ...state,
              characterId: '',
              apparentCharacterId: apparentCharacterIdAfterAssignment(
                state.apparentCharacterId,
                '',
              ),
            },
          };
        }
        const alignment = alignmentForCharacter(character);
        return {
          ...current,
          [playerId]: {
            ...state,
            characterId,
            actualAlignment: alignment,
            startingAlignment: alignment,
            apparentCharacterId: apparentCharacterIdAfterAssignment(
              state.apparentCharacterId,
              characterId,
            ),
          },
        };
      });
    },
    [focusedCharacterPool],
  );

  const handleSave = () => {
    onSave(draftSlots, draftParticipants, draftPlayerState, effectivePropagation);
    setReviewOpen(false);
  };

  const handleOpenPreparation = (openPreparation: () => void) => {
    onSave(draftSlots, draftParticipants, draftPlayerState, effectivePropagation);
    openPreparation();
  };

  return (
    <Box
      data-testid="town-square-edit-mode"
      sx={{
        minHeight: '100%',
        overflow: 'auto',
        bgcolor: 'rgba(237, 108, 2, 0.06)',
        pb: 2,
      }}
    >
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 5,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1.5,
          py: 1,
          bgcolor: 'warning.main',
          color: 'warning.contrastText',
          boxShadow: 1,
        }}
      >
        <GroupsIcon />
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" fontWeight={800}>
            Edit Seating
          </Typography>
          <Typography variant="caption">Draft changes are not live until saved.</Typography>
        </Box>
        <Button
          size="small"
          color="inherit"
          startIcon={<CloseIcon />}
          onClick={onCancel}
          aria-label="cancel seating edits"
        >
          Cancel
        </Button>
      </Box>

      <Box sx={{ p: 1.5 }}>
        <Alert severity={validation.isValid ? 'success' : 'warning'} sx={{ mb: 1.5 }}>
          {validation.isValid
            ? 'Seating is ready for play.'
            : 'Planning can continue, but every game participant must be seated before play starts.'}
        </Alert>

        {!gameStarted && (needsCharacterSelection || needsCharacterAssignment) && (
          <>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<ChecklistIcon />}
                onClick={() =>
                  handleOpenPreparation(
                    needsCharacterSelection ? onOpenCharacterSelection : onOpenCharacterAssignment,
                  )
                }
              >
                Select Characters
              </Button>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Finish the next preparation step before play. Your seating draft saves before it
              opens.
            </Typography>
          </>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() =>
              setDraftSlots((current) => [
                ...current,
                { kind: 'seat', id: generateId(), playerId: null },
              ])
            }
          >
            Add Seat
          </Button>
          <Button
            size="small"
            onClick={() =>
              setDraftSlots((current) => [...current, { kind: 'spacer', id: generateId() }])
            }
          >
            Add Spacer
          </Button>
          <Button
            size="small"
            disabled={draftSlots.some((slot) => slot.kind === 'storyteller')}
            onClick={() =>
              setDraftSlots((current) => [...current, { kind: 'storyteller', id: generateId() }])
            }
          >
            Add Storyteller
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<ShuffleIcon />}
            disabled={seatedPlayerIds.size < 2}
            onClick={handleRandomizeSeating}
          >
            Randomize seating
          </Button>
        </Box>
        {seatingRandomizationWarning && (
          <Alert severity="warning" sx={{ mb: 1 }}>
            No randomized arrangement satisfied every character adjacency rule. Review this seating
            manually before saving.
          </Alert>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <Box sx={{ position: 'relative', width: '100%', height: { xs: 520, sm: 600 } }}>
            <SeatingTemplateCircle
              slots={draftSlots}
              players={participatingPlayers}
              playerCharacterById={playerCharacterDisplays}
              displaySeatNumbers={displaySeatNumbers}
              shape={isSmallViewport ? 'ovoid' : 'circle'}
              tileSize={isSmallViewport ? 112 : 140}
              onAssignSeat={handleAssignSeat}
              onRemoveSlot={(slotId) =>
                setDraftSlots((current) => current.filter((slot) => slot.id !== slotId))
              }
              onMoveSlot={handleMoveSlot}
            />
          </Box>
        </DndContext>

        <Divider sx={{ my: 1.5 }} />
        <Typography variant="subtitle2" fontWeight={700}>
          Save scope
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' } }}>
          <FormControlLabel
            control={
              <Switch
                checked={propagation.toTemplate}
                onChange={(_, checked) =>
                  setPropagation((current) => ({ ...current, toTemplate: checked }))
                }
              />
            }
            label="Update session template"
          />
          <FormControlLabel
            control={
              <Switch
                checked={effectivePropagation.toOtherGames}
                disabled={draftChangesLineupOrState}
                onChange={(_, checked) =>
                  setPropagation((current) => ({ ...current, toOtherGames: checked }))
                }
              />
            }
            label="Update other games"
          />
        </Box>
        <Typography variant="caption" color="text.secondary">
          Turn these off to keep this game&apos;s seating independent.
        </Typography>
        {draftChangesLineupOrState && (
          <Alert severity="info" sx={{ mt: 1 }}>
            Other-game updates are unavailable because this draft changes the lineup or player
            state. Save those changes to this game only.
          </Alert>
        )}

        <Divider sx={{ my: 1.5 }} />
        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
          Game Participants
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          Add roster players directly, then tap a participant to manage their character.
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
          {sessionPlayers.map((player) => {
            const participating = participantIds.has(player.id);
            if (!participating) {
              return (
                <Button
                  key={player.id}
                  size="small"
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => handleParticipationChange(player.id, true)}
                  data-testid={`add-player-${player.id}`}
                  sx={{ minHeight: 40 }}
                >
                  Add {player.name} to game
                </Button>
              );
            }
            const parked = participating && !seatedPlayerIds.has(player.id);
            return (
              <Chip
                key={player.id}
                icon={<PersonIcon />}
                label={`${player.name} · ${parked ? 'Parked' : 'Seated'}`}
                color={parked ? 'warning' : 'primary'}
                variant="filled"
                onClick={() => setFocusedPlayerId(player.id)}
                data-testid={`edit-player-${player.id}`}
                sx={{ minHeight: 40 }}
              />
            );
          })}
        </Box>

        {parkedParticipants.length > 0 && (
          <Alert severity="info" sx={{ mt: 1.5 }}>
            Parking:{' '}
            {parkedParticipants
              .map((participant) => rosterById.get(participant.playerId)?.name)
              .join(', ')}
          </Alert>
        )}

        <Box
          sx={{
            mt: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
          }}
        >
          <Box>
            <Typography variant="body2" fontWeight={700}>
              Review
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {draftParticipants.length} playing · {seatedPlayerIds.size} seated ·{' '}
              {parkedParticipants.length} parked
            </Typography>
          </Box>
          <Button variant="contained" color="warning" onClick={() => setReviewOpen(true)}>
            Review &amp; Save
          </Button>
        </Box>
      </Box>

      <Drawer
        anchor="bottom"
        open={focusedPlayerId !== null}
        onClose={() => setFocusedPlayerId(null)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: '80vh',
            p: 2,
          },
        }}
      >
        {focusedPlayer && (
          <Box data-testid="focused-player-sheet">
            <Typography variant="h6" fontWeight={800}>
              {focusedPlayer.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Game-specific participation and character
            </Typography>
            <Divider sx={{ my: 1.5 }} />
            <FormControlLabel
              control={
                <Switch
                  checked={focusedParticipant !== undefined}
                  onChange={(_, checked) => handleParticipationChange(focusedPlayer.id, checked)}
                  inputProps={{ 'aria-label': `${focusedPlayer.name} participates in this game` }}
                />
              }
              label="Playing this game"
            />
            {focusedParticipant && (
              <>
                <FormControlLabel
                  control={
                    <Switch
                      checked={focusedParticipant.isTraveller}
                      onChange={(_, checked) => handleTravellerChange(focusedPlayer.id, checked)}
                      inputProps={{ 'aria-label': `${focusedPlayer.name} is a traveller` }}
                    />
                  }
                  label="Traveller"
                />
                <Typography variant="body2" fontWeight={700} sx={{ mt: 1 }}>
                  Assigned character
                </Typography>
                {focusedCharacterOptions.length === 0 ? (
                  <Alert
                    severity="info"
                    sx={{ mt: 0.75 }}
                    action={
                      !focusedParticipant.isTraveller ? (
                        <Button
                          color="inherit"
                          size="small"
                          onClick={() => handleOpenPreparation(onOpenCharacterSelection)}
                        >
                          Select
                        </Button>
                      ) : undefined
                    }
                  >
                    {focusedParticipant.isTraveller
                      ? 'This script has no Traveller characters.'
                      : 'Select characters for this game first.'}
                  </Alert>
                ) : (
                  <Select
                    fullWidth
                    size="small"
                    value={
                      focusedCharacterOptions.some(
                        (character) => character.id === focusedState?.characterId,
                      )
                        ? focusedState?.characterId
                        : ''
                    }
                    onChange={(event) =>
                      handleCharacterChange(focusedPlayer.id, String(event.target.value))
                    }
                    displayEmpty
                    inputProps={{ 'aria-label': `assign character to ${focusedPlayer.name}` }}
                    sx={{ mt: 0.75 }}
                  >
                    <MenuItem value="">
                      <em>Unassigned</em>
                    </MenuItem>
                    {focusedCharacterOptions.map((character) => (
                      <MenuItem
                        key={character.id}
                        value={character.id}
                        disabled={isCharacterUnavailableForAssignment(
                          character.id,
                          focusedPlayer.id,
                          draftParticipants,
                          draftPlayerState,
                          focusedAvailableCounts,
                        )}
                      >
                        {character.name}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              </>
            )}
            <Button fullWidth sx={{ mt: 2 }} onClick={() => setFocusedPlayerId(null)}>
              Done
            </Button>
          </Box>
        )}
      </Drawer>

      <Dialog open={reviewOpen} onClose={() => setReviewOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Review Town Square changes</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {draftParticipants.length} participants, {displaySeatNumbers.size} seats,{' '}
            {parkedParticipants.length} parked.
          </Typography>
          {!validation.isValid && (
            <Alert severity="warning" sx={{ mt: 1.5 }}>
              This draft is not ready to start. Saving is allowed so setup can continue, but the
              Night transition will return here until seating is valid.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewOpen(false)}>Back</Button>
          <Button variant="contained" color="warning" onClick={handleSave}>
            {validation.isValid ? 'Save changes' : 'Save draft'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
