import { useCallback } from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
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
 *
 * On larger viewports (≥600px), icons and text scale up ~50% for readability at a distance.
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

  const isLargeViewport = useMediaQuery('(min-width:600px)');
  const iconSize = isLargeViewport ? 168 : 112;
  const nameVariant = isLargeViewport ? 'h5' : 'h6';
  const nameMaxWidth = isLargeViewport ? 200 : 140;
  const titleVariant = isLargeViewport ? 'h3' : 'h4';
  const messageVariant = isLargeViewport ? 'h2' : 'h3';

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
            variant={titleVariant}
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
              gap: isLargeViewport ? 6 : 4,
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
                    width: iconSize,
                    height: iconSize,
                    border: `3px solid ${getCharacterTypeColor(ch.type)}`,
                    bgcolor: '#fff',
                  }}
                />
                <Typography
                  variant={nameVariant}
                  sx={{
                    color: getCharacterTypeColor(ch.type),
                    fontWeight: 600,
                    textAlign: 'center',
                    maxWidth: nameMaxWidth,
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
          variant={messageVariant}
          data-testid="player-show-message"
          sx={{
            color: '#fff',
            fontWeight: 700,
            textAlign: 'center',
            px: 4,
            maxWidth: isLargeViewport ? 800 : 600,
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
