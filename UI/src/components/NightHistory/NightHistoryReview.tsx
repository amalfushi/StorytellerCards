import { useMemo, useCallback, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
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
 * Supports a read/edit toggle:
 * - **View mode** (default): notes and choices shown as static read-only text.
 * - **Edit mode**: notes and choices become interactive, matching the live flashcard UI.
 *   All edits apply to the specific night's history entry via granular reducer actions.
 */
export function NightHistoryReview({
  historyEntry,
  historyIndex,
  isFirstNight,
  open,
  onClose,
}: NightHistoryReviewProps) {
  const { state, updateNightHistory, updateNightHistoryNote, updateNightHistoryChoice } = useGame();
  const { getCharacter, allCharacters } = useCharacterLookup();

  const [isEditMode, setIsEditMode] = useState(false);

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

  /** Update notes and save via granular action. */
  const handleUpdateNotes = useCallback(
    (characterId: string, notes: string) => {
      setLocalEntry((prev) => ({
        ...prev,
        notes: { ...prev.notes, [characterId]: notes },
      }));
      updateNightHistoryNote(historyIndex, characterId, notes);
    },
    [historyIndex, updateNightHistoryNote],
  );

  /** Update selection and save via granular action. */
  const handleUpdateSelection = useCallback(
    (characterId: string, value: string | string[]) => {
      setLocalEntry((prev) => ({
        ...prev,
        selections: { ...(prev.selections ?? {}), [characterId]: value },
      }));
      updateNightHistoryChoice(historyIndex, characterId, value);
    },
    [historyIndex, updateNightHistoryChoice],
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
        <Button
          size="small"
          variant="outlined"
          startIcon={isEditMode ? <VisibilityIcon /> : <EditIcon />}
          onClick={() => setIsEditMode((prev) => !prev)}
          aria-label={isEditMode ? 'Switch to view mode' : 'Switch to edit mode'}
          sx={{
            color: isEditMode ? '#66bb6a' : 'rgba(255,255,255,0.7)',
            borderColor: isEditMode ? '#66bb6a' : 'rgba(255,255,255,0.25)',
            textTransform: 'none',
            fontSize: '0.8rem',
            ml: 1,
            flexShrink: 0,
            '&:hover': {
              borderColor: isEditMode ? '#81c784' : 'rgba(255,255,255,0.5)',
            },
          }}
        >
          {isEditMode ? 'View' : 'Edit'}
        </Button>
      </Box>

      {/* ── Carousel — readOnly controlled by edit mode ── */}
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
          readOnly={!isEditMode}
        />
      </Box>
    </Box>
  );
}
