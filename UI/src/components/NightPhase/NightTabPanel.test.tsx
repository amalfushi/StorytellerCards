import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NightTabPanel } from '@/components/NightPhase/NightTabPanel.tsx';
import type { NightOrderEntry, NightProgress } from '@/types/index.ts';
import { Alignment } from '@/types/index.ts';

// ──────────────────────────────────────────────
// Mock react-swipeable
// ──────────────────────────────────────────────

vi.mock('react-swipeable', () => ({
  useSwipeable: () => ({}),
}));

// ──────────────────────────────────────────────
// Mock data
// ──────────────────────────────────────────────

const makeEntry = (id: string, name: string): NightOrderEntry => ({
  order: 0,
  type: 'character',
  id,
  name,
  helpText: `Help for ${name}`,
  subActions: [{ id: `${id}-sa1`, description: `Wake ${name}`, isConditional: false }],
});

const entries: NightOrderEntry[] = [
  makeEntry('fortuneteller', 'Fortune Teller'),
  makeEntry('imp', 'Imp'),
];

const mockPlayers = [
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
];

// ──────────────────────────────────────────────
// Mocks
// ──────────────────────────────────────────────

const mockStartNight = vi.fn();
const mockCompleteNight = vi.fn();
const mockUpdateNightProgress = vi.fn();
const mockSetNightCardIndex = vi.fn();

let mockNightProgress: NightProgress | null = null;

vi.mock('@/context/GameContext.tsx', () => ({
  useGame: () => ({
    state: {
      game: {
        id: 'test-game',
        sessionId: 'test-session',
        scriptId: 'test-script',
        currentDay: 1,
        currentPhase: 'Night',
        isFirstNight: true,
        players: mockPlayers,
        nightHistory: [],
      },
      showCharacters: false,
      nightProgress: mockNightProgress,
    },
    startNight: mockStartNight,
    completeNight: mockCompleteNight,
    updateNightProgress: mockUpdateNightProgress,
    setNightCardIndex: mockSetNightCardIndex,
  }),
}));

vi.mock('@/hooks/useCharacterLookup.ts', () => ({
  useCharacterLookup: () => ({
    getCharacter: (id: string) => ({
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1),
      type: 'Townsfolk',
      defaultAlignment: 'Good',
      abilityShort: 'Test ability',
      firstNight: null,
      otherNights: null,
      reminders: [],
    }),
    getCharactersByIds: (ids: string[]) =>
      ids.map((id) => ({
        id,
        name: id.charAt(0).toUpperCase() + id.slice(1),
        type: 'Townsfolk',
        defaultAlignment: 'Good',
        abilityShort: 'Test ability',
        firstNight: null,
        otherNights: null,
        reminders: [],
      })),
  }),
}));

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe('NightTabPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNightProgress = null;
  });

  it('auto-starts night when nightProgress is null', () => {
    render(
      <NightTabPanel
        entries={entries}
        players={mockPlayers}
        scriptCharacterIds={['fortuneteller', 'imp']}
      />,
    );

    expect(mockStartNight).toHaveBeenCalledWith(entries.length);
  });

  it('renders FlashcardCarousel when nightProgress exists', () => {
    mockNightProgress = {
      currentCardIndex: 0,
      subActionStates: {},
      notes: {},
      selections: {},
      totalCards: entries.length,
    };

    render(
      <NightTabPanel
        entries={entries}
        players={mockPlayers}
        scriptCharacterIds={['fortuneteller', 'imp']}
      />,
    );

    expect(screen.getByTestId('night-tab-panel')).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: 'Night phase flashcard carousel' }),
    ).toBeInTheDocument();
  });

  it('returns null when nightProgress is null (before auto-start resolves)', () => {
    const { container } = render(
      <NightTabPanel
        entries={entries}
        players={mockPlayers}
        scriptCharacterIds={['fortuneteller', 'imp']}
      />,
    );

    // The component returns null while waiting for startNight to create nightProgress
    expect(container.querySelector('[data-testid="night-tab-panel"]')).not.toBeInTheDocument();
  });

  it('does not call startNight when nightProgress already exists', () => {
    mockNightProgress = {
      currentCardIndex: 0,
      subActionStates: {},
      notes: {},
      selections: {},
      totalCards: entries.length,
    };

    render(
      <NightTabPanel
        entries={entries}
        players={mockPlayers}
        scriptCharacterIds={['fortuneteller', 'imp']}
      />,
    );

    expect(mockStartNight).not.toHaveBeenCalled();
  });

  it('calls onComplete callback when night is completed', () => {
    mockNightProgress = {
      currentCardIndex: entries.length - 1,
      subActionStates: {},
      notes: {},
      selections: {},
      totalCards: entries.length,
    };

    const onComplete = vi.fn();
    render(
      <NightTabPanel
        entries={entries}
        players={mockPlayers}
        scriptCharacterIds={['fortuneteller', 'imp']}
        onComplete={onComplete}
      />,
    );

    // Click the "Complete Night" button (visible on last card)
    const completeButton = screen.getByText(/Complete Night/);
    completeButton.click();

    expect(mockCompleteNight).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
