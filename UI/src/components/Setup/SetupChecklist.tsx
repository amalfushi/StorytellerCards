/**
 * SetupChecklist — dynamic pre-game setup checklist.
 *
 * Generates checklist items from the current game state:
 * - Characters with `setup: true` that need ST decisions
 * - Characters with `storytellerSetup` steps
 * - Distribution modifiers applied (confirmation)
 * - Required character warnings (e.g. Choirboy → King)
 * - Global reminder placements needed (Marionette, Drunk, etc.)
 *
 * Items are checkable with state persistence via localStorage.
 * Includes a "Start Night 1 →" button at the bottom.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import FormControlLabel from '@mui/material/FormControlLabel';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import NightlightRoundIcon from '@mui/icons-material/NightlightRound';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import type { PlayerSeat } from '@/types/index.ts';
import { buildChecklistItems, type SetupChecklistItem } from './buildChecklistItems.ts';

// ── Types ──

export interface SetupChecklistProps {
  /** Current game ID — used for localStorage key. */
  gameId: string;
  /** Players with assigned characters. */
  players: PlayerSeat[];
  /** IDs of in-play characters. */
  inPlayCharacterIds: string[];
  /** Script character IDs (for modifier/requirement detection). */
  scriptCharacterIds: string[];
  /** Callback when "Start Night 1" is clicked. */
  onStartNight: () => void;
  /** Callback when the Storyteller opens the quick reseat tool. */
  onReseat?: () => void;
}

// ── Helpers ──

const STORAGE_KEY_PREFIX = 'storyteller-setup-checklist-';

function loadCheckedState(gameId: string): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${gameId}`);
    if (raw) return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    // Ignore
  }
  return {};
}

function saveCheckedState(gameId: string, state: Record<string, boolean>): void {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${gameId}`, JSON.stringify(state));
  } catch {
    // Storage full
  }
}

// ── Item generation ──
// `buildChecklistItems` lives in `./buildChecklistItems.ts` and is re-imported above.

// ── Component ──

export function SetupChecklist({
  gameId,
  players,
  inPlayCharacterIds,
  scriptCharacterIds,
  onStartNight,
  onReseat,
}: SetupChecklistProps) {
  const [checkedState, setCheckedState] = useState<Record<string, boolean>>(() =>
    loadCheckedState(gameId),
  );

  // Persist checked state
  useEffect(() => {
    saveCheckedState(gameId, checkedState);
  }, [gameId, checkedState]);

  const items = useMemo(
    () => buildChecklistItems(players, inPlayCharacterIds, scriptCharacterIds),
    [players, inPlayCharacterIds, scriptCharacterIds],
  );

  const handleToggle = useCallback((itemId: string) => {
    setCheckedState((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  }, []);

  // All critical items must be checked to enable "Start Night 1"
  const criticalItems = items.filter((item) => item.critical);
  const allCriticalChecked = criticalItems.every((item) => checkedState[item.id]);
  const allChecked = items.every((item) => checkedState[item.id]);
  const checkedCount = items.filter((item) => checkedState[item.id]).length;

  if (items.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          No setup steps required — ready to start!
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
          {onReseat && (
            <Button variant="outlined" size="small" onClick={onReseat}>
              Reseat
            </Button>
          )}
          <Button variant="contained" startIcon={<NightlightRoundIcon />} onClick={onStartNight}>
            Start Night 1 →
          </Button>
        </Box>
      </Box>
    );
  }

  const categoryLabels: Record<string, string> = {
    setup: '⚙️ Setup Decisions',
    modifier: '📊 Distribution Modifiers',
    required: '⚠️ Required Characters',
    prompt: '📋 Setup Prompts',
    reminder: '🏷️ Reminder Placements',
  };

  // Group items by category
  const groupedItems = items.reduce<Record<string, SetupChecklistItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <Box sx={{ p: 2 }} data-testid="setup-checklist">
      <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
        Pre-Game Setup
        <Chip
          label={`${checkedCount}/${items.length}`}
          size="small"
          color={allChecked ? 'success' : 'default'}
          sx={{ ml: 1 }}
        />
      </Typography>
      {onReseat && (
        <Button variant="outlined" size="small" onClick={onReseat} sx={{ mb: 1 }}>
          Reseat
        </Button>
      )}

      {Object.entries(groupedItems).map(([category, categoryItems]) => (
        <Paper key={category} elevation={1} sx={{ mb: 1.5, p: 1.5, bgcolor: 'background.default' }}>
          <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 700 }}>
            {categoryLabels[category] ?? category}
          </Typography>
          {categoryItems.map((item) => (
            <Box key={item.id} sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!checkedState[item.id]}
                    onChange={() => handleToggle(item.id)}
                    size="small"
                  />
                }
                label={
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        textDecoration: checkedState[item.id] ? 'line-through' : 'none',
                        color: checkedState[item.id] ? 'text.disabled' : 'text.primary',
                      }}
                    >
                      {item.label}
                      {item.critical && !checkedState[item.id] && (
                        <WarningAmberIcon
                          sx={{
                            fontSize: 14,
                            ml: 0.5,
                            verticalAlign: 'text-bottom',
                            color: 'warning.main',
                          }}
                        />
                      )}
                    </Typography>
                    {item.description && (
                      <Typography
                        variant="caption"
                        sx={{ color: 'text.secondary', display: 'block' }}
                      >
                        {item.description}
                      </Typography>
                    )}
                  </Box>
                }
                sx={{ alignItems: 'flex-start', mr: 0, width: '100%' }}
              />
            </Box>
          ))}
        </Paper>
      ))}

      <Box sx={{ mt: 2, textAlign: 'center' }}>
        {!allCriticalChecked && criticalItems.length > 0 && (
          <Typography variant="caption" color="warning.main" sx={{ display: 'block', mb: 1 }}>
            Complete all critical items (⚠️) before starting Night 1
          </Typography>
        )}
        <Button
          variant="contained"
          size="large"
          startIcon={<NightlightRoundIcon />}
          onClick={onStartNight}
          disabled={!allCriticalChecked && criticalItems.length > 0}
          sx={{ minWidth: 200 }}
        >
          Start Night 1 →
        </Button>
      </Box>
    </Box>
  );
}
