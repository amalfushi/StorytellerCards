import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Container from '@mui/material/Container';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Fab from '@mui/material/Fab';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import TextField from '@mui/material/TextField';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import { useSession } from '@/context/SessionContext.tsx';

export function HomePage() {
  const { state, createSession, deleteSession } = useSession();
  const navigate = useNavigate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');

  const handleCreateSession = () => {
    const name = newSessionName.trim() || `Session ${state.sessions.length + 1}`;
    // Create with empty script and 5 default empty players
    const defaultPlayerNames = Array.from({ length: 5 }, (_, i) => `Player ${i + 1}`);
    createSession(name, '', defaultPlayerNames);
    setNewSessionName('');
    setDialogOpen(false);
  };

  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteSession(id);
  };

  const handleOpenSession = (id: string) => {
    navigate(`/session/${id}`);
  };

  return (
    <Box sx={{ pb: 10 }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="h1" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Storyteller Cards
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ pt: 2 }}>
        {state.sessions.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '60vh',
              gap: 3,
              textAlign: 'center',
            }}
          >
            <SportsEsportsIcon sx={{ fontSize: 80, color: 'text.disabled' }} />
            <Typography variant="h5" color="text.secondary">
              No sessions yet
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Create your first session to start managing your Blood on the Clocktower games.
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
            >
              Create Session
            </Button>
          </Box>
        ) : (
          <List disablePadding>
            {state.sessions.map((session) => (
              <ListItem key={session.id} disablePadding sx={{ mb: 1.5 }}>
                <Card sx={{ width: '100%' }} elevation={2}>
                  <CardActionArea onClick={() => handleOpenSession(session.id)}>
                    <CardContent
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                      }}
                    >
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" component="div">
                          {session.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(session.createdAt).toLocaleDateString()} &middot;{' '}
                          {session.gameIds.length} {session.gameIds.length === 1 ? 'game' : 'games'}
                          {session.defaultScriptId ? ` · ${session.defaultScriptId}` : ''}
                        </Typography>
                      </Box>
                      <IconButton
                        edge="end"
                        aria-label="delete session"
                        onClick={(e) => handleDeleteSession(e, session.id)}
                        sx={{ color: 'error.main' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </ListItem>
            ))}
          </List>
        )}
      </Container>

      {/* FAB — only shown when sessions exist (empty state has its own button) */}
      {state.sessions.length > 0 && (
        <Fab
          color="primary"
          aria-label="create session"
          onClick={() => setDialogOpen(true)}
          sx={{ position: 'fixed', bottom: 24, right: 24 }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Create Session Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>New Session</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Session Name"
            fullWidth
            variant="outlined"
            value={newSessionName}
            onChange={(e) => setNewSessionName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateSession();
            }}
            placeholder={`Session ${state.sessions.length + 1}`}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateSession}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
