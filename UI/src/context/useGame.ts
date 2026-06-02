/**
 * React context object + `useGame` hook for the game view state.
 *
 * Kept in a separate, JSX-free module so `GameContext.tsx` can satisfy
 * `react-refresh/only-export-components` (component-only file) while
 * consumers still import the hook directly.
 */

import { createContext, useContext } from 'react';
import type { GameContextValue } from './GameContext.tsx';

export const GameContext = createContext<GameContextValue | null>(null);

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error('useGame must be used within a <GameProvider>');
  }
  return ctx;
}
