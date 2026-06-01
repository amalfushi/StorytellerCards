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
import type { CharacterDef, PlayerSeat } from '@/types/index.ts';
import { getCharacter } from '@/data/characters/index.ts';
import { getSetupModifiers } from '@/utils/setupModifiers.ts';
import { getRequiredCharacters, getSetupPrompts } from '@/utils/requiredCharacters.ts';

// ── Types ──

export interface SetupChecklistItem {
  /** Unique ID for this checklist item. */
  id: string;
  /** Display label. */
  label: string;
  /** Optional description with more detail. */
  description?: string;
  /** Whether this item blocks starting Night 1. */
  critical: boolean;
  /** Category for grouping. */
  category: 'setup' | 'modifier' | 'required' | 'reminder' | 'prompt';
}

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

/**
 * Build checklist items from the current game state.
 */
export function buildChecklistItems(
  players: PlayerSeat[],
  inPlayCharacterIds: string[],
  scriptCharacterIds: string[],
): SetupChecklistItem[] {
  const items: SetupChecklistItem[] = [];

  // Resolve in-play character defs
  const inPlayChars: CharacterDef[] = [];
  for (const id of inPlayCharacterIds) {
    const def = getCharacter(id);
    if (def) inPlayChars.push(def);
  }

  // 1. Characters with storytellerSetup steps
  for (const char of inPlayChars) {
    if (char.storytellerSetup) {
      for (const step of char.storytellerSetup) {
        items.push({
          id: `setup-${char.id}-${step.id}`,
          label: `${char.name}: ${step.description}`,
          critical: true,
          category: 'setup',
        });
      }
    }
  }

  // 2. Characters with setup: true that may need ST decisions (no storytellerSetup but have setup flag)
  for (const char of inPlayChars) {
    if (char.setup && !char.storytellerSetup?.length && !char.setupModification) {
      items.push({
        id: `setup-flag-${char.id}`,
        label: `${char.name}: Confirm setup requirements`,
        description: char.abilityShort,
        critical: false,
        category: 'setup',
      });
    }
  }

  // 3. Distribution modifiers
  const modifiers = getSetupModifiers(inPlayCharacterIds);
  for (const mod of modifiers) {
    items.push({
      id: `modifier-${mod.characterId}`,
      label: `${mod.characterName}: ${mod.description}`,
      description: 'Confirm distribution has been adjusted',
      critical: false,
      category: 'modifier',
    });
  }

  // 4. Required character warnings
  const required = getRequiredCharacters(scriptCharacterIds);
  for (const req of required) {
    // Only flag if the required character is also not in the in-play set
    if (!inPlayCharacterIds.includes(req.requiredCharacterId)) {
      items.push({
        id: `required-${req.sourceCharacterId}-${req.requiredCharacterId}`,
        label: `${req.sourceCharacterName} requires ${req.requiredCharacterName}`,
        description: req.reason,
        critical: true,
        category: 'required',
      });
    }
  }

  // 5. Setup prompts (e.g. Bounty Hunter)
  const prompts = getSetupPrompts(inPlayCharacterIds);
  for (const prompt of prompts) {
    items.push({
      id: `prompt-${prompt.characterId}`,
      label: `${prompt.characterName}: ${prompt.prompt}`,
      critical: true,
      category: 'prompt',
    });
  }

  // 6. Global reminder placements needed
  for (const char of inPlayChars) {
    if (char.remindersGlobal && char.remindersGlobal.length > 0) {
      // Check if any player has had the apparent character set (for Marionette/Drunk)
      const hasApparentAssignment = players.some(
        (p) => p.characterId === char.id && p.apparentCharacterId,
      );
      if (!hasApparentAssignment) {
        items.push({
          id: `reminder-global-${char.id}`,
          label: `Place "${char.remindersGlobal[0].text}" reminder for ${char.name}`,
          description: `Global reminder token for ${char.name}`,
          critical: false,
          category: 'reminder',
        });
      }
    }
  }

  return items;
}

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
