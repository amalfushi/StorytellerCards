import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { SxProps, Theme } from '@mui/material/styles';
import { getCharacterIconPath } from '@/utils/characterIcon.ts';

export interface CharacterIconImageProps {
  /** Character ID used to resolve the icon path (e.g. `"fortuneteller"`). */
  characterId: string;
  /** Character name — used for `alt` text and the fallback letter. */
  characterName: string;
  /** CSS colour for the fallback circle background. */
  typeColor: string;
  /** Width and height in pixels (enforced minimum of 48). */
  size: number;
  /** Colour of the thick circular border ring around the icon. */
  borderColor: string;
  /** Optional click handler. Adds `cursor: pointer` when provided. */
  onClick?: (event: React.MouseEvent) => void;
  /** Extra MUI `sx` props merged onto the outer wrapper. */
  sx?: SxProps<Theme>;
  /** When `true`, desaturates and darkens the icon. */
  isDead?: boolean;
}

/**
 * Renders a character's PNG icon inside a white circular container with a
 * coloured alignment border.
 *
 * Visual structure (outermost → innermost):
 * ```
 * ┌─── thick coloured border (3 px) ───┐
 * │ ┌─── white background fill ──────┐ │
 * │ │   ┌── character icon (PNG) ──┐ │ │
 * │ │   └──────────────────────────┘ │ │
 * │ └────────────────────────────────┘ │
 * └────────────────────────────────────┘
 * ```
 *
 * If the image fails to load (missing file, network error, etc.) the
 * component falls back to the legacy coloured-circle-with-first-letter
 * approach so the UI is never blank.
 *
 * The `size` prop defines the **outer diameter** including the border.
 * A minimum of 48 px is enforced regardless of what the caller passes.
 */
export function CharacterIconImage({
  characterId,
  characterName,
  typeColor,
  size: rawSize,
  borderColor,
  onClick,
  sx,
  isDead = false,
}: CharacterIconImageProps) {
  const size = Math.max(rawSize, 48);
  const borderWidth = 3;
  const innerSize = size - borderWidth * 2;

  const [imgError, setImgError] = useState(false);

  const handleError = useCallback(() => {
    setImgError(true);
  }, []);

  const deadFilter = isDead ? 'saturate(0.2) brightness(0.7)' : 'none';
  const cursor = onClick ? 'pointer' : 'default';

  return (
    <Box
      onClick={onClick}
      sx={[
        {
          width: size,
          height: size,
          borderRadius: '50%',
          border: `${borderWidth}px solid ${borderColor}`,
          backgroundColor: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          filter: deadFilter,
          transition: 'filter 0.3s ease',
          cursor,
          '&:hover': onClick ? { opacity: 0.85 } : {},
          boxSizing: 'border-box',
        },
        // Merge caller-supplied sx (supports array form)
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {imgError || !characterId ? (
        <Box
          sx={{
            width: innerSize,
            height: innerSize,
            borderRadius: '50%',
            bgcolor: typeColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography
            sx={{
              color: '#fff',
              fontWeight: 700,
              fontSize: `${innerSize * 0.45}px`,
              lineHeight: 1,
              textTransform: 'uppercase',
            }}
          >
            {characterName.charAt(0) || '?'}
          </Typography>
        </Box>
      ) : (
        <img
          src={getCharacterIconPath(characterId)}
          alt={characterName}
          onError={handleError}
          style={{
            display: 'block',
            width: innerSize,
            height: innerSize,
            objectFit: 'cover',
            borderRadius: '50%',
          }}
        />
      )}
    </Box>
  );
}
