import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { PlayerToken } from '@/types/index.ts';
import { resolveTokenColor } from '@/components/common/characterTypeColor.ts';
import { getDefaultCharacterIconPath } from '@/utils/characterIcon.ts';
import { getCharacter } from '@/data/characters/index.ts';

export interface ReminderTokenChipProps {
  /** The player token to render. */
  token: PlayerToken;
  /** Chip size — "small" (default) or "medium". */
  size?: 'small' | 'medium';
  /** Delete handler — when provided the chip gets a delete button. */
  onRemove?: () => void;
  /** Click handler. */
  onClick?: () => void;
  /** Display name of the source character (shown as avatar tooltip). */
  sourceName?: string;
  /** When true, renders in a greyed-out "already placed" state. */
  placed?: boolean;
  /** Subtext shown below the token label (e.g., player placement info). */
  placedInfo?: string;
}

/**
 * Renders a single coloured MUI Chip representing a player's status token.
 *
 * Shows the source character's icon (when available) and is coloured by
 * the source character's type colour. This is the shared visual component
 * used by both {@link ReminderTokenChips} (horizontal list) and
 * {@link TokenBadges} (positioned around player tiles).
 */
export function ReminderTokenChip({
  token,
  size = 'small',
  onRemove,
  onClick,
  sourceName,
  placed,
  placedInfo,
}: ReminderTokenChipProps) {
  const iconSize = size === 'small' ? 30 : 40;

  const sourceCharacter = token.sourceCharacterId
    ? getCharacter(token.sourceCharacterId)
    : undefined;
  const avatarSrc =
    token.sourceCharacterId && sourceCharacter
      ? getDefaultCharacterIconPath(token.sourceCharacterId, sourceCharacter.type)
      : undefined;

  const avatarElement = token.sourceCharacterId ? (
    <Avatar
      src={avatarSrc}
      alt={sourceName ?? token.sourceCharacterId}
      sx={{
        width: iconSize,
        height: iconSize,
        bgcolor: '#fff',
        border: '2px solid #fff',
        overflow: 'visible',
        '& img': {
          width: 34,
          height: 34,
          objectFit: 'contain',
          position: 'relative',
        },
      }}
    />
  ) : undefined;

  const wrappedAvatar =
    avatarElement && sourceName ? (
      <Tooltip title={sourceName}>{avatarElement}</Tooltip>
    ) : (
      avatarElement
    );

  const chipMinHeight = iconSize + 4;
  const baseColor = resolveTokenColor(token);

  const chipLabel = placedInfo ? (
    <Box component="span" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <span>{token.label}</span>
      <Typography
        component="span"
        data-testid="placed-reminder-info"
        sx={{ fontSize: '0.55rem', lineHeight: 1.1, color: 'rgba(255,255,255,0.5)' }}
      >
        {placedInfo}
      </Typography>
    </Box>
  ) : (
    token.label
  );

  return (
    <Chip
      label={chipLabel}
      size={size}
      avatar={wrappedAvatar}
      onDelete={onRemove}
      onClick={onClick}
      sx={{
        bgcolor: placed ? 'rgba(128,128,128,0.15)' : baseColor,
        color: placed ? 'rgba(200,200,200,0.5)' : '#fff',
        fontWeight: 600,
        fontSize: size === 'small' ? '0.65rem' : '0.75rem',
        minHeight: chipMinHeight,
        maxWidth: 'none',
        whiteSpace: 'normal',
        wordWrap: 'break-word',
        pl: '1px',
        opacity: placed ? 0.6 : 1,
        border: placed ? '1px solid rgba(128,128,128,0.3)' : undefined,
        cursor: onClick ? 'pointer' : 'default',
        '& .MuiChip-avatar': {
          width: iconSize,
          height: iconSize,
          ml: '2px',
        },
        '& .MuiChip-label': {
          whiteSpace: 'normal',
          wordWrap: 'break-word',
          py: 0.5,
        },
      }}
    />
  );
}
