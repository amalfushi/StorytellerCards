import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Badge from '@mui/material/Badge';
import Divider from '@mui/material/Divider';
import type {
  NightOrderEntry as NightOrderEntryType,
  PlayerSeat,
  CharacterDef,
} from '@/types/index.ts';
import { getCharacterTypeColor } from '@/components/common/characterTypeColor.ts';
import { CharacterDetailModal } from '@/components/common/CharacterDetailModal.tsx';

interface NightOrderEntryProps {
  entry: NightOrderEntryType;
  character?: CharacterDef;
  /** Player assigned to this character (if any). */
  assignedPlayer?: PlayerSeat;
}

/**
 * A single entry in the night order list.
 * Structural entries (Dusk, Dawn, Minion Info, Demon Info) render as
 * divider/separator cards. Character entries show order badge, icon, name,
 * abbreviated help text, and the assigned player if present.
 */
export function NightOrderEntry({ entry, character, assignedPlayer }: NightOrderEntryProps) {
  const [detailOpen, setDetailOpen] = useState(false);

  // Structural entry — render as divider card
  if (entry.type === 'structural') {
    return (
      <Box
        sx={{
          py: 1,
          px: 2,
          bgcolor: 'grey.200',
          borderTop: '2px solid',
          borderBottom: '2px solid',
          borderColor: 'grey.400',
          my: 0.5,
        }}
      >
        <Typography
          variant="subtitle2"
          fontWeight={700}
          color="text.secondary"
          textAlign="center"
          textTransform="uppercase"
          letterSpacing={1}
        >
          {entry.name}
        </Typography>
        {entry.helpText && entry.helpText !== entry.name && (
          <Typography
            variant="caption"
            color="text.secondary"
            textAlign="center"
            display="block"
            sx={{ mt: 0.25 }}
          >
            {entry.helpText}
          </Typography>
        )}
        <Divider sx={{ mt: 0.5 }} />
      </Box>
    );
  }

  // Character entry
  const typeColor = character ? getCharacterTypeColor(character.type) : '#9e9e9e';
  const isDead = assignedPlayer ? !assignedPlayer.alive : false;

  // Abbreviated help text — first sentence
  const shortHelp = entry.helpText.split(/\.\s/)[0] + '.';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.5,
        px: 1.5,
        py: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
        opacity: isDead ? 0.45 : 1,
        transition: 'opacity 0.2s',
      }}
    >
      {/* Order badge */}
      <Badge
        badgeContent={entry.order}
        color="default"
        sx={{
          '& .MuiBadge-badge': {
            position: 'relative',
            transform: 'none',
            bgcolor: 'grey.700',
            color: '#fff',
            fontSize: '0.65rem',
            minWidth: 22,
            height: 22,
          },
          mt: 0.5,
        }}
      />

      {/* Character icon placeholder */}
      <Box
        onClick={() => {
          if (character) setDetailOpen(true);
        }}
        sx={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          bgcolor: typeColor,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: character ? 'pointer' : 'default',
          '&:hover': character ? { opacity: 0.8 } : {},
        }}
      >
        <Typography variant="caption" sx={{ color: '#fff', fontWeight: 700, fontSize: '0.6rem' }}>
          {entry.name.charAt(0)}
        </Typography>
      </Box>

      {/* Text content */}
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" fontWeight={600} noWrap>
            {entry.name}
          </Typography>

          {/* Assigned player badge */}
          {assignedPlayer && (
            <Typography
              variant="caption"
              sx={{
                bgcolor: 'grey.100',
                px: 0.75,
                py: 0.25,
                borderRadius: 1,
                fontWeight: 500,
                whiteSpace: 'nowrap',
                textDecoration: isDead ? 'line-through' : 'none',
              }}
            >
              #{assignedPlayer.seat} {assignedPlayer.playerName}
            </Typography>
          )}
        </Box>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.3,
          }}
        >
          {shortHelp}
        </Typography>
      </Box>
      {/* Character Detail Modal */}
      <CharacterDetailModal
        open={detailOpen}
        character={character ?? null}
        onClose={() => setDetailOpen(false)}
      />
    </Box>
  );
}
