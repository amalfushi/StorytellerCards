import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameProvider, useGame } from '@/context/GameContext.tsx';
import { ShowCharactersToggle } from '@/components/common/ShowCharactersToggle.tsx';
import type { Game } from '@/types/index.ts';
import { Phase } from '@/types/index.ts';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

// Minimal game to load into the provider
const mockGame: Game = {
  id: 'test-game',
  sessionId: 'test-session',
  scriptId: 'test-script',
  currentDay: 1,
  currentPhase: Phase.Day,
  isFirstNight: true,
  players: [],
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

  useEffect(() => {
    loadGame(mockGame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state.game && showCharacters && !state.showCharacters) {
      toggleShowCharacters();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.game?.id]);

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
