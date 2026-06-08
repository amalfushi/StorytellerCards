import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import AppBar from '@mui/material/AppBar';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Button from '@mui/material/Button';
import Fab from '@mui/material/Fab';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Popover from '@mui/material/Popover';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import ChecklistIcon from '@mui/icons-material/Checklist';
import Drawer from '@mui/material/Drawer';
import GroupsIcon from '@mui/icons-material/Groups';
import HistoryIcon from '@mui/icons-material/History';
import PeopleIcon from '@mui/icons-material/People';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import NightlightRoundIcon from '@mui/icons-material/NightlightRound';
import type { CharacterDef, Game, Phase, PlayerToken, Script } from '@/types/index.ts';
import { useSession } from '@/context/useSession.ts';
import { useGame } from '@/context/useGame.ts';
import { useCharacterLookup } from '@/hooks/useCharacterLookup.ts';
import { useNightOrder } from '@/hooks/useNightOrder.ts';
import { useApiSync } from '@/hooks/useApiSync.ts';
import { ShowCharactersToggle } from '@/components/common/ShowCharactersToggle.tsx';
import { PhaseBar } from '@/components/PhaseBar/PhaseBar.tsx';
import { TownSquareTab } from '@/components/TownSquare/TownSquareTab.tsx';
import { PlayerListTab } from '@/components/PlayerList/PlayerListTab.tsx';
import { ScriptReferenceTab } from '@/components/ScriptViewer/ScriptReferenceTab.tsx';
import { NightOrderTab } from '@/components/NightOrder/NightOrderTab.tsx';
import { NightTabPanel } from '@/components/NightPhase/NightTabPanel.tsx';
import { NightHistoryDrawer } from '@/components/NightHistory/NightHistoryDrawer.tsx';
import { NightChoiceSelector } from '@/components/NightPhase/NightChoiceSelector.tsx';
import { CharacterAssignmentDialog } from '@/components/CharacterAssignment/CharacterAssignmentDialog.tsx';
import { CharacterSelection } from '@/components/Setup/CharacterSelection.tsx';
import { DemonBluffSelection } from '@/components/Setup/DemonBluffSelection.tsx';
import { SetupChecklist } from '@/components/Setup/SetupChecklist.tsx';
import { LoadingState } from '@/components/common/LoadingState.tsx';
import { ReseatTool } from '@/components/common/ReseatTool.tsx';
import { useTimer } from '@/hooks/useTimer.ts';
import { Phase as PhaseEnum } from '@/types/index.ts';
import { AddPlayerDialog } from '@/components/TownSquare/AddPlayerDialog.tsx';
import { DayTimerFab } from '@/components/Timer/DayTimerFab.tsx';

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
    addTraveller,
    saveGame,
    setPhase,
    setInPlayCharacters,
    setDemonBluffs,
    setLunaticBluffs,
    setPlayerBluffs,
    swapPlayerSeats,
    addToken,
    removeToken,
  } = useGame();
  const { allCharacters, getCharactersByIds, getCharacter } = useCharacterLookup();

  const [tabIndex, setTabIndex] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [charSelectionOpen, setCharSelectionOpen] = useState(false);
  const [bluffSelectionOpen, setBluffSelectionOpen] = useState(false);
  const [lunaticBluffSelectionOpen, setLunaticBluffSelectionOpen] = useState(false);
  const [setupChecklistOpen, setSetupChecklistOpen] = useState(false);
  const [reseatOpen, setReseatOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'night'>('day');
  const [addPlayerOpen, setAddPlayerOpen] = useState(false);
  const [reminderPicker, setReminderPicker] = useState<{
    anchorEl: HTMLElement;
    token: PlayerToken;
  } | null>(null);

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

  const isDayPhase = gameState.game?.currentPhase === PhaseEnum.Day;

  const handleAddPlayer = useCallback(
    (seat: number, playerName: string, characterId: string, alignment: 'Good' | 'Evil') => {
      addTraveller(seat, playerName, characterId, alignment);
    },
    [addTraveller],
  );

  // Find the session for the display name
  const session = useMemo(
    () => sessionState.sessions.find((s) => s.id === sessionId) ?? null,
    [sessionState.sessions, sessionId],
  );

  const { fetchGame: apiFetchGame, fetchScript } = useApiSync();

  // Read game from localStorage synchronously on first render (lazy initializer)
  const [initialGame, setInitialGame] = useState<Game | null>(() => {
    if (!gameId) return null;
    try {
      const raw = localStorage.getItem(`storyteller-game-${gameId}`);
      if (raw) return JSON.parse(raw) as Game;
    } catch {
      // Failed to load — state stays null
    }
    return null;
  });

  // If game wasn't in localStorage, try fetching from API
  useEffect(() => {
    if (initialGame || !sessionId || !gameId) return;
    let cancelled = false;
    apiFetchGame(sessionId, gameId).then((remoteGame) => {
      if (cancelled || !remoteGame) return;
      // Persist to localStorage so subsequent loads are instant
      try {
        localStorage.setItem(`storyteller-game-${gameId}`, JSON.stringify(remoteGame));
      } catch {
        // Silently ignore storage errors
      }
      setInitialGame(remoteGame);
    });
    return () => {
      cancelled = true;
    };
  }, [initialGame, sessionId, gameId, apiFetchGame]);

  // Push game into context on mount
  useEffect(() => {
    if (initialGame) loadGame(initialGame);
  }, [initialGame, loadGame]);

  // Derive loading: we found a game in localStorage but context hasn't received it yet
  const loading = !!initialGame && !gameState.game;

  const [remoteScript, setRemoteScript] = useState<Script | null>(null);

  // Load the script from localStorage using the game's scriptId
  const localScript = useMemo<Script | null>(() => {
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

  // If script not in localStorage, fetch from API (remote device scenario)
  useEffect(() => {
    if (!gameState.game?.scriptId || localScript) return;
    let cancelled = false;
    fetchScript(gameState.game.scriptId).then((apiScript) => {
      if (cancelled || !apiScript) return;
      try {
        localStorage.setItem(`storyteller-script-${apiScript.id}`, JSON.stringify(apiScript));
      } catch {
        // Silently ignore storage errors
      }
      setRemoteScript(apiScript);
    });
    return () => {
      cancelled = true;
    };
  }, [gameState.game?.scriptId, localScript, fetchScript]);

  // Only use remoteScript if its ID matches the current game's scriptId
  const script =
    localScript ?? (remoteScript?.id === gameState.game?.scriptId ? remoteScript : null);

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
  const nightEntries = useNightOrder(
    scriptCharacterIds,
    isFirstNight,
    players,
    game?.activeLoric ?? [],
    game?.activeFabled ?? [],
  );

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

  // M35: Reminder token click opens an inline picker in night view.
  const handleReminderTokenClick = useCallback(
    (token: PlayerToken, event: React.MouseEvent<HTMLElement>) => {
      setReminderPicker({ anchorEl: event.currentTarget, token });
    },
    [],
  );

  const currentReminderPlayer = useMemo(() => {
    if (!reminderPicker) return undefined;
    return players.find((player) =>
      (player.tokens ?? []).some((token) => token.id === reminderPicker.token.id),
    );
  }, [players, reminderPicker]);

  const goodCharacterReminderOptions = useMemo(() => {
    const orderedIds = [
      ...scriptCharacterIds,
      ...players
        .map((player) => player.characterId)
        .filter((id): id is string => !!id && !scriptCharacterIds.includes(id)),
    ];

    return orderedIds
      .map((id) => getCharacter(id))
      .filter(
        (character): character is CharacterDef =>
          !!character && (character.type === 'Townsfolk' || character.type === 'Outsider'),
      );
  }, [getCharacter, players, scriptCharacterIds]);

  const currentReminderCharacterName = useMemo(() => {
    if (!currentReminderPlayer?.characterId) return '';
    return getCharacter(currentReminderPlayer.characterId)?.name ?? '';
  }, [currentReminderPlayer, getCharacter]);

  const handleReminderPlayerChange = useCallback(
    (value: string | string[]) => {
      if (!reminderPicker || Array.isArray(value)) return;
      if (!value) {
        if (currentReminderPlayer) {
          removeToken(currentReminderPlayer.seat, reminderPicker.token.id);
        }
        setReminderPicker(null);
        return;
      }
      const pickerScope = reminderPicker.token.pickerScope ?? 'players';
      if (pickerScope === 'goodCharacters') {
        const selectedCharacter = goodCharacterReminderOptions.find(
          (character) => character.name === value,
        );
        const selectedPlayer = selectedCharacter
          ? players.find((player) => player.characterId === selectedCharacter.id)
          : undefined;
        if (selectedPlayer) {
          addToken(selectedPlayer.seat, reminderPicker.token);
        } else if (currentReminderPlayer) {
          removeToken(currentReminderPlayer.seat, reminderPicker.token.id);
        }
        setReminderPicker(null);
        return;
      }

      const selectedPlayer = players.find((player) => player.playerName === value);
      if (selectedPlayer) {
        addToken(selectedPlayer.seat, reminderPicker.token);
      }
      setReminderPicker(null);
    },
    [
      addToken,
      currentReminderPlayer,
      goodCharacterReminderOptions,
      players,
      reminderPicker,
      removeToken,
    ],
  );

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
              onReseat={() => setReseatOpen(true)}
              onAddToken={addToken}
              onRemoveToken={removeToken}
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
          <Box
            sx={{
              flex: 1,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
            }}
          >
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              {tabIndex === 0 && <TownSquareTab scriptCharacterIds={scriptCharacterIds} />}
              {tabIndex === 1 && <PlayerListTab scriptCharacterIds={scriptCharacterIds} />}
              {tabIndex === 2 && <ScriptReferenceTab scriptCharacterIds={scriptCharacterIds} />}
              {tabIndex === 3 && <NightOrderTab scriptCharacterIds={scriptCharacterIds} />}
            </Box>

            {/* ── Shared FABs for Town Square & Players tabs ── */}
            {(tabIndex === 0 || tabIndex === 1) && (
              <>
                <Fab
                  color="primary"
                  size="small"
                  aria-label="add player"
                  onClick={() => setAddPlayerOpen(true)}
                  sx={{
                    position: 'absolute',
                    bottom: 16,
                    right: 16,
                    zIndex: 10,
                  }}
                >
                  <AddIcon />
                </Fab>
                {isDayPhase && <DayTimerFab timer={dayTimer} />}
              </>
            )}

            {/* ── Add Player Dialog ── */}
            <AddPlayerDialog
              key={String(addPlayerOpen)}
              open={addPlayerOpen}
              existingPlayers={players}
              scriptCharacterIds={scriptCharacterIds}
              inPlayCharacterIds={game?.inPlayCharacterIds ?? []}
              onClose={() => setAddPlayerOpen(false)}
              onAdd={handleAddPlayer}
            />
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

      <ReseatTool
        open={reseatOpen}
        players={players}
        onClose={() => setReseatOpen(false)}
        onConfirmSwap={swapPlayerSeats}
      />

      <Popover
        open={!!reminderPicker}
        anchorEl={reminderPicker?.anchorEl}
        onClose={() => setReminderPicker(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <Box
          sx={{ minWidth: 260, p: 1.5, bgcolor: 'rgba(30, 30, 50, 0.98)' }}
          data-testid="reminder-player-picker"
        >
          <NightChoiceSelector
            type={reminderPicker?.token.pickerScope === 'goodCharacters' ? 'character' : 'player'}
            value={
              reminderPicker?.token.pickerScope === 'goodCharacters'
                ? currentReminderCharacterName
                : (currentReminderPlayer?.playerName ?? '')
            }
            onChange={handleReminderPlayerChange}
            players={players}
            characters={
              reminderPicker?.token.pickerScope === 'goodCharacters'
                ? goodCharacterReminderOptions
                : undefined
            }
            label={
              reminderPicker?.token.pickerScope === 'goodCharacters'
                ? 'Choose a character'
                : 'Choose a player'
            }
            emptyOptionLabel="Unassigned"
            characterLookup={getCharacter}
            showUnassignedCharacterType={reminderPicker?.token.pickerScope !== 'goodCharacters'}
          />
        </Box>
      </Popover>

      {/* Character Assignment Dialog */}
      {game && (
        <CharacterAssignmentDialog
          open={assignDialogOpen}
          onClose={() => setAssignDialogOpen(false)}
          players={game.players}
          scriptCharacters={scriptCharacterDefs}
          inPlayCharacterIds={game.inPlayCharacterIds}
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
