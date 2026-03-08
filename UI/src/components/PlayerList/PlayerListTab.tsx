import { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import type { CharacterDef, Alignment } from '@/types/index.ts';
import { useGame } from '@/context/GameContext.tsx';
import { useCharacterLookup } from '@/hooks/useCharacterLookup.ts';
import { getCharacterTypeColor } from '@/components/common/characterTypeColor.ts';
import { PlayerRow } from '@/components/PlayerList/PlayerRow.tsx';
import { PlayerEditDialog } from '@/components/PlayerList/PlayerEditDialog.tsx';

interface PlayerListTabProps {
  scriptCharacterIds: string[];
}

/**
 * Scrollable table of all players in the game.
 * Day view shows seat, name, alive/dead, ghost vote.
 * Night view adds character name, type, alignment, and inline edit on tap.
 */
export function PlayerListTab({ scriptCharacterIds }: PlayerListTabProps) {
  const { state, updatePlayer } = useGame();
  const { getCharacter, getCharactersByIds } = useCharacterLookup();
  const [editSeat, setEditSeat] = useState<number | null>(null);

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

  const handleToggleAlive = (seat: number) => {
    const player = players.find((p) => p.seat === seat);
    if (player) {
      updatePlayer(seat, { alive: !player.alive });
    }
  };

  const handleToggleGhostVote = (seat: number) => {
    const player = players.find((p) => p.seat === seat);
    if (player) {
      updatePlayer(seat, { ghostVoteUsed: !player.ghostVoteUsed });
    }
  };

  const handleRowClick = (seat: number) => {
    setEditSeat(seat);
  };

  const handleEditSave = (
    seat: number,
    updates: {
      characterId?: string;
      actualAlignment?: Alignment;
      visibleAlignment?: Alignment;
    },
  ) => {
    updatePlayer(seat, updates);
  };

  if (sortedPlayers.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">No players in this game.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
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
              {showCharacters && <TableCell sx={{ px: 1 }}>Tokens</TableCell>}
              {showCharacters && (
                <TableCell align="center" sx={{ width: 32, px: 0.5 }}>
                  Align
                </TableCell>
              )}
              <TableCell align="center" sx={{ width: 44, px: 0.5 }}>
                Alive
              </TableCell>
              <TableCell align="center" sx={{ width: 44, px: 0.5 }}>
                Vote
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedPlayers.map((player) => (
              <PlayerRow
                key={player.seat}
                player={player}
                showCharacters={showCharacters}
                character={player.characterId ? getCharacter(player.characterId) : undefined}
                onToggleAlive={handleToggleAlive}
                onToggleGhostVote={handleToggleGhostVote}
                onRowClick={handleRowClick}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <PlayerEditDialog
        key={editingPlayer?.seat ?? 'none'}
        open={editSeat !== null}
        player={editingPlayer}
        scriptCharacters={scriptCharacters}
        onClose={() => setEditSeat(null)}
        onSave={handleEditSave}
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
