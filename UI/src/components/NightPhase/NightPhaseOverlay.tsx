import { useState, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import NightlightRoundIcon from '@mui/icons-material/NightlightRound';
import { useGame } from '@/context/GameContext.tsx';
import { useNightOrder } from '@/hooks/useNightOrder.ts';
import { useCharacterLookup } from '@/hooks/useCharacterLookup.ts';
import { FlashcardCarousel } from './FlashcardCarousel.tsx';

export interface NightPhaseOverlayProps {
  scriptCharacterIds: string[];
}

/**
 * Full-screen overlay that contains the Night Phase flashcard carousel.
 *
 * Visible when the game phase is Night and nightProgress is active.
 * Can be dismissed without losing progress; a "Resume Night" FAB
 * re-opens the overlay.
 */
export function NightPhaseOverlay({ scriptCharacterIds }: NightPhaseOverlayProps) {
  const { state, startNight, updateNightProgress, completeNight } = useGame();
  const { game, nightProgress } = state;
  const { getCharacter } = useCharacterLookup();

  const isFirstNight = game?.isFirstNight ?? true;
  const entries = useNightOrder(scriptCharacterIds, isFirstNight);

  const [overlayVisible, setOverlayVisible] = useState(true);

  const isNightPhase = game?.currentPhase === 'Night';
  const hasProgress = nightProgress !== null;

  // Auto-start night progress when entering Night phase without progress
  // This is triggered by the "Start Night" action in the PhaseBar
  const shouldAutoStart = isNightPhase && !hasProgress;

  /** Open overlay and start night if needed. */
  const handleStartOrResume = useCallback(() => {
    if (shouldAutoStart) {
      startNight(entries.length);
    }
    setOverlayVisible(true);
  }, [shouldAutoStart, startNight, entries.length]);

  /** Dismiss overlay but preserve progress. */
  const handleDismiss = useCallback(() => {
    setOverlayVisible(false);
  }, []);

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

  /** Complete the night, close overlay. */
  const handleComplete = useCallback(() => {
    completeNight();
    setOverlayVisible(false);
  }, [completeNight]);

  const players = useMemo(() => game?.players ?? [], [game?.players]);

  // ── If not night phase, render nothing ──
  if (!isNightPhase) return null;

  // ── "Resume Night" FAB when overlay is dismissed but progress exists ──
  if (hasProgress && !overlayVisible) {
    return (
      <Fab
        color="primary"
        onClick={() => setOverlayVisible(true)}
        sx={{
          position: 'fixed',
          bottom: 80,
          right: 16,
          zIndex: 1200,
          backgroundColor: '#1a237e',
          '&:hover': { backgroundColor: '#283593' },
        }}
        aria-label="Resume Night"
      >
        <NightlightRoundIcon />
      </Fab>
    );
  }

  // ── "Start Night" FAB when night phase but no progress yet ──
  if (!hasProgress && !overlayVisible) {
    return (
      <Fab
        color="primary"
        variant="extended"
        onClick={handleStartOrResume}
        sx={{
          position: 'fixed',
          bottom: 80,
          right: 16,
          zIndex: 1200,
          backgroundColor: '#1a237e',
          '&:hover': { backgroundColor: '#283593' },
        }}
        aria-label="Start Night"
      >
        <NightlightRoundIcon sx={{ mr: 1 }} />
        Start Night
      </Fab>
    );
  }

  // ── No progress and overlay wants to be visible → auto-start ──
  if (!hasProgress && overlayVisible) {
    // Trigger start on next tick to avoid dispatching during render
    // We show a loading-like state; the effect will fire via the FAB click
    return (
      <Fab
        color="primary"
        variant="extended"
        onClick={handleStartOrResume}
        sx={{
          position: 'fixed',
          bottom: 80,
          right: 16,
          zIndex: 1200,
          backgroundColor: '#1a237e',
          '&:hover': { backgroundColor: '#283593' },
        }}
        aria-label="Start Night"
      >
        <NightlightRoundIcon sx={{ mr: 1 }} />
        Start Night
      </Fab>
    );
  }

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
          onComplete={handleComplete}
        />
      </Box>
    </Box>
  );
}
