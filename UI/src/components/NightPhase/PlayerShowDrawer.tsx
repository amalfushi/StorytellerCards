import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import PushPinIcon from '@mui/icons-material/PushPin';
import VisibilityIcon from '@mui/icons-material/Visibility';
import type {
  CharacterDef,
  PlayerId,
  ShowToPlayerMessage,
  ShowToPlayerTemplate,
} from '@/types/index.ts';
import {
  getSeededShowToPlayerTemplates,
  rankShowToPlayerTemplates,
} from '@/data/showToPlayerTemplates.ts';
import { PlayerShowScreen } from './PlayerShowScreen.tsx';
import type { PlayerShowScreenVariant } from './PlayerShowScreen.tsx';

export interface PlayerShowDrawerProps {
  open: boolean;
  onClose: () => void;
  playerId?: PlayerId;
  displaySeat?: number;
  scriptId?: string;
  playerName?: string;
  messages?: ShowToPlayerMessage[];
  templates?: ShowToPlayerTemplate[];
  bluffCharacters?: CharacterDef[];
  bluffLabel?: string;
  characterDef?: CharacterDef;
  onAddMessage?: (playerId: PlayerId, text: string, templateId?: string) => void;
  onMarkMessageShown?: (messageId: string) => void;
  onEditMessage?: (messageId: string, text: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onPinTemplate?: (text: string, scope: ShowToPlayerTemplate['scope'], scriptId?: string) => void;
  onUnpinTemplate?: (templateId: string) => void;
  onBumpTemplateUsage?: (templateId: string) => void;
}

function sortByLastShownDesc(a: ShowToPlayerMessage, b: ShowToPlayerMessage): number {
  return Date.parse(b.lastShownAt ?? b.createdAt) - Date.parse(a.lastShownAt ?? a.createdAt);
}

export function PlayerShowDrawer({
  open,
  onClose,
  playerId,
  displaySeat,
  scriptId = 'carousel',
  playerName,
  messages = [],
  templates = [],
  bluffCharacters,
  bluffLabel = 'Bluffs',
  characterDef,
  onAddMessage,
  onMarkMessageShown,
  onEditMessage,
  onDeleteMessage,
  onPinTemplate,
  onUnpinTemplate,
  onBumpTemplateUsage,
}: PlayerShowDrawerProps) {
  const [showScreenOpen, setShowScreenOpen] = useState(false);
  const [showScreenVariant, setShowScreenVariant] = useState<PlayerShowScreenVariant>('text');
  const [showMessage, setShowMessage] = useState('');
  const [composeText, setComposeText] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const autoClonedMessageRef = useRef<string | null>(null);

  const hasBluffs = bluffCharacters && bluffCharacters.length > 0;
  const playerMessages = useMemo(
    () => messages.filter((message) => message.playerId === playerId),
    [messages, playerId],
  );
  const activeMessages = useMemo(
    () => playerMessages.filter((message) => !message.lastShownAt),
    [playerMessages],
  );
  const lastShownMessage = useMemo(
    () => playerMessages.filter((message) => message.lastShownAt).sort(sortByLastShownDesc)[0],
    [playerMessages],
  );
  const seededTemplates = useMemo(() => getSeededShowToPlayerTemplates(scriptId), [scriptId]);
  const rankedTemplates = useMemo(
    () => rankShowToPlayerTemplates([...templates, ...seededTemplates], messages, scriptId),
    [messages, scriptId, seededTemplates, templates],
  );
  const pinnedTemplateIds = useMemo(
    () => new Set(templates.map((template) => template.id)),
    [templates],
  );
  const pinnedTemplates = useMemo(
    () =>
      templates.filter((template) => template.scope === 'global' || template.scriptId === scriptId),
    [scriptId, templates],
  );

  useEffect(() => {
    if (!open) {
      autoClonedMessageRef.current = null;
      return;
    }
    if (
      playerId === undefined ||
      activeMessages.length > 0 ||
      !lastShownMessage ||
      autoClonedMessageRef.current === lastShownMessage.id
    ) {
      return;
    }
    autoClonedMessageRef.current = lastShownMessage.id;
    onAddMessage?.(playerId, lastShownMessage.text, lastShownMessage.templateId);
  }, [activeMessages.length, lastShownMessage, onAddMessage, open, playerId]);

  const handleShowBluffs = useCallback(() => {
    setShowScreenVariant('bluffs');
    setShowScreenOpen(true);
  }, []);

  const handleShowOncePerGamePrompt = useCallback(() => {
    setShowMessage('Would you like to use your ability?');
    setShowScreenVariant('text');
    setShowScreenOpen(true);
  }, []);

  const handleShowMessage = useCallback(
    (message: ShowToPlayerMessage) => {
      onMarkMessageShown?.(message.id);
      setShowMessage(message.text);
      setShowScreenVariant('text');
      setShowScreenOpen(true);
    },
    [onMarkMessageShown],
  );

  const handleTemplateSelect = useCallback(
    (template: ShowToPlayerTemplate) => {
      if (playerId === undefined) return;
      onAddMessage?.(playerId, template.text, template.id);
      onBumpTemplateUsage?.(template.id);
      setShowMessage(template.text);
      setShowScreenVariant('text');
      setShowScreenOpen(true);
    },
    [onAddMessage, onBumpTemplateUsage, playerId],
  );

  const handleAddMessage = useCallback(() => {
    if (playerId === undefined) return;
    const text = composeText.trim();
    if (!text) return;
    onAddMessage?.(playerId, text);
    setComposeText('');
  }, [composeText, onAddMessage, playerId]);

  const handleSaveEdit = useCallback(
    (messageId: string) => {
      const text = editingText.trim();
      if (!text) return;
      onEditMessage?.(messageId, text);
      setEditingMessageId(null);
      setEditingText('');
    },
    [editingText, onEditMessage],
  );

  const title = playerName
    ? `Show ${playerName}`
    : displaySeat
      ? `Show Seat ${displaySeat}`
      : 'Show Player';

  return (
    <>
      <Drawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        data-testid="player-show-drawer"
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: '84vh',
            bgcolor: '#1a1a2e',
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1.5, pb: 0.5 }}>
          <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.3)' }} />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', px: 2, pb: 1 }}>
          <VisibilityIcon sx={{ color: 'rgba(255,255,255,0.7)', mr: 1 }} />
          <Typography variant="h6" sx={{ color: '#fff', flexGrow: 1, fontWeight: 700 }}>
            {title}
          </Typography>
          <IconButton
            aria-label="Close show drawer"
            onClick={onClose}
            size="small"
            sx={{ color: 'rgba(255,255,255,0.5)' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <Stack spacing={2} sx={{ px: 2, pb: 3, overflowY: 'auto' }}>
          {hasBluffs && (
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FullscreenIcon />}
              onClick={handleShowBluffs}
              data-testid="show-bluffs-btn"
              sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
            >
              Show {bluffLabel}
            </Button>
          )}

          {characterDef?.oncePerGame && (
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FullscreenIcon />}
              onClick={handleShowOncePerGamePrompt}
              data-testid="show-once-per-game-prompt-btn"
              sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
            >
              Ask to use ability
            </Button>
          )}

          <Box>
            <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 700, mb: 1 }}>
              Active messages
            </Typography>
            {activeMessages.length === 0 ? (
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                No active messages for this player.
              </Typography>
            ) : (
              <Stack spacing={1}>
                {activeMessages.map((message) => {
                  const isPinned = message.templateId
                    ? pinnedTemplateIds.has(message.templateId)
                    : false;
                  return (
                    <Box
                      key={message.id}
                      data-testid="show-message-card"
                      sx={{
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: 2,
                        p: 1.25,
                        bgcolor: 'rgba(255,255,255,0.04)',
                      }}
                    >
                      {editingMessageId === message.id ? (
                        <Stack spacing={1}>
                          <TextField
                            value={editingText}
                            onChange={(event) => setEditingText(event.target.value)}
                            multiline
                            minRows={2}
                            size="small"
                            inputProps={{ 'aria-label': 'Edit show message' }}
                          />
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleSaveEdit(message.id)}
                          >
                            Save
                          </Button>
                        </Stack>
                      ) : (
                        <>
                          <Typography sx={{ color: '#fff', mb: 1 }}>{message.text}</Typography>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                            <Button size="small" onClick={() => handleShowMessage(message)}>
                              Re-show
                            </Button>
                            <IconButton
                              aria-label="Edit message"
                              size="small"
                              onClick={() => {
                                setEditingMessageId(message.id);
                                setEditingText(message.text);
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              aria-label="Clone message"
                              size="small"
                              onClick={() =>
                                playerId !== undefined && onAddMessage?.(playerId, message.text)
                              }
                            >
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              aria-label="Delete message"
                              size="small"
                              onClick={() => onDeleteMessage?.(message.id)}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                            {isPinned && message.templateId ? (
                              <IconButton
                                aria-label="Unpin template"
                                size="small"
                                onClick={() => onUnpinTemplate?.(message.templateId ?? '')}
                              >
                                <PushPinIcon fontSize="small" color="primary" />
                              </IconButton>
                            ) : (
                              <IconButton
                                aria-label="Pin template"
                                size="small"
                                onClick={() => onPinTemplate?.(message.text, 'script', scriptId)}
                              >
                                <PushPinIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Stack>
                        </>
                      )}
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Box>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

          <Box>
            <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 700, mb: 1 }}>
              Pinned templates
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {pinnedTemplates.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                  Pin a message to keep it here.
                </Typography>
              ) : (
                pinnedTemplates.map((template) => (
                  <Chip
                    key={template.id}
                    label={template.text}
                    onClick={() => handleTemplateSelect(template)}
                    onDelete={() => onUnpinTemplate?.(template.id)}
                    color="primary"
                    variant="outlined"
                  />
                ))
              )}
            </Stack>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 700, mb: 1 }}>
              Recent templates
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {rankedTemplates.slice(0, 8).map((template) => (
                <Chip
                  key={template.id}
                  label={template.text}
                  onClick={() => handleTemplateSelect(template)}
                  variant="outlined"
                  sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.24)' }}
                />
              ))}
            </Stack>
          </Box>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

          <Box>
            <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 700, mb: 1 }}>
              Compose
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={2}
              maxRows={4}
              value={composeText}
              onChange={(event) => setComposeText(event.target.value)}
              placeholder="Type a message to show this player…"
              data-testid="show-message-compose"
              sx={{
                mb: 1,
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                },
                '& .MuiInputBase-input::placeholder': { color: 'rgba(255,255,255,0.4)' },
              }}
            />
            <Button
              fullWidth
              variant="contained"
              onClick={handleAddMessage}
              disabled={playerId === undefined || !composeText.trim()}
              data-testid="add-show-message-btn"
            >
              Add Message
            </Button>
          </Box>
        </Stack>
      </Drawer>

      <PlayerShowScreen
        open={showScreenOpen}
        onClose={() => setShowScreenOpen(false)}
        variant={showScreenVariant}
        bluffCharacters={bluffCharacters}
        message={showMessage}
      />
    </>
  );
}
