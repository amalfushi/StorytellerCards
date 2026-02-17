import { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
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
              {showCharacters && <TableCell sx={{ px: 1 }}>Ability</TableCell>}
              <TableCell align="center" sx={{ width: 44, px: 0.5 }}>
                Alive
              </TableCell>
              {showCharacters && (
                <TableCell align="center" sx={{ width: 32, px: 0.5 }}>
                  Align
                </TableCell>
              )}
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
    </Box>
  );
}
