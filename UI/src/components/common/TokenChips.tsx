import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import type { PlayerToken } from '@/types/index.ts';

// ──────────────────────────────────────────────
// Token display colours (F3-17 / F3-18)
// ──────────────────────────────────────────────

const TOKEN_CHIP_COLORS = {
  drunk: '#7b1fa2', // purple
  poisoned: '#388e3c', // green
  custom: '#757575', // grey fallback
} as const;

export interface TokenChipsProps {
  /** The player's active tokens. */
  tokens: PlayerToken[];
  /** Chip size — "small" (default) or "medium". */
  size?: 'small' | 'medium';
}

/**
 * Resolve the background colour for a token chip.
 *
 * - Drunk → purple (`#7b1fa2`)
 * - Poisoned → green (`#388e3c`)
 * - Custom → token's own colour if set, otherwise grey (`#757575`)
 */
function resolveTokenColor(token: PlayerToken): string {
  if (token.type === 'drunk') return TOKEN_CHIP_COLORS.drunk;
  if (token.type === 'poisoned') return TOKEN_CHIP_COLORS.poisoned;
  return token.color ?? TOKEN_CHIP_COLORS.custom;
}

/**
 * Renders a row of small coloured MUI Chips representing a player's
 * active status tokens (Drunk, Poisoned, custom).
 *
 * Used by PlayerRow (F3-17) and NightFlashcard (F3-18) to show
 * token status inline.
 */
export function TokenChips({ tokens, size = 'small' }: TokenChipsProps) {
  if (!tokens || tokens.length === 0) return null;

  return (
    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
      {tokens.map((token) => (
        <Chip
          key={token.id}
          label={token.label}
          size={size}
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
      ))}
    </Box>
  );
}
