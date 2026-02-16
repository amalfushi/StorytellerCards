import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useSession } from '@/context/SessionContext.tsx';
import { importScript } from '@/utils/scriptImporter.ts';
import { LoadingState } from '@/components/common/LoadingState.tsx';
import type { Script } from '@/types/index.ts';

const MIN_PLAYERS = 5;
const MAX_PLAYERS = 20;

export function SessionSetupPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { state, updateSession, addGameToSession, selectGame } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const session = state.sessions.find((s) => s.id === sessionId);

  // Local state for editing
  const [sessionName, setSessionName] = useState('');
  const [players, setPlayers] = useState<Array<{ seat: number; playerName: string }>>([]);
  const [script, setScript] = useState<Script | null>(null);
  const [scriptError, setScriptError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  // Initialize local state from session
  useEffect(() => {
    if (session) {
      setSessionName(session.name);
      setPlayers([...session.defaultPlayers]);
    }
  }, [session]);

  // Load script info from localStorage if a scriptId exists
  useEffect(() => {
    if (session?.defaultScriptId) {
      try {
        const raw = localStorage.getItem(`storyteller-script-${session.defaultScriptId}`);
        if (raw) {
          setScript(JSON.parse(raw) as Script);
        }
      } catch {
        // Ignore parse errors
      }
    }
  }, [session?.defaultScriptId]);

  // ── Debounced save for session name ──
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

  const handleNameChange = (value: string) => {
    setSessionName(value);
    debouncedSaveName(value);
  };

  // ── Player management ──

  const savePlayers = useCallback(
    (updated: Array<{ seat: number; playerName: string }>) => {
      if (sessionId) {
        updateSession(sessionId, { defaultPlayers: updated });
      }
    },
    [sessionId, updateSession],
  );

  const handlePlayerNameChange = (seat: number, name: string) => {
    const updated = players.map((p) => (p.seat === seat ? { ...p, playerName: name } : p));
    setPlayers(updated);
    savePlayers(updated);
  };

  const handleAddPlayer = () => {
    if (players.length >= MAX_PLAYERS) return;
    const newSeat = players.length + 1;
    const updated = [...players, { seat: newSeat, playerName: `Player ${newSeat}` }];
    setPlayers(updated);
    savePlayers(updated);
  };

  const handleRemovePlayer = (seat: number) => {
    if (players.length <= MIN_PLAYERS) return;
    // Remove player and re-number seats
    const filtered = players.filter((p) => p.seat !== seat);
    const renumbered = filtered.map((p, i) => ({ ...p, seat: i + 1 }));
    setPlayers(renumbered);
    savePlayers(renumbered);
  };

  // ── Script import ──

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setScriptError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const json: unknown = JSON.parse(text);
      const parsed = importScript(json);

      // Save script to localStorage
      localStorage.setItem(`storyteller-script-${parsed.id}`, JSON.stringify(parsed));

      setScript(parsed);
      if (sessionId) {
        updateSession(sessionId, { defaultScriptId: parsed.id });
      }
    } catch (err) {
      setScriptError(err instanceof Error ? err.message : 'Failed to import script');
    } finally {
      setImporting(false);
    }

    // Reset file input so same file can be re-uploaded
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ── Game management ──

  const handleCreateGame = () => {
    if (!sessionId) return;
    addGameToSession(sessionId);
  };

  const handleOpenGame = (gameId: string) => {
    if (!sessionId) return;
    selectGame(sessionId, gameId);
    navigate(`/session/${sessionId}/game/${gameId}`);
  };

  // ── Guard: session not found ──

  if (!session) {
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
        {/* ── Section A: Session Info ── */}
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

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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

        {/* ── Section B: Default Players ── */}
        <Paper sx={{ p: 2, mb: 3 }} elevation={1}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ flexGrow: 1 }}>
              Default Players ({players.length})
            </Typography>
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={handleAddPlayer}
              disabled={players.length >= MAX_PLAYERS}
            >
              Add Player
            </Button>
          </Box>

          <Grid container spacing={1}>
            {players.map((player) => (
              <Grid size={{ xs: 12 }} key={player.seat}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={player.seat}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ minWidth: 32 }}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    variant="outlined"
                    value={player.playerName}
                    onChange={(e) => handlePlayerNameChange(player.seat, e.target.value)}
                    placeholder={`Player ${player.seat}`}
                  />
                  <IconButton
                    size="small"
                    aria-label={`remove player ${player.seat}`}
                    onClick={() => handleRemovePlayer(player.seat)}
                    disabled={players.length <= MIN_PLAYERS}
                    color="error"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* ── Section C: Games List ── */}
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
                  />
                ))}
              </List>
            </>
          )}
        </Paper>
      </Container>
    </Box>
  );
}

// ──────────────────────────────────────────────
// Sub-component: Game list item
// ──────────────────────────────────────────────

function GameListItem({
  gameId,
  gameNumber,
  onClick,
}: {
  gameId: string;
  gameNumber: number;
  onClick: () => void;
}) {
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
        <CardActionArea onClick={onClick}>
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <ListItemButton component="div" sx={{ p: 0 }}>
              <ListItemText primary={`Game ${gameNumber}`} secondary={phase || 'Not started'} />
            </ListItemButton>
          </CardContent>
        </CardActionArea>
      </Card>
    </ListItem>
  );
}
