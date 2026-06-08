import { Routes, Route, useParams } from 'react-router-dom';
import { ErrorBoundary } from '@/components/common/ErrorBoundary.tsx';
import { HomePage } from '@/pages/HomePage.tsx';
import { SessionSetupPage } from '@/pages/SessionSetupPage.tsx';
import { GameViewPage } from '@/pages/GameViewPage.tsx';

/** Wrapper that remounts GameViewPage when gameId changes via key prop. */
function GameViewPageWrapper() {
  const { gameId } = useParams<{ gameId: string }>();
  return <GameViewPage key={gameId} />;
}

export function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ErrorBoundary>
            <HomePage />
          </ErrorBoundary>
        }
      />
      <Route
        path="/session/:sessionId"
        element={
          <ErrorBoundary>
            <SessionSetupPage />
          </ErrorBoundary>
        }
      />
      <Route
        path="/session/:sessionId/game/:gameId"
        element={
          <ErrorBoundary>
            <GameViewPageWrapper />
          </ErrorBoundary>
        }
      />
    </Routes>
  );
}
