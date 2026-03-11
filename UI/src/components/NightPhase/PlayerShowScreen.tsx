import { useCallback } from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import type { CharacterDef } from '@/types/index.ts';
import { getCharacterTypeColor } from '@/components/common/characterTypeColor.ts';
import { getCharacterIconPath } from '@/utils/characterIcon.ts';

/** Variant determines the display layout. */
export type PlayerShowScreenVariant = 'bluffs' | 'text';

export interface PlayerShowScreenProps {
  open: boolean;
  onClose: () => void;
  variant: PlayerShowScreenVariant;
  /** Bluff characters to display (variant='bluffs'). */
  bluffCharacters?: CharacterDef[];
  /** Text message to display (variant='text'). */
  message?: string;
}

/**
 * Fullscreen overlay for showing information to a player.
 *
 * Designed for physically turning the phone toward a player so they
 * can read the content without seeing any other game info.
 *
 * - `variant='bluffs'`: "Your bluffs are:" + large character icons
 * - `variant='text'`: Large centered text message
 */
export function PlayerShowScreen({
  open,
  onClose,
  variant,
  bluffCharacters = [],
  message,
}: PlayerShowScreenProps) {
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen
      data-testid="player-show-screen"
      slotProps={{
        paper: {
          sx: {
            bgcolor: '#0a0a0a',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          },
        },
      }}
    >
      {/* Close button */}
      <IconButton
        aria-label="close"
        onClick={onClose}
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          color: 'rgba(255,255,255,0.5)',
          '&:hover': { color: 'rgba(255,255,255,0.8)' },
        }}
        data-testid="player-show-screen-close"
      >
        <CloseIcon sx={{ fontSize: '2rem' }} />
      </IconButton>

      {variant === 'bluffs' && (
        <>
          <Typography
            variant="h4"
            sx={{
              color: '#fff',
              fontWeight: 700,
              mb: 5,
              textAlign: 'center',
              textShadow: '0 2px 12px rgba(0,0,0,0.5)',
            }}
          >
            Your bluffs are:
          </Typography>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: 4,
              flexWrap: 'wrap',
              px: 3,
            }}
          >
            {bluffCharacters.map((ch) => (
              <Box
                key={ch.id}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1.5,
                }}
                data-testid={`player-show-bluff-${ch.id}`}
              >
                <Avatar
                  src={getCharacterIconPath(ch.id)}
                  alt={ch.name}
                  sx={{
                    width: 112,
                    height: 112,
                    border: `3px solid ${getCharacterTypeColor(ch.type)}`,
                    bgcolor: 'rgba(0,0,0,0.3)',
                  }}
                />
                <Typography
                  variant="h6"
                  sx={{
                    color: getCharacterTypeColor(ch.type),
                    fontWeight: 600,
                    textAlign: 'center',
                    maxWidth: 140,
                    lineHeight: 1.2,
                  }}
                >
                  {ch.name}
                </Typography>
              </Box>
            ))}
          </Box>
        </>
      )}

      {variant === 'text' && message && (
        <Typography
          variant="h3"
          data-testid="player-show-message"
          sx={{
            color: '#fff',
            fontWeight: 700,
            textAlign: 'center',
            px: 4,
            maxWidth: 600,
            lineHeight: 1.4,
            textShadow: '0 2px 12px rgba(0,0,0,0.5)',
          }}
        >
          {message}
        </Typography>
      )}
    </Dialog>
  );
}
