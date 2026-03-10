import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import type { PlayerToken } from '@/types/index.ts';
import { resolveTokenColor } from '@/components/common/characterTypeColor.ts';
import { getCharacterIconPath } from '@/utils/characterIcon.ts';

export interface ReminderTokenChipProps {
  /** The player token to render. */
  token: PlayerToken;
  /** Chip size — "small" (default) or "medium". */
  size?: 'small' | 'medium';
  /** Delete handler — when provided the chip gets a delete button. */
  onRemove?: () => void;
  /** Display name of the source character (shown as avatar tooltip). */
  sourceName?: string;
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
  sourceName,
}: ReminderTokenChipProps) {
  const iconSize = size === 'small' ? 20 : 22;

  const avatarElement = token.sourceCharacterId ? (
    <Avatar
      src={getCharacterIconPath(token.sourceCharacterId)}
      alt={sourceName ?? token.sourceCharacterId}
      sx={{ width: iconSize, height: iconSize }}
    />
  ) : undefined;

  const wrappedAvatar =
    avatarElement && sourceName ? (
      <Tooltip title={sourceName}>{avatarElement}</Tooltip>
    ) : (
      avatarElement
    );

  return (
    <Chip
      label={token.label}
      size={size}
      avatar={wrappedAvatar}
      onDelete={onRemove}
      sx={{
        bgcolor: resolveTokenColor(token),
        color: '#fff',
        fontWeight: 600,
        fontSize: size === 'small' ? '0.65rem' : '0.75rem',
        height: 'auto',
        maxWidth: 'none',
        whiteSpace: 'normal',
        wordWrap: 'break-word',
        '& .MuiChip-label': {
          whiteSpace: 'normal',
          wordWrap: 'break-word',
          py: 0.5,
        },
      }}
    />
  );
}
