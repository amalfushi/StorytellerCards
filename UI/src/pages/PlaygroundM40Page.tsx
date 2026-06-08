import { useReducer, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
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
import { TemplateCircle } from './playground/m40/TemplateCircle.tsx';
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
        <ActiveGamePanel state={state} dispatch={dispatch} />

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

/**
 * Inline editable text — click to edit, Enter/blur to save, Escape to cancel.
 * Lightweight playground helper; not for production reuse.
 */
function EditableText({
  value,
  onChange,
  ariaLabel,
}: {
  value: string;
  onChange: (next: string) => void;
  ariaLabel: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onChange(trimmed);
    else setDraft(value);
    setEditing(false);
  };
  if (!editing) {
    return (
      <Button
        size="small"
        variant="text"
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
        aria-label={`rename ${ariaLabel}`}
        sx={{ textTransform: 'none', justifyContent: 'flex-start', minWidth: 0 }}
      >
        {value}
      </Button>
    );
  }
  return (
    <TextField
      autoFocus
      size="small"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit();
        else if (e.key === 'Escape') {
          setDraft(value);
          setEditing(false);
        }
      }}
      onBlur={commit}
      inputProps={{ 'aria-label': `edit ${ariaLabel}` }}
    />
  );
}

function PlayersPanel({ state, dispatch }: DispatchProp) {
  const [name, setName] = useState('');
  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    dispatch({ type: 'ADD_PLAYER', playerId: newId(), name: trimmed });
    setName('');
  };

  // Build a playerId -> { seatIndex } map for template assignments.
  const templateSeatByPlayer = new Map<string, number>();
  let seatIdx = 0;
  for (const slot of state.template.slots) {
    if (slot.kind === 'seat') {
      seatIdx += 1;
      if (slot.playerId) templateSeatByPlayer.set(slot.playerId, seatIdx);
    }
  }

  const seated = state.players.filter((p) => templateSeatByPlayer.has(p.id));
  const unseated = state.players.filter((p) => !templateSeatByPlayer.has(p.id));

  const renderRow = (p: { id: string; name: string }) => {
    const seatNum = templateSeatByPlayer.get(p.id);
    return (
      <ListItem
        key={p.id}
        disableGutters
        data-testid={`player-row-${p.id}`}
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
        <ListItemText
          primary={
            <EditableText
              value={p.name}
              onChange={(next) => dispatch({ type: 'RENAME_PLAYER', playerId: p.id, name: next })}
              ariaLabel={`player ${p.name}`}
            />
          }
          secondary={seatNum ? `Template seat ${seatNum}` : 'Unseated'}
        />
      </ListItem>
    );
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

      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        Parking lot ({unseated.length})
      </Typography>
      <List dense disablePadding data-testid="parking-lot">
        {unseated.length === 0 ? (
          <ListItem disableGutters>
            <ListItemText
              primary={<em>(no unseated players)</em>}
              primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
            />
          </ListItem>
        ) : (
          unseated.map(renderRow)
        )}
      </List>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
        Seated in template ({seated.length})
      </Typography>
      <List dense disablePadding data-testid="seated-list">
        {seated.length === 0 ? (
          <ListItem disableGutters>
            <ListItemText
              primary={<em>(none seated yet)</em>}
              primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
            />
          </ListItem>
        ) : (
          seated.map(renderRow)
        )}
      </List>
    </Paper>
  );
}

function TemplatePanel({ state, dispatch }: DispatchProp) {
  return (
    <Paper variant="outlined" sx={{ p: 2, flex: 2, minWidth: 360 }}>
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        Template ({state.template.slots.length} slots)
      </Typography>
      <TemplateCircle
        slots={state.template.slots}
        players={state.players}
        onAddSeat={() => dispatch({ type: 'ADD_TEMPLATE_SEAT', slotId: newId() })}
        onAddSpacer={() => dispatch({ type: 'ADD_TEMPLATE_SPACER', slotId: newId() })}
        onRemoveSlot={(slotId) => dispatch({ type: 'REMOVE_TEMPLATE_SLOT', slotId })}
        onAssignSeat={(slotId, playerId) =>
          dispatch({ type: 'ASSIGN_TEMPLATE_SEAT', slotId, playerId })
        }
      />
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
                <Stack direction="row" spacing={1} alignItems="center">
                  <EditableText
                    value={g.name}
                    onChange={(next) => dispatch({ type: 'RENAME_GAME', gameId: g.id, name: next })}
                    ariaLabel={`game ${g.name}`}
                  />
                  <Button
                    size="small"
                    variant={state.activeGameId === g.id ? 'contained' : 'outlined'}
                    onClick={() => dispatch({ type: 'SELECT_GAME', gameId: g.id })}
                  >
                    {state.activeGameId === g.id ? 'Active' : 'Make active'}
                  </Button>
                </Stack>
              }
              secondary={`${g.slots.length} slots · ${g.participants.length} participants`}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}

// ---------------------------------------------------------------------------
// ActiveGamePanel — Phase 6: seat assignment with sticky propagation
// ---------------------------------------------------------------------------
//
// Renders the currently-active game as a second circle. Each seat dispatches
// `ASSIGN_GAME_SEAT`, with an optional propagation override controlled by the
// two checkboxes here. The checkboxes are persisted into
// `state.propagationDefault` via `SET_PROPAGATION_DEFAULT` so the preference
// is "sticky" across actions, per the M40 design.

function ActiveGamePanel({ state, dispatch }: DispatchProp) {
  const activeGame = state.games.find((g) => g.id === state.activeGameId) ?? null;
  const { toTemplate, toOtherGames } = state.propagationDefault;

  if (!activeGame) {
    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Active game
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No active game. Create one and click <strong>Make active</strong>.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" alignItems="baseline" spacing={2} sx={{ mb: 1 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          Active game: {activeGame.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {activeGame.slots.filter((s) => s.kind === 'seat').length} seats ·{' '}
          {activeGame.participants.length} participants
        </Typography>
      </Stack>

      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={toTemplate}
              onChange={(e) =>
                dispatch({
                  type: 'SET_PROPAGATION_DEFAULT',
                  pref: { toTemplate: e.target.checked },
                })
              }
            />
          }
          label="Also update template"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={toOtherGames}
              onChange={(e) =>
                dispatch({
                  type: 'SET_PROPAGATION_DEFAULT',
                  pref: { toOtherGames: e.target.checked },
                })
              }
            />
          }
          label="Also update other games"
        />
      </Stack>

      <TemplateCircle
        slots={activeGame.slots}
        players={state.players}
        readOnlySlots
        centerLabel={activeGame.name}
        onAddSeat={() => {
          /* no-op when readOnlySlots */
        }}
        onAddSpacer={() => {
          /* no-op when readOnlySlots */
        }}
        onRemoveSlot={() => {
          /* no-op when readOnlySlots */
        }}
        onAssignSeat={(slotId, playerId) =>
          dispatch({
            type: 'ASSIGN_GAME_SEAT',
            gameId: activeGame.id,
            slotId,
            playerId,
            // Omitting `propagation` means the reducer applies the sticky
            // session-level default; the checkboxes above mutate that default.
          })
        }
      />

      <Divider sx={{ my: 2 }} />
      <Typography variant="caption" color="text.secondary" component="div">
        Participants:{' '}
        {activeGame.participants.length === 0
          ? '(none)'
          : activeGame.participants
              .map((p) => {
                const player = state.players.find((pl) => pl.id === p.playerId);
                return `${player?.name ?? '?'}${p.isTraveller ? ' (traveller)' : ''}`;
              })
              .join(', ')}
      </Typography>
    </Paper>
  );
}
