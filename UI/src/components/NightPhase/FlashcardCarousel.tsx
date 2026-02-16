import { useState, useCallback, useMemo, useRef } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useSwipeable } from 'react-swipeable';
import type { NightOrderEntry, PlayerSeat, CharacterDef, NightProgress } from '@/types/index.ts';
import { NightFlashcard } from './NightFlashcard.tsx';
import { StructuralCard } from './StructuralCard.tsx';
import { NightProgressBar } from './NightProgressBar.tsx';

export interface FlashcardCarouselProps {
  entries: NightOrderEntry[];
  players: PlayerSeat[];
  characterLookup: (id: string) => CharacterDef | undefined;
  nightProgress: NightProgress;
  onUpdateProgress: (characterId: string, subActionIndex: number) => void;
  onUpdateNotes: (characterId: string, notes: string) => void;
  onComplete: () => void;
  readOnly?: boolean;
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
  onComplete,
  readOnly = false,
}: FlashcardCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(nightProgress.currentCardIndex);
  const [slideDir, setSlideDir] = useState<'none' | 'left' | 'right'>('none');
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
      }, 300);
    },
    [currentIndex, totalCards],
  );

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => goTo('next'),
    onSwipedRight: () => goTo('prev'),
    trackMouse: false,
    trackTouch: true,
    delta: 40,
    preventScrollOnSwipe: true,
  });

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

  /** Render the correct card type for a given index. */
  const renderCard = (idx: number) => {
    if (idx < 0 || idx >= totalCards) return null;
    const entry = entries[idx];
    const checked =
      nightProgress.subActionStates[entry.id] ?? new Array(entry.subActions.length).fill(false);
    const note = nightProgress.notes[entry.id] ?? '';

    if (entry.type === 'structural') {
      return (
        <StructuralCard
          entry={entry}
          checkedStates={checked}
          onToggleSubAction={(i) => handleToggle(entry.id, i)}
          readOnly={readOnly}
        />
      );
    }

    const player = players.find((p) => p.characterId === entry.id);
    const charDef = characterLookup(entry.id);
    const isDead = player ? !player.alive : false;

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
              width: 36,
              height: 36,
            }}
            size="small"
          >
            <ChevronLeftIcon />
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
              width: 36,
              height: 36,
            }}
            size="small"
          >
            <ChevronRightIcon />
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
      </Box>

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
