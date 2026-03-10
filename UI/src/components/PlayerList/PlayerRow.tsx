import { useState } from 'react';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import type { PlayerSeat, CharacterDef } from '@/types/index.ts';
import { characterColors } from '@/theme/index.ts';
import { getCharacterTypeColor } from '@/components/common/characterTypeColor.ts';
import { CharacterDetailModal } from '@/components/common/CharacterDetailModal.tsx';
import { CharacterIconImage } from '@/components/common/CharacterIconImage.tsx';
import { ReminderTokenChips } from '@/components/common/ReminderTokenChips.tsx';
import { getAlignmentBorderColor } from '@/utils/characterIcon.ts';

interface PlayerRowProps {
  player: PlayerSeat;
  showCharacters: boolean;
  /** Whether the alignment column is visible. */
  showAlignment?: boolean;
  character?: CharacterDef;
  onToggleAlive: (seat: number) => void;
  onToggleGhostVote: (seat: number) => void;
  onRowClick: (seat: number) => void;
  /** Edit handler — shows an edit icon button in the row. */
  onEdit?: (seat: number) => void;
  /** Whether this row is the active swap source. */
  isSwapSource?: boolean;
  /** Apparent (believed) character definition for concealed players. */
  apparentCharacter?: CharacterDef;
}

/**
 * A single row in the PlayerList table.
 *
 * Column order:
 * Seat | Player Name | Type (pill) | Icon | Character Name | Ability | Tokens | Alignment | Alive | Ghost Vote
 *
 * Day view hides character-specific columns (except Traveller icons/names are always visible).
 * If a player's actualAlignment differs from their character's defaultAlignment,
 * the type pill gets a thick coloured border to signal the mismatch.
 */
export function PlayerRow({
  player,
  showCharacters,
  showAlignment = false,
  character,
  onToggleAlive,
  onToggleGhostVote,
  onRowClick,
  onEdit,
  isSwapSource,
  apparentCharacter,
}: PlayerRowProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const typeColor = character ? getCharacterTypeColor(character.type) : '#9e9e9e';
  const isDead = !player.alive;

  // Traveller border: single-color based on alignment (only shown when showCharacters)
  const travellerBorderColor = player.isTraveller
    ? player.actualAlignment === 'Good'
      ? characterColors.travellerGood
      : player.actualAlignment === 'Evil'
        ? characterColors.travellerEvil
        : '#9e9e9e'
    : undefined;
  const travellerBorder =
    player.isTraveller && showCharacters ? `3px solid ${travellerBorderColor}` : undefined;

  // Traveller background tint: 10% opacity of type color (always visible)
  const travellerBackground = player.isTraveller
    ? player.actualAlignment === 'Evil'
      ? 'rgba(211, 47, 47, 0.1)'
      : 'rgba(25, 118, 210, 0.1)'
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
          borderRight: travellerBorder,
          backgroundColor: isSwapSource ? 'rgba(237, 108, 2, 0.15)' : travellerBackground,
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

        {/* Character icon (night view OR Traveller always visible) */}
        {(showCharacters || player.isTraveller) && (
          <TableCell align="center" sx={{ width: 60, px: 0.5 }}>
            {character ? (
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <CharacterIconImage
                  characterId={character.id}
                  characterName={character.name}
                  typeColor={typeColor}
                  size={48}
                  borderColor={getAlignmentBorderColor(player.actualAlignment, typeColor)}
                  alignment={player.actualAlignment}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDetailOpen(true);
                  }}
                />
              </Box>
            ) : (
              '—'
            )}
          </TableCell>
        )}

        {/* Character Name (night view OR Traveller always visible) */}
        {(showCharacters || player.isTraveller) && (
          <TableCell sx={{ px: 1 }}>
            {character?.name ?? '—'}
            {showCharacters && apparentCharacter && (
              <Chip
                label={`→ ${apparentCharacter.name}`}
                size="small"
                title={`Believes they are ${apparentCharacter.name}`}
                sx={{
                  ml: 0.5,
                  fontSize: '0.6rem',
                  height: 18,
                  bgcolor: 'rgba(255,152,0,0.15)',
                  color: '#ff9800',
                  fontStyle: 'italic',
                }}
              />
            )}
          </TableCell>
        )}

        {/* Ability short (night view only) — strikethrough when dead */}
        {showCharacters && (
          <TableCell
            sx={{
              px: 1,
              flex: 2,
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              whiteSpace: 'normal',
              fontSize: '0.75rem',
              color: 'text.secondary',
              textDecoration: isDead ? 'line-through' : 'none',
            }}
          >
            {character?.abilityShort ?? '—'}
          </TableCell>
        )}

        {/* Active tokens / reminders (night view only) */}
        {showCharacters && (
          <TableCell sx={{ px: 1 }}>
            {player.tokens.length > 0 ? <ReminderTokenChips tokens={player.tokens} /> : null}
          </TableCell>
        )}

        {/* Alignment text (night view only, when showAlignment is on) */}
        {showCharacters && showAlignment && (
          <TableCell align="center" sx={{ width: 60, px: 0.5 }}>
            <Box
              component="span"
              sx={{
                fontWeight: 600,
                fontSize: '0.75rem',
                color:
                  player.actualAlignment === 'Good'
                    ? characterColors.townsfolk
                    : player.actualAlignment === 'Evil'
                      ? characterColors.demon
                      : '#9e9e9e',
              }}
            >
              {player.actualAlignment}
            </Box>
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

        {/* Edit button (visible mode only, when onEdit provided) */}
        {showCharacters && onEdit && (
          <TableCell align="center" sx={{ width: 36, px: 0.5 }}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(player.seat);
              }}
              aria-label={`edit seat ${player.seat}`}
              data-testid={`edit-btn-${player.seat}`}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </TableCell>
        )}
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
