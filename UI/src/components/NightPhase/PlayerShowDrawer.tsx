import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import MessageIcon from '@mui/icons-material/Message';
import VisibilityIcon from '@mui/icons-material/Visibility';
import type { CharacterDef } from '@/types/index.ts';
import { PlayerShowScreen } from './PlayerShowScreen.tsx';
import type { PlayerShowScreenVariant } from './PlayerShowScreen.tsx';

export interface PlayerShowDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Bluff characters to display (only shown if provided). */
  bluffCharacters?: CharacterDef[];
  /** Label for the bluff option (e.g., "Demon Bluffs" or "Lunatic Bluffs"). */
  bluffLabel?: string;
  /** Persisted custom message for this character. */
  customMessage?: string;
  /** Called when the custom message is saved. */
  onCustomMessageChange?: (message: string) => void;
  /** Called when the custom message is cleared. */
  onClearCustomMessage?: () => void;
}

/**
 * Bottom drawer for selecting what to show a player fullscreen.
 *
 * Provides options like "Show Bluffs" (for demons/lunatics) and
 * "Custom Message" (always available). Each option opens a
 * fullscreen `PlayerShowScreen` overlay.
 */
export function PlayerShowDrawer({
  open,
  onClose,
  bluffCharacters,
  bluffLabel = 'Bluffs',
  customMessage = '',
  onCustomMessageChange,
  onClearCustomMessage,
}: PlayerShowDrawerProps) {
  const [showScreenOpen, setShowScreenOpen] = useState(false);
  const [showScreenVariant, setShowScreenVariant] = useState<PlayerShowScreenVariant>('text');
  const [editingMessage, setEditingMessage] = useState(customMessage);

  const hasBluffs = bluffCharacters && bluffCharacters.length > 0;

  const handleShowBluffs = useCallback(() => {
    setShowScreenVariant('bluffs');
    setShowScreenOpen(true);
  }, []);

  const handleShowCustomMessage = useCallback(() => {
    // Save the message before showing
    if (editingMessage.trim() && onCustomMessageChange) {
      onCustomMessageChange(editingMessage.trim());
    }
    setShowScreenVariant('text');
    setShowScreenOpen(true);
  }, [editingMessage, onCustomMessageChange]);

  const handleCloseShowScreen = useCallback(() => {
    setShowScreenOpen(false);
  }, []);

  const handleMessageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingMessage(e.target.value);
  }, []);

  const handleMessageBlur = useCallback(() => {
    if (editingMessage.trim() && onCustomMessageChange) {
      onCustomMessageChange(editingMessage.trim());
    }
  }, [editingMessage, onCustomMessageChange]);

  const handleClearMessage = useCallback(() => {
    setEditingMessage('');
    onClearCustomMessage?.();
  }, [onClearCustomMessage]);

  // Sync editing state when drawer opens with persisted message
  const handleDrawerEnter = useCallback(() => {
    setEditingMessage(customMessage);
  }, [customMessage]);

  return (
    <>
      <Drawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        data-testid="player-show-drawer"
        slotProps={{ transition: { onEnter: handleDrawerEnter } }}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: '70vh',
            bgcolor: '#1a1a2e',
          },
        }}
      >
        {/* Drag handle */}
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1.5, pb: 0.5 }}>
          <Box
            sx={{
              width: 40,
              height: 4,
              borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.3)',
            }}
          />
        </Box>

        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', px: 2, pb: 1 }}>
          <VisibilityIcon sx={{ color: 'rgba(255,255,255,0.7)', mr: 1 }} />
          <Typography variant="h6" sx={{ color: '#fff', flexGrow: 1, fontWeight: 700 }}>
            Show Player
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ px: 2, pb: 3 }}>
          {/* Bluffs option */}
          {hasBluffs && (
            <>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FullscreenIcon />}
                onClick={handleShowBluffs}
                data-testid="show-bluffs-btn"
                sx={{
                  justifyContent: 'flex-start',
                  color: '#ff8a80',
                  borderColor: 'rgba(255,138,128,0.3)',
                  py: 1.5,
                  textTransform: 'none',
                  fontSize: '1rem',
                  '&:hover': { borderColor: '#ff8a80', bgcolor: 'rgba(255,138,128,0.08)' },
                }}
              >
                Show {bluffLabel}
              </Button>
              <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
            </>
          )}

          {/* Custom message section */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
            <MessageIcon sx={{ color: 'rgba(255,255,255,0.7)', mr: 1, fontSize: 20 }} />
            <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 600 }}>
              Custom Message
            </Typography>
          </Box>

          <TextField
            fullWidth
            multiline
            minRows={2}
            maxRows={4}
            value={editingMessage}
            onChange={handleMessageChange}
            onBlur={handleMessageBlur}
            placeholder="Type a message to show this player…"
            data-testid="custom-message-input"
            sx={{
              mb: 1.5,
              '& .MuiOutlinedInput-root': {
                color: '#fff',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' },
                '&.Mui-focused fieldset': { borderColor: '#90caf9' },
              },
              '& .MuiInputBase-input::placeholder': { color: 'rgba(255,255,255,0.4)' },
            }}
          />

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<FullscreenIcon />}
              onClick={handleShowCustomMessage}
              disabled={!editingMessage.trim()}
              data-testid="show-custom-message-btn"
              sx={{
                py: 1,
                textTransform: 'none',
                fontSize: '0.95rem',
              }}
            >
              Show Message
            </Button>
            {editingMessage.trim() && (
              <IconButton
                onClick={handleClearMessage}
                size="small"
                data-testid="clear-custom-message-btn"
                sx={{ color: 'rgba(255,255,255,0.5)' }}
              >
                <DeleteOutlineIcon />
              </IconButton>
            )}
          </Box>
        </Box>
      </Drawer>

      {/* Fullscreen show screen */}
      <PlayerShowScreen
        open={showScreenOpen}
        onClose={handleCloseShowScreen}
        variant={showScreenVariant}
        bluffCharacters={bluffCharacters}
        message={editingMessage}
      />
    </>
  );
}
