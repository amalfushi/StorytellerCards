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
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import type { CharacterDef, Alignment, PlayerToken as PlayerTokenType } from '@/types/index.ts';
import { useGame } from '@/context/GameContext.tsx';
import { useCharacterLookup } from '@/hooks/useCharacterLookup.ts';
import { getCharacterTypeColor } from '@/components/common/characterTypeColor.ts';
import { PlayerRow } from '@/components/PlayerList/PlayerRow.tsx';
import { PlayerActionsModal } from '@/components/TownSquare/PlayerActionsModal.tsx';
import { TokenManager } from '@/components/TownSquare/TokenManager.tsx';
import { buildAvailableTokens } from '@/utils/buildAvailableTokens.ts';

interface PlayerListTabProps {
  scriptCharacterIds: string[];
}

/**
 * Scrollable table of all players in the game.
 * Day view shows seat, name, alive/dead, ghost vote.
 * Night view adds character name, type, alignment, reminders, and an edit icon.
 */
export function PlayerListTab({ scriptCharacterIds }: PlayerListTabProps) {
  const {
    state,
    updatePlayer,
    swapPlayerSeats,
    removeTraveller,
    addToken,
    removeToken,
    setDemonBluffs,
    setLunaticBluffs,
  } = useGame();
  const { getCharacter, getCharactersByIds, allCharacters } = useCharacterLookup();
  const [editSeat, setEditSeat] = useState<number | null>(null);
  const [swapSourceSeat, setSwapSourceSeat] = useState<number | null>(null);
  const [showAlignment, setShowAlignment] = useState(false);
  const [tokenManagerSeat, setTokenManagerSeat] = useState<number | null>(null);

  const players = useMemo(() => state.game?.players ?? [], [state.game?.players]);
  const showCharacters = state.showCharacters;

  // Active Fabled/Loric game modifiers
  const activeFabledIds = useMemo(() => state.game?.activeFabled ?? [], [state.game?.activeFabled]);
  const activeLoricIds = useMemo(() => state.game?.activeLoric ?? [], [state.game?.activeLoric]);
  const activeModifiers: CharacterDef[] = useMemo(() => {
    const ids = [...activeFabledIds, ...activeLoricIds];
    return ids.map((id) => getCharacter(id)).filter((ch): ch is CharacterDef => ch !== undefined);
  }, [activeFabledIds, activeLoricIds, getCharacter]);

  // Sort by seat number
  const sortedPlayers = useMemo(() => [...players].sort((a, b) => a.seat - b.seat), [players]);

  // Script characters for the dropdown
  const scriptCharacters: CharacterDef[] = useMemo(
    () => getCharactersByIds(scriptCharacterIds),
    [getCharactersByIds, scriptCharacterIds],
  );

  const editingPlayer =
    editSeat !== null ? (players.find((p) => p.seat === editSeat) ?? null) : null;

  // ── Bluff props for the actions modal ──
  const editingPlayerCharDef = editingPlayer?.characterId
    ? getCharacter(editingPlayer.characterId)
    : undefined;
  const isEditPlayerDemon = editingPlayerCharDef?.type === 'Demon';
  const isEditPlayerLunatic = editingPlayer?.characterId === 'lunatic';

  const bluffIds = isEditPlayerDemon
    ? state.game?.demonBluffs
    : isEditPlayerLunatic
      ? state.game?.lunaticBluffs
      : undefined;

  const modalBluffCharacters = useMemo(
    () => (bluffIds?.length ? getCharactersByIds(bluffIds) : undefined),
    [bluffIds, getCharactersByIds],
  );

  const modalAvailableBluffCharacters = useMemo(() => {
    if (!isEditPlayerDemon && !isEditPlayerLunatic) return undefined;
    const inPlay = new Set(state.game?.inPlayCharacterIds ?? []);
    return scriptCharacters.filter((ch) => {
      if (ch.type !== 'Townsfolk' && ch.type !== 'Outsider') return false;
      if (isEditPlayerLunatic) return true;
      return !inPlay.has(ch.id);
    });
  }, [isEditPlayerDemon, isEditPlayerLunatic, scriptCharacters, state.game?.inPlayCharacterIds]);

  const handleChangeBluff = useCallback(
    (oldBluffId: string, newBluffId: string) => {
      const currentBluffs = bluffIds ?? [];
      const updated = currentBluffs.map((id) => (id === oldBluffId ? newBluffId : id));
      if (isEditPlayerDemon) {
        setDemonBluffs(updated);
      } else if (isEditPlayerLunatic) {
        setLunaticBluffs(updated);
      }
    },
    [bluffIds, isEditPlayerDemon, isEditPlayerLunatic, setDemonBluffs, setLunaticBluffs],
  );

  const modalBluffLabel = isEditPlayerLunatic ? 'Lunatic Bluffs' : 'Demon Bluffs';

  // Token manager player (derive from live state for fresh tokens)
  const tokenPlayer =
    tokenManagerSeat !== null ? (players.find((p) => p.seat === tokenManagerSeat) ?? null) : null;

  // Available tokens for token manager — resolve character IDs to CharacterDef objects
  const activeCharacters = useMemo(() => {
    if (!state.game) return [] as CharacterDef[];
    return state.game.players
      .map((p) => getCharacter(p.characterId))
      .filter((c): c is CharacterDef => c !== undefined);
  }, [state.game, getCharacter]);

  const apparentCharacters = useMemo(() => {
    if (!state.game) return [] as CharacterDef[];
    return state.game.players
      .filter((p) => p.apparentCharacterId)
      .map((p) => getCharacter(p.apparentCharacterId!))
      .filter((c): c is CharacterDef => c !== undefined);
  }, [state.game, getCharacter]);

  const availableTokens = useMemo(
    () => buildAvailableTokens(activeCharacters, apparentCharacters),
    [activeCharacters, apparentCharacters],
  );

  const handleToggleAlive = useCallback(
    (seat: number) => {
      const player = players.find((p) => p.seat === seat);
      if (player) {
        updatePlayer(seat, { alive: !player.alive });
      }
    },
    [players, updatePlayer],
  );

  const handleToggleGhostVote = useCallback(
    (seat: number) => {
      const player = players.find((p) => p.seat === seat);
      if (player) {
        updatePlayer(seat, { ghostVoteUsed: !player.ghostVoteUsed });
      }
    },
    [players, updatePlayer],
  );

  const handleRemoveTraveller = useCallback(
    (seat: number) => {
      removeTraveller(seat);
    },
    [removeTraveller],
  );

  const handleManageTokens = useCallback((seat: number) => {
    setTokenManagerSeat(seat);
  }, []);

  const handleSaveCharacter = useCallback(
    (seat: number, updates: { characterId?: string; actualAlignment?: Alignment }) => {
      updatePlayer(seat, updates);
    },
    [updatePlayer],
  );

  const handleSwapWith = useCallback((seat: number) => {
    setSwapSourceSeat(seat);
  }, []);

  const handleRowClick = (seat: number) => {
    if (swapSourceSeat !== null) {
      if (seat !== swapSourceSeat) {
        swapPlayerSeats(swapSourceSeat, seat);
      }
      setSwapSourceSeat(null);
      return;
    }
  };

  const handleOpenEdit = useCallback((seat: number) => {
    setEditSeat(seat);
  }, []);

  const handleAddToken = useCallback(
    (seat: number, token: PlayerTokenType) => {
      addToken(seat, token);
    },
    [addToken],
  );

  const handleRemoveToken = useCallback(
    (seat: number, tokenId: string) => {
      removeToken(seat, tokenId);
    },
    [removeToken],
  );

  if (sortedPlayers.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">No players in this game.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      {/* Swap mode indicator */}
      {swapSourceSeat !== null && (
        <Chip
          icon={<SwapHorizIcon />}
          label={`Tap a player to swap with Seat ${swapSourceSeat}`}
          onDelete={() => setSwapSourceSeat(null)}
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

      <TableContainer>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
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
              <PlayerRow
                key={player.seat}
                player={player}
                showCharacters={showCharacters}
                showAlignment={showAlignment}
                character={player.characterId ? getCharacter(player.characterId) : undefined}
                apparentCharacter={
                  player.apparentCharacterId ? getCharacter(player.apparentCharacterId) : undefined
                }
                onToggleAlive={handleToggleAlive}
                onToggleGhostVote={handleToggleGhostVote}
                onRowClick={handleRowClick}
                onEdit={showCharacters ? handleOpenEdit : undefined}
                isSwapSource={swapSourceSeat === player.seat}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>

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
