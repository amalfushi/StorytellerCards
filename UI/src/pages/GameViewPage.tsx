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
import ChecklistIcon from '@mui/icons-material/Checklist';
import Drawer from '@mui/material/Drawer';
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
import { SyncStatusIndicator } from '@/components/common/SyncStatusIndicator.tsx';
import { PhaseBar } from '@/components/PhaseBar/PhaseBar.tsx';
import { TownSquareTab } from '@/components/TownSquare/TownSquareTab.tsx';
import { PlayerListTab } from '@/components/PlayerList/PlayerListTab.tsx';
import { ScriptReferenceTab } from '@/components/ScriptViewer/ScriptReferenceTab.tsx';
import { NightOrderTab } from '@/components/NightOrder/NightOrderTab.tsx';
import { NightTabPanel } from '@/components/NightPhase/NightTabPanel.tsx';
import { NightHistoryDrawer } from '@/components/NightHistory/NightHistoryDrawer.tsx';
import { CharacterAssignmentDialog } from '@/components/CharacterAssignment/CharacterAssignmentDialog.tsx';
import { CharacterSelection } from '@/components/Setup/CharacterSelection.tsx';
import { DemonBluffSelection } from '@/components/Setup/DemonBluffSelection.tsx';
import { SetupChecklist } from '@/components/Setup/SetupChecklist.tsx';
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
  const {
    state: gameState,
    loadGame,
    updatePlayer,
    saveGame,
    setPhase,
    setInPlayCharacters,
    setDemonBluffs,
    setLunaticBluffs,
    setPlayerBluffs,
    syncStatus,
    forceSync,
  } = useGame();
  const { allCharacters, getCharactersByIds, getCharacter } = useCharacterLookup();

  const [tabIndex, setTabIndex] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [charSelectionOpen, setCharSelectionOpen] = useState(false);
  const [bluffSelectionOpen, setBluffSelectionOpen] = useState(false);
  const [lunaticBluffSelectionOpen, setLunaticBluffSelectionOpen] = useState(false);
  const [setupChecklistOpen, setSetupChecklistOpen] = useState(false);
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

  // Check if in-play character selection is needed (no inPlayCharacterIds yet)
  const needsCharacterSelection = useMemo(() => {
    if (!game) return false;
    return needsCharacterAssignment && !game.inPlayCharacterIds?.length;
  }, [game, needsCharacterAssignment]);

  // Characters are assigned but first night hasn't been played yet — show setup checklist
  const showSetupChecklistBanner = useMemo(() => {
    if (!game) return false;
    return (
      !needsCharacterAssignment &&
      game.isFirstNight &&
      game.nightHistory.length === 0 &&
      (game.inPlayCharacterIds?.length ?? 0) > 0
    );
  }, [game, needsCharacterAssignment]);

  // Handle confirming in-play character selection
  const handleConfirmInPlayCharacters = useCallback(
    (characterIds: string[]) => {
      setInPlayCharacters(characterIds);
      saveGame();
      // Proceed to demon bluff selection after character selection
      setCharSelectionOpen(false);
      setBluffSelectionOpen(true);
    },
    [setInPlayCharacters, saveGame],
  );

  // Check if the Lunatic is in play (for conditional bluff selection step)
  const lunaticIsInPlay = useMemo(
    () => game?.inPlayCharacterIds?.includes('lunatic') ?? false,
    [game?.inPlayCharacterIds],
  );

  // Handle confirming demon bluff selection
  const handleConfirmDemonBluffs = useCallback(
    (bluffIds: string[]) => {
      setDemonBluffs(bluffIds);
      saveGame();
      setBluffSelectionOpen(false);
      if (lunaticIsInPlay) {
        setLunaticBluffSelectionOpen(true);
      } else {
        setAssignDialogOpen(true);
      }
    },
    [setDemonBluffs, saveGame, lunaticIsInPlay],
  );

  // Handle confirming lunatic bluff selection
  const handleConfirmLunaticBluffs = useCallback(
    (bluffIds: string[]) => {
      setLunaticBluffs(bluffIds);
      saveGame();
      setLunaticBluffSelectionOpen(false);
      setAssignDialogOpen(true);
    },
    [setLunaticBluffs, saveGame],
  );

  // Use in-play characters for assignment if available, else all script characters
  const inPlayIds = game?.inPlayCharacterIds;
  const assignmentCharacterDefs = useMemo(() => {
    if (inPlayIds?.length) {
      return getCharactersByIds(inPlayIds);
    }
    return scriptCharacterDefs;
  }, [inPlayIds, getCharactersByIds, scriptCharacterDefs]);

  // Template bluffs for distribution after assignment
  const templateDemonBluffs = game?.demonBluffs;
  const templateLunaticBluffs = game?.lunaticBluffs;

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

          // Distribute template bluffs to the assigned seat
          const charDef = getCharacter(p.characterId);
          if (charDef?.type === 'Demon' && templateDemonBluffs?.length) {
            setPlayerBluffs(p.seat, templateDemonBluffs);
          } else if (p.characterId === 'lunatic' && templateLunaticBluffs?.length) {
            setPlayerBluffs(p.seat, templateLunaticBluffs);
          }
        }
      }
      saveGame();
    },
    [
      updatePlayer,
      saveGame,
      getCharacter,
      templateDemonBluffs,
      templateLunaticBluffs,
      setPlayerBluffs,
    ],
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

  // Phase 2: Reminder token click — switch to Day view (TownSquare tab)
  const handleReminderTokenClick = useCallback(() => {
    setViewMode('day');
    setTabIndex(0);
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

          {showSetupChecklistBanner && (
            <Tooltip title="Setup Checklist">
              <IconButton
                color="inherit"
                aria-label="setup checklist"
                onClick={() => setSetupChecklistOpen(true)}
                sx={{ mr: 0.5 }}
              >
                <ChecklistIcon />
              </IconButton>
            </Tooltip>
          )}

          {syncStatus && <SyncStatusIndicator status={syncStatus} onRefresh={forceSync} />}

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
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                color="inherit"
                size="small"
                startIcon={<AssignmentIndIcon />}
                onClick={() => setCharSelectionOpen(true)}
              >
                {game.inPlayCharacterIds?.length ? 'Re-select Characters' : 'Select Characters'}
              </Button>
              <Button
                color="inherit"
                size="small"
                startIcon={<AssignmentIndIcon />}
                onClick={() => setAssignDialogOpen(true)}
              >
                {needsCharacterSelection ? 'Skip to Assign' : 'Setup Characters'}
              </Button>
            </Box>
          }
          sx={{ borderRadius: 0 }}
        >
          Characters haven&apos;t been assigned yet. Set up characters before the first night!
        </Alert>
      )}

      {/* ── Setup Checklist Banner ── */}
      {showSetupChecklistBanner && viewMode === 'day' && !setupChecklistOpen && (
        <Alert
          severity="success"
          action={
            <Button
              color="inherit"
              size="small"
              startIcon={<ChecklistIcon />}
              onClick={() => setSetupChecklistOpen(true)}
            >
              Setup Checklist
            </Button>
          }
          sx={{ borderRadius: 0 }}
        >
          Characters assigned! Review the setup checklist before starting Night 1.
        </Alert>
      )}

      {/* ── Setup Checklist Drawer ── */}
      {game && game.inPlayCharacterIds && (
        <Drawer
          anchor="right"
          open={setupChecklistOpen}
          onClose={() => setSetupChecklistOpen(false)}
          PaperProps={{ sx: { width: { xs: '100%', sm: 380 }, maxWidth: '100vw' } }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 1.5,
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              ✅ Setup Checklist
            </Typography>
            <IconButton
              onClick={() => setSetupChecklistOpen(false)}
              aria-label="close setup checklist"
              size="small"
            >
              ✕
            </IconButton>
          </Box>
          <Box sx={{ overflow: 'auto', flex: 1 }}>
            <SetupChecklist
              gameId={game.id}
              players={game.players}
              inPlayCharacterIds={game.inPlayCharacterIds}
              scriptCharacterIds={scriptCharacterIds}
              onStartNight={() => {
                setSetupChecklistOpen(false);
                handleNightClick();
              }}
            />
          </Box>
        </Drawer>
      )}

      {/* ── Tab content / Night panel ── */}
      {viewMode === 'night' ? (
        <NightTabPanel
          entries={nightEntries}
          players={players}
          scriptCharacterIds={scriptCharacterIds}
          onComplete={handleNightComplete}
          onReminderTokenClick={handleReminderTokenClick}
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
          scriptCharacters={assignmentCharacterDefs}
          onConfirm={handleConfirmAssignments}
        />
      )}

      {/* Character Selection Dialog */}
      {game && (
        <CharacterSelection
          open={charSelectionOpen}
          onClose={() => setCharSelectionOpen(false)}
          scriptCharacters={scriptCharacterDefs}
          playerCount={game.players.filter((p) => !p.isTraveller).length}
          initialSelected={game.inPlayCharacterIds}
          onConfirm={handleConfirmInPlayCharacters}
        />
      )}

      {/* Demon Bluff Selection Dialog */}
      {game && game.inPlayCharacterIds && (
        <DemonBluffSelection
          open={bluffSelectionOpen}
          onClose={() => {
            setBluffSelectionOpen(false);
            if (lunaticIsInPlay) {
              setLunaticBluffSelectionOpen(true);
            } else {
              setAssignDialogOpen(true);
            }
          }}
          scriptCharacters={scriptCharacterDefs}
          inPlayCharacterIds={game.inPlayCharacterIds}
          initialSelected={game.demonBluffs}
          onConfirm={handleConfirmDemonBluffs}
        />
      )}

      {/* Lunatic Bluff Selection Dialog */}
      {game && game.inPlayCharacterIds && lunaticIsInPlay && (
        <DemonBluffSelection
          open={lunaticBluffSelectionOpen}
          onClose={() => {
            setLunaticBluffSelectionOpen(false);
            setAssignDialogOpen(true);
          }}
          scriptCharacters={scriptCharacterDefs}
          inPlayCharacterIds={game.inPlayCharacterIds}
          initialSelected={game.lunaticBluffs}
          onConfirm={handleConfirmLunaticBluffs}
          variant="lunatic"
        />
      )}
    </Box>
  );
}
