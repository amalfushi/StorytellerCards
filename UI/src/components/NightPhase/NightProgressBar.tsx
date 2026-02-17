import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { NightOrderEntry } from '@/types/index.ts';
import { getCharacterTypeColor } from '@/components/common/characterTypeColor.ts';

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
 * Each dot is clickable when an `onClick` handler is provided.
 */
export function NightProgressBar({
  currentIndex,
  totalCards,
  entries,
  characterTypes = {},
  deadIds = new Set(),
  onClick,
}: NightProgressBarProps) {
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
          gap: '4px',
          flexWrap: 'wrap',
          justifyContent: 'center',
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

          return (
            <Box
              key={`${entry.id}-${i}`}
              role={onClick ? 'button' : undefined}
              tabIndex={onClick ? 0 : undefined}
              aria-label={onClick ? `Go to card ${i + 1}: ${entry.name}` : undefined}
              onClick={() => onClick?.(i)}
              onKeyDown={(e) => {
                if (onClick && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onClick(i);
                }
              }}
              sx={{
                width: isCurrent ? 18 : 14,
                height: isCurrent ? 18 : 14,
                borderRadius: '50%',
                backgroundColor: isDead ? 'transparent' : dotColor,
                border: isDead ? `2px solid ${dotColor}` : isCurrent ? '2px solid #fff' : 'none',
                opacity: isCurrent ? 1 : 0.6,
                transition: 'all 0.2s ease',
                flexShrink: 0,
                cursor: onClick ? 'pointer' : 'default',
                '&:hover': onClick
                  ? {
                      opacity: 1,
                      transform: 'scale(1.2)',
                    }
                  : {},
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
}
