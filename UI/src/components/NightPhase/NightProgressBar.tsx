import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { NightOrderEntry } from '@/types/index.ts';
import { getCharacterTypeColor } from '@/components/common/characterTypeColor.ts';

/** Threshold above which the "worm" condensed view activates. */
const CONDENSED_THRESHOLD = 10;
/** How many dots to show at full size around the current dot in condensed mode. */
const VISIBLE_RADIUS = 2;

export interface NightProgressBarProps {
  currentIndex: number;
  totalCards: number;
  entries: NightOrderEntry[];
  /** Map of entry id → CharacterDef.type for colouring dots. */
  characterTypes?: Record<string, string>;
  /** Set of entry ids whose players are dead, for hollow dots. */
  deadIds?: Set<string>;
  /** Callback when a dot is clicked — jumps to that card index. */
  onClick?: (index: number) => void;
}

/**
 * Returns a scale factor (0–1) for each dot index in "worm" mode.
 * Dots near `currentIndex` are full size; dots further away shrink down.
 */
function dotScale(index: number, currentIndex: number, total: number): number {
  if (total <= CONDENSED_THRESHOLD) return 1;
  const distance = Math.abs(index - currentIndex);
  if (distance <= VISIBLE_RADIUS) return 1;
  if (distance <= VISIBLE_RADIUS + 1) return 0.65;
  if (distance <= VISIBLE_RADIUS + 2) return 0.4;
  return 0.25;
}

/**
 * Compact progress indicator showing "X / Y" and a row of coloured dots.
 *
 * Each dot is clickable when an `onClick` handler is provided.
 * For 10+ cards the dots use a "worm" pattern — the current dot and its
 * immediate neighbours are full-size while distant dots shrink, keeping
 * the indicator compact on small screens.
 */
export function NightProgressBar({
  currentIndex,
  totalCards,
  entries,
  characterTypes = {},
  deadIds = new Set(),
  onClick,
}: NightProgressBarProps) {
  const isCondensed = entries.length > CONDENSED_THRESHOLD;

  return (
    <Box
      aria-label="Night progress"
      role="progressbar"
      aria-valuenow={currentIndex + 1}
      aria-valuemax={totalCards}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 0.75,
        px: 2,
        flexShrink: 0,
      }}
    >
      {/* Counter text */}
      <Typography
        variant="caption"
        sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, mb: 0.5 }}
      >
        {currentIndex + 1} / {totalCards}
      </Typography>

      {/* Dot row */}
      <Box
        sx={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          maxWidth: '100%',
        }}
      >
        {entries.map((entry, i) => {
          const isCurrent = i === currentIndex;
          const isStructural = entry.type === 'structural';
          const isDead = deadIds.has(entry.id);
          const charType = characterTypes[entry.id];
          const dotColor = isStructural
            ? '#9e9e9e'
            : charType
              ? getCharacterTypeColor(charType)
              : '#9e9e9e';

          // In condensed mode, distant dots shrink via a scale factor
          const scale = dotScale(i, currentIndex, entries.length);
          const baseSize = isCurrent ? 18 : 14;
          const size = isCondensed ? baseSize * scale : baseSize;

          return (
            <Box
              key={`${entry.id}-${i}`}
              role={onClick ? 'button' : undefined}
              tabIndex={onClick ? 0 : undefined}
              aria-label={
                onClick ? `Go to card ${i + 1} of ${totalCards}: ${entry.name}` : undefined
              }
              onClick={() => onClick?.(i)}
              onKeyDown={(e) => {
                if (onClick && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onClick(i);
                }
              }}
              sx={{
                width: size,
                height: size,
                minWidth: isCondensed ? size : undefined,
                minHeight: isCondensed ? size : undefined,
                borderRadius: '50%',
                backgroundColor: isDead ? 'transparent' : dotColor,
                border: isDead ? `2px solid ${dotColor}` : isCurrent ? '2px solid #fff' : 'none',
                opacity: isCurrent ? 1 : isCondensed ? Math.max(scale, 0.45) : 0.6,
                transition: 'all 0.25s ease',
                flexShrink: 0,
                cursor: onClick ? 'pointer' : 'default',
                '&:hover': onClick
                  ? {
                      opacity: 1,
                      transform: 'scale(1.25)',
                    }
                  : {},
                '&:focus-visible': {
                  outline: '2px solid #90caf9',
                  outlineOffset: 2,
                },
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
}
