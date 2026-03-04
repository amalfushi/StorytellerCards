import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { NightHistoryReview } from '@/components/NightHistory/NightHistoryReview.tsx';
import type { NightHistoryEntry, Game } from '@/types/index.ts';
import { Alignment } from '@/types/index.ts';

// ──────────────────────────────────────────────
// Mock data
// ──────────────────────────────────────────────

const mockHistoryEntry: NightHistoryEntry = {
  dayNumber: 1,
  isFirstNight: true,
  completedAt: '2026-02-15T22:30:00.000Z',
  subActionStates: {
    fortuneteller: [true, true],
  },
  notes: {
    fortuneteller: 'Chose Alice and Bob — No.',
  },
  selections: {},
};

const mockOtherNightEntry: NightHistoryEntry = {
  dayNumber: 2,
  isFirstNight: false,
  completedAt: '2026-02-15T23:15:00.000Z',
  subActionStates: {
    fortuneteller: [true, false],
    imp: [true],
  },
  notes: {},
  selections: {},
};

const baseGame: Game = {
  id: 'game-1',
  sessionId: 'session-1',
  scriptId: 'boozling',
  currentDay: 3,
  currentPhase: 'Day',
  isFirstNight: false,
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
  nightHistory: [mockHistoryEntry, mockOtherNightEntry],
};

// ──────────────────────────────────────────────
// Mocks
// ──────────────────────────────────────────────

const mockUpdateNightHistory = vi.fn();

let mockState: {
  game: Game | null;
  nightProgress: null;
  showCharacters: boolean;
};

vi.mock('@/context/GameContext.tsx', () => ({
  useGame: () => ({
    state: mockState,
    updateNightHistory: mockUpdateNightHistory,
  }),
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
    getCharactersByIds: () => [],
    allCharacters: [
      {
        id: 'fortuneteller',
        name: 'Fortune Teller',
        type: 'Townsfolk',
        defaultAlignment: 'Good',
        abilityShort: 'Choose 2 players.',
        firstNight: null,
        otherNights: null,
        reminders: [],
      },
    ],
  }),
}));

// Mock FlashcardCarousel to avoid deep rendering
vi.mock('@/components/NightPhase/FlashcardCarousel.tsx', () => ({
  FlashcardCarousel: ({
    onComplete,
    onUpdateProgress,
    onUpdateNotes,
  }: {
    onComplete: () => void;
    onUpdateProgress: (charId: string, idx: number) => void;
    onUpdateNotes: (charId: string, notes: string) => void;
  }) => (
    <div data-testid="flashcard-carousel">
      <button onClick={onComplete} data-testid="complete-btn">
        Complete
      </button>
      <button
        onClick={() => onUpdateProgress('fortuneteller', 0)}
        data-testid="toggle-progress-btn"
      >
        Toggle Progress
      </button>
      <button
        onClick={() => onUpdateNotes('fortuneteller', 'Test note')}
        data-testid="update-notes-btn"
      >
        Update Notes
      </button>
    </div>
  ),
}));

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe('NightHistoryReview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState = {
      game: baseGame,
      nightProgress: null,
      showCharacters: false,
    };
  });

  it('renders without crashing', () => {
    const { container } = render(
      <NightHistoryReview
        historyEntry={mockHistoryEntry}
        historyIndex={0}
        isFirstNight={true}
        open={true}
        onClose={vi.fn()}
      />,
    );
    expect(container).toBeTruthy();
  });

  it('returns null when open is false', () => {
    const { container } = render(
      <NightHistoryReview
        historyEntry={mockHistoryEntry}
        historyIndex={0}
        isFirstNight={true}
        open={false}
        onClose={vi.fn()}
      />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('shows night label for first night review', () => {
    render(
      <NightHistoryReview
        historyEntry={mockHistoryEntry}
        historyIndex={0}
        isFirstNight={true}
        open={true}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('Night 1 Review — First Night')).toBeInTheDocument();
  });

  it('shows night label for other night review', () => {
    render(
      <NightHistoryReview
        historyEntry={mockOtherNightEntry}
        historyIndex={1}
        isFirstNight={false}
        open={true}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('Night 2 Review')).toBeInTheDocument();
  });

  it('shows the flashcard carousel', () => {
    render(
      <NightHistoryReview
        historyEntry={mockHistoryEntry}
        historyIndex={0}
        isFirstNight={true}
        open={true}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByTestId('flashcard-carousel')).toBeInTheDocument();
  });

  it('shows "Editable" label', () => {
    render(
      <NightHistoryReview
        historyEntry={mockHistoryEntry}
        historyIndex={0}
        isFirstNight={true}
        open={true}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('Editable')).toBeInTheDocument();
  });

  it('has a close button that calls onClose', async () => {
    const onClose = vi.fn();
    render(
      <NightHistoryReview
        historyEntry={mockHistoryEntry}
        historyIndex={0}
        isFirstNight={true}
        open={true}
        onClose={onClose}
      />,
    );
    const closeButton = screen.getByLabelText('Close review');
    await userEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls updateNightHistory when sub-action is toggled', async () => {
    render(
      <NightHistoryReview
        historyEntry={mockHistoryEntry}
        historyIndex={0}
        isFirstNight={true}
        open={true}
        onClose={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByTestId('toggle-progress-btn'));
    expect(mockUpdateNightHistory).toHaveBeenCalledTimes(1);
    expect(mockUpdateNightHistory).toHaveBeenCalledWith(0, expect.objectContaining({
      dayNumber: 1,
      isFirstNight: true,
    }));
  });

  it('calls updateNightHistory when notes are updated', async () => {
    render(
      <NightHistoryReview
        historyEntry={mockHistoryEntry}
        historyIndex={0}
        isFirstNight={true}
        open={true}
        onClose={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByTestId('update-notes-btn'));
    expect(mockUpdateNightHistory).toHaveBeenCalledTimes(1);
    expect(mockUpdateNightHistory).toHaveBeenCalledWith(0, expect.objectContaining({
      notes: expect.objectContaining({ fortuneteller: 'Test note' }),
    }));
  });
});
