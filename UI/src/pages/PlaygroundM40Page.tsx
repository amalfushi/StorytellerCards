import { Link as RouterLink } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

/**
 * M40 — Seating Template + Player + Game Rework (Playground)
 *
 * Disposable UI for iterating the seating-template + first-class-player data model
 * in isolation from production `SessionContext` / `GameContext`. See
 * `docs/milestones/40 - seating template rework/milestone40.md`.
 *
 * Phase 1: scaffold only. Phases 2+ wire up the local reducer, template editor,
 * roster, games, seat assignment, and character assignment.
 */
export function PlaygroundM40Page() {
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

      <Container maxWidth="md" sx={{ pt: 3 }}>
        <Typography variant="h5" gutterBottom>
          Playground scaffold
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          This is an intentionally throwaway UI for milestone 40. Phase 1 only wires the route.
          Subsequent phases will add the seating template editor, player roster, game list, seat
          assignment with propagation, and character assignment decoupled from seat count.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          See <code>docs/milestones/40 - seating template rework/milestone40.md</code> for scope and
          acceptance criteria.
        </Typography>
      </Container>
    </Box>
  );
}
