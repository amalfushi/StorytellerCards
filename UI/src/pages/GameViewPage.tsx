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
import Popover from '@mui/material/Popover';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import ChecklistIcon from '@mui/icons-material/Checklist';
import Drawer from '@mui/material/Drawer';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import GroupsIcon from '@mui/icons-material/Groups';
import HistoryIcon from '@mui/icons-material/History';
import PeopleIcon from '@mui/icons-material/People';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import NightlightRoundIcon from '@mui/icons-material/NightlightRound';
import AirlineSeatReclineExtraIcon from '@mui/icons-material/AirlineSeatReclineExtra';
import type {
  CharacterDef,
  Game,
  Phase,
  PlayerGameState,
  PlayerId,
  PlayerToken,
  Script,
} from '@/types/index.ts';
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
import { CharacterDraftDialog } from '@/components/Drafting/CharacterDraftDialog.tsx';
import { DemonBluffSelection } from '@/components/Setup/DemonBluffSelection.tsx';
import { SetupChecklist } from '@/components/Setup/SetupChecklist.tsx';
import { LoadingState } from '@/components/common/LoadingState.tsx';
import { useTimer } from '@/hooks/useTimer.ts';
import { Phase as PhaseEnum } from '@/types/index.ts';
import { DayTimerFab } from '@/components/Timer/DayTimerFab.tsx';
import {
  buildDisplaySeatNumberMap,
  hasGameStarted,
  validateGameSeating,
} from '@/utils/seating/index.ts';
import { randomizeConstrainedDraftSeating } from '@/utils/drafting/draftSeating.ts';

interface GameViewPlayer extends PlayerGameState {
  playerId: string;
  seat: number;
  playerName: string;
  isTraveller: boolean;
}

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
    updatePlayerState,
    saveGame,
    setPhase,
    setInPlayCharacters,
    setCharacterDraft,
    completeCharacterDraft,
    setDemonBluffs,
    setLunaticBluffs,
    setPlayerBluffs,
    setApparentCharacter,
    setPlayerCountOverride,
    addToken,
    removeToken,
    setSeatingConfirmed,
  } = useGame();
  const { allCharacters, getCharactersByIds, getCharacter } = useCharacterLookup();

  const [tabIndex, setTabIndex] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [characterSetupOpen, setCharacterSetupOpen] = useState(false);
  const [charSelectionOpen, setCharSelectionOpen] = useState(false);
  const [characterDraftOpen, setCharacterDraftOpen] = useState(false);
  const [bluffSelectionOpen, setBluffSelectionOpen] = useState(false);
  const [lunaticBluffSelectionOpen, setLunaticBluffSelectionOpen] = useState(false);
  const [setupChecklistOpen, setSetupChecklistOpen] = useState(false);
  const [seatingEditMode, setSeatingEditMode] = useState(false);
  const [seatingConfirmationOpen, setSeatingConfirmationOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'night'>('day');
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
  const hasCharacterPool = (game?.inPlayCharacterIds?.length ?? 0) > 0;
  const gameNumber = session && game ? session.gameIds.indexOf(game.id) + 1 : 0;
  const seatingValidation = useMemo(
    () =>
      game ? validateGameSeating(game.slots, game.participants, session?.players ?? []) : null,
    [game, session?.players],
  );

  // Build display rows for legacy child components until their Slot-based migration lands.
  const isFirstNight = game?.isFirstNight ?? true;
  const players = useMemo<GameViewPlayer[]>(() => {
    if (!game) return [];
    const sessionPlayers = new Map((session?.players ?? []).map((player) => [player.id, player]));
    const participants = new Map(
      game.participants.map((participant) => [participant.playerId, participant]),
    );
    const displayMap = buildDisplaySeatNumberMap(game.slots);
    const rows: GameViewPlayer[] = [];
    const seatedPlayerIds = new Set<string>();

    for (const slot of game.slots) {
      if (slot.kind !== 'seat' || !slot.playerId) continue;
      const stateForPlayer = game.playerState[slot.playerId];
      const participant = participants.get(slot.playerId);
      if (!stateForPlayer || !participant) continue;
      seatedPlayerIds.add(slot.playerId);
      rows.push({
        ...stateForPlayer,
        playerId: slot.playerId,
        seat: displayMap.get(slot.id) ?? rows.length + 1,
        playerName: sessionPlayers.get(slot.playerId)?.name ?? 'Unknown player',
        isTraveller: participant.isTraveller,
      });
    }

    let nextSeat = rows.length + 1;
    for (const participant of game.participants) {
      if (seatedPlayerIds.has(participant.playerId)) continue;
      const stateForPlayer = game.playerState[participant.playerId];
      if (!stateForPlayer) continue;
      rows.push({
        ...stateForPlayer,
        playerId: participant.playerId,
        seat: nextSeat,
        playerName: sessionPlayers.get(participant.playerId)?.name ?? 'Unknown player',
        isTraveller: participant.isTraveller,
      });
      nextSeat += 1;
    }

    return rows.sort((a, b) => a.seat - b.seat);
  }, [game, session?.players]);
  const draftingPlayerIds = useMemo(
    () =>
      game?.participants
        .filter((participant) => !participant.isTraveller)
        .map((participant) => participant.playerId) ?? [],
    [game?.participants],
  );
  const draftingPlayerNames = useMemo(
    () =>
      Object.fromEntries(
        draftingPlayerIds.map((playerId) => [
          playerId,
          session?.players.find((player) => player.id === playerId)?.name ?? 'Unknown player',
        ]),
      ),
    [draftingPlayerIds, session?.players],
  );

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
    const nonTravellers = game.participants.filter((p) => !p.isTraveller);
    return (
      nonTravellers.length > 0 &&
      nonTravellers.every((participant) => !game.playerState[participant.playerId]?.characterId)
    );
  }, [game]);

  const handleCompleteCharacterDraft = useCallback(
    (draft: NonNullable<Game['characterDraft']>) => {
      if (!game) return;
      const characterIdByPlayer = Object.fromEntries(
        draft.entries.flatMap((entry) =>
          entry.actualCharacterId ? [[entry.playerId, entry.actualCharacterId]] : [],
        ),
      );
      const seating = randomizeConstrainedDraftSeating(
        game.slots,
        draft.playerOrder,
        characterIdByPlayer,
        scriptCharacterDefs,
      );
      completeCharacterDraft(draft, seating.slots);
      setCharacterDraftOpen(false);
      setTabIndex(0);
      setSeatingEditMode(!seating.constraintsSatisfied);
      setBluffSelectionOpen(draft.setupMode !== 'atheist');
    },
    [completeCharacterDraft, game, scriptCharacterDefs],
  );

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
      } else if (needsCharacterAssignment) {
        setAssignDialogOpen(true);
      }
    },
    [setDemonBluffs, saveGame, lunaticIsInPlay, needsCharacterAssignment],
  );

  // Handle confirming lunatic bluff selection
  const handleConfirmLunaticBluffs = useCallback(
    (bluffIds: string[]) => {
      setLunaticBluffs(bluffIds);
      saveGame();
      setLunaticBluffSelectionOpen(false);
      if (needsCharacterAssignment) {
        setAssignDialogOpen(true);
      }
    },
    [setLunaticBluffs, saveGame, needsCharacterAssignment],
  );

  // Template bluffs for distribution after assignment
  const templateDemonBluffs = game?.demonBluffs;
  const templateLunaticBluffs = game?.lunaticBluffs;

  // Handle confirming character assignments
  const handleConfirmAssignments = useCallback(
    (updatedPlayerState: Record<PlayerId, PlayerGameState>) => {
      for (const [playerId, state] of Object.entries(updatedPlayerState)) {
        updatePlayerState(playerId, {
          characterId: state.characterId,
          actualAlignment: state.actualAlignment,
          startingAlignment: state.startingAlignment,
        });

        setApparentCharacter(playerId, state.apparentCharacterId ?? '');

        const charDef = getCharacter(state.characterId);
        if (charDef?.type === 'Demon' && templateDemonBluffs?.length) {
          setPlayerBluffs(playerId, templateDemonBluffs);
        } else if (state.characterId === 'lunatic' && templateLunaticBluffs?.length) {
          setPlayerBluffs(playerId, templateLunaticBluffs);
        }
      }
      saveGame();
    },
    [
      updatePlayerState,
      setApparentCharacter,
      saveGame,
      getCharacter,
      templateDemonBluffs,
      templateLunaticBluffs,
      setPlayerBluffs,
    ],
  );

  // PhaseBar callbacks
  const enterNightView = useCallback(() => {
    setPhase(PhaseEnum.Night);
    setViewMode('night');
  }, [setPhase]);

  const handleNightClick = useCallback(() => {
    if (viewMode === 'night' || !game) return;
    if (hasGameStarted(game)) {
      enterNightView();
      return;
    }
    if (!seatingValidation?.isValid) {
      setTabIndex(0);
      setSeatingEditMode(true);
      return;
    }
    if (!game.seatingConfirmed) {
      setSeatingConfirmationOpen(true);
      return;
    }
    enterNightView();
  }, [enterNightView, game, seatingValidation?.isValid, viewMode]);

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

  const handleSetupAddToken = useCallback(
    (playerId: PlayerId, token: PlayerToken) => {
      addToken(playerId, token);
    },
    [addToken],
  );

  const handleSetupRemoveToken = useCallback(
    (playerId: PlayerId, tokenId: string) => {
      removeToken(playerId, tokenId);
    },
    [removeToken],
  );

  const handleReminderPlayerChange = useCallback(
    (value: string | string[]) => {
      if (!reminderPicker || Array.isArray(value)) return;
      if (!value) {
        if (currentReminderPlayer) {
          removeToken(currentReminderPlayer.playerId, reminderPicker.token.id);
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
          addToken(selectedPlayer.playerId, reminderPicker.token);
        } else if (currentReminderPlayer) {
          removeToken(currentReminderPlayer.playerId, reminderPicker.token.id);
        }
        setReminderPicker(null);
        return;
      }

      const selectedPlayer = players.find((player) => player.playerName === value);
      if (selectedPlayer) {
        addToken(selectedPlayer.playerId, reminderPicker.token);
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
            data-testid="game-day-header"
            data-day={game.currentDay}
          >
            {session?.name ?? 'Game'} — Day {game.currentDay}
          </Typography>

          <Tooltip title="Edit Seating">
            <IconButton
              color="inherit"
              aria-label="edit seating"
              onClick={() => {
                setViewMode('day');
                setTabIndex(0);
                setSeatingEditMode(true);
              }}
              sx={{ mr: 0.5 }}
            >
              <AirlineSeatReclineExtraIcon />
            </IconButton>
          </Tooltip>

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
                onClick={() => setCharacterSetupOpen(true)}
              >
                Select Characters
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
              participants={game.participants}
              playerState={game.playerState}
              sessionPlayers={session?.players ?? []}
              inPlayCharacterIds={game.inPlayCharacterIds}
              scriptCharacterIds={scriptCharacterIds}
              onStartNight={() => {
                setSetupChecklistOpen(false);
                handleNightClick();
              }}
              onAddToken={handleSetupAddToken}
              onRemoveToken={handleSetupRemoveToken}
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
              {tabIndex === 0 && (
                <TownSquareTab
                  scriptCharacterIds={scriptCharacterIds}
                  editMode={seatingEditMode}
                  onEditModeChange={setSeatingEditMode}
                  onSelectCharacters={() => setCharacterSetupOpen(true)}
                />
              )}
              {tabIndex === 1 && <PlayerListTab scriptCharacterIds={scriptCharacterIds} />}
              {tabIndex === 2 && <ScriptReferenceTab scriptCharacterIds={scriptCharacterIds} />}
              {tabIndex === 3 && <NightOrderTab scriptCharacterIds={scriptCharacterIds} />}
            </Box>

            {/* ── Shared FABs for Town Square & Players tabs ── */}
            {(tabIndex === 0 || tabIndex === 1) && isDayPhase && <DayTimerFab timer={dayTimer} />}
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

      <Dialog
        open={seatingConfirmationOpen}
        onClose={() => setSeatingConfirmationOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Confirm Game {gameNumber || ''} seating</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            All {game.participants.length} participants have seats. Use this Town Square for the
            first Night?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setSeatingConfirmationOpen(false);
              setTabIndex(0);
              setSeatingEditMode(true);
            }}
          >
            Review seating
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setSeatingConfirmed(true);
              setSeatingConfirmationOpen(false);
              enterNightView();
            }}
          >
            Confirm &amp; start Night
          </Button>
        </DialogActions>
      </Dialog>

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
          open={assignDialogOpen && hasCharacterPool}
          onClose={() => setAssignDialogOpen(false)}
          slots={game.slots}
          participants={game.participants}
          playerState={game.playerState}
          sessionPlayers={session?.players ?? []}
          playerCountOverride={game.playerCountOverride}
          scriptCharacters={scriptCharacterDefs}
          inPlayCharacterIds={game.inPlayCharacterIds}
          onConfirm={handleConfirmAssignments}
          onPlayerCountChange={setPlayerCountOverride}
        />
      )}

      <Dialog open={characterSetupOpen} onClose={() => setCharacterSetupOpen(false)}>
        <DialogTitle>Select Characters</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Choose the setup flow for this game.
          </Typography>
          <Box sx={{ display: 'grid', gap: 1.5, minWidth: { sm: 360 } }}>
            <Button
              variant="outlined"
              onClick={() => {
                setCharacterSetupOpen(false);
                setCharSelectionOpen(true);
              }}
            >
              Manual selection and assignment
            </Button>
            <Button
              variant="contained"
              startIcon={<AssignmentIndIcon />}
              onClick={() => {
                setCharacterSetupOpen(false);
                setCharacterDraftOpen(true);
              }}
            >
              {game?.characterDraft?.status === 'drafting'
                ? 'Resume character draft'
                : 'Start character draft'}
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCharacterSetupOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Character Selection Dialog */}
      {game && (
        <CharacterSelection
          open={charSelectionOpen}
          onClose={() => setCharSelectionOpen(false)}
          scriptCharacters={scriptCharacterDefs}
          playerCount={game.participants.filter((participant) => !participant.isTraveller).length}
          initialSelected={game.inPlayCharacterIds}
          onConfirm={handleConfirmInPlayCharacters}
        />
      )}

      {game && (
        <CharacterDraftDialog
          open={characterDraftOpen}
          playerIds={draftingPlayerIds}
          playerNames={draftingPlayerNames}
          scriptCharacters={scriptCharacterDefs}
          draftState={game.characterDraft}
          onClose={() => setCharacterDraftOpen(false)}
          onDraftChange={setCharacterDraft}
          onDraftComplete={handleCompleteCharacterDraft}
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
            } else if (needsCharacterAssignment) {
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
            if (needsCharacterAssignment) {
              setAssignDialogOpen(true);
            }
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
