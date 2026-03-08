import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import AppBar from '@mui/material/AppBar';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import GroupsIcon from '@mui/icons-material/Groups';
import HistoryIcon from '@mui/icons-material/History';
import PeopleIcon from '@mui/icons-material/People';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import NightlightRoundIcon from '@mui/icons-material/NightlightRound';
import type { Game, Phase, Script } from '@/types/index.ts';
import { useSession } from '@/context/SessionContext.tsx';
import { useGame } from '@/context/GameContext.tsx';
import { useCharacterLookup } from '@/hooks/useCharacterLookup.ts';
import { useNightOrder } from '@/hooks/useNightOrder.ts';
import { ShowCharactersToggle } from '@/components/common/ShowCharactersToggle.tsx';
import { PhaseBar } from '@/components/PhaseBar/PhaseBar.tsx';
import { TownSquareTab } from '@/components/TownSquare/TownSquareTab.tsx';
import { PlayerListTab } from '@/components/PlayerList/PlayerListTab.tsx';
import { ScriptReferenceTab } from '@/components/ScriptViewer/ScriptReferenceTab.tsx';
import { NightOrderTab } from '@/components/NightOrder/NightOrderTab.tsx';
import { NightTabPanel } from '@/components/NightPhase/NightTabPanel.tsx';
import { NightHistoryDrawer } from '@/components/NightHistory/NightHistoryDrawer.tsx';
import { CharacterAssignmentDialog } from '@/components/CharacterAssignment/CharacterAssignmentDialog.tsx';
import { LoadingState } from '@/components/common/LoadingState.tsx';
import { useTimer } from '@/hooks/useTimer.ts';
import { Phase as PhaseEnum } from '@/types/index.ts';

/**
 * Main Game View page — the primary gameplay screen.
 *
 * Layout:
 * - AppBar (session name, back button, ShowCharactersToggle)
 * - PhaseBar (Day ↔ Night mode switch)
 * - Tab content / NightTabPanel (flex-grow, scrollable)
 * - BottomNavigation (Town Square | Players | Script | Night Order) — hidden during night view
 */
export function GameViewPage() {
  const { sessionId, gameId } = useParams<{ sessionId: string; gameId: string }>();
  const navigate = useNavigate();
  const { state: sessionState } = useSession();
  const { state: gameState, loadGame, updatePlayer, saveGame, setPhase } = useGame();
  const { allCharacters, getCharactersByIds } = useCharacterLookup();

  const [tabIndex, setTabIndex] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'night'>('day');

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

  // On page refresh: if nightProgress is active, auto-resume night view.
  // This effect runs once when nightProgress transitions from null to non-null
  // after game is loaded from localStorage.
  const hasAutoResumed = useRef(false);
  useEffect(() => {
    if (!hasAutoResumed.current && gameState.nightProgress) {
      hasAutoResumed.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from loaded state
      setViewMode('night');
    }
  }, [gameState.nightProgress]);

  // Derive loading: we found a game in localStorage but context hasn't received it yet
  const loading = !!initialGame && !gameState.game;

  // Load the script from localStorage using the game's scriptId
  const script = useMemo<Script | null>(() => {
    const scriptId = gameState.game?.scriptId;
    if (!scriptId) return null;
    try {
      const raw = localStorage.getItem(`storyteller-script-${scriptId}`);
      if (raw) return JSON.parse(raw) as Script;
    } catch {
      // Ignore parse errors
    }
    return null;
  }, [gameState.game?.scriptId]);

  // Derive script character IDs from the loaded script, falling back to all characters
  const scriptCharacterIds = useMemo(() => {
    if (script?.characterIds?.length) return script.characterIds;
    return allCharacters.map((ch) => ch.id);
  }, [script, allCharacters]);

  // Script characters as CharacterDef[] for the assignment dialog
  const scriptCharacterDefs = useMemo(
    () => getCharactersByIds(scriptCharacterIds),
    [getCharactersByIds, scriptCharacterIds],
  );

  const game = gameState.game;
  const nightHistoryCount = game?.nightHistory.length ?? 0;

  // Build night order entries for the NightTabPanel
  const isFirstNight = game?.isFirstNight ?? true;
  const players = useMemo(() => game?.players ?? [], [game?.players]);
  const nightEntries = useNightOrder(scriptCharacterIds, isFirstNight, players);

  // Check if characters need to be assigned (all non-traveller players have empty characterId)
  const needsCharacterAssignment = useMemo(() => {
    if (!game) return false;
    const nonTravellers = game.players.filter((p) => !p.isTraveller);
    return nonTravellers.length > 0 && nonTravellers.every((p) => !p.characterId);
  }, [game]);

  // Handle confirming character assignments
  const handleConfirmAssignments = useCallback(
    (updatedPlayers: import('@/types/index.ts').PlayerSeat[]) => {
      for (const p of updatedPlayers) {
        if (p.characterId) {
          updatePlayer(p.seat, {
            characterId: p.characterId,
            actualAlignment: p.actualAlignment,
            startingAlignment: p.startingAlignment,
          });
        }
      }
      saveGame();
    },
    [updatePlayer, saveGame],
  );

  // PhaseBar callbacks
  const handleNightClick = useCallback(() => {
    if (viewMode !== 'night') {
      setPhase(PhaseEnum.Night);
      setViewMode('night');
    }
  }, [viewMode, setPhase]);

  const handleDayClick = useCallback(() => {
    if (viewMode !== 'day') {
      setViewMode('day');
    }
  }, [viewMode]);

  // Night completion callback — return to Day view
  const handleNightComplete = useCallback(() => {
    setViewMode('day');
  }, []);

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
      <PhaseBar
        activeView={viewMode === 'night' ? 'Night' : 'Day'}
        nightInProgress={gameState.nightProgress !== null}
        onNightClick={handleNightClick}
        onDayClick={handleDayClick}
      />

      {/* ── Character Assignment Banner ── */}
      {needsCharacterAssignment && viewMode === 'day' && (
        <Alert
          severity="info"
          action={
            <Button
              color="inherit"
              size="small"
              startIcon={<AssignmentIndIcon />}
              onClick={() => setAssignDialogOpen(true)}
            >
              Setup Characters
            </Button>
          }
          sx={{ borderRadius: 0 }}
        >
          Characters haven't been assigned yet. Set up characters before the first night!
        </Alert>
      )}

      {/* ── Tab content / Night panel ── */}
      {viewMode === 'night' ? (
        <NightTabPanel
          entries={nightEntries}
          players={players}
          scriptCharacterIds={scriptCharacterIds}
          onComplete={handleNightComplete}
        />
      ) : (
        <>
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
            <BottomNavigationAction
              label="Players"
              icon={<PeopleIcon />}
              aria-label="Players tab"
            />
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
        </>
      )}

      {/* Night History Drawer */}
      <NightHistoryDrawer open={historyOpen} onClose={() => setHistoryOpen(false)} />

      {/* Character Assignment Dialog */}
      {game && (
        <CharacterAssignmentDialog
          open={assignDialogOpen}
          onClose={() => setAssignDialogOpen(false)}
          players={game.players}
          scriptCharacters={scriptCharacterDefs}
          onConfirm={handleConfirmAssignments}
        />
      )}
    </Box>
  );
}
