import { useCallback, useMemo, useEffect } from 'react';
import Box from '@mui/material/Box';
import type { CharacterDef, NightOrderEntry, PlayerSeat } from '@/types/index.ts';
import { useGame } from '@/context/GameContext.tsx';
import { useCharacterLookup } from '@/hooks/useCharacterLookup.ts';
import { FlashcardCarousel } from './FlashcardCarousel.tsx';

export interface NightTabPanelProps {
  entries: NightOrderEntry[];
  players: PlayerSeat[];
  scriptCharacterIds: string[];
  /** Called when the night is completed so the parent can switch back to Day view */
  onComplete?: () => void;
}

/**
 * Inline night phase panel — renders the FlashcardCarousel within the
 * normal tab content area (no overlay, no fixed positioning).
 *
 * Auto-starts the night if `nightProgress` is null when mounted.
 * Syncs the current card index back to GameContext via `setNightCardIndex`.
 */
export function NightTabPanel({
  entries,
  players,
  scriptCharacterIds,
  onComplete,
}: NightTabPanelProps) {
  const { state, startNight, updateNightProgress, completeNight, setNightCardIndex } = useGame();
  const { nightProgress } = state;
  const game = state.game;
  const { getCharacter, getCharactersByIds } = useCharacterLookup();

  // Script characters for choice dropdowns
  const scriptCharacters: CharacterDef[] = useMemo(
    () => getCharactersByIds(scriptCharacterIds),
    [getCharactersByIds, scriptCharacterIds],
  );

  // Previous night's history entry (for showing last night's selections)
  const previousNightHistory = useMemo(() => {
    if (!game?.nightHistory?.length) return undefined;
    return game.nightHistory[game.nightHistory.length - 1];
  }, [game]);

  // Auto-start night if nightProgress is null
  useEffect(() => {
    if (!nightProgress && entries.length > 0) {
      startNight(entries.length);
    }
  }, [nightProgress, entries.length, startNight]);

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

  /** Sync card index changes back to context. */
  const handleCardChange = useCallback(
    (index: number) => {
      setNightCardIndex(index);
    },
    [setNightCardIndex],
  );

  /** Complete night and notify parent. */
  const handleComplete = useCallback(() => {
    completeNight();
    onComplete?.();
  }, [completeNight, onComplete]);

  // Wait for night progress to be initialised (auto-start useEffect may be pending)
  if (!nightProgress) return null;

  return (
    <Box
      data-testid="night-tab-panel"
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #0d1117 0%, #161b22 50%, #0d1117 100%)',
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      <FlashcardCarousel
        entries={entries}
        players={players}
        characterLookup={getCharacter}
        nightProgress={nightProgress}
        onUpdateProgress={handleUpdateProgress}
        onUpdateNotes={handleUpdateNotes}
        onUpdateSelection={handleUpdateSelection}
        onComplete={handleComplete}
        onCardChange={handleCardChange}
        scriptCharacters={scriptCharacters}
        previousNightHistory={previousNightHistory}
      />
    </Box>
  );
}
