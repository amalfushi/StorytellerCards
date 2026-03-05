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
  /** Width and height in pixels. */
  size: number;
  /** Optional click handler. Adds `cursor: pointer` when provided. */
  onClick?: (event: React.MouseEvent) => void;
  /** Extra MUI `sx` props merged onto the outer wrapper. */
  sx?: SxProps<Theme>;
  /** When `true`, desaturates and darkens the icon. */
  isDead?: boolean;
}

/**
 * Renders a character's PNG icon inside a circular container.
 *
 * If the image fails to load (missing file, network error, etc.) the
 * component falls back to the legacy coloured-circle-with-first-letter
 * approach so the UI is never blank.
 */
export function CharacterIconImage({
  characterId,
  characterName,
  typeColor,
  size,
  onClick,
  sx,
  isDead = false,
}: CharacterIconImageProps) {
  const [imgError, setImgError] = useState(false);

  const handleError = useCallback(() => {
    setImgError(true);
  }, []);

  const deadFilter = isDead ? 'saturate(0.2) brightness(0.7)' : 'none';
  const cursor = onClick ? 'pointer' : 'default';

  // Fallback: coloured circle with first letter
  if (imgError || !characterId) {
    return (
      <Box
        onClick={onClick}
        sx={[
          {
            width: size,
            height: size,
            borderRadius: '50%',
            bgcolor: typeColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            filter: deadFilter,
            transition: 'filter 0.3s ease',
            cursor,
            '&:hover': onClick ? { opacity: 0.85 } : {},
          },
          // Merge caller-supplied sx (supports array form)
          ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
        ]}
      >
        <Typography
          sx={{
            color: '#fff',
            fontWeight: 700,
            fontSize: `${size * 0.45}px`,
            lineHeight: 1,
            textTransform: 'uppercase',
          }}
        >
          {characterName.charAt(0) || '?'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      onClick={onClick}
      sx={[
        {
          width: size,
          height: size,
          borderRadius: '50%',
          overflow: 'hidden',
          flexShrink: 0,
          filter: deadFilter,
          transition: 'filter 0.3s ease',
          cursor,
          '&:hover': onClick ? { opacity: 0.85 } : {},
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <img
        src={getCharacterIconPath(characterId)}
        alt={characterName}
        onError={handleError}
        width={size}
        height={size}
        style={{
          display: 'block',
          width: size,
          height: size,
          objectFit: 'cover',
          borderRadius: '50%',
        }}
      />
    </Box>
  );
}
