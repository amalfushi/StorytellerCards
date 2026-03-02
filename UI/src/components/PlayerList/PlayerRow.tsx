import { useState } from 'react';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import type { PlayerSeat, CharacterDef } from '@/types/index.ts';
import { characterColors } from '@/theme/index.ts';
import { getCharacterTypeColor } from '@/components/common/characterTypeColor.ts';
import { CharacterDetailModal } from '@/components/common/CharacterDetailModal.tsx';
import { TokenChips } from '@/components/common/TokenChips.tsx';

interface PlayerRowProps {
  player: PlayerSeat;
  showCharacters: boolean;
  character?: CharacterDef;
  onToggleAlive: (seat: number) => void;
  onToggleGhostVote: (seat: number) => void;
  onRowClick: (seat: number) => void;
}

/**
 * A single row in the PlayerList table.
 *
 * Column order:
 * Seat | Player Name | Type (pill) | Icon | Character Name | abilityShort | Alive | Alignment | Ghost Vote
 *
 * Day view hides character-specific columns.
 * If a player's actualAlignment differs from their character's defaultAlignment,
 * the type pill gets a thick coloured border to signal the mismatch.
 */
export function PlayerRow({
  player,
  showCharacters,
  character,
  onToggleAlive,
  onToggleGhostVote,
  onRowClick,
}: PlayerRowProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const typeColor = character ? getCharacterTypeColor(character.type) : '#9e9e9e';
  const isDead = !player.alive;

  // Traveller border: split blue/red
  const travellerBorder = player.isTraveller
    ? `3px solid ${characterColors.travellerGood}`
    : undefined;
  const travellerBorderRight = player.isTraveller
    ? `3px solid ${characterColors.travellerEvil}`
    : undefined;

  // M3-6: Alignment mismatch border on the type pill
  // Compare player's actualAlignment to the character's defaultAlignment.
  // If they differ, draw a thick border in the player's actual alignment colour.
  // e.g. Evil Townsfolk → blue pill with red border; Good Demon → red pill with blue border.
  const hasMismatch =
    character &&
    player.actualAlignment !== 'Unknown' &&
    character.defaultAlignment !== 'Unknown' &&
    player.actualAlignment !== character.defaultAlignment;

  const mismatchBorder = hasMismatch
    ? player.actualAlignment === 'Evil'
      ? `3px solid ${characterColors.demon}`
      : `3px solid ${characterColors.townsfolk}`
    : undefined;

  return (
    <>
      <TableRow
        hover
        onClick={() => showCharacters && onRowClick(player.seat)}
        sx={{
          opacity: isDead ? 0.5 : 1,
          cursor: showCharacters ? 'pointer' : 'default',
          borderLeft: travellerBorder,
          borderRight: travellerBorderRight,
        }}
      >
        {/* Seat # */}
        <TableCell align="center" sx={{ width: 40, px: 1 }}>
          {player.seat}
        </TableCell>

        {/* Player Name */}
        <TableCell sx={{ px: 1, fontWeight: 500 }}>{player.playerName}</TableCell>

        {/* Type chip (night view only) */}
        {showCharacters && (
          <TableCell sx={{ px: 1 }}>
            {character ? (
              <Chip
                label={character.type}
                size="small"
                sx={{
                  bgcolor: typeColor,
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  height: 22,
                  border: mismatchBorder ?? 'none',
                }}
              />
            ) : (
              '—'
            )}
          </TableCell>
        )}

        {/* Character icon (night view only) */}
        {showCharacters && (
          <TableCell align="center" sx={{ width: 36, px: 0.5 }}>
            {character ? (
              <Box
                onClick={(e) => {
                  e.stopPropagation();
                  setDetailOpen(true);
                }}
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  bgcolor: typeColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  cursor: 'pointer',
                  '&:hover': { opacity: 0.8 },
                }}
              >
                <Typography
                  sx={{ color: '#fff', fontWeight: 700, fontSize: '0.65rem', lineHeight: 1 }}
                >
                  {character.name.charAt(0)}
                </Typography>
              </Box>
            ) : (
              '—'
            )}
          </TableCell>
        )}

        {/* Character Name (night view only) */}
        {showCharacters && <TableCell sx={{ px: 1 }}>{character?.name ?? '—'}</TableCell>}

        {/* Active tokens (night view only, F3-17) */}
        {showCharacters && (
          <TableCell sx={{ px: 1 }}>
            {player.tokens.length > 0 ? <TokenChips tokens={player.tokens} /> : '—'}
          </TableCell>
        )}

        {/* Ability short (night view only) — strikethrough when dead */}
        {showCharacters && (
          <TableCell
            sx={{
              px: 1,
              maxWidth: 180,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: '0.75rem',
              color: 'text.secondary',
              textDecoration: isDead ? 'line-through' : 'none',
            }}
          >
            {character?.abilityShort ?? '—'}
          </TableCell>
        )}

        {/* Alive/Dead toggle */}
        <TableCell align="center" sx={{ width: 44, px: 0.5 }}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onToggleAlive(player.seat);
            }}
            color={player.alive ? 'success' : 'error'}
            aria-label={player.alive ? 'Mark as dead' : 'Mark as alive'}
          >
            {player.alive ? <CheckCircleIcon fontSize="small" /> : <CancelIcon fontSize="small" />}
          </IconButton>
        </TableCell>

        {/* Alignment indicator (night view only) */}
        {showCharacters && (
          <TableCell align="center" sx={{ width: 32, px: 0.5 }}>
            <Box
              sx={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                mx: 'auto',
                bgcolor:
                  player.actualAlignment === 'Good'
                    ? characterColors.townsfolk
                    : player.actualAlignment === 'Evil'
                      ? characterColors.demon
                      : '#9e9e9e',
              }}
            />
          </TableCell>
        )}

        {/* Ghost Vote */}
        <TableCell align="center" sx={{ width: 44, px: 0.5 }}>
          {isDead && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onToggleGhostVote(player.seat);
              }}
              color={player.ghostVoteUsed ? 'default' : 'primary'}
              aria-label={player.ghostVoteUsed ? 'Ghost vote used' : 'Ghost vote available'}
            >
              <HowToVoteIcon
                fontSize="small"
                sx={{
                  opacity: player.ghostVoteUsed ? 0.3 : 1,
                }}
              />
            </IconButton>
          )}
        </TableCell>
      </TableRow>

      {/* Character Detail Modal */}
      <CharacterDetailModal
        open={detailOpen}
        character={character ?? null}
        onClose={() => setDetailOpen(false)}
      />
    </>
  );
}
