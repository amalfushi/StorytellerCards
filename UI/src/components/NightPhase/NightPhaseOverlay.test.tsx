import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NightPhaseOverlay } from '@/components/NightPhase/NightPhaseOverlay.tsx';
import type { NightProgress, Game } from '@/types/index.ts';
import { Alignment } from '@/types/index.ts';

// ──────────────────────────────────────────────
// Mock hooks & context
// ──────────────────────────────────────────────

const mockStartNight = vi.fn();
const mockUpdateNightProgress = vi.fn();
const mockCompleteNight = vi.fn();

const baseGame: Game = {
  id: 'game-1',
  sessionId: 'session-1',
  scriptId: 'boozling',
  currentDay: 1,
  currentPhase: 'Night',
  isFirstNight: true,
  players: [
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
  ],
  nightHistory: [],
};

const baseNightProgress: NightProgress = {
  currentCardIndex: 0,
  subActionStates: {},
  notes: {},
  selections: {},
  totalCards: 3,
};

let mockState: {
  game: Game | null;
  nightProgress: NightProgress | null;
  showCharacters: boolean;
};

vi.mock('@/context/GameContext.tsx', () => ({
  useGame: () => ({
    state: mockState,
    startNight: mockStartNight,
    updateNightProgress: mockUpdateNightProgress,
    completeNight: mockCompleteNight,
  }),
}));

vi.mock('react-swipeable', () => ({
  useSwipeable: () => ({}),
}));

// Mock useNightOrder to return simple entries
vi.mock('@/hooks/useNightOrder.ts', () => ({
  useNightOrder: () => [
    {
      order: 0,
      type: 'structural' as const,
      id: 'dusk',
      name: 'Dusk',
      helpText: 'Begin the night.',
      subActions: [{ id: 'dusk-1', description: 'Close eyes', isConditional: false }],
    },
    {
      order: 1,
      type: 'character' as const,
      id: 'fortuneteller',
      name: 'Fortune Teller',
      helpText: 'Choose 2 players.',
      subActions: [{ id: 'ft-1', description: 'Wake them', isConditional: false }],
    },
    {
      order: 99,
      type: 'structural' as const,
      id: 'dawn',
      name: 'Dawn',
      helpText: 'Open eyes.',
      subActions: [{ id: 'dawn-1', description: 'Open eyes', isConditional: false }],
    },
  ],
}));

// Mock useCharacterLookup
vi.mock('@/hooks/useCharacterLookup.ts', () => ({
  useCharacterLookup: () => ({
    getCharacter: (id: string) =>
      id === 'fortuneteller'
        ? {
            id: 'fortuneteller',
            name: 'Fortune Teller',
            type: 'Townsfolk',
            defaultAlignment: 'Good',
            abilityShort: 'Choose 2 players.',
            firstNight: null,
            otherNights: null,
            reminders: [],
          }
        : undefined,
    getCharactersByIds: (ids: string[]) =>
      ids
        .filter((id) => id === 'fortuneteller')
        .map(() => ({
          id: 'fortuneteller',
          name: 'Fortune Teller',
          type: 'Townsfolk',
          defaultAlignment: 'Good',
          abilityShort: 'Choose 2 players.',
          firstNight: null,
          otherNights: null,
          reminders: [],
        })),
    allCharacters: [],
  }),
}));

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe('NightPhaseOverlay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState = {
      game: baseGame,
      nightProgress: baseNightProgress,
      showCharacters: false,
    };
  });

  it('renders when open, in Night phase, and has progress', () => {
    render(
      <NightPhaseOverlay
        scriptCharacterIds={['fortuneteller']}
        externalOpen
      />,
    );
    // Should render the flashcard carousel region
    expect(screen.getByRole('region')).toBeInTheDocument();
  });

  it('does not render when externalOpen is false', () => {
    const { container } = render(
      <NightPhaseOverlay
        scriptCharacterIds={['fortuneteller']}
        externalOpen={false}
      />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('does not render when phase is Day', () => {
    mockState = {
      ...mockState,
      game: { ...baseGame, currentPhase: 'Day' },
    };
    const { container } = render(
      <NightPhaseOverlay
        scriptCharacterIds={['fortuneteller']}
        externalOpen
      />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('does not render when there is no game', () => {
    mockState = { game: null, nightProgress: null, showCharacters: false };
    const { container } = render(
      <NightPhaseOverlay
        scriptCharacterIds={['fortuneteller']}
        externalOpen
      />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('does not render when nightProgress is null', () => {
    mockState = { ...mockState, nightProgress: null };
    // startNight will be called by the effect, but nightProgress stays null in this render
    const { container } = render(
      <NightPhaseOverlay
        scriptCharacterIds={['fortuneteller']}
        externalOpen
      />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('shows the flashcard carousel inside the overlay', () => {
    render(
      <NightPhaseOverlay
        scriptCharacterIds={['fortuneteller']}
        externalOpen
      />,
    );
    expect(screen.getByLabelText('Night phase flashcard carousel')).toBeInTheDocument();
  });

  it('has a close/dismiss button', () => {
    render(
      <NightPhaseOverlay
        scriptCharacterIds={['fortuneteller']}
        externalOpen
      />,
    );
    expect(screen.getByLabelText('Minimize night overlay')).toBeInTheDocument();
  });

  it('calls onClose when dismiss button is clicked', async () => {
    const onClose = vi.fn();
    render(
      <NightPhaseOverlay
        scriptCharacterIds={['fortuneteller']}
        externalOpen
        onClose={onClose}
      />,
    );
    const dismissButton = screen.getByLabelText('Minimize night overlay');
    dismissButton.click();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows progress counter for the cards', () => {
    render(
      <NightPhaseOverlay
        scriptCharacterIds={['fortuneteller']}
        externalOpen
      />,
    );
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('calls startNight when opened without existing progress', () => {
    mockState = { ...mockState, nightProgress: null };
    render(
      <NightPhaseOverlay
        scriptCharacterIds={['fortuneteller']}
        externalOpen
      />,
    );
    expect(mockStartNight).toHaveBeenCalledWith(3);
  });

  it('does not call startNight when progress already exists', () => {
    render(
      <NightPhaseOverlay
        scriptCharacterIds={['fortuneteller']}
        externalOpen
      />,
    );
    expect(mockStartNight).not.toHaveBeenCalled();
  });
});
