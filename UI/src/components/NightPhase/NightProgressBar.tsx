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
}

/**
 * Compact progress indicator showing "X / Y" and a row of coloured dots.
 */
export function NightProgressBar({
  currentIndex,
  totalCards,
  entries,
  characterTypes = {},
  deadIds = new Set(),
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
          gap: '3px',
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
              sx={{
                width: isCurrent ? 10 : 6,
                height: isCurrent ? 10 : 6,
                borderRadius: '50%',
                backgroundColor: isDead ? 'transparent' : dotColor,
                border: isDead ? `1.5px solid ${dotColor}` : isCurrent ? `2px solid #fff` : 'none',
                opacity: isCurrent ? 1 : 0.6,
                transition: 'all 0.2s ease',
                flexShrink: 0,
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
}
