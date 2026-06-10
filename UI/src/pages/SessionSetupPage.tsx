import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import TextField from '@mui/material/TextField';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SyncIcon from '@mui/icons-material/Sync';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useSession } from '@/context/useSession.ts';
import { useApiSync } from '@/hooks/useApiSync.ts';
import { importScript } from '@/utils/scriptImporter.ts';
import { LoadingState } from '@/components/common/LoadingState.tsx';
import { ScriptBuilder } from '@/components/ScriptBuilder/ScriptBuilder.tsx';
import {
  SeatingTemplateCircle,
  SEAT_DROPPABLE_PREFIX,
  SLOT_DRAGGABLE_PREFIX,
  SLOT_POSITION_DROPPABLE_PREFIX,
} from '@/components/Setup/SeatingTemplateCircle.tsx';
import type { Player, Script } from '@/types/index.ts';
import { buildDisplaySeatNumberMap } from '@/utils/seating/index.ts';
import { getPlayerColorById } from '@/utils/playerColor.ts';

const MAX_PLAYERS = 20;

export function SessionSetupPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const {
    state,
    updateSession,
    addPlayer,
    renamePlayer,
    removePlayer,
    addTemplateSeat,
    addTemplateSpacer,
    addTemplateStoryteller,
    removeTemplateSlot,
    moveTemplateSlot,
    assignTemplateSeat,
    addGameToSession,
    applyTemplateToGame,
    selectGame,
    deleteGame,
  } = useSession();
  const { syncScript } = useApiSync();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const session = state.sessions.find((s) => s.id === sessionId);

  const [sessionName, setSessionName] = useState('');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [script, setScript] = useState<Script | null>(null);
  const [scriptError, setScriptError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [scriptBuilderOpen, setScriptBuilderOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const theme = useTheme();
  const isSmallViewport = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (session) {
      setSessionName(session.name);
    }
  }, [session]);

  useEffect(() => {
    if (session?.defaultScriptId) {
      try {
        const raw = localStorage.getItem(`storyteller-script-${session.defaultScriptId}`);
        setScript(raw ? (JSON.parse(raw) as Script) : null);
      } catch {
        setScript(null);
      }
    }
  }, [session?.defaultScriptId]);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedSaveName = useCallback(
    (name: string) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        if (sessionId) {
          updateSession(sessionId, { name });
        }
      }, 500);
    },
    [sessionId, updateSession],
  );

  const displaySeatNumbers = useMemo(
    () => buildDisplaySeatNumberMap(session?.template.slots ?? []),
    [session?.template.slots],
  );

  const seatedPlayerIds = useMemo(
    () =>
      new Set(
        (session?.template.slots ?? [])
          .filter((slot): slot is Extract<Slot, { kind: 'seat' }> => slot.kind === 'seat')
          .map((slot) => slot.playerId)
          .filter((playerId): playerId is string => playerId !== null),
      ),
    [session?.template.slots],
  );

  const parkedPlayers = useMemo(
    () => session?.players.filter((player) => !seatedPlayerIds.has(player.id)) ?? [],
    [session?.players, seatedPlayerIds],
  );

  const handleNameChange = (value: string) => {
    setSessionName(value);
    debouncedSaveName(value);
  };

  const handleAddRosterPlayer = () => {
    if (!sessionId || !newPlayerName.trim() || (session?.players.length ?? 0) >= MAX_PLAYERS)
      return;
    addPlayer(sessionId, newPlayerName.trim());
    setNewPlayerName('');
  };

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!sessionId || !session || !over) return;
      const activeId = String(active.id);
      const overId = String(over.id);

      if (activeId.startsWith(SLOT_DRAGGABLE_PREFIX)) {
        const slotId = activeId.slice(SLOT_DRAGGABLE_PREFIX.length);
        let targetSlotId: string | null = null;
        if (overId.startsWith(SLOT_POSITION_DROPPABLE_PREFIX)) {
          targetSlotId = overId.slice(SLOT_POSITION_DROPPABLE_PREFIX.length);
        } else if (overId.startsWith(SEAT_DROPPABLE_PREFIX)) {
          // Inner SeatCell droppable overlaps the SlotPositionWrapper. When
          // collision detection resolves to the inner one, still treat it as a
          // reorder target so the drop doesn't silently no-op.
          targetSlotId = overId.slice(SEAT_DROPPABLE_PREFIX.length);
        }
        if (!targetSlotId || slotId === targetSlotId) return;
        const toIndex = session.template.slots.findIndex((s) => s.id === targetSlotId);
        if (toIndex === -1) return;
        moveTemplateSlot(sessionId, slotId, toIndex);
        return;
      }

      if (overId.startsWith(SEAT_DROPPABLE_PREFIX)) {
        const slotId = overId.slice(SEAT_DROPPABLE_PREFIX.length);
        const playerId = activeId.startsWith('rosterplayer:')
          ? activeId.slice('rosterplayer:'.length)
          : null;
        if (!playerId) return;
        assignTemplateSeat(sessionId, slotId, playerId);
      }
    },
    [assignTemplateSeat, moveTemplateSlot, session, sessionId],
  );

  const handleAddSeatsForAllPlayers = () => {
    if (!sessionId || !session) return;
    const seatedCount = session.template.slots.filter((s) => s.kind === 'seat').length;
    const need = Math.max(0, session.players.length - seatedCount);
    for (let i = 0; i < need; i++) addTemplateSeat(sessionId);
  };

  const handleApplyTemplateToAllGames = () => {
    if (!sessionId || !session) return;
    session.gameIds.forEach((gid) => applyTemplateToGame(sessionId, gid));
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    setScriptError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const json: unknown = JSON.parse(text);
      const parsed = importScript(json);

      localStorage.setItem(`storyteller-script-${parsed.id}`, JSON.stringify(parsed));
      syncScript(parsed);

      setScript(parsed);
      if (sessionId) {
        updateSession(sessionId, { defaultScriptId: parsed.id });
      }
    } catch (err) {
      setScriptError(err instanceof Error ? err.message : 'Failed to import script');
    } finally {
      setImporting(false);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreateGame = () => {
    if (!sessionId) return;
    addGameToSession(sessionId);
  };

  const handleOpenGame = (gameId: string) => {
    if (!sessionId) return;
    selectGame(sessionId, gameId);
    navigate(`/session/${sessionId}/game/${gameId}`);
  };

  const handleDeleteGame = (gameId: string) => {
    if (!sessionId) return;
    deleteGame(sessionId, gameId);
  };

  if (!session || !sessionId) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="error">
          Session not found
        </Typography>
        <Button onClick={() => navigate('/')} sx={{ mt: 2 }}>
          Back to Home
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ pb: 4 }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="back"
            onClick={() => navigate('/')}
            sx={{ mr: 1 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="h1" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Session Setup
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ pt: 2 }}>
        <Accordion defaultExpanded sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" fontWeight="bold">
              Session Info
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <TextField
              fullWidth
              label="Session Name"
              variant="outlined"
              size="small"
              value={sessionName}
              onChange={(e) => handleNameChange(e.target.value)}
              sx={{ mb: 2 }}
            />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
                Script: {script ? script.name : 'None selected'}
                {script?.author ? ` (by ${script.author})` : ''}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<UploadFileIcon />}
                onClick={handleImportClick}
              >
                Import Script
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setScriptBuilderOpen(true)}
              >
                Create Script
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                hidden
                onChange={(e) => void handleFileUpload(e)}
              />
            </Box>

            {importing && <LoadingState message="Importing script…" />}

            {scriptError && (
              <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                {scriptError}
              </Typography>
            )}

            {script && !importing && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {script.characterIds.length} characters
              </Typography>
            )}
          </AccordionDetails>
        </Accordion>

        <Accordion defaultExpanded sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" fontWeight="bold">
              Player Roster ({session.players.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="New player name"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddRosterPlayer();
                }}
              />
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddRosterPlayer}
                disabled={!newPlayerName.trim() || session.players.length >= MAX_PLAYERS}
              >
                Add
              </Button>
            </Box>
            <Grid container spacing={1}>
              {session.players.map((player) => (
                <RosterPlayerItem
                  key={player.id}
                  player={player}
                  seated={seatedPlayerIds.has(player.id)}
                  rosterIds={session.players.map((p) => p.id)}
                  onNameChange={(name) => renamePlayer(session.id, player.id, name)}
                  onRemove={() => removePlayer(session.id, player.id)}
                />
              ))}
            </Grid>
            {parkedPlayers.length > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Parking lot: {parkedPlayers.map((player) => player.name).join(', ')}
              </Typography>
            )}
          </AccordionDetails>
        </Accordion>

        <Accordion defaultExpanded sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" fontWeight="bold">
              Seating Template ({displaySeatNumbers.size} seats)
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1, flexWrap: 'wrap' }}>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={() => addTemplateSeat(session.id)}
              >
                Add Seat
              </Button>
              <Button size="small" onClick={() => addTemplateSpacer(session.id)}>
                Add Spacer
              </Button>
              <Button
                size="small"
                onClick={() => addTemplateStoryteller(session.id)}
                disabled={session.template.slots.some((slot) => slot.kind === 'storyteller')}
              >
                Add Storyteller
              </Button>
              <Button size="small" onClick={handleAddSeatsForAllPlayers}>
                Add seats for all players
              </Button>
              {session.gameIds.length > 0 && (
                <Button
                  size="small"
                  color="primary"
                  variant="outlined"
                  onClick={handleApplyTemplateToAllGames}
                  sx={{ ml: 'auto' }}
                >
                  Apply template to all games
                </Button>
              )}
            </Box>

            {session.template.slots.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ py: 2, textAlign: 'center' }}
              >
                No seating slots yet. Add seats, spacers, or a storyteller marker.
              </Typography>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    height: { xs: 560, sm: 560, md: 640 },
                  }}
                >
                  <SeatingTemplateCircle
                    slots={session.template.slots}
                    players={session.players}
                    displaySeatNumbers={displaySeatNumbers}
                    shape={isSmallViewport ? 'ovoid' : 'circle'}
                    onAssignSeat={(slotId, playerId) =>
                      assignTemplateSeat(session.id, slotId, playerId)
                    }
                    onRemoveSlot={(slotId) => removeTemplateSlot(session.id, slotId)}
                  />
                </Box>
              </DndContext>
            )}
          </AccordionDetails>
        </Accordion>

        <Accordion defaultExpanded sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" fontWeight="bold">
              Games ({session.gameIds.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Box sx={{ flexGrow: 1 }} />
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleCreateGame}
              >
                New Game
              </Button>
            </Box>
            {session.gameIds.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ py: 2, textAlign: 'center' }}
              >
                No games yet. Create your first game to start playing.
              </Typography>
            ) : (
              <>
                <Divider sx={{ mb: 1 }} />
                <List disablePadding>
                  {session.gameIds.map((gameId, index) => (
                    <GameListItem
                      key={gameId}
                      gameId={gameId}
                      gameNumber={index + 1}
                      onClick={() => handleOpenGame(gameId)}
                      onDelete={() => handleDeleteGame(gameId)}
                      onApplyTemplate={() => applyTemplateToGame(session.id, gameId)}
                    />
                  ))}
                </List>
              </>
            )}
          </AccordionDetails>
        </Accordion>

        <ScriptBuilder
          open={scriptBuilderOpen}
          onClose={() => setScriptBuilderOpen(false)}
          onSave={(newScript) => {
            syncScript(newScript);
            setScript(newScript);
            updateSession(session.id, { defaultScriptId: newScript.id });
          }}
        />
      </Container>
    </Box>
  );
}

function RosterPlayerItem({
  player,
  seated,
  rosterIds,
  onNameChange,
  onRemove,
}: {
  player: Player;
  seated: boolean;
  rosterIds: string[];
  onNameChange: (name: string) => void;
  onRemove: () => void;
}) {
  const color = getPlayerColorById(player.id, rosterIds);
  return (
    <Grid size={{ xs: 12 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip
          label={seated ? 'Seated' : 'Parked'}
          size="small"
          variant={seated ? 'filled' : 'outlined'}
          sx={
            seated
              ? { bgcolor: color, color: '#fff', borderColor: color }
              : { color, borderColor: color }
          }
        />
        <TextField
          fullWidth
          size="small"
          variant="outlined"
          value={player.name}
          onChange={(e) => onNameChange(e.target.value)}
        />
        <IconButton
          size="small"
          aria-label={`remove ${player.name}`}
          onClick={onRemove}
          color="error"
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
    </Grid>
  );
}

function GameListItem({
  gameId,
  gameNumber,
  onClick,
  onDelete,
  onApplyTemplate,
}: {
  gameId: string;
  gameNumber: number;
  onClick: () => void;
  onDelete: () => void;
  onApplyTemplate: () => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [phase] = useState<string>(() => {
    try {
      const raw = localStorage.getItem(`storyteller-game-${gameId}`);
      if (raw) {
        const game = JSON.parse(raw) as { currentPhase?: string; currentDay?: number };
        return game.currentPhase ? `Day ${game.currentDay ?? 1} · ${game.currentPhase}` : '';
      }
    } catch {
      // Ignore
    }
    return '';
  });

  return (
    <ListItem disablePadding>
      <Card sx={{ width: '100%', mb: 1 }} variant="outlined">
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CardActionArea onClick={onClick} sx={{ flex: 1 }}>
            <CardContent
              sx={{
                py: 1.5,
                '&:last-child': { pb: 1.5 },
              }}
            >
              <ListItemText primary={`Game ${gameNumber}`} secondary={phase || 'Not started'} />
            </CardContent>
          </CardActionArea>
          <CardActions>
            <IconButton
              size="small"
              color="primary"
              aria-label={`apply template to game ${gameNumber}`}
              onClick={onApplyTemplate}
              data-testid={`apply-template-${gameId}`}
              title="Apply current template to this game"
            >
              <SyncIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              aria-label={`delete game ${gameNumber}`}
              onClick={() => setConfirmOpen(true)}
              data-testid={`delete-game-${gameId}`}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </CardActions>
        </Box>
      </Card>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs">
        <DialogTitle>Delete Game {gameNumber}?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            This will permanently delete Game {gameNumber} and all its data (players, night history,
            etc.). This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              setConfirmOpen(false);
              onDelete();
            }}
            data-testid="confirm-delete-game"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </ListItem>
  );
}
