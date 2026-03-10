import Box from '@mui/material/Box';
import type { PlayerToken } from '@/types/index.ts';
import { ReminderTokenChip } from '@/components/common/ReminderTokenChip.tsx';

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
 * Renders a row of small coloured MUI Chips representing a player's
 * active status tokens (Drunk, Poisoned, custom).
 *
 * Each chip shows the source character's icon (when available) and
 * is coloured by the source character's type colour.
 *
 * Delegates individual chip rendering to {@link ReminderTokenChip}.
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

  return (
    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
      {tokens.map((token) => {
        const sourceName =
          token.sourceCharacterId && getSourceName
            ? getSourceName(token.sourceCharacterId)
            : undefined;
        return (
          <ReminderTokenChip
            key={token.id}
            token={token}
            size={size}
            onRemove={onRemove ? () => onRemove(token.id) : undefined}
            sourceName={sourceName}
          />
        );
      })}
    </Box>
  );
}
