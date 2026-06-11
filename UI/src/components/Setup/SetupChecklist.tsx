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

import { useCallback, useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import FormControlLabel from '@mui/material/FormControlLabel';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import NightlightRoundIcon from '@mui/icons-material/NightlightRound';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import type {
  Participant,
  Player,
  PlayerGameState,
  PlayerId,
  PlayerToken,
  ReminderToken,
} from '@/types/index.ts';
import { getCharacter } from '@/data/characters/index.ts';
import { NightChoiceSelector } from '@/components/NightPhase/NightChoiceSelector.tsx';
import type { NightOrderPlayer } from '@/utils/nightOrderFilter.ts';
import { buildChecklistItems, type SetupChecklistItem } from './buildChecklistItems.ts';

// ── Types ──

export interface SetupChecklistProps {
  /** Current game ID — used for localStorage key. */
  gameId: string;
  /** Players participating in this game. */
  participants: Participant[];
  /** Per-player state keyed by PlayerId. */
  playerState: Record<PlayerId, PlayerGameState>;
  /** Session roster used for player names. */
  sessionPlayers: Player[];
  /** IDs of in-play characters. */
  inPlayCharacterIds: string[];
  /** Script character IDs (for modifier/requirement detection). */
  scriptCharacterIds: string[];
  /** Callback when "Start Night 1" is clicked. */
  onStartNight: () => void;
  /** Place a reminder token on a player using the canonical game token store. */
  onAddToken?: (playerId: PlayerId, token: PlayerToken) => void;
  /** Remove a reminder token from a player using the canonical game token store. */
  onRemoveToken?: (playerId: PlayerId, tokenId: string) => void;
}

// ── Helpers ──

const STORAGE_KEY_PREFIX = 'storyteller-setup-checklist-';

const CATEGORY_LABELS: Record<string, string> = {
  setup: '⚙️ Setup Decisions',
  modifier: '📊 Distribution Modifiers',
  required: '⚠️ Required Characters',
  prompt: '📋 Setup Prompts',
  reminder: '🏷️ Reminder Placements',
};

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

function reminderToPlayerToken(reminder: ReminderToken): PlayerToken {
  return {
    id: reminder.id,
    type: 'custom',
    label: reminder.text,
    ...(reminder.pickerScope ? { pickerScope: reminder.pickerScope } : {}),
    sourceCharacterId: reminder.sourceCharacterId,
  };
}

// ── Component ──

export function SetupChecklist({
  gameId,
  participants,
  playerState,
  sessionPlayers,
  inPlayCharacterIds,
  scriptCharacterIds,
  onStartNight,
  onAddToken,
  onRemoveToken,
}: SetupChecklistProps) {
  const [checkedState, setCheckedState] = useState<Record<string, boolean>>(() =>
    loadCheckedState(gameId),
  );

  // Persist checked state
  useEffect(() => {
    saveCheckedState(gameId, checkedState);
  }, [gameId, checkedState]);

  const items = useMemo(
    () => buildChecklistItems(participants, playerState, inPlayCharacterIds, scriptCharacterIds),
    [participants, playerState, inPlayCharacterIds, scriptCharacterIds],
  );

  const sessionPlayerNameById = useMemo(() => {
    return new Map(sessionPlayers.map((player) => [player.id, player.name]));
  }, [sessionPlayers]);

  const playerOptions = useMemo<NightOrderPlayer[]>(() => {
    return participants
      .map((participant, index): NightOrderPlayer | null => {
        const state = playerState[participant.playerId];
        if (!state) return null;
        return {
          playerId: participant.playerId,
          playerName: sessionPlayerNameById.get(participant.playerId) ?? 'Unknown player',
          seat: index + 1,
          characterId: state.characterId,
          alive: state.alive,
          actualAlignment: state.actualAlignment,
          tokens: state.tokens,
          gainedAbility: state.gainedAbility,
        };
      })
      .filter((player): player is NightOrderPlayer => player !== null);
  }, [participants, playerState, sessionPlayerNameById]);

  const handleToggle = useCallback((itemId: string) => {
    setCheckedState((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  }, []);

  // All critical items must be checked to enable "Start Night 1"
  const criticalItems = useMemo(() => items.filter((item) => item.critical), [items]);
  const allCriticalChecked = criticalItems.every((item) => checkedState[item.id]);
  const allChecked = items.every((item) => checkedState[item.id]);
  const checkedCount = items.filter((item) => checkedState[item.id]).length;

  const reminderLookup = useMemo(() => {
    const lookup = new Map<string, ReminderToken>();
    for (const item of items) {
      if (!item.characterId) continue;
      const character = getCharacter(item.characterId);
      for (const reminder of character?.reminders ?? []) {
        lookup.set(reminder.id, reminder);
      }
    }
    return lookup;
  }, [items]);

  const tokenPlacements = useMemo(() => {
    const placements = new Map<string, NightOrderPlayer>();
    for (const player of playerOptions) {
      for (const token of player.tokens ?? []) {
        placements.set(token.id, player);
      }
    }
    return placements;
  }, [playerOptions]);

  const handleReminderPlacement = useCallback(
    (tokenId: string, playerName: string) => {
      const currentPlayer = tokenPlacements.get(tokenId);
      if (!playerName) {
        if (currentPlayer) onRemoveToken?.(currentPlayer.playerId, tokenId);
        return;
      }
      const reminder = reminderLookup.get(tokenId);
      const selectedPlayer = playerOptions.find((player) => player.playerName === playerName);
      if (!reminder || !selectedPlayer) return;
      onAddToken?.(selectedPlayer.playerId, reminderToPlayerToken(reminder));
    },
    [onAddToken, onRemoveToken, playerOptions, reminderLookup, tokenPlacements],
  );

  const groupedItems = useMemo(() => {
    return items.reduce<Record<string, SetupChecklistItem[]>>((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});
  }, [items]);

  if (items.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          No setup steps required — ready to start!
        </Typography>
        <Button variant="contained" startIcon={<NightlightRoundIcon />} onClick={onStartNight}>
          Start Night 1 →
        </Button>
      </Box>
    );
  }

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

      {Object.entries(groupedItems).map(([category, categoryItems]) => (
        <Paper key={category} elevation={1} sx={{ mb: 1.5, p: 1.5, bgcolor: 'background.default' }}>
          <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 700 }}>
            {CATEGORY_LABELS[category] ?? category}
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
                    {item.reminderTokenIds && item.reminderTokenIds.length > 0 && (
                      <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {
                            item.reminderTokenIds.filter((tokenId) => tokenPlacements.has(tokenId))
                              .length
                          }
                          /{item.reminderTokenIds.length} placed
                        </Typography>
                        {item.reminderTokenIds.map((tokenId) => {
                          const reminder = reminderLookup.get(tokenId);
                          const placedPlayer = tokenPlacements.get(tokenId);
                          if (!reminder) return null;
                          return (
                            <NightChoiceSelector
                              key={tokenId}
                              type="player"
                              value={placedPlayer?.playerName ?? ''}
                              onChange={(value) => {
                                if (Array.isArray(value)) return;
                                handleReminderPlacement(tokenId, value);
                              }}
                              players={playerOptions}
                              label={reminder.text}
                              readOnly={!onAddToken && !onRemoveToken}
                              emptyOptionLabel="Unassigned"
                              characterLookup={getCharacter}
                            />
                          );
                        })}
                      </Box>
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
