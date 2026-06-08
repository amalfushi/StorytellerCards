import { useReducer, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import DeleteIcon from '@mui/icons-material/Delete';

import { playgroundReducer } from './playground/m40/reducer.ts';
import { initialPgSession, type PgSession } from './playground/m40/types.ts';

/**
 * M40 — Seating Template + Player + Game Rework (Playground)
 *
 * Disposable UI for iterating the seating-template + first-class-player data model
 * in isolation from production `SessionContext` / `GameContext`. See
 * `docs/milestones/40 - seating template rework/milestone40.md`.
 *
 * Phase 2: reducer wired up with a minimal smoke editor (players, template slots,
 * games). Phases 3+ will replace these primitives with the proper town-square
 * editor, drag-and-drop, and character assignment.
 */
export function PlaygroundM40Page() {
  const [state, dispatch] = useReducer(playgroundReducer, initialPgSession);

  return (
    <Box>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="h1" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            M40 Playground — Seating Rework
          </Typography>
          <Button component={RouterLink} to="/" color="inherit" size="small">
            Back to Home
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ pt: 3, pb: 6 }}>
        <Typography variant="h5" gutterBottom>
          Playground scaffold
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Phase 2: reducer + types wired. The editor below is throwaway scaffolding; the proper
          template / roster / game UIs land in Phases 3-7. See{' '}
          <code>docs/milestones/40 - seating template rework/milestone40.md</code>.
        </Typography>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 2 }}>
          <PlayersPanel state={state} dispatch={dispatch} />
          <TemplatePanel state={state} dispatch={dispatch} />
          <GamesPanel state={state} dispatch={dispatch} />
        </Stack>

        <Divider sx={{ my: 3 }} />
        <Typography variant="caption" color="text.secondary">
          Active game: <code>{state.activeGameId ?? 'none'}</code> · Propagation default → template:{' '}
          {String(state.propagationDefault.toTemplate)}, other games:{' '}
          {String(state.propagationDefault.toOtherGames)}
        </Typography>
      </Container>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Throwaway sub-panels (Phase 2 smoke editor)
// ---------------------------------------------------------------------------

type DispatchProp = {
  state: PgSession;
  dispatch: React.Dispatch<Parameters<typeof playgroundReducer>[1]>;
};

function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

function PlayersPanel({ state, dispatch }: DispatchProp) {
  const [name, setName] = useState('');
  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    dispatch({ type: 'ADD_PLAYER', playerId: newId(), name: trimmed });
    setName('');
  };
  return (
    <Paper variant="outlined" sx={{ p: 2, flex: 1, minWidth: 240 }}>
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        Players ({state.players.length})
      </Typography>
      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
        <TextField
          size="small"
          label="Add player"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          fullWidth
        />
        <Button variant="contained" onClick={submit}>
          Add
        </Button>
      </Stack>
      <List dense disablePadding>
        {state.players.map((p) => (
          <ListItem
            key={p.id}
            disableGutters
            secondaryAction={
              <IconButton
                edge="end"
                size="small"
                aria-label={`remove ${p.name}`}
                onClick={() => dispatch({ type: 'REMOVE_PLAYER', playerId: p.id })}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            }
          >
            <ListItemText primary={p.name} secondary={p.id.slice(0, 8)} />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}

function TemplatePanel({ state, dispatch }: DispatchProp) {
  return (
    <Paper variant="outlined" sx={{ p: 2, flex: 1, minWidth: 240 }}>
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        Template ({state.template.slots.length} slots)
      </Typography>
      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={() => dispatch({ type: 'ADD_TEMPLATE_SEAT', slotId: newId() })}
        >
          + Seat
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={() => dispatch({ type: 'ADD_TEMPLATE_SPACER', slotId: newId() })}
        >
          + Spacer
        </Button>
      </Stack>
      <List dense disablePadding>
        {state.template.slots.map((slot, idx) => {
          const assignedName =
            slot.kind === 'seat' && slot.playerId
              ? (state.players.find((p) => p.id === slot.playerId)?.name ?? '?')
              : null;
          return (
            <ListItem
              key={slot.id}
              disableGutters
              secondaryAction={
                <IconButton
                  edge="end"
                  size="small"
                  aria-label={`remove slot ${idx + 1}`}
                  onClick={() => dispatch({ type: 'REMOVE_TEMPLATE_SLOT', slotId: slot.id })}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              }
            >
              <ListItemText
                primary={
                  <>
                    #{idx + 1} <Chip size="small" label={slot.kind} sx={{ mr: 1 }} />
                    {assignedName ?? (slot.kind === 'seat' ? '(empty)' : '—')}
                  </>
                }
              />
            </ListItem>
          );
        })}
      </List>
    </Paper>
  );
}

function GamesPanel({ state, dispatch }: DispatchProp) {
  const createGame = () => {
    const slotIdMap: Record<string, string> = {};
    for (const s of state.template.slots) slotIdMap[s.id] = newId();
    dispatch({
      type: 'CREATE_GAME',
      gameId: newId(),
      name: `Game ${state.games.length + 1}`,
      slotIdMap,
    });
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, flex: 1, minWidth: 240 }}>
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        Games ({state.games.length})
      </Typography>
      <Button
        variant="contained"
        size="small"
        onClick={createGame}
        disabled={state.template.slots.length === 0}
        sx={{ mb: 1 }}
      >
        + Create game (snapshot template)
      </Button>
      <List dense disablePadding>
        {state.games.map((g) => (
          <ListItem
            key={g.id}
            disableGutters
            secondaryAction={
              <IconButton
                edge="end"
                size="small"
                aria-label={`remove game ${g.name}`}
                onClick={() => dispatch({ type: 'REMOVE_GAME', gameId: g.id })}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            }
          >
            <ListItemText
              primary={
                <Button
                  size="small"
                  variant={state.activeGameId === g.id ? 'contained' : 'text'}
                  onClick={() => dispatch({ type: 'SELECT_GAME', gameId: g.id })}
                >
                  {g.name}
                </Button>
              }
              secondary={`${g.slots.length} slots · ${g.participants.length} participants`}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}
