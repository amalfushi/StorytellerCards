import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameProvider } from '@/context/GameContext.tsx';
import { useGame } from '@/context/useGame.ts';
import { ShowCharactersToggle } from '@/components/common/ShowCharactersToggle.tsx';
import type { Game } from '@/types/index.ts';
import { Phase } from '@/types/index.ts';
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';

// Mock useSession for context access
vi.mock('@/context/useSession.ts', () => ({
  useSession: () => ({
    state: {
      sessions: [],
      activeSessionId: null,
      activeGameId: null,
    },
  }),
}));

// Minimal game to load into the provider
const mockGame: Game = {
  id: 'test-game',
  sessionId: 'test-session',
  scriptId: 'test-script',
  currentDay: 1,
  currentPhase: Phase.Day,
  isFirstNight: true,
  slots: [],
  participants: [],
  playerState: {},
  playerCountOverride: null,
  nightHistory: [],
};

/**
 * Helper wrapper that provides GameContext with an optional pre-loaded game
 * and optional showCharacters initial state.
 */
function TestWrapper({
  children,
  showCharacters = false,
}: {
  children: ReactNode;
  showCharacters?: boolean;
}) {
  return (
    <GameProvider>
      <GameLoader showCharacters={showCharacters}>{children}</GameLoader>
    </GameProvider>
  );
}

function GameLoader({
  children,
  showCharacters,
}: {
  children: ReactNode;
  showCharacters: boolean;
}) {
  const { loadGame, toggleShowCharacters, state } = useGame();
  const showCharactersRef = useRef(showCharacters);
  const appliedRef = useRef(false);

  useEffect(() => {
    loadGame(mockGame);
  }, [loadGame]);

  useEffect(() => {
    if (!appliedRef.current && state.game && showCharactersRef.current && !state.showCharacters) {
      appliedRef.current = true;
      toggleShowCharacters();
    }
  }, [state.game, state.showCharacters, toggleShowCharacters]);

  return <>{children}</>;
}

describe('ShowCharactersToggle', () => {
  it('renders toggle button', () => {
    render(
      <TestWrapper>
        <ShowCharactersToggle />
      </TestWrapper>,
    );
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('shows "Show character info" label when characters are hidden (day mode)', () => {
    render(
      <TestWrapper showCharacters={false}>
        <ShowCharactersToggle />
      </TestWrapper>,
    );
    expect(screen.getByLabelText('Show character info')).toBeInTheDocument();
  });

  it('shows "Hide character info" label when characters are shown (night mode)', () => {
    render(
      <TestWrapper showCharacters={true}>
        <ShowCharactersToggle />
      </TestWrapper>,
    );
    expect(screen.getByLabelText('Hide character info')).toBeInTheDocument();
  });

  it('toggles from day to night mode on click', () => {
    render(
      <TestWrapper showCharacters={false}>
        <ShowCharactersToggle />
      </TestWrapper>,
    );
    const button = screen.getByRole('button');
    // Initially day mode (show character info label)
    expect(button).toHaveAttribute('aria-label', 'Show character info');

    fireEvent.click(button);

    // After toggle, should be night mode
    expect(button).toHaveAttribute('aria-label', 'Hide character info');
  });

  it('toggles from night to day mode on click', () => {
    render(
      <TestWrapper showCharacters={true}>
        <ShowCharactersToggle />
      </TestWrapper>,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Hide character info');

    fireEvent.click(button);

    expect(button).toHaveAttribute('aria-label', 'Show character info');
  });
});
