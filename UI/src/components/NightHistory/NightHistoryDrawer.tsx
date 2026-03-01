import { useState } from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import NotesIcon from '@mui/icons-material/Notes';
import type { NightHistoryEntry } from '@/types/index.ts';
import { useGame } from '@/context/GameContext.tsx';
import { getNightSummary } from '@/utils/nightHistoryUtils.ts';
import { NightHistoryReview } from './NightHistoryReview.tsx';

export interface NightHistoryDrawerProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Side drawer that lists all completed night history entries.
 * Tapping an entry opens the {@link NightHistoryReview} full-screen overlay.
 */
export function NightHistoryDrawer({ open, onClose }: NightHistoryDrawerProps) {
  const { state } = useGame();
  const nightHistory: NightHistoryEntry[] = state.game?.nightHistory ?? [];

  const [reviewEntry, setReviewEntry] = useState<NightHistoryEntry | null>(null);
  const [reviewIndex, setReviewIndex] = useState<number>(-1);

  const formatTime = (iso: string): string => {
    try {
      return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: { xs: '85vw', sm: 360 },
            background: 'linear-gradient(180deg, #0d1117 0%, #161b22 100%)',
            color: '#e6edf3',
          },
        }}
      >
        {/* ── Header ── */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1.5,
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            📜 Night History
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* ── Content ── */}
        {nightHistory.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.4)' }}>
              No nights completed yet
            </Typography>
          </Box>
        ) : (
          <List disablePadding sx={{ overflow: 'auto', flex: 1 }}>
            {nightHistory.map((entry, idx) => {
              const { totalSubActions, completedSubActions, hasNotes } = getNightSummary(entry);
              const label = entry.isFirstNight
                ? `Night ${entry.dayNumber} — First Night`
                : `Night ${entry.dayNumber}`;

              return (
                <ListItemButton
                  key={idx}
                  onClick={() => {
                    setReviewEntry(entry);
                    setReviewIndex(idx);
                  }}
                  sx={{
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.04)' },
                    py: 1.5,
                    px: 2,
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <EditIcon sx={{ fontSize: 18, color: 'rgba(255,255,255,0.35)' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={label}
                    secondary={
                      <Box
                        component="span"
                        sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}
                      >
                        <Typography
                          variant="caption"
                          component="span"
                          sx={{ color: 'rgba(255,255,255,0.5)' }}
                        >
                          Completed at {formatTime(entry.completedAt)}
                        </Typography>
                        <Box
                          component="span"
                          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                        >
                          <Typography
                            variant="caption"
                            component="span"
                            sx={{
                              color:
                                completedSubActions === totalSubActions
                                  ? '#4caf50'
                                  : 'rgba(255,255,255,0.5)',
                            }}
                          >
                            {completedSubActions}/{totalSubActions} sub-actions completed
                          </Typography>
                          {hasNotes && (
                            <NotesIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }} />
                          )}
                        </Box>
                      </Box>
                    }
                    primaryTypographyProps={{
                      sx: { fontWeight: 600, color: '#e6edf3', fontSize: '0.95rem' },
                    }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        )}
      </Drawer>

      {/* ── Review overlay (now editable) ── */}
      {reviewEntry && (
        <NightHistoryReview
          historyEntry={reviewEntry}
          historyIndex={reviewIndex}
          isFirstNight={reviewEntry.isFirstNight}
          open={true}
          onClose={() => setReviewEntry(null)}
        />
      )}
    </>
  );
}
