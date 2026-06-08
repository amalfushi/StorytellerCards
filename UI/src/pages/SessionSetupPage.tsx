import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { ChangeEvent, CSSProperties } from 'react';
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
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
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
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useSession } from '@/context/useSession.ts';
import { useApiSync } from '@/hooks/useApiSync.ts';
import { importScript } from '@/utils/scriptImporter.ts';
import { LoadingState } from '@/components/common/LoadingState.tsx';
import { ScriptBuilder } from '@/components/ScriptBuilder/ScriptBuilder.tsx';
import type { Player, Script, Slot } from '@/types/index.ts';
import { buildDisplaySeatNumberMap } from '@/utils/seating/index.ts';

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
    setPropagationDefault,
    addGameToSession,
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
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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
    if (!sessionId || !newPlayerName.trim() || (session?.players.length ?? 0) >= MAX_PLAYERS) return;
    addPlayer(sessionId, newPlayerName.trim());
    setNewPlayerName('');
  };

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!sessionId || !session || !over || active.id === over.id) return;
      const toIndex = session.template.slots.findIndex((slot) => slot.id === String(over.id));
      if (toIndex === -1) return;
      moveTemplateSlot(sessionId, String(active.id), toIndex);
    },
    [moveTemplateSlot, session, sessionId],
  );

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
      <Container maxWidth="sm" sx={{ py: 4, textAlign: 'center' }}>
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

      <Container maxWidth="sm" sx={{ pt: 2 }}>
        <Paper sx={{ p: 2, mb: 3 }} elevation={1}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Session Info
          </Typography>

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
        </Paper>

        <Paper sx={{ p: 2, mb: 3 }} elevation={1}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Player Roster ({session.players.length})
          </Typography>
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
        </Paper>

        <Paper sx={{ p: 2, mb: 3 }} elevation={1}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ flexGrow: 1 }}>
              Seating Template ({displaySeatNumbers.size} seats)
            </Typography>
            <Button size="small" startIcon={<AddIcon />} onClick={() => addTemplateSeat(session.id)}>
              Add Seat
            </Button>
            <Button size="small" onClick={() => addTemplateSpacer(session.id)}>
              Add Spacer
            </Button>
            <Button size="small" onClick={() => addTemplateStoryteller(session.id)}>
              Add Storyteller
            </Button>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={session.propagationDefault.toTemplate}
                  onChange={(_, checked) =>
                    setPropagationDefault(session.id, { toTemplate: checked })
                  }
                />
              }
              label="Propagate game seating changes to template by default"
            />
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={session.propagationDefault.toOtherGames}
                  onChange={(_, checked) =>
                    setPropagationDefault(session.id, { toOtherGames: checked })
                  }
                />
              }
              label="Propagate game seating changes to other games by default"
            />
          </Box>

          {session.template.slots.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
              No seating slots yet. Add seats, spacers, or a storyteller marker.
            </Typography>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={session.template.slots.map((slot) => slot.id)}
                strategy={verticalListSortingStrategy}
              >
                <Grid container spacing={1}>
                  {session.template.slots.map((slot) => (
                    <SortableTemplateSlot
                      key={slot.id}
                      slot={slot}
                      displaySeatNumber={displaySeatNumbers.get(slot.id) ?? null}
                      players={session.players}
                      onAssign={(playerId) => assignTemplateSeat(session.id, slot.id, playerId)}
                      onRemove={() => removeTemplateSlot(session.id, slot.id)}
                    />
                  ))}
                </Grid>
              </SortableContext>
            </DndContext>
          )}
        </Paper>

        <Paper sx={{ p: 2 }} elevation={1}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ flexGrow: 1 }}>
              Games ({session.gameIds.length})
            </Typography>
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
            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
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
                  />
                ))}
              </List>
            </>
          )}
        </Paper>

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
  onNameChange,
  onRemove,
}: {
  player: Player;
  seated: boolean;
  onNameChange: (name: string) => void;
  onRemove: () => void;
}) {
  return (
    <Grid size={{ xs: 12 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip label={seated ? 'Seated' : 'Parked'} size="small" variant="outlined" />
        <TextField
          fullWidth
          size="small"
          variant="outlined"
          value={player.name}
          onChange={(e) => onNameChange(e.target.value)}
        />
        <IconButton size="small" aria-label={`remove ${player.name}`} onClick={onRemove} color="error">
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
    </Grid>
  );
}

function SortableTemplateSlot({
  slot,
  displaySeatNumber,
  players,
  onAssign,
  onRemove,
}: {
  slot: Slot;
  displaySeatNumber: number | null;
  players: Player[];
  onAssign: (playerId: string | null) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: slot.id,
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  const title =
    slot.kind === 'seat'
      ? `Seat ${displaySeatNumber ?? '?'}`
      : slot.kind === 'spacer'
        ? 'Spacer'
        : 'Storyteller';

  return (
    <Grid size={{ xs: 12 }} ref={setNodeRef} style={style}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box
          component="span"
          {...attributes}
          {...listeners}
          sx={{ display: 'flex', cursor: 'grab', touchAction: 'none' }}
          aria-label={`reorder ${title}`}
        >
          <DragIndicatorIcon fontSize="small" sx={{ color: 'text.secondary' }} />
        </Box>
        <Chip label={title} size="small" color={slot.kind === 'seat' ? 'primary' : 'default'} />
        {slot.kind === 'seat' ? (
          <TextField
            select
            fullWidth
            size="small"
            label="Assigned player"
            value={slot.playerId ?? ''}
            onChange={(e) => onAssign(e.target.value || null)}
          >
            <MenuItem value="">Empty seat</MenuItem>
            {players.map((player) => (
              <MenuItem key={player.id} value={player.id}>
                {player.name}
              </MenuItem>
            ))}
          </TextField>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
            {slot.kind === 'spacer' ? 'Gap in seating layout' : 'Storyteller position marker'}
          </Typography>
        )}
        <IconButton size="small" aria-label={`remove ${title}`} onClick={onRemove} color="error">
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
}: {
  gameId: string;
  gameNumber: number;
  onClick: () => void;
  onDelete: () => void;
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
