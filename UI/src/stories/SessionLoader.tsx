import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useSession } from '../context/useSession';
import type { Session } from '../types';

/**
 * Internal Storybook helper that loads a mock {@link Session} into the
 * surrounding `<SessionProvider>`. Used by `withMockGameContext` so that
 * components reading `useSession()` (e.g. `NightHistoryDrawer`) can find a
 * matching session/players row for the mock game.
 */
export function SessionLoader({ session, children }: { session: Session; children: ReactNode }) {
  const { syncSession, selectSession } = useSession();
  const sessionRef = useRef(session);

  useEffect(() => {
    syncSession(sessionRef.current);
    selectSession(sessionRef.current.id);
  }, [syncSession, selectSession]);

  return <>{children}</>;
}
