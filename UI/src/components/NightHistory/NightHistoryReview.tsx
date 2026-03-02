import { useMemo, useCallback, useState } from 'react';
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
  /** Index of this entry in game.nightHistory (for saving edits). */
  historyIndex: number;
  isFirstNight: boolean;
  open: boolean;
  onClose: () => void;
}

/**
 * Full-screen overlay that renders a past night's flashcard carousel.
 *
 * M3-11: Now **editable** — checkmarks, notes, and selections can be modified
 * and are saved back to the game's nightHistory via `updateNightHistory`.
 */
export function NightHistoryReview({
  historyEntry,
  historyIndex,
  isFirstNight,
  open,
  onClose,
}: NightHistoryReviewProps) {
  const { state, updateNightHistory } = useGame();
  const { getCharacter, allCharacters } = useCharacterLookup();

  // Derive the same script character IDs used in the game
  const scriptCharacterIds = useMemo(() => allCharacters.map((ch) => ch.id), [allCharacters]);

  // Overlay snapshotted tokens from the history entry onto players so
  // the review flashcards show tokens that were active during that night
  // rather than current (live) tokens.
  const players = useMemo(() => {
    const livePlayers = state.game?.players ?? [];
    const snapshot = historyEntry.tokenSnapshot;
    if (!snapshot) return livePlayers;
    return livePlayers.map((p) => {
      const snapshotTokens = snapshot[p.characterId];
      if (snapshotTokens !== undefined) {
        return { ...p, tokens: snapshotTokens };
      }
      // Character had no tokens at that point in time
      return { ...p, tokens: [] };
    });
  }, [state.game?.players, historyEntry.tokenSnapshot]);

  // Get the night order entries that match the historical night type
  // F3-10: Pass players so the night order only includes in-play characters,
  // matching the live NightPhaseOverlay behaviour (M3-3).
  const entries = useNightOrder(scriptCharacterIds, isFirstNight, players);

  // Local editable copy of the history entry
  const [localEntry, setLocalEntry] = useState<NightHistoryEntry>(() => ({
    ...historyEntry,
    selections: historyEntry.selections ?? {},
  }));

  // Reconstruct NightProgress from local entry
  const nightProgress: NightProgress = useMemo(
    () => ({
      currentCardIndex: 0,
      subActionStates: { ...localEntry.subActionStates },
      notes: { ...localEntry.notes },
      selections: { ...(localEntry.selections ?? {}) },
      totalCards: entries.length,
    }),
    [localEntry, entries.length],
  );

  /** Toggle a sub-action checkbox and save. */
  const handleUpdateProgress = useCallback(
    (characterId: string, subActionIndex: number) => {
      setLocalEntry((prev) => {
        const current =
          prev.subActionStates[characterId] ??
          new Array(entries.find((e) => e.id === characterId)?.subActions.length ?? 0).fill(false);
        const updated = [...current];
        updated[subActionIndex] = !updated[subActionIndex];
        const newEntry: NightHistoryEntry = {
          ...prev,
          subActionStates: { ...prev.subActionStates, [characterId]: updated },
        };
        updateNightHistory(historyIndex, newEntry);
        return newEntry;
      });
    },
    [entries, historyIndex, updateNightHistory],
  );

  /** Update notes and save. */
  const handleUpdateNotes = useCallback(
    (characterId: string, notes: string) => {
      setLocalEntry((prev) => {
        const newEntry: NightHistoryEntry = {
          ...prev,
          notes: { ...prev.notes, [characterId]: notes },
        };
        updateNightHistory(historyIndex, newEntry);
        return newEntry;
      });
    },
    [historyIndex, updateNightHistory],
  );

  /** Update selection and save. */
  const handleUpdateSelection = useCallback(
    (characterId: string, value: string | string[]) => {
      setLocalEntry((prev) => {
        const newEntry: NightHistoryEntry = {
          ...prev,
          selections: { ...(prev.selections ?? {}), [characterId]: value },
        };
        updateNightHistory(historyIndex, newEntry);
        return newEntry;
      });
    },
    [historyIndex, updateNightHistory],
  );

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
          Editable
        </Typography>
      </Box>

      {/* ── Carousel — now editable ── */}
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <FlashcardCarousel
          entries={entries}
          players={players}
          characterLookup={getCharacter}
          nightProgress={nightProgress}
          onUpdateProgress={handleUpdateProgress}
          onUpdateNotes={handleUpdateNotes}
          onUpdateSelection={handleUpdateSelection}
          onComplete={() => {}}
        />
      </Box>
    </Box>
  );
}
