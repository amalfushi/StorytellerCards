import { useCallback, useState } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import Avatar from '@mui/material/Avatar';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import CloseIcon from '@mui/icons-material/Close';
import type { CharacterDef } from '@/types/index.ts';
import { CharacterIconImage } from '@/components/common/CharacterIconImage.tsx';
import { getCharacterTypeColor } from '@/components/common/characterTypeColor.ts';
import { getAlignmentBorderColor, getCharacterIconPath } from '@/utils/characterIcon.ts';
import { rewriteShowPlayerMessage } from '@/utils/rewriteShowPlayerMessage.ts';

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
  /** Source character that triggered the display (e.g. Cerenovus for "SELECTED YOU"). */
  sourceCharacter?: CharacterDef;
  /** Additional character to display (e.g. the madness character for Cerenovus). */
  additionalCharacter?: CharacterDef;
  /** Character list to display with icons (e.g. not-in-play characters). */
  characterList?: CharacterDef[];
  /** Label shown above the additional character (e.g. "You are now MAD that you are:"). */
  additionalLabel?: string;
  /** Instruction text shown between the token header and selected character icon. */
  instructionText?: string;
  /** Character ID selected by default when the character picker opens. */
  initialSelectedCharacterId?: string;
  /** Use a Good/Evil selector instead of the character picker. */
  showAlignmentPicker?: boolean;
  /** Current Good/Evil selection for the alignment picker. */
  alignmentValue?: string;
  /** Callback fired when a Good/Evil value is selected. */
  onAlignmentChange?: (value: 'Good' | 'Evil') => void;
}

interface CharacterShowIconProps {
  character: CharacterDef;
  iconSize: number;
  nameVariant: 'h3' | 'h4';
  nameMaxWidth: number;
  testId: string;
}

function CharacterShowIcon({
  character,
  iconSize,
  nameVariant,
  nameMaxWidth,
  testId,
}: CharacterShowIconProps) {
  const typeColor = getCharacterTypeColor(character.type);
  return (
    <Box
      sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}
      data-testid={testId}
    >
      <CharacterIconImage
        characterId={character.id}
        characterName={character.name}
        typeColor={typeColor}
        size={iconSize}
        borderColor={getAlignmentBorderColor(character.defaultAlignment, typeColor)}
        alignment={character.defaultAlignment}
      />
      <Typography
        variant={nameVariant}
        sx={{
          color: typeColor,
          fontWeight: 600,
          textAlign: 'center',
          maxWidth: nameMaxWidth,
          lineHeight: 1.2,
        }}
      >
        {character.name}
      </Typography>
    </Box>
  );
}

/**
 * Fullscreen overlay for showing information to a player.
 *
 * Designed for physically turning the phone toward a player so they
 * can read the content without seeing any other game info.
 *
 * - `variant='bluffs'`: Player-facing bluff guidance + large character icons
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
  sourceCharacter,
  additionalCharacter,
  characterList,
  additionalLabel,
  instructionText,
  initialSelectedCharacterId,
  showAlignmentPicker = false,
  alignmentValue = '',
  onAlignmentChange,
}: PlayerShowScreenProps) {
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const [selectedCharacterId, setSelectedCharacterId] = useState(initialSelectedCharacterId ?? '');
  const selectedCharacter =
    scriptCharacters.find((character) => character.id === selectedCharacterId) ?? null;

  const isLargeViewport = useMediaQuery('(min-width:600px)');
  const iconSize = isLargeViewport ? 168 : 112;
  const nameVariant = isLargeViewport ? 'h3' : 'h4';
  const nameMaxWidth = isLargeViewport ? 300 : 220;
  const titleVariant = isLargeViewport ? 'h3' : 'h4';
  const messageVariant = isLargeViewport ? 'h2' : 'h3';
  const instructionVariant = isLargeViewport ? 'h5' : 'h6';

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
              mb: 1,
              textAlign: 'center',
              textShadow: '0 2px 12px rgba(0,0,0,0.5)',
            }}
            data-testid="player-show-bluff-title"
          >
            These characters are not in play.
          </Typography>

          <Typography
            variant={instructionVariant}
            data-testid="player-show-bluff-instructions"
            sx={{
              color: 'rgba(255,255,255,0.78)',
              fontStyle: 'italic',
              textAlign: 'center',
              px: 3,
              mb: 5,
              maxWidth: isLargeViewport ? 640 : 420,
              lineHeight: 1.45,
            }}
          >
            You may pretend to be these characters. Try to share this information with your minions.
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
              <CharacterShowIcon
                key={ch.id}
                character={ch}
                iconSize={iconSize}
                nameVariant={nameVariant}
                nameMaxWidth={nameMaxWidth}
                testId={`player-show-bluff-${ch.id}`}
              />
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
          {rewriteShowPlayerMessage(message)}
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

          {/* Source character icon (e.g. the Cerenovus/Harpy token) */}
          {sourceCharacter && (
            <CharacterShowIcon
              character={sourceCharacter}
              iconSize={iconSize}
              nameVariant={nameVariant}
              nameMaxWidth={nameMaxWidth}
              testId={`source-character-${sourceCharacter.id}`}
            />
          )}

          {/* Additional label (e.g. "You are now MAD that you are:") */}
          {additionalLabel && (
            <Typography
              variant={titleVariant}
              sx={{
                color: '#fff',
                fontWeight: 700,
                textAlign: 'center',
                textShadow: '0 2px 12px rgba(0,0,0,0.5)',
                mt: 1,
              }}
              data-testid="token-additional-label"
            >
              {additionalLabel}
            </Typography>
          )}

          {/* Instruction text (e.g. madness consequences) */}
          {instructionText && (
            <Typography
              variant={instructionVariant}
              data-testid="token-instruction-text"
              sx={{
                color: 'rgba(255,255,255,0.78)',
                fontStyle: 'italic',
                textAlign: 'center',
                px: 2,
                maxWidth: isLargeViewport ? 640 : 420,
                lineHeight: 1.45,
              }}
            >
              {instructionText}
            </Typography>
          )}

          {/* Additional character icon (e.g. the madness character for Cerenovus) */}
          {additionalCharacter && (
            <CharacterShowIcon
              character={additionalCharacter}
              iconSize={iconSize}
              nameVariant={nameVariant}
              nameMaxWidth={nameMaxWidth}
              testId={`additional-character-${additionalCharacter.id}`}
            />
          )}

          {/* Character icon list (e.g. not-in-play characters) */}
          {characterList && characterList.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap' }}>
              {characterList.map((character) => (
                <CharacterShowIcon
                  key={character.id}
                  character={character}
                  iconSize={Math.round(iconSize * 0.75)}
                  nameVariant={nameVariant}
                  nameMaxWidth={nameMaxWidth}
                  testId={`token-character-list-${character.id}`}
                />
              ))}
            </Box>
          )}

          {/* Selected character display from picker (large icon) */}
          {selectedCharacter && (
            <CharacterShowIcon
              character={selectedCharacter}
              iconSize={iconSize}
              nameVariant={nameVariant}
              nameMaxWidth={nameMaxWidth}
              testId={`selected-character-${selectedCharacter.id}`}
            />
          )}

          {showCharacterPicker && showAlignmentPicker && (
            <FormControl size="small" sx={{ width: isLargeViewport ? 350 : 280 }}>
              <InputLabel id="token-alignment-picker-label" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                Select alignment to show
              </InputLabel>
              <Select
                labelId="token-alignment-picker-label"
                label="Select alignment to show"
                value={alignmentValue}
                onChange={(event) => {
                  const value = event.target.value;
                  if (value === 'Good' || value === 'Evil') onAlignmentChange?.(value);
                }}
                data-testid="token-alignment-picker"
                sx={{
                  color: '#fff',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255,255,255,0.5)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#90caf9' },
                  '& .MuiSvgIcon-root': { color: 'rgba(255,255,255,0.5)' },
                }}
              >
                <MenuItem value="Good">Good</MenuItem>
                <MenuItem value="Evil">Evil</MenuItem>
              </Select>
            </FormControl>
          )}

          {/* Character picker — display-only, does NOT change game state */}
          {showCharacterPicker && !showAlignmentPicker && scriptCharacters.length > 0 && (
            <Autocomplete
              options={scriptCharacters}
              getOptionLabel={(opt) => opt.name}
              groupBy={(opt) => opt.type}
              value={selectedCharacter}
              onChange={(_, val) => setSelectedCharacterId(val?.id ?? '')}
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
          {showCharacterPicker && !showAlignmentPicker && !selectedCharacter && (
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
