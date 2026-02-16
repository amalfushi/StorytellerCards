import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GroupsIcon from '@mui/icons-material/Groups';
import HistoryIcon from '@mui/icons-material/History';
import PeopleIcon from '@mui/icons-material/People';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import NightlightRoundIcon from '@mui/icons-material/NightlightRound';
import type { Game, Phase } from '@/types/index.ts';
import { useSession } from '@/context/SessionContext.tsx';
import { useGame } from '@/context/GameContext.tsx';
import { useCharacterLookup } from '@/hooks/useCharacterLookup.ts';
import { ShowCharactersToggle } from '@/components/common/ShowCharactersToggle.tsx';
import { PhaseBar } from '@/components/PhaseBar/PhaseBar.tsx';
import { TownSquareTab } from '@/components/TownSquare/TownSquareTab.tsx';
import { PlayerListTab } from '@/components/PlayerList/PlayerListTab.tsx';
import { ScriptReferenceTab } from '@/components/ScriptViewer/ScriptReferenceTab.tsx';
import { NightOrderTab } from '@/components/NightOrder/NightOrderTab.tsx';
import { NightPhaseOverlay } from '@/components/NightPhase/NightPhaseOverlay.tsx';
import { NightHistoryDrawer } from '@/components/NightHistory/NightHistoryDrawer.tsx';
import { LoadingState } from '@/components/common/LoadingState.tsx';
import { useTimer } from '@/hooks/useTimer.ts';

/**
 * Main Game View page — the primary gameplay screen.
 *
 * Layout:
 * - AppBar (session name, back button, ShowCharactersToggle)
 * - PhaseBar (Dawn → Day → Dusk → Night stepper)
 * - Tab content (flex-grow, scrollable)
 * - BottomNavigation (Town Square | Players | Script | Night Order)
 */
export function GameViewPage() {
  const { sessionId, gameId } = useParams<{ sessionId: string; gameId: string }>();
  const navigate = useNavigate();
  const { state: sessionState } = useSession();
  const { state: gameState, loadGame } = useGame();
  const { allCharacters } = useCharacterLookup();

  const [tabIndex, setTabIndex] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);

  // ── Day timer (lifted here so state survives tab switches) ──
  const dayTimer = useTimer();
  const prevPhaseRef = useRef<Phase | undefined>(undefined);

  // Auto-pause the timer when leaving the Day phase
  useEffect(() => {
    const currentPhase = gameState.game?.currentPhase;
    const prevPhase = prevPhaseRef.current;
    prevPhaseRef.current = currentPhase;

    if (prevPhase === 'Day' && currentPhase !== 'Day' && dayTimer.isRunning) {
      dayTimer.pause();
    }
  }, [gameState.game?.currentPhase, dayTimer]);

  // Find the session for the display name
  const session = useMemo(
    () => sessionState.sessions.find((s) => s.id === sessionId) ?? null,
    [sessionState.sessions, sessionId],
  );

  // Read game from localStorage synchronously on first render (lazy initializer)
  const [initialGame] = useState<Game | null>(() => {
    if (!gameId) return null;
    try {
      const raw = localStorage.getItem(`storyteller-game-${gameId}`);
      if (raw) return JSON.parse(raw) as Game;
    } catch {
      // Failed to load — state stays null
    }
    return null;
  });

  // Push game into context on mount
  useEffect(() => {
    if (initialGame) loadGame(initialGame);
  }, [initialGame, loadGame]);

  // Derive loading: we found a game in localStorage but context hasn't received it yet
  const loading = !!initialGame && !gameState.game;

  // Derive script character IDs from the game's script
  // For the Boozling script, the scriptId on the game matches the script.
  // We pull character IDs from the allCharacters list that belong to this script.
  // Since we don't have a scripts registry yet, we use all characters in characters.json
  // as the Boozling script set (Phase 0–2 only support Boozling).
  const scriptCharacterIds = useMemo(() => allCharacters.map((ch) => ch.id), [allCharacters]);

  const game = gameState.game;
  const nightHistoryCount = game?.nightHistory.length ?? 0;

  if (loading) {
    return <LoadingState message="Loading game data…" />;
  }

  if (!game) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Game not found
        </Typography>
        <Typography
          variant="body2"
          color="primary"
          sx={{ cursor: 'pointer' }}
          onClick={() => navigate(`/session/${sessionId}`)}
        >
          Back to session
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      {/* ── AppBar ── */}
      <AppBar position="static" elevation={1}>
        <Toolbar variant="dense">
          <IconButton
            edge="start"
            color="inherit"
            aria-label="back to session"
            onClick={() => navigate(`/session/${sessionId}`)}
            sx={{ mr: 1 }}
          >
            <ArrowBackIcon />
          </IconButton>

          <Typography
            variant="subtitle1"
            component="h1"
            sx={{ flexGrow: 1, fontWeight: 'bold' }}
            noWrap
          >
            {session?.name ?? 'Game'} — Day {game.currentDay}
          </Typography>

          {nightHistoryCount > 0 && (
            <Tooltip title="Night History">
              <IconButton
                color="inherit"
                aria-label="night history"
                onClick={() => setHistoryOpen(true)}
                sx={{ mr: 0.5 }}
              >
                <Badge badgeContent={nightHistoryCount} color="secondary" max={99}>
                  <HistoryIcon />
                </Badge>
              </IconButton>
            </Tooltip>
          )}

          <ShowCharactersToggle />
        </Toolbar>
      </AppBar>

      {/* ── PhaseBar ── */}
      <PhaseBar />

      {/* ── Tab content ── */}
      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {tabIndex === 0 && (
            <TownSquareTab scriptCharacterIds={scriptCharacterIds} dayTimer={dayTimer} />
          )}
          {tabIndex === 1 && <PlayerListTab scriptCharacterIds={scriptCharacterIds} />}
          {tabIndex === 2 && <ScriptReferenceTab scriptCharacterIds={scriptCharacterIds} />}
          {tabIndex === 3 && <NightOrderTab scriptCharacterIds={scriptCharacterIds} />}
        </Box>
      </Box>

      {/* ── Bottom Navigation ── */}
      <BottomNavigation
        value={tabIndex}
        onChange={(_, newValue) => setTabIndex(newValue)}
        showLabels
        aria-label="Main navigation"
        role="navigation"
        sx={{
          borderTop: 1,
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <BottomNavigationAction
          label="Town Square"
          icon={<GroupsIcon />}
          aria-label="Town Square tab"
        />
        <BottomNavigationAction label="Players" icon={<PeopleIcon />} aria-label="Players tab" />
        <BottomNavigationAction
          label="Script"
          icon={<MenuBookIcon />}
          aria-label="Script reference tab"
        />
        <BottomNavigationAction
          label="Night Order"
          icon={<NightlightRoundIcon />}
          aria-label="Night Order tab"
        />
      </BottomNavigation>

      {/* Night Phase Overlay — self-manages visibility based on game phase */}
      <NightPhaseOverlay scriptCharacterIds={scriptCharacterIds} />

      {/* Night History Drawer */}
      <NightHistoryDrawer open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </Box>
  );
}
