import { useCallback, useState } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import CloseIcon from '@mui/icons-material/Close';
import type { CharacterDef } from '@/types/index.ts';
import { getCharacterTypeColor } from '@/components/common/characterTypeColor.ts';
import { getCharacterIconPath } from '@/utils/characterIcon.ts';

/** Variant determines the display layout. */
export type PlayerShowScreenVariant = 'bluffs' | 'text' | 'token';

export interface PlayerShowScreenProps {
  open: boolean;
  onClose: () => void;
  variant: PlayerShowScreenVariant;
  /** Bluff characters to display (variant='bluffs'). */
  bluffCharacters?: CharacterDef[];
  /** Text message to display (variant='text'). */
  message?: string;
  /** Token display text, e.g. "You are:" (variant='token'). */
  tokenText?: string;
  /** Whether this token needs a character picker (variant='token'). */
  showCharacterPicker?: boolean;
  /** Script characters for the picker dropdown (variant='token'). */
  scriptCharacters?: CharacterDef[];
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
  tokenText,
  showCharacterPicker = false,
  scriptCharacters = [],
}: PlayerShowScreenProps) {
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const [selectedCharacter, setSelectedCharacter] = useState<CharacterDef | null>(null);

  const isLargeViewport = useMediaQuery('(min-width:600px)');
  const iconSize = isLargeViewport ? 168 : 112;
  const nameVariant = isLargeViewport ? 'h3' : 'h4';
  const nameMaxWidth = isLargeViewport ? 300 : 220;
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

      {variant === 'token' && tokenText && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            px: 3,
          }}
          data-testid="player-show-token"
        >
          {/* Token text */}
          <Typography
            variant={titleVariant}
            sx={{
              color: '#fff',
              fontWeight: 700,
              textAlign: 'center',
              textShadow: '0 2px 12px rgba(0,0,0,0.5)',
            }}
          >
            {tokenText}
          </Typography>

          {/* Selected character display (large icon) */}
          {selectedCharacter && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
              <Avatar
                src={getCharacterIconPath(selectedCharacter.id)}
                alt={selectedCharacter.name}
                sx={{
                  width: iconSize,
                  height: iconSize,
                  border: `3px solid ${getCharacterTypeColor(selectedCharacter.type)}`,
                  bgcolor: '#fff',
                }}
              />
              <Typography
                variant={nameVariant}
                sx={{
                  color: getCharacterTypeColor(selectedCharacter.type),
                  fontWeight: 600,
                  textAlign: 'center',
                  maxWidth: nameMaxWidth,
                  lineHeight: 1.2,
                }}
              >
                {selectedCharacter.name}
              </Typography>
            </Box>
          )}

          {/* Character picker — display-only, does NOT change game state */}
          {showCharacterPicker && scriptCharacters.length > 0 && (
            <Autocomplete
              options={scriptCharacters}
              getOptionLabel={(opt) => opt.name}
              groupBy={(opt) => opt.type}
              value={selectedCharacter}
              onChange={(_, val) => setSelectedCharacter(val)}
              renderOption={(props, opt) => {
                const { key, ...rest } = props;
                return (
                  <Box
                    component="li"
                    key={key}
                    {...rest}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                  >
                    <Avatar
                      src={getCharacterIconPath(opt.id)}
                      alt={opt.name}
                      sx={{ width: 28, height: 28, bgcolor: '#fff' }}
                    />
                    <Typography sx={{ color: getCharacterTypeColor(opt.type), fontWeight: 500 }}>
                      {opt.name}
                    </Typography>
                  </Box>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select character to show"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#fff',
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
                      '&.Mui-focused fieldset': { borderColor: '#90caf9' },
                    },
                    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                    '& .MuiSvgIcon-root': { color: 'rgba(255,255,255,0.5)' },
                  }}
                />
              )}
              sx={{ width: isLargeViewport ? 350 : 280 }}
              data-testid="token-character-picker"
            />
          )}

          {/* Prompt to select when picker is shown but nothing selected */}
          {showCharacterPicker && !selectedCharacter && (
            <Typography
              variant="body1"
              sx={{ color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', mt: 1 }}
            >
              Select a character above to display
            </Typography>
          )}
        </Box>
      )}
    </Dialog>
  );
}
