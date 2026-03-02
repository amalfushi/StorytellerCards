import { useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { NightOrderEntry } from '@/types/index.ts';
import { getCharacterTypeColor } from '@/components/common/characterTypeColor.ts';

/** Threshold above which the scrollable carousel activates. */
const SCROLL_THRESHOLD = 10;

/** Base size for inactive dots (px). */
const DOT_SIZE = 12;
/** Size for the active dot (px). */
const ACTIVE_DOT_SIZE = 16;

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
 * Compact progress indicator showing "X / Y" and a row of coloured dots.
 *
 * Each dot is clickable when an `onClick` handler is provided.
 * For 10+ cards, dots are displayed in a horizontally scrollable
 * container that auto-scrolls to keep the active dot centred, keeping
 * all dots at full size for easy tapping on mobile.
 */
export function NightProgressBar({
  currentIndex,
  totalCards,
  entries,
  characterTypes = {},
  deadIds = new Set(),
  onClick,
}: NightProgressBarProps) {
  const isScrollable = entries.length > SCROLL_THRESHOLD;
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the active dot into view when it changes
  useEffect(() => {
    if (!isScrollable || !scrollRef.current) return;
    const container = scrollRef.current;
    const activeDot = container.children[currentIndex] as HTMLElement | undefined;
    if (!activeDot) return;
    const containerRect = container.getBoundingClientRect();
    const dotRect = activeDot.getBoundingClientRect();
    const scrollLeft = activeDot.offsetLeft - container.offsetWidth / 2 + dotRect.width / 2;
    container.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
    // Only need containerRect reference for layout — suppress lint
    void containerRect;
  }, [currentIndex, isScrollable]);

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

      {/* Dot row — scrollable for 10+ entries, centred for fewer */}
      <Box
        ref={scrollRef}
        sx={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          maxWidth: '100%',
          ...(isScrollable
            ? {
                overflowX: 'auto',
                whiteSpace: 'nowrap',
                scrollbarWidth: 'none', // Firefox
                '&::-webkit-scrollbar': { display: 'none' }, // Chrome/Safari
                WebkitOverflowScrolling: 'touch',
                px: 1,
              }
            : {
                flexWrap: 'wrap',
                justifyContent: 'center',
              }),
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

          const size = isCurrent ? ACTIVE_DOT_SIZE : DOT_SIZE;

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
                minWidth: size,
                minHeight: size,
                borderRadius: '50%',
                backgroundColor: isDead ? 'transparent' : dotColor,
                border: isDead ? `2px solid ${dotColor}` : isCurrent ? '2px solid #fff' : 'none',
                opacity: isCurrent ? 1 : 0.6,
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
