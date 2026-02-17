import { useState, useCallback, useMemo, useEffect } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import type { CharacterDef } from '@/types/index.ts';
import { useGame } from '@/context/GameContext.tsx';
import { useNightOrder } from '@/hooks/useNightOrder.ts';
import { useCharacterLookup } from '@/hooks/useCharacterLookup.ts';
import { FlashcardCarousel } from './FlashcardCarousel.tsx';

export interface NightPhaseOverlayProps {
  scriptCharacterIds: string[];
  /** When true, the overlay is shown (controlled from parent, e.g. AppBar button). */
  externalOpen?: boolean;
  /** Called when the overlay wants to close (so parent can sync state). */
  onClose?: () => void;
}

/**
 * Full-screen overlay that contains the Night Phase flashcard carousel.
 *
 * Controlled via `externalOpen` / `onClose` props from the parent (AppBar button).
 * When opened, auto-starts night progress if not already started.
 */
export function NightPhaseOverlay({
  scriptCharacterIds,
  externalOpen = false,
  onClose,
}: NightPhaseOverlayProps) {
  const { state, startNight, updateNightProgress, completeNight } = useGame();
  const { game, nightProgress } = state;
  const { getCharacter, getCharactersByIds } = useCharacterLookup();

  const isFirstNight = game?.isFirstNight ?? true;
  const allEntries = useNightOrder(scriptCharacterIds, isFirstNight);

  // M3-3: Filter night order to only characters assigned to players (keep structural entries)
  const assignedCharIds = useMemo(() => {
    const ids = new Set<string>();
    for (const p of game?.players ?? []) {
      if (p.characterId) ids.add(p.characterId);
    }
    return ids;
  }, [game?.players]);

  const entries = useMemo(
    () => allEntries.filter((e) => e.type === 'structural' || assignedCharIds.has(e.id)),
    [allEntries, assignedCharIds],
  );

  // Script characters for the choice dropdowns
  const scriptCharacters: CharacterDef[] = useMemo(
    () => getCharactersByIds(scriptCharacterIds),
    [getCharactersByIds, scriptCharacterIds],
  );

  // Previous night's history entry (for showing last night's selections)
  // const previousNightHistory = useMemo(()=> {
  //   if (!game?.nightHistory.length) return undefined;
  //   return game.nightHistory[game.nightHistory.length - 1];
  // }, [game?.nightHistory]);
  const previousNightHistory =
    game && game.nightHistory?.length > 0
      ? game.nightHistory[game.nightHistory.length - 1]
      : undefined;

  const isNightPhase = game?.currentPhase === 'Night';
  const [overlayVisible, setOverlayVisible] = useState(externalOpen && isNightPhase);

  const hasProgress = nightProgress !== null;

  // Sync externalOpen prop → internal state
  useEffect(() => {
    if (externalOpen && isNightPhase) {
      if (!hasProgress) {
        startNight(entries.length);
      }
      // setOverlayVisible(true);
    }
  }, [externalOpen, isNightPhase, hasProgress, startNight, entries.length]);

  /** Dismiss overlay but preserve progress. */
  const handleDismiss = useCallback(() => {
    setOverlayVisible(false);
    onClose?.();
  }, [onClose]);

  /** Toggle a sub-action checkbox. */
  const handleUpdateProgress = useCallback(
    (characterId: string, subActionIndex: number) => {
      if (!nightProgress) return;
      const current =
        nightProgress.subActionStates[characterId] ??
        new Array(entries.find((e) => e.id === characterId)?.subActions.length ?? 0).fill(false);
      const updated = [...current];
      updated[subActionIndex] = !updated[subActionIndex];
      updateNightProgress(characterId, updated);
    },
    [nightProgress, entries, updateNightProgress],
  );

  /** Update notes for a character. */
  const handleUpdateNotes = useCallback(
    (characterId: string, notes: string) => {
      updateNightProgress(characterId, undefined, notes);
    },
    [updateNightProgress],
  );

  /** Update selection for a character. */
  const handleUpdateSelection = useCallback(
    (characterId: string, value: string | string[]) => {
      updateNightProgress(characterId, undefined, undefined, value);
    },
    [updateNightProgress],
  );

  /** Complete the night, close overlay. */
  const handleComplete = useCallback(() => {
    completeNight();
    setOverlayVisible(false);
    onClose?.();
  }, [completeNight, onClose]);

  const players = useMemo(() => game?.players ?? [], [game?.players]);

  // Only render when night phase is active AND overlay should be visible
  if (!isNightPhase || !hasProgress || !overlayVisible) return null;

  // ── Full overlay ──
  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 1300,
        background: 'linear-gradient(180deg, #0d1117 0%, #161b22 50%, #0d1117 100%)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Dismiss button */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          p: 1,
          flexShrink: 0,
        }}
      >
        <IconButton
          onClick={handleDismiss}
          sx={{ color: 'rgba(255,255,255,0.6)' }}
          aria-label="Minimize night overlay"
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Carousel */}
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <FlashcardCarousel
          entries={entries}
          players={players}
          characterLookup={getCharacter}
          nightProgress={nightProgress!}
          onUpdateProgress={handleUpdateProgress}
          onUpdateNotes={handleUpdateNotes}
          onUpdateSelection={handleUpdateSelection}
          onComplete={handleComplete}
          scriptCharacters={scriptCharacters}
          previousNightHistory={previousNightHistory}
        />
      </Box>
    </Box>
  );
}
