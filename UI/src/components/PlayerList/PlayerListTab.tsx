import { useState, useMemo, useCallback } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CharacterDef, Alignment, PlayerToken as PlayerTokenType } from '@/types/index.ts';
import { useGame } from '@/context/useGame.ts';
import { useSession } from '@/context/useSession.ts';
import { useCharacterLookup } from '@/hooks/useCharacterLookup.ts';
import { getCharacterTypeColor } from '@/components/common/characterTypeColor.ts';
import { PlayerRow, type PlayerListRowPlayer } from '@/components/PlayerList/PlayerRow.tsx';
import { PlayerActionsModal } from '@/components/TownSquare/PlayerActionsModal.tsx';
import { TokenManager } from '@/components/TownSquare/TokenManager.tsx';
import { buildAvailableTokens } from '@/utils/buildAvailableTokens.ts';
import { buildDisplaySeatNumberMap } from '@/utils/seating/index.ts';

interface PlayerListTabProps {
  scriptCharacterIds: string[];
}

/**
 * Scrollable table of all seated players in the game.
 * Day view shows seat, name, alive/dead, ghost vote.
 * Night view adds character name, type, alignment, reminders, and an edit icon.
 */
export function PlayerListTab({ scriptCharacterIds }: PlayerListTabProps) {
  const {
    state,
    updatePlayerState,
    moveGameSlot,
    removeParticipant,
    addToken,
    removeToken,
    setPlayerBluffs,
  } = useGame();
  const { state: sessionState } = useSession();
  const { getCharacter, getCharactersByIds, allCharacters } = useCharacterLookup();
  const [editSeat, setEditSeat] = useState<number | null>(null);
  const [moveSourceSlotId, setMoveSourceSlotId] = useState<string | null>(null);
  const [showAlignment, setShowAlignment] = useState(false);
  const [tokenManagerSeat, setTokenManagerSeat] = useState<number | null>(null);

  // ── Drag-and-drop sensors ──
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const game = state.game;
  const session = useMemo(
    () => (game ? (sessionState.sessions.find((s) => s.id === game.sessionId) ?? null) : null),
    [game, sessionState.sessions],
  );
  const showCharacters = state.showCharacters;

  const sessionPlayersById = useMemo(
    () => new Map((session?.players ?? []).map((player) => [player.id, player] as const)),
    [session?.players],
  );

  const participantsById = useMemo(
    () =>
      new Map(
        (game?.participants ?? []).map(
          (participant) => [participant.playerId, participant] as const,
        ),
      ),
    [game?.participants],
  );

  const players = useMemo<PlayerListRowPlayer[]>(() => {
    if (!game) return [];

    const displaySeatNumbers = buildDisplaySeatNumberMap(game.slots);
    return game.slots.flatMap((slot) => {
      if (slot.kind !== 'seat' || !slot.playerId) return [];

      const playerState = game.playerState[slot.playerId];
      const sessionPlayer = sessionPlayersById.get(slot.playerId);
      if (!playerState || !sessionPlayer) return [];

      return [
        {
          ...playerState,
          playerId: slot.playerId,
          slotId: slot.id,
          seat: displaySeatNumbers.get(slot.id) ?? 0,
          playerName: sessionPlayer.name,
          isTraveller: participantsById.get(slot.playerId)?.isTraveller ?? false,
          tokens: playerState.tokens ?? [],
        },
      ];
    });
  }, [game, participantsById, sessionPlayersById]);

  // Active Fabled/Loric game modifiers
  const activeFabledIds = useMemo(() => game?.activeFabled ?? [], [game?.activeFabled]);
  const activeLoricIds = useMemo(() => game?.activeLoric ?? [], [game?.activeLoric]);
  const activeModifiers: CharacterDef[] = useMemo(() => {
    const ids = [...activeFabledIds, ...activeLoricIds];
    return ids.map((id) => getCharacter(id)).filter((ch): ch is CharacterDef => ch !== undefined);
  }, [activeFabledIds, activeLoricIds, getCharacter]);

  // Rows are already derived from slot order; keep an explicit sort by display number for safety.
  const sortedPlayers = useMemo(() => [...players].sort((a, b) => a.seat - b.seat), [players]);

  // Script characters for the dropdown
  const scriptCharacters: CharacterDef[] = useMemo(
    () => getCharactersByIds(scriptCharacterIds),
    [getCharactersByIds, scriptCharacterIds],
  );

  const editingPlayer =
    editSeat !== null ? (players.find((player) => player.seat === editSeat) ?? null) : null;

  // ── Bluff props for the actions modal ──
  const editingPlayerCharDef = editingPlayer?.characterId
    ? getCharacter(editingPlayer.characterId)
    : undefined;
  const isEditPlayerDemon = editingPlayerCharDef?.type === 'Demon';
  const isEditPlayerLunatic = editingPlayer?.characterId === 'lunatic';
  const showBluffsForPlayer = isEditPlayerDemon || isEditPlayerLunatic;

  const bluffIds = editingPlayer ? game?.playerBluffs?.[editingPlayer.playerId] : undefined;

  const modalBluffCharacters = useMemo(
    () => (bluffIds?.length ? getCharactersByIds(bluffIds) : undefined),
    [bluffIds, getCharactersByIds],
  );

  const modalAvailableBluffCharacters = useMemo(() => {
    if (!showBluffsForPlayer) return undefined;
    const inPlay = new Set(game?.inPlayCharacterIds ?? []);
    return scriptCharacters.filter((ch) => {
      if (ch.type !== 'Townsfolk' && ch.type !== 'Outsider') return false;
      if (isEditPlayerLunatic) return true;
      return !inPlay.has(ch.id);
    });
  }, [showBluffsForPlayer, isEditPlayerLunatic, scriptCharacters, game?.inPlayCharacterIds]);

  const handleChangeBluff = useCallback(
    (oldBluffId: string, newBluffId: string) => {
      if (!editingPlayer) return;
      const currentBluffs = bluffIds ?? [];
      const updated = currentBluffs.map((id) => (id === oldBluffId ? newBluffId : id));
      setPlayerBluffs(editingPlayer.playerId, updated);
    },
    [editingPlayer, bluffIds, setPlayerBluffs],
  );

  const modalBluffLabel = isEditPlayerLunatic ? 'Lunatic Bluffs' : 'Demon Bluffs';

  // Token manager player (derive from live state for fresh tokens)
  const tokenPlayer =
    tokenManagerSeat !== null
      ? (players.find((player) => player.seat === tokenManagerSeat) ?? null)
      : null;

  // Available tokens for token manager — resolve character IDs to CharacterDef objects
  const activeCharacters = useMemo(() => {
    if (!game) return [] as CharacterDef[];
    return game.participants
      .map((participant) => game.playerState[participant.playerId]?.characterId)
      .filter((characterId): characterId is string => Boolean(characterId))
      .map((characterId) => getCharacter(characterId))
      .filter((character): character is CharacterDef => character !== undefined);
  }, [game, getCharacter]);

  const apparentCharacters = useMemo(() => {
    if (!game) return [] as CharacterDef[];
    return game.participants
      .map((participant) => game.playerState[participant.playerId]?.apparentCharacterId)
      .filter((characterId): characterId is string => Boolean(characterId))
      .map((characterId) => getCharacter(characterId))
      .filter((character): character is CharacterDef => character !== undefined);
  }, [game, getCharacter]);

  const availableTokens = useMemo(
    () => buildAvailableTokens(activeCharacters, apparentCharacters),
    [activeCharacters, apparentCharacters],
  );

  const findPlayerBySeat = useCallback(
    (seat: number) => players.find((player) => player.seat === seat),
    [players],
  );

  const moveSlotToPlayerSeat = useCallback(
    (slotId: string, targetSeat: number) => {
      if (!game) return;
      const targetPlayer = findPlayerBySeat(targetSeat);
      if (!targetPlayer) return;
      const targetIndex = game.slots.findIndex((slot) => slot.id === targetPlayer.slotId);
      if (targetIndex >= 0) moveGameSlot(slotId, targetIndex);
    },
    [findPlayerBySeat, game, moveGameSlot],
  );

  const handleToggleAlive = useCallback(
    (seat: number) => {
      const player = findPlayerBySeat(seat);
      if (player) {
        updatePlayerState(player.playerId, { alive: !player.alive });
      }
    },
    [findPlayerBySeat, updatePlayerState],
  );

  const handleToggleGhostVote = useCallback(
    (seat: number) => {
      const player = findPlayerBySeat(seat);
      if (player) {
        updatePlayerState(player.playerId, { ghostVoteUsed: !player.ghostVoteUsed });
      }
    },
    [findPlayerBySeat, updatePlayerState],
  );

  const handleRemoveTraveller = useCallback(
    (seat: number) => {
      const player = findPlayerBySeat(seat);
      if (player) removeParticipant(player.playerId);
    },
    [findPlayerBySeat, removeParticipant],
  );

  const handleManageTokens = useCallback((seat: number) => {
    setTokenManagerSeat(seat);
  }, []);

  const handleSaveCharacter = useCallback(
    (seat: number, updates: { characterId?: string; actualAlignment?: Alignment }) => {
      const player = findPlayerBySeat(seat);
      if (player) updatePlayerState(player.playerId, updates);
    },
    [findPlayerBySeat, updatePlayerState],
  );

  const handleSwapWith = useCallback(
    (seat: number) => {
      const player = findPlayerBySeat(seat);
      if (player) setMoveSourceSlotId(player.slotId);
    },
    [findPlayerBySeat],
  );

  const handleRowClick = (seat: number) => {
    if (moveSourceSlotId !== null) {
      const sourcePlayer = players.find((player) => player.slotId === moveSourceSlotId);
      if (sourcePlayer && seat !== sourcePlayer.seat) {
        moveSlotToPlayerSeat(moveSourceSlotId, seat);
      }
      setMoveSourceSlotId(null);
    }
  };

  const handleOpenEdit = useCallback((seat: number) => {
    setEditSeat(seat);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !game) return;
      const targetIndex = game.slots.findIndex((slot) => slot.id === over.id);
      if (targetIndex >= 0) moveGameSlot(String(active.id), targetIndex);
    },
    [game, moveGameSlot],
  );

  const handleAddToken = useCallback(
    (seat: number, token: PlayerTokenType) => {
      const player = findPlayerBySeat(seat);
      if (player) addToken(player.playerId, token);
    },
    [addToken, findPlayerBySeat],
  );

  const handleRemoveToken = useCallback(
    (seat: number, tokenId: string) => {
      const player = findPlayerBySeat(seat);
      if (player) removeToken(player.playerId, tokenId);
    },
    [findPlayerBySeat, removeToken],
  );

  const moveSourceSeat =
    moveSourceSlotId !== null
      ? (players.find((player) => player.slotId === moveSourceSlotId)?.seat ?? null)
      : null;

  if (sortedPlayers.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">No players in this game.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      {/* Move mode indicator */}
      {moveSourceSeat !== null && (
        <Chip
          icon={<SwapHorizIcon />}
          label={`Tap a player to move Seat ${moveSourceSeat} before them`}
          onDelete={() => setMoveSourceSlotId(null)}
          color="warning"
          sx={{ m: 1 }}
          data-testid="swap-mode-indicator"
        />
      )}

      {/* Alignment column toggle (default off) */}
      {showCharacters && (
        <Box sx={{ px: 1.5, py: 0.5, display: 'flex', justifyContent: 'flex-end' }}>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={showAlignment}
                onChange={(_, checked) => setShowAlignment(checked)}
                data-testid="alignment-toggle"
              />
            }
            label={
              <Typography variant="caption" color="text.secondary">
                Show Alignment
              </Typography>
            }
          />
        </Box>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={sortedPlayers.map((player) => player.slotId)}
          strategy={verticalListSortingStrategy}
        >
          <TableContainer>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 28, px: 0 }} />
                  <TableCell align="center" sx={{ width: 40, px: 1 }}>
                    #
                  </TableCell>
                  <TableCell sx={{ px: 1 }}>Player</TableCell>
                  {showCharacters && <TableCell sx={{ px: 1 }}>Type</TableCell>}
                  {showCharacters && (
                    <TableCell align="center" sx={{ width: 36, px: 0.5 }}>
                      Icon
                    </TableCell>
                  )}
                  {showCharacters && <TableCell sx={{ px: 1 }}>Character</TableCell>}
                  {showCharacters && <TableCell sx={{ px: 1, flex: 2 }}>Ability</TableCell>}
                  {showCharacters && <TableCell sx={{ px: 1 }}>Reminders</TableCell>}
                  {showCharacters && showAlignment && (
                    <TableCell align="center" sx={{ width: 60, px: 0.5 }}>
                      Align
                    </TableCell>
                  )}
                  <TableCell align="center" sx={{ width: 44, px: 0.5 }}>
                    Alive
                  </TableCell>
                  <TableCell align="center" sx={{ width: 44, px: 0.5 }}>
                    Vote
                  </TableCell>
                  {showCharacters && (
                    <TableCell align="center" sx={{ width: 36, px: 0.5 }}>
                      Edit
                    </TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedPlayers.map((player) => (
                  <SortablePlayerRow
                    key={player.slotId}
                    player={player}
                    showCharacters={showCharacters}
                    showAlignment={showAlignment}
                    character={player.characterId ? getCharacter(player.characterId) : undefined}
                    apparentCharacter={
                      player.apparentCharacterId
                        ? getCharacter(player.apparentCharacterId)
                        : undefined
                    }
                    onToggleAlive={handleToggleAlive}
                    onToggleGhostVote={handleToggleGhostVote}
                    onRowClick={handleRowClick}
                    onEdit={showCharacters ? handleOpenEdit : undefined}
                    isSwapSource={moveSourceSlotId === player.slotId}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </SortableContext>
      </DndContext>

      {/* Shared PlayerActionsModal (same as TownSquare) */}
      <PlayerActionsModal
        open={editSeat !== null}
        player={editingPlayer}
        showCharacters={showCharacters}
        scriptCharacters={scriptCharacters}
        allCharacters={allCharacters}
        demonBluffs={bluffIds}
        bluffCharacters={modalBluffCharacters}
        availableBluffCharacters={modalAvailableBluffCharacters}
        bluffLabel={modalBluffLabel}
        onClose={() => setEditSeat(null)}
        onToggleAlive={handleToggleAlive}
        onToggleGhostVote={handleToggleGhostVote}
        onRemoveTraveller={handleRemoveTraveller}
        onManageTokens={handleManageTokens}
        onSaveCharacter={handleSaveCharacter}
        onSwapWith={handleSwapWith}
        onChangeBluff={handleChangeBluff}
      />

      {/* Token Manager Dialog */}
      <TokenManager
        open={tokenPlayer !== null}
        player={tokenPlayer}
        onClose={() => setTokenManagerSeat(null)}
        onAddToken={handleAddToken}
        onRemoveToken={handleRemoveToken}
        characterDef={tokenPlayer?.characterId ? getCharacter(tokenPlayer.characterId) : undefined}
        availableTokens={availableTokens}
        allPlayers={players}
      />

      {/* Game Modifiers section — active Fabled/Loric */}
      {activeModifiers.length > 0 && (
        <Box data-testid="game-modifiers-section" sx={{ mt: 1 }}>
          <Divider />
          <Typography
            variant="subtitle2"
            sx={{ px: 1.5, py: 1, fontWeight: 700, color: 'text.secondary' }}
          >
            Game Modifiers
          </Typography>
          {activeModifiers.map((ch) => {
            const color = getCharacterTypeColor(ch.type);
            return (
              <Box
                key={ch.id}
                data-testid={`modifier-${ch.id}`}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1,
                  px: 1.5,
                  py: 0.75,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: color,
                    mt: 0.75,
                    flexShrink: 0,
                  }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {ch.name}
                    <Typography
                      component="span"
                      variant="caption"
                      sx={{ ml: 0.75, color, fontWeight: 600 }}
                    >
                      {ch.type}
                    </Typography>
                  </Typography>
                  {ch.abilityShort && ch.abilityShort !== '<TODO>' && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', lineHeight: 1.3 }}
                    >
                      {ch.abilityShort}
                    </Typography>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

// ──────────────────────────────────────────────
// Sub-component: Sortable player row wrapper
// ──────────────────────────────────────────────

type SortablePlayerRowProps = Omit<
  React.ComponentProps<typeof PlayerRow>,
  'dragHandle' | 'rowRef' | 'rowStyle'
>;

function SortablePlayerRow(props: SortablePlayerRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.player.slotId,
  });

  return (
    <PlayerRow
      {...props}
      rowRef={setNodeRef as React.Ref<HTMLTableRowElement>}
      rowStyle={{
        transform: CSS.Transform.toString(transform),
        transition: transition ?? undefined,
        opacity: isDragging ? 0.5 : 1,
      }}
      dragHandle={
        <Box
          component="span"
          {...attributes}
          {...listeners}
          sx={{
            cursor: 'grab',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            touchAction: 'none',
            py: 0.5,
          }}
          aria-label={`reorder seat ${props.player.seat}`}
        >
          <DragIndicatorIcon fontSize="small" sx={{ color: 'text.secondary' }} />
        </Box>
      }
    />
  );
}
