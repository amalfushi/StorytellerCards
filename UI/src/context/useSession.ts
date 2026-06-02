/**
 * React context object + `useSession` hook for the session list.
 *
 * Kept in a separate, JSX-free module so `SessionContext.tsx` can satisfy
 * `react-refresh/only-export-components` (component-only file) while
 * consumers still import the hook directly.
 */

import { createContext, useContext } from 'react';
import type { SessionContextValue } from './SessionContext.tsx';

export const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used within a <SessionProvider>');
  }
  return ctx;
}
