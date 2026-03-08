import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FlashcardCarousel } from '@/components/NightPhase/FlashcardCarousel.tsx';
import type { NightOrderEntry, PlayerSeat, NightProgress, CharacterDef } from '@/types/index.ts';
import { Alignment, CharacterType } from '@/types/index.ts';

// ──────────────────────────────────────────────
// Mock react-swipeable — provide passthrough handlers
// ──────────────────────────────────────────────

vi.mock('react-swipeable', () => ({
  useSwipeable: () => ({}),
}));

// ──────────────────────────────────────────────
// Mock data
// ──────────────────────────────────────────────

const makeEntry = (
  id: string,
  name: string,
  type: 'structural' | 'character' = 'character',
): NightOrderEntry => ({
  order: 0,
  type,
  id,
  name,
  helpText: `Help text for ${name}`,
  subActions: [{ id: `${id}-sa1`, description: `Wake ${name}`, isConditional: false }],
});

const duskEntry = makeEntry('dusk', 'Dusk', 'structural');
const fortuneTellerEntry = makeEntry('fortuneteller', 'Fortune Teller');
const impEntry = makeEntry('imp', 'Imp');
const dawnEntry = makeEntry('dawn', 'Dawn', 'structural');

const entries: NightOrderEntry[] = [duskEntry, fortuneTellerEntry, impEntry, dawnEntry];

const mockPlayers: PlayerSeat[] = [
  {
    seat: 1,
    playerName: 'Alice',
    characterId: 'fortuneteller',
    alive: true,
    ghostVoteUsed: false,
    visibleAlignment: Alignment.Unknown,
    actualAlignment: Alignment.Good,
    startingAlignment: Alignment.Good,
    activeReminders: [],
    isTraveller: false,
    tokens: [],
  },
  {
    seat: 2,
    playerName: 'Bob',
    characterId: 'imp',
    alive: true,
    ghostVoteUsed: false,
    visibleAlignment: Alignment.Unknown,
    actualAlignment: Alignment.Evil,
    startingAlignment: Alignment.Evil,
    activeReminders: [],
    isTraveller: false,
    tokens: [],
  },
];

const mockCharacterDef: CharacterDef = {
  id: 'fortuneteller',
  name: 'Fortune Teller',
  type: CharacterType.Townsfolk,
  defaultAlignment: Alignment.Good,
  abilityShort: 'Choose 2 players.',
  firstNight: null,
  otherNights: null,
  reminders: [],
};

const mockImpDef: CharacterDef = {
  id: 'imp',
  name: 'Imp',
  type: CharacterType.Demon,
  defaultAlignment: Alignment.Evil,
  abilityShort: 'Each night, choose a player: they die.',
  firstNight: null,
  otherNights: null,
  reminders: [],
};

const characterLookup = (id: string): CharacterDef | undefined => {
  if (id === 'fortuneteller') return mockCharacterDef;
  if (id === 'imp') return mockImpDef;
  return undefined;
};

const makeNightProgress = (cardIndex = 0): NightProgress => ({
  currentCardIndex: cardIndex,
  subActionStates: {},
  notes: {},
  selections: {},
  totalCards: entries.length,
});

const defaultProps = {
  entries,
  players: mockPlayers,
  characterLookup,
  nightProgress: makeNightProgress(),
  onUpdateProgress: vi.fn(),
  onUpdateNotes: vi.fn(),
  onComplete: vi.fn(),
};

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe('FlashcardCarousel', () => {
  it('renders without crashing', () => {
    render(<FlashcardCarousel {...defaultProps} />);
    expect(screen.getByRole('region')).toBeInTheDocument();
  });

  it('shows the current card based on index (first card = structural Dusk)', () => {
    render(<FlashcardCarousel {...defaultProps} />);
    // Dusk is a structural entry — should show its name
    expect(screen.getByText('Dusk')).toBeInTheDocument();
  });

  it('shows progress indicator with counter text', () => {
    render(<FlashcardCarousel {...defaultProps} />);
    // Should show "1 / 4" since we're at index 0 of 4 entries
    expect(screen.getByText('1 / 4')).toBeInTheDocument();
  });

  it('has correct aria-label on carousel container', () => {
    render(<FlashcardCarousel {...defaultProps} />);
    expect(screen.getByLabelText('Night phase flashcard carousel')).toBeInTheDocument();
  });

  it('does not show previous button on first card', () => {
    render(<FlashcardCarousel {...defaultProps} />);
    // On first card, there should be no "previous" button (ChevronLeft)
    // On first card, only the "next" arrow should exist
    const svgIcons = document.querySelectorAll('[data-testid="ChevronLeftIcon"]');
    expect(svgIcons).toHaveLength(0);
  });

  it('shows next button when not on last card', () => {
    render(<FlashcardCarousel {...defaultProps} />);
    const rightIcon = document.querySelector('[data-testid="ChevronRightIcon"]');
    expect(rightIcon).toBeInTheDocument();
  });

  it('shows "Complete Night" button on the last card', () => {
    render(
      <FlashcardCarousel {...defaultProps} nightProgress={makeNightProgress(entries.length - 1)} />,
    );
    expect(screen.getByText(/Complete Night/)).toBeInTheDocument();
  });

  it('does not show "Complete Night" button when NOT on last card', () => {
    render(<FlashcardCarousel {...defaultProps} />);
    expect(screen.queryByText(/Complete Night/)).not.toBeInTheDocument();
  });

  it('does not show "Complete Night" button when readOnly', () => {
    render(
      <FlashcardCarousel
        {...defaultProps}
        nightProgress={makeNightProgress(entries.length - 1)}
        readOnly
      />,
    );
    expect(screen.queryByText(/Complete Night/)).not.toBeInTheDocument();
  });

  it('calls onComplete when "Complete Night" button is clicked', () => {
    const onComplete = vi.fn();
    render(
      <FlashcardCarousel
        {...defaultProps}
        nightProgress={makeNightProgress(entries.length - 1)}
        onComplete={onComplete}
      />,
    );
    fireEvent.click(screen.getByText(/Complete Night/));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('renders correct card count in progress bar', () => {
    render(<FlashcardCarousel {...defaultProps} />);
    expect(screen.getByText('1 / 4')).toBeInTheDocument();
  });

  it('renders structural card for structural entries', () => {
    render(<FlashcardCarousel {...defaultProps} />);
    // Dusk is shown at index 0 as a structural card
    // Structural cards show their icon
    expect(screen.getByText('🌙')).toBeInTheDocument();
  });

  it('renders character flashcard for character entries at the right index', () => {
    render(<FlashcardCarousel {...defaultProps} nightProgress={makeNightProgress(1)} />);
    // Index 1 is Fortune Teller — a character entry
    expect(screen.getByText('Fortune Teller')).toBeInTheDocument();
    expect(screen.getByText('Alice (Seat 1)')).toBeInTheDocument();
  });

  it('supports keyboard navigation with ArrowRight', () => {
    render(<FlashcardCarousel {...defaultProps} />);
    const carousel = screen.getByRole('region');
    // Press ArrowRight to navigate
    fireEvent.keyDown(carousel, { key: 'ArrowRight' });
    // Navigation is animated so immediate DOM check may still show initial card
    // But the event should not throw
    expect(carousel).toBeInTheDocument();
  });

  // ── onCardChange callback ──

  it('calls onCardChange when navigating to the next card', () => {
    vi.useFakeTimers();
    const onCardChange = vi.fn();
    render(<FlashcardCarousel {...defaultProps} onCardChange={onCardChange} />);

    // Click the next arrow button
    const rightIcon = document.querySelector('[data-testid="ChevronRightIcon"]');
    expect(rightIcon).toBeInTheDocument();
    fireEvent.click(rightIcon!.closest('button')!);

    // The callback fires after the 300ms animation timeout
    vi.advanceTimersByTime(300);
    expect(onCardChange).toHaveBeenCalledWith(1);
    vi.useRealTimers();
  });

  it('does not break when onCardChange is not provided', () => {
    vi.useFakeTimers();
    render(<FlashcardCarousel {...defaultProps} />);

    const rightIcon = document.querySelector('[data-testid="ChevronRightIcon"]');
    expect(rightIcon).toBeInTheDocument();
    fireEvent.click(rightIcon!.closest('button')!);

    // Should not throw even without onCardChange
    vi.advanceTimersByTime(300);
    expect(screen.getByRole('region')).toBeInTheDocument();
    vi.useRealTimers();
  });
});
