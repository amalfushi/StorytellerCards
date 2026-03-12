import { useState, useCallback, useMemo, useRef } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Fab from '@mui/material/Fab';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useSwipeable } from 'react-swipeable';
import type {
  NightOrderEntry,
  PlayerSeat,
  CharacterDef,
  NightProgress,
  NightHistoryEntry,
} from '@/types/index.ts';
import { NightFlashcard } from './NightFlashcard.tsx';
import { StructuralCard } from './StructuralCard.tsx';
import { NightProgressBar } from './NightProgressBar.tsx';
import { PlayerShowDrawer } from './PlayerShowDrawer.tsx';

export interface FlashcardCarouselProps {
  entries: NightOrderEntry[];
  players: PlayerSeat[];
  characterLookup: (id: string) => CharacterDef | undefined;
  nightProgress: NightProgress;
  onUpdateProgress: (characterId: string, subActionIndex: number) => void;
  onUpdateNotes: (characterId: string, notes: string) => void;
  onUpdateSelection?: (characterId: string, value: string | string[]) => void;
  onComplete: () => void;
  readOnly?: boolean;
  /** All script characters for choice dropdowns */
  scriptCharacters?: CharacterDef[];
  /** Previous night's history entry (for displaying last night's selections) */
  previousNightHistory?: NightHistoryEntry;
  /** Callback when a dot is clicked to jump to that card */
  onDotClick?: (index: number) => void;
  /** Callback fired whenever the current card index changes */
  onCardChange?: (index: number) => void;
  /** Callback when a reminder token is clicked (navigates to Day view). */
  onReminderTokenClick?: (tokenText: string) => void;
  /** Demon bluff character definitions (passed to demoninfo StructuralCard). */
  bluffCharacters?: CharacterDef[];
  /** Per-player bluffs keyed by seat number (as string). */
  playerBluffs?: Record<string, string[]>;
  /** Custom player messages keyed by characterId. */
  customPlayerMessages?: Record<string, string>;
  /** Callback when a custom player message is saved. */
  onCustomMessageChange?: (characterId: string, message: string) => void;
  /** Callback when a custom player message is cleared. */
  onClearCustomMessage?: (characterId: string) => void;
}

/**
 * Swipeable carousel that manages navigation between night flashcards.
 *
 * Uses `react-swipeable` for touch gestures and renders only
 * the current card ± 1 neighbour for performance.
 */
export function FlashcardCarousel({
  entries,
  players,
  characterLookup,
  nightProgress,
  onUpdateProgress,
  onUpdateNotes,
  onUpdateSelection,
  onComplete,
  readOnly = false,
  scriptCharacters = [],
  previousNightHistory,
  onDotClick,
  onCardChange,
  onReminderTokenClick,
  bluffCharacters,
  playerBluffs,
  customPlayerMessages,
  onCustomMessageChange,
  onClearCustomMessage,
}: FlashcardCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(nightProgress.currentCardIndex);
  const [slideDir, setSlideDir] = useState<'none' | 'left' | 'right'>('none');
  const [showDrawerOpen, setShowDrawerOpen] = useState(false);
  const isAnimating = useRef(false);

  const totalCards = entries.length;
  const isLastCard = currentIndex === totalCards - 1;

  // Build lookup maps for progress bar dots
  const characterTypes = useMemo(() => {
    const map: Record<string, string> = {};
    for (const entry of entries) {
      if (entry.type === 'character') {
        const def = characterLookup(entry.id);
        if (def) map[entry.id] = def.type;
      }
    }
    return map;
  }, [entries, characterLookup]);

  const deadIds = useMemo(() => {
    const set = new Set<string>();
    for (const entry of entries) {
      if (entry.type === 'character') {
        const player = players.find((p) => p.characterId === entry.id);
        if (player && !player.alive) set.add(entry.id);
      }
    }
    return set;
  }, [entries, players]);

  const goTo = useCallback(
    (direction: 'next' | 'prev') => {
      if (isAnimating.current) return;
      const nextIdx =
        direction === 'next'
          ? Math.min(currentIndex + 1, totalCards - 1)
          : Math.max(currentIndex - 1, 0);
      if (nextIdx === currentIndex) return;

      isAnimating.current = true;
      setSlideDir(direction === 'next' ? 'left' : 'right');

      // After the CSS transition, settle to new index
      setTimeout(() => {
        setCurrentIndex(nextIdx);
        setSlideDir('none');
        isAnimating.current = false;
        onCardChange?.(nextIdx);
      }, 300);
    },
    [currentIndex, totalCards, onCardChange],
  );

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => goTo('next'),
    onSwipedRight: () => goTo('prev'),
    trackMouse: false,
    trackTouch: true,
    delta: 40,
    preventScrollOnSwipe: true,
  });

  /** Jump to an arbitrary card index (for dot clicks). */
  const goToIndex = useCallback(
    (idx: number) => {
      if (isAnimating.current || idx === currentIndex) return;
      if (idx < 0 || idx >= totalCards) return;
      isAnimating.current = true;
      setSlideDir(idx > currentIndex ? 'left' : 'right');
      setTimeout(() => {
        setCurrentIndex(idx);
        setSlideDir('none');
        isAnimating.current = false;
        onCardChange?.(idx);
      }, 300);
    },
    [currentIndex, totalCards, onCardChange],
  );

  /** Toggle a single sub-action checkbox for a given entry. */
  const handleToggle = useCallback(
    (entryId: string, subActionIndex: number) => {
      onUpdateProgress(entryId, subActionIndex);
    },
    [onUpdateProgress],
  );

  /** Update notes for a given entry. */
  const handleNotes = useCallback(
    (entryId: string, notes: string) => {
      onUpdateNotes(entryId, notes);
    },
    [onUpdateNotes],
  );

  /** Update selection for a given entry. */
  const handleSelection = useCallback(
    (entryId: string, value: string | string[]) => {
      onUpdateSelection?.(entryId, value);
    },
    [onUpdateSelection],
  );

  /** Handle dot click navigation */
  const handleDotClick = useCallback(
    (idx: number) => {
      onDotClick?.(idx);
      goToIndex(idx);
    },
    [onDotClick, goToIndex],
  );

  /** Render the correct card type for a given index. */
  const renderCard = (idx: number) => {
    if (idx < 0 || idx >= totalCards) return null;
    const entry = entries[idx];
    const checked =
      nightProgress.subActionStates[entry.id] ?? new Array(entry.subActions.length).fill(false);
    const note = nightProgress.notes[entry.id] ?? '';
    const selectionValue = nightProgress.selections?.[entry.id];
    const prevSelection = previousNightHistory?.selections?.[entry.id];
    const prevNote = previousNightHistory?.notes?.[entry.id];

    if (entry.type === 'structural') {
      return (
        <StructuralCard
          entry={entry}
          checkedStates={checked}
          onToggleSubAction={(i) => handleToggle(entry.id, i)}
          readOnly={readOnly}
          bluffCharacters={entry.id === 'demoninfo' ? bluffCharacters : undefined}
        />
      );
    }

    const player = players.find((p) => p.characterId === entry.id);
    const charDef = characterLookup(entry.id);
    const isDead = player ? !player.alive : false;
    const isDemon = charDef?.type === 'Demon';
    const isLunatic = entry.id === 'lunatic';

    // Per-player bluffs: look up from the matched player's seat
    const playerSeatBluffs = player && playerBluffs ? playerBluffs[String(player.seat)] : undefined;
    const resolvedBluffChars = playerSeatBluffs?.length
      ? playerSeatBluffs
          .map((id) => characterLookup(id))
          .filter((c): c is CharacterDef => c !== undefined)
      : undefined;

    return (
      <NightFlashcard
        entry={entry}
        playerSeat={player}
        characterDef={charDef}
        checkedStates={checked}
        notes={note}
        onToggleSubAction={(i) => handleToggle(entry.id, i)}
        onNotesChange={(n) => handleNotes(entry.id, n)}
        isDead={isDead}
        readOnly={readOnly}
        players={players}
        scriptCharacters={scriptCharacters}
        selectionValue={selectionValue}
        onSelectionChange={(v) => handleSelection(entry.id, v)}
        previousSelection={prevSelection}
        characterLookup={characterLookup}
        previousNotes={prevNote}
        onReminderTokenClick={onReminderTokenClick}
        lunaticBluffCharacters={isLunatic ? resolvedBluffChars : undefined}
        demonBluffCharacters={isDemon ? resolvedBluffChars : undefined}
      />
    );
  };

  // Compute transform for slide animation
  const translateX =
    slideDir === 'left'
      ? 'translateX(-100%)'
      : slideDir === 'right'
        ? 'translateX(100%)'
        : 'translateX(0)';

  // Keyboard navigation for left/right arrows
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      goTo('prev');
    } else if (e.key === 'ArrowRight') {
      goTo('next');
    }
  };

  // Compute bluff characters for the current card's show drawer
  const currentEntry = entries[currentIndex];
  const currentPlayer =
    currentEntry?.type === 'character'
      ? players.find((p) => p.characterId === currentEntry.id)
      : undefined;
  const currentBluffIds =
    currentPlayer && playerBluffs ? playerBluffs[String(currentPlayer.seat)] : undefined;
  const currentBluffChars = useMemo(() => {
    if (!currentBluffIds?.length) return undefined;
    return currentBluffIds
      .map((id) => characterLookup(id))
      .filter((c): c is CharacterDef => c !== undefined);
  }, [currentBluffIds, characterLookup]);
  const currentBluffLabel = currentEntry?.id === 'lunatic' ? 'Lunatic Bluffs' : 'Demon Bluffs';
  const showFab = !readOnly && currentEntry?.type === 'character';

  return (
    <Box
      aria-label="Night phase flashcard carousel"
      role="region"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        outline: 'none',
      }}
    >
      {/* Progress bar */}
      <NightProgressBar
        currentIndex={currentIndex}
        totalCards={totalCards}
        entries={entries}
        characterTypes={characterTypes}
        deadIds={deadIds}
        onClick={handleDotClick}
      />

      {/* Swipeable card area */}
      <Box
        {...swipeHandlers}
        sx={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          minHeight: 0,
        }}
      >
        {/* Navigation arrows */}
        {currentIndex > 0 && (
          <IconButton
            onClick={() => goTo('prev')}
            sx={{
              position: 'absolute',
              left: 2,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              color: 'rgba(255,255,255,0.6)',
              backgroundColor: 'rgba(0,0,0,0.3)',
              '&:hover': { backgroundColor: 'rgba(0,0,0,0.5)' },
              width: 44,
              height: 44,
            }}
            size="medium"
          >
            <ChevronLeftIcon sx={{ fontSize: '1.8rem' }} />
          </IconButton>
        )}
        {currentIndex < totalCards - 1 && (
          <IconButton
            onClick={() => goTo('next')}
            sx={{
              position: 'absolute',
              right: 2,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              color: 'rgba(255,255,255,0.6)',
              backgroundColor: 'rgba(0,0,0,0.3)',
              '&:hover': { backgroundColor: 'rgba(0,0,0,0.5)' },
              width: 44,
              height: 44,
            }}
            size="medium"
          >
            <ChevronRightIcon sx={{ fontSize: '1.8rem' }} />
          </IconButton>
        )}

        {/* Card container with slide animation */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            px: 3,
            py: 1,
            transform: translateX,
            transition: slideDir !== 'none' ? 'transform 300ms ease-out' : 'none',
            minHeight: 0,
          }}
        >
          {renderCard(currentIndex)}
        </Box>

        {/* Show Player FAB — floating bottom-right on character cards */}
        {showFab && (
          <Fab
            size="small"
            aria-label="show player"
            onClick={() => setShowDrawerOpen(true)}
            data-testid="show-player-fab"
            sx={{
              position: 'absolute',
              bottom: 16,
              right: 16,
              zIndex: 10,
              bgcolor: 'rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.8)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
            }}
          >
            <VisibilityIcon />
          </Fab>
        )}
      </Box>

      {/* Player show drawer (lifted from cards to carousel level) */}
      <PlayerShowDrawer
        open={showDrawerOpen}
        onClose={() => setShowDrawerOpen(false)}
        bluffCharacters={currentBluffChars}
        bluffLabel={currentBluffLabel}
        customMessage={customPlayerMessages?.[currentEntry?.id ?? '']}
        onCustomMessageChange={
          onCustomMessageChange && currentEntry
            ? (msg) => onCustomMessageChange(currentEntry.id, msg)
            : undefined
        }
        onClearCustomMessage={
          onClearCustomMessage && currentEntry
            ? () => onClearCustomMessage(currentEntry.id)
            : undefined
        }
      />

      {/* Complete Night button — shown on last card */}
      {isLastCard && !readOnly && (
        <Box sx={{ px: 3, pb: 2, pt: 1, flexShrink: 0 }}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            onClick={onComplete}
            sx={{
              fontWeight: 'bold',
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '1rem',
            }}
          >
            ✅ Complete Night
          </Button>
        </Box>
      )}
    </Box>
  );
}
