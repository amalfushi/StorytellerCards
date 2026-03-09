import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import type { PlayerToken } from '@/types/index.ts';
import { getReminderTokenColor } from '@/components/common/characterTypeColor.ts';
import { getCharacterIconPath } from '@/utils/characterIcon.ts';

// ──────────────────────────────────────────────
// Token display colours (F3-17 / F3-18)
// ──────────────────────────────────────────────

const TOKEN_CHIP_COLORS = {
  drunk: '#7b1fa2', // purple
  poisoned: '#388e3c', // green
  custom: '#757575', // grey fallback
} as const;

export interface ReminderTokenChipsProps {
  /** The player's active tokens. */
  tokens: PlayerToken[];
  /** Chip size — "small" (default) or "medium". */
  size?: 'small' | 'medium';
  /** Optional delete handler — when provided each chip gets a delete button. */
  onRemove?: (tokenId: string) => void;
  /** Optional resolver for source character display name (used in avatar tooltip). */
  getSourceName?: (sourceCharacterId: string) => string | undefined;
}

/**
 * Resolve the background colour for a token chip.
 *
 * - Drunk → purple (`#7b1fa2`)
 * - Poisoned → green (`#388e3c`)
 * - Custom with source character → character type colour
 * - Custom → token's own colour if set, otherwise grey (`#757575`)
 */
function resolveTokenColor(token: PlayerToken): string {
  if (token.type === 'drunk') return TOKEN_CHIP_COLORS.drunk;
  if (token.type === 'poisoned') return TOKEN_CHIP_COLORS.poisoned;
  if (token.sourceCharacterId) return getReminderTokenColor(token.sourceCharacterId);
  return token.color ?? TOKEN_CHIP_COLORS.custom;
}

/**
 * Renders a row of small coloured MUI Chips representing a player's
 * active status tokens (Drunk, Poisoned, custom).
 *
 * Each chip shows the source character's icon (when available) and
 * is coloured by the source character's type colour.
 *
 * Optionally supports removal via `onRemove` and source name tooltips
 * via `getSourceName` — used by the TokenManager dialog.
 */
export function ReminderTokenChips({
  tokens,
  size = 'small',
  onRemove,
  getSourceName,
}: ReminderTokenChipsProps) {
  if (!tokens || tokens.length === 0) return null;

  // Dev-time validation: warn when custom tokens lack a sourceCharacterId
  if (import.meta.env.DEV) {
    for (const token of tokens) {
      if (token.type === 'custom' && !token.sourceCharacterId) {
        console.error(
          `[ReminderTokenChips] Token "${token.label}" (${token.id}) is missing sourceCharacterId. ` +
            'All custom tokens should reference their originating character.',
        );
      }
    }
  }

  const iconSize = size === 'small' ? 20 : 22;

  return (
    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
      {tokens.map((token) => {
        const sourceName =
          token.sourceCharacterId && getSourceName
            ? getSourceName(token.sourceCharacterId)
            : undefined;
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
            key={token.id}
            label={token.label}
            size={size}
            avatar={wrappedAvatar}
            onDelete={onRemove ? () => onRemove(token.id) : undefined}
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
      })}
    </Box>
  );
}
