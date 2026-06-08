import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useGame } from '../context/useGame';
import type { GameViewState } from '../context/GameContext';
import type { Game } from '../types';

/**
 * Internal Storybook helper that loads a mock game into the surrounding
 * `<GameProvider>` and applies any view-state overrides.
 *
 * Extracted from `decorators.tsx` so the decorator factory file can stay
 * free of inline component definitions (which would mix component and
 * non-component exports — see `react-refresh/only-export-components`).
 */
export function GameLoader({
  game,
  overrides,
  children,
}: {
  game: Game;
  overrides: Partial<GameViewState>;
  children: ReactNode;
}) {
  const { loadGame, setPhase, toggleShowCharacters, state } = useGame();

  // Storybook decorator overrides are read once at mount and never tracked
  // across re-renders; keep them in a ref so the deps lint rule is satisfied
  // without re-running the loader effects when the overrides object identity
  // changes.
  const gameRef = useRef(game);
  const overridesRef = useRef(overrides);

  useEffect(() => {
    loadGame(gameRef.current);
  }, [loadGame]);

  useEffect(() => {
    const phase = overridesRef.current.game?.currentPhase;
    if (state.game && phase) {
      setPhase(phase);
    }
  }, [state.game, setPhase]);

  const showCharactersAppliedRef = useRef(false);
  useEffect(() => {
    const showCharactersOverride = overridesRef.current.showCharacters;
    if (
      state.game &&
      !showCharactersAppliedRef.current &&
      showCharactersOverride !== undefined &&
      showCharactersOverride !== state.showCharacters
    ) {
      toggleShowCharacters();
      showCharactersAppliedRef.current = true;
    } else if (state.game && showCharactersOverride !== undefined) {
      // Override matches initial state — mark as applied so user toggles aren't reverted.
      showCharactersAppliedRef.current = true;
    }
  }, [state.game, state.showCharacters, toggleShowCharacters]);

  return <>{children}</>;
}
