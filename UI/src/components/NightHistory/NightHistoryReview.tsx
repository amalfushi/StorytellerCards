import { useMemo, useCallback } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import type { NightHistoryEntry, NightProgress } from '@/types/index.ts';
import { useGame } from '@/context/GameContext.tsx';
import { useNightOrder } from '@/hooks/useNightOrder.ts';
import { useCharacterLookup } from '@/hooks/useCharacterLookup.ts';
import { FlashcardCarousel } from '@/components/NightPhase/FlashcardCarousel.tsx';

export interface NightHistoryReviewProps {
  historyEntry: NightHistoryEntry;
  isFirstNight: boolean;
  open: boolean;
  onClose: () => void;
}

/**
 * Full-screen overlay that renders a past night's flashcard carousel in read-only mode.
 *
 * Reconstructs the {@link NightProgress} from the saved {@link NightHistoryEntry}
 * and reuses the existing {@link FlashcardCarousel} with `readOnly={true}`.
 */
export function NightHistoryReview({
  historyEntry,
  isFirstNight,
  open,
  onClose,
}: NightHistoryReviewProps) {
  const { state } = useGame();
  const { getCharacter, allCharacters } = useCharacterLookup();

  // Derive the same script character IDs used in the game
  const scriptCharacterIds = useMemo(() => allCharacters.map((ch) => ch.id), [allCharacters]);

  // Get the night order entries that match the historical night type
  const entries = useNightOrder(scriptCharacterIds, isFirstNight);

  // Reconstruct NightProgress from history entry
  const nightProgress: NightProgress = useMemo(
    () => ({
      currentCardIndex: 0,
      subActionStates: { ...historyEntry.subActionStates },
      notes: { ...historyEntry.notes },
      totalCards: entries.length,
    }),
    [historyEntry, entries.length],
  );

  const players = useMemo(() => state.game?.players ?? [], [state.game?.players]);

  // No-ops since this is read-only
  const noop = useCallback(() => {}, []);
  const noopStr = useCallback((_id: string, _n: string) => {}, []);
  const noopIdx = useCallback((_id: string, _i: number) => {}, []);

  if (!open) return null;

  const nightLabel = isFirstNight
    ? `Night ${historyEntry.dayNumber} Review — First Night`
    : `Night ${historyEntry.dayNumber} Review`;

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 1400,
        background: 'linear-gradient(180deg, #0d1117 0%, #161b22 50%, #0d1117 100%)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* ── Header ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 1,
          py: 1,
          flexShrink: 0,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{ color: 'rgba(255,255,255,0.7)', mr: 1 }}
          aria-label="Close review"
          size="small"
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 'bold', color: '#e6edf3', flexGrow: 1 }}
          noWrap
        >
          {nightLabel}
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', ml: 1, flexShrink: 0 }}>
          Read Only
        </Typography>
      </Box>

      {/* ── Carousel ── */}
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <FlashcardCarousel
          entries={entries}
          players={players}
          characterLookup={getCharacter}
          nightProgress={nightProgress}
          onUpdateProgress={noopIdx}
          onUpdateNotes={noopStr}
          onComplete={noop}
          readOnly
        />
      </Box>
    </Box>
  );
}
