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
const mockUpdateNightHistoryNote = vi.fn();
const mockUpdateNightHistoryChoice = vi.fn();

let mockState: {
  game: Game | null;
  nightProgress: null;
  showCharacters: boolean;
};

vi.mock('@/context/GameContext.tsx', () => ({
  useGame: () => ({
    state: mockState,
    updateNightHistory: mockUpdateNightHistory,
    updateNightHistoryNote: mockUpdateNightHistoryNote,
    updateNightHistoryChoice: mockUpdateNightHistoryChoice,
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

// Track readOnly prop passed to FlashcardCarousel
let lastCarouselReadOnly: boolean | undefined;

// Mock FlashcardCarousel to avoid deep rendering
vi.mock('@/components/NightPhase/FlashcardCarousel.tsx', () => ({
  FlashcardCarousel: ({
    onComplete,
    onUpdateProgress,
    onUpdateNotes,
    onUpdateSelection,
    readOnly,
  }: {
    onComplete: () => void;
    onUpdateProgress: (charId: string, idx: number) => void;
    onUpdateNotes: (charId: string, notes: string) => void;
    onUpdateSelection?: (charId: string, value: string | string[]) => void;
    readOnly?: boolean;
  }) => {
    lastCarouselReadOnly = readOnly;
    return (
      <div data-testid="flashcard-carousel" data-readonly={readOnly}>
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
        <button
          onClick={() => onUpdateSelection?.('fortuneteller', 'Alice')}
          data-testid="update-selection-btn"
        >
          Update Selection
        </button>
      </div>
    );
  },
}));

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe('NightHistoryReview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lastCarouselReadOnly = undefined;
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
    expect(mockUpdateNightHistory).toHaveBeenCalledWith(
      0,
      expect.objectContaining({
        dayNumber: 1,
        isFirstNight: true,
      }),
    );
  });

  it('calls updateNightHistoryNote when notes are updated', async () => {
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
    expect(mockUpdateNightHistoryNote).toHaveBeenCalledTimes(1);
    expect(mockUpdateNightHistoryNote).toHaveBeenCalledWith(0, 'fortuneteller', 'Test note');
  });

  it('calls updateNightHistoryChoice when selection is updated', async () => {
    render(
      <NightHistoryReview
        historyEntry={mockHistoryEntry}
        historyIndex={0}
        isFirstNight={true}
        open={true}
        onClose={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByTestId('update-selection-btn'));
    expect(mockUpdateNightHistoryChoice).toHaveBeenCalledTimes(1);
    expect(mockUpdateNightHistoryChoice).toHaveBeenCalledWith(0, 'fortuneteller', 'Alice');
  });

  // ── Edit Mode Toggle tests ──

  describe('edit mode toggle', () => {
    it('shows Edit button by default (view mode)', () => {
      render(
        <NightHistoryReview
          historyEntry={mockHistoryEntry}
          historyIndex={0}
          isFirstNight={true}
          open={true}
          onClose={vi.fn()}
        />,
      );
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.queryByText('View')).not.toBeInTheDocument();
    });

    it('does not show "Editable" text label', () => {
      render(
        <NightHistoryReview
          historyEntry={mockHistoryEntry}
          historyIndex={0}
          isFirstNight={true}
          open={true}
          onClose={vi.fn()}
        />,
      );
      expect(screen.queryByText('Editable')).not.toBeInTheDocument();
    });

    it('starts in read-only mode (carousel readOnly=true)', () => {
      render(
        <NightHistoryReview
          historyEntry={mockHistoryEntry}
          historyIndex={0}
          isFirstNight={true}
          open={true}
          onClose={vi.fn()}
        />,
      );
      expect(lastCarouselReadOnly).toBe(true);
    });

    it('toggles to edit mode when Edit button is clicked', async () => {
      render(
        <NightHistoryReview
          historyEntry={mockHistoryEntry}
          historyIndex={0}
          isFirstNight={true}
          open={true}
          onClose={vi.fn()}
        />,
      );
      await userEvent.click(screen.getByText('Edit'));
      expect(screen.getByText('View')).toBeInTheDocument();
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
      expect(lastCarouselReadOnly).toBe(false);
    });

    it('toggles back to view mode when View button is clicked', async () => {
      render(
        <NightHistoryReview
          historyEntry={mockHistoryEntry}
          historyIndex={0}
          isFirstNight={true}
          open={true}
          onClose={vi.fn()}
        />,
      );
      // Switch to edit mode
      await userEvent.click(screen.getByText('Edit'));
      expect(screen.getByText('View')).toBeInTheDocument();
      // Switch back to view mode
      await userEvent.click(screen.getByText('View'));
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(lastCarouselReadOnly).toBe(true);
    });

    it('has accessible aria-label for edit toggle', () => {
      render(
        <NightHistoryReview
          historyEntry={mockHistoryEntry}
          historyIndex={0}
          isFirstNight={true}
          open={true}
          onClose={vi.fn()}
        />,
      );
      expect(screen.getByLabelText('Switch to edit mode')).toBeInTheDocument();
    });

    it('updates aria-label when toggled to edit mode', async () => {
      render(
        <NightHistoryReview
          historyEntry={mockHistoryEntry}
          historyIndex={0}
          isFirstNight={true}
          open={true}
          onClose={vi.fn()}
        />,
      );
      await userEvent.click(screen.getByLabelText('Switch to edit mode'));
      expect(screen.getByLabelText('Switch to view mode')).toBeInTheDocument();
    });
  });
});
