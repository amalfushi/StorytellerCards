import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PersonIcon from '@mui/icons-material/Person';
import type { NightOrderEntry, PlayerSeat, CharacterDef, ActiveJinx } from '@/types/index.ts';
import { getCharacterTypeColor } from '@/components/common/characterTypeColor.ts';
import { CharacterDetailModal } from '@/components/common/CharacterDetailModal.tsx';
import { CharacterIconImage } from '@/components/common/CharacterIconImage.tsx';
import { ReminderTokenChips } from '@/components/common/ReminderTokenChips.tsx';
import { ReminderTokenChip } from '@/components/common/ReminderTokenChip.tsx';
import { getAlignmentBorderColor, getCharacterIconPath } from '@/utils/characterIcon.ts';
import { parseReminderMarkers, hasReminderMarkers } from '@/utils/reminderUtils.ts';
import { detectSignalType } from '@/utils/signalDetection.ts';
import { SubActionChecklist } from './SubActionChecklist.tsx';
import { NightChoiceSelector } from './NightChoiceSelector.tsx';
import { PlayerShowScreen } from './PlayerShowScreen.tsx';

export interface NightFlashcardProps {
  entry: NightOrderEntry;
  playerSeat?: PlayerSeat;
  characterDef?: CharacterDef;
  checkedStates: boolean[];
  notes: string;
  onToggleSubAction: (index: number) => void;
  onNotesChange: (notes: string) => void;
  isDead: boolean;
  readOnly?: boolean;
  /** All players in the game (for choice dropdowns). */
  players?: PlayerSeat[];
  /** All script characters (for character choice dropdown). */
  scriptCharacters?: CharacterDef[];
  /** Current selection value for this character's choice. */
  selectionValue?: string | string[];
  /** Callback when selection changes. */
  onSelectionChange?: (value: string | string[]) => void;
  /** Previous night's selection for context display. */
  previousSelection?: string | string[];
  /** Active jinxes for the current character. */
  activeJinxes?: ActiveJinx[];
  /** Lookup function for character definitions (used for inline icons in dropdowns). */
  characterLookup?: (id: string) => CharacterDef | undefined;
  /** Previous night's notes for pre-population. */
  previousNotes?: string;
  /** Callback when a reminder token is clicked (navigates to Day view). */
  onReminderTokenClick?: (tokenText: string) => void;
  /** Lunatic bluff character definitions (shown on Lunatic's first-night card). */
  lunaticBluffCharacters?: CharacterDef[];
  /** Demon bluff character definitions (shown for demon characters). */
  demonBluffCharacters?: CharacterDef[];
  /** Callback to open the Show Player drawer (triggered by FAB moved to card). */
  onOpenShowDrawer?: () => void;
}

/**
 * Full flashcard for a character's night action.
 *
 * Shows the character icon placeholder, name, type chip, player info,
 * sub-action checklist, and a notes field.
 */
export function NightFlashcard({
  entry,
  playerSeat,
  characterDef,
  checkedStates,
  notes,
  onToggleSubAction,
  onNotesChange,
  isDead,
  readOnly = false,
  players = [],
  scriptCharacters = [],
  selectionValue,
  onSelectionChange,
  previousSelection,
  activeJinxes = [],
  characterLookup,
  previousNotes,
  onReminderTokenClick,
  lunaticBluffCharacters,
  demonBluffCharacters: _demonBluffCharacters,
  onOpenShowDrawer,
}: NightFlashcardProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [choiceShowMessage, setChoiceShowMessage] = useState<string | null>(null);
  const typeColor = characterDef ? getCharacterTypeColor(characterDef.type) : '#9e9e9e';

  const typeName = characterDef?.type ?? 'Unknown';

  // Get explicit choices from the character definition's night action
  const parsedChoices = useMemo(() => {
    const nightAction = characterDef
      ? characterDef.firstNight?.order === entry.order
        ? characterDef.firstNight
        : characterDef.otherNights?.order === entry.order
          ? characterDef.otherNights
          : null
      : null;

    if (nightAction?.choices && nightAction.choices.length > 0) {
      return nightAction.choices.map((c) => ({
        type: c.type,
        multiple: c.maxSelections > 1,
        maxSelections: c.maxSelections,
        label: c.label,
      }));
    }

    return [];
  }, [characterDef, entry.order]);

  const isCompound = parsedChoices.length > 1;

  // Parse :reminder: markers in help text
  const reminderSegments = useMemo(() => {
    const reminders = characterDef?.reminders ?? [];
    if (reminders.length > 0 && hasReminderMarkers(entry.helpText)) {
      return parseReminderMarkers(entry.helpText, reminders);
    }
    return null;
  }, [characterDef, entry.helpText]);

  /**
   * For compound choices (e.g. player + character), we store values as an array
   * where each element corresponds to one selector's value.
   * For single choices, we keep the original string | string[] format.
   */
  const getCompoundValue = useCallback(
    (index: number): string | string[] => {
      if (!isCompound) {
        // Single choice — use selectionValue directly
        const choice = parsedChoices[0];
        if (!choice) return '';
        return selectionValue ?? (choice.multiple ? [] : '');
      }
      // Compound — selectionValue should be string[] with one entry per selector
      if (!Array.isArray(selectionValue)) return '';
      return (selectionValue[index] as string) ?? '';
    },
    [isCompound, parsedChoices, selectionValue],
  );

  const getCompoundPrev = useCallback(
    (index: number): string | string[] | undefined => {
      if (!isCompound) return previousSelection;
      if (!Array.isArray(previousSelection)) return undefined;
      return (previousSelection[index] as string) ?? undefined;
    },
    [isCompound, previousSelection],
  );

  const handleCompoundChange = useCallback(
    (index: number, value: string | string[]) => {
      if (!onSelectionChange) return;
      if (!isCompound) {
        onSelectionChange(value);
        return;
      }
      // Build new compound array
      const current = Array.isArray(selectionValue)
        ? [...selectionValue]
        : new Array(parsedChoices.length).fill('');
      // Ensure the array is large enough
      while (current.length < parsedChoices.length) current.push('');
      current[index] = value;
      onSelectionChange(current);
    },
    [onSelectionChange, isCompound, selectionValue, parsedChoices.length],
  );

  // For dead players, desaturate only the background — keep content fully readable
  const deadBgColor = 'rgba(40, 40, 45, 0.95)';
  const aliveBgColor = 'rgba(30, 30, 50, 0.95)';

  // Phase 3: Detect signal-type sub-actions for inline controls
  const signalInfos = useMemo(
    () => entry.subActions.map((sa) => detectSignalType(sa.description)),
    [entry.subActions],
  );

  // Phase 5: Pre-populate notes with previous night's notes (one-time)
  const hasPrepopulated = useRef(false);
  useEffect(() => {
    if (!hasPrepopulated.current && !readOnly && previousNotes && !notes) {
      hasPrepopulated.current = true;
      onNotesChange(previousNotes);
    }
  }, [previousNotes, notes, readOnly, onNotesChange]);

  // Phase 2: Build a map of placed reminder tokens → player info
  const placedReminders = useMemo(() => {
    if (!characterDef) return new Map<string, PlayerSeat>();
    const map = new Map<string, PlayerSeat>();
    for (const player of players) {
      for (const reminderId of player.activeReminders) {
        const token = characterDef.reminders.find((r) => r.id === reminderId);
        if (token) map.set(token.id, player);
      }
    }
    return map;
  }, [characterDef, players]);

  // Phase 4: Separate affecting tokens (from OTHER characters) from this character's tokens
  const affectingTokens = useMemo(
    () => (playerSeat ? playerSeat.tokens.filter((t) => t.sourceCharacterId !== entry.id) : []),
    [playerSeat, entry.id],
  );

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        bgcolor: isDead ? deadBgColor : aliveBgColor,
        boxShadow: isDead ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,0,0,0.5)',
        p: 2.5,
        mx: 1,
        minHeight: 0,
        flex: 1,
        overflow: 'auto',
        transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
      }}
    >
      {/* Desaturated background overlay for dead players */}
      {isDead && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            borderRadius: 3,
            background: 'rgba(0, 0, 0, 0.15)',
            filter: 'saturate(0.2)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}
      {/* Ghost badge for dead players */}
      {isDead && (
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            fontSize: '2rem',
            zIndex: 2,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
          }}
        >
          👻
        </Box>
      )}

      {/* Phase 4: Type chip → upper-left of content card */}
      <Box sx={{ position: 'absolute', top: 12, left: 12, zIndex: 2 }}>
        <Chip
          label={typeName}
          size="small"
          sx={{
            backgroundColor: isDead ? 'rgba(128,128,128,0.2)' : `${typeColor}33`,
            color: isDead ? 'rgba(200,200,200,0.7)' : typeColor,
            fontWeight: 600,
            borderColor: isDead ? 'rgba(200,200,200,0.3)' : typeColor,
            border: '1px solid',
            transition: 'background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease',
          }}
        />
      </Box>

      {/* Character icon + affecting tokens row */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mb: 2,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Phase 4: Character icon with affecting tokens to the right */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CharacterIconImage
            characterId={entry.id}
            characterName={entry.name}
            typeColor={typeColor}
            size={80}
            borderColor={getAlignmentBorderColor(
              playerSeat?.actualAlignment ?? characterDef?.defaultAlignment,
              typeColor,
            )}
            alignment={playerSeat?.actualAlignment ?? characterDef?.defaultAlignment}
            isDead={isDead}
            onClick={characterDef ? () => setDetailOpen(true) : undefined}
            sx={{ boxShadow: `0 0 20px ${typeColor}44` }}
          />
          {/* Phase 4: Active affecting tokens (from OTHER characters) → right of icon */}
          {affectingTokens.length > 0 && (
            <Box
              data-testid="affecting-tokens"
              sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}
            >
              <ReminderTokenChips tokens={affectingTokens} size="small" />
            </Box>
          )}
        </Box>

        {/* Character name */}
        <Typography
          variant="h5"
          sx={{
            fontWeight: 'bold',
            color: '#fff',
            textAlign: 'center',
            mt: 1.5,
            mb: 0.5,
          }}
        >
          {entry.name}
        </Typography>

        {/* Short ability description */}
        {characterDef?.abilityShort && (
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255,255,255,0.85)',
              textAlign: 'center',
              fontWeight: 'bold',
              mt: 0.5,
              px: 1,
              fontSize: '1rem',
              lineHeight: 1.4,
            }}
          >
            {characterDef.abilityShort}
          </Typography>
        )}

        {/* Inline reminder tokens when :reminder: markers are present */}
        {reminderSegments && (
          <Box
            data-testid="reminder-segments"
            sx={{
              mt: 1.5,
              p: 1.5,
              borderRadius: 1.5,
              bgcolor: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <Typography
              component="div"
              variant="body2"
              sx={{
                color: 'rgba(255,255,255,0.85)',
                lineHeight: 2,
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              {reminderSegments.map((seg, i) =>
                seg.type === 'text' ? (
                  <span key={i}>{seg.value}</span>
                ) : (
                  <ReminderTokenChip
                    key={`reminder-${seg.index}`}
                    token={{
                      id: seg.token.id,
                      label: seg.token.text,
                      sourceCharacterId: seg.token.sourceCharacterId,
                    }}
                    size="small"
                  />
                ),
              )}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Player info */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          mb: 1.5,
          px: 0.5,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <PersonIcon sx={{ fontSize: 18, color: 'rgba(255,255,255,0.6)' }} />
        {playerSeat ? (
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>
            {playerSeat.playerName} (Seat {playerSeat.seat})
          </Typography>
        ) : (
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
            Unassigned
          </Typography>
        )}
      </Box>

      {/* Lunatic bluff display (only on lunatic first-night card when bluffs are set) */}
      {lunaticBluffCharacters && lunaticBluffCharacters.length > 0 && (
        <Box
          data-testid="lunatic-bluffs"
          sx={{
            width: '100%',
            mt: 1,
            mb: 1.5,
            p: 1.5,
            borderRadius: 2,
            bgcolor: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              color: '#42a5f5',
              fontWeight: 700,
              mb: 1,
              textAlign: 'center',
            }}
          >
            Show these bluffs to the Lunatic
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            {lunaticBluffCharacters.map((ch) => (
              <Box
                key={ch.id}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 0.5,
                }}
                data-testid={`bluff-display-${ch.id}`}
              >
                <Avatar
                  src={getCharacterIconPath(ch.id)}
                  alt={ch.name}
                  sx={{
                    width: 48,
                    height: 48,
                    border: `2px solid ${getCharacterTypeColor(ch.type)}`,
                    bgcolor: 'rgba(0,0,0,0.3)',
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: getCharacterTypeColor(ch.type),
                    fontWeight: 600,
                    textAlign: 'center',
                    maxWidth: 80,
                    lineHeight: 1.2,
                  }}
                >
                  {ch.name}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      <Divider
        sx={{ borderColor: 'rgba(255,255,255,0.12)', mb: 1, position: 'relative', zIndex: 1 }}
      />

      {/* Jinx reminder banners */}
      {activeJinxes.length > 0 && (
        <Box sx={{ mb: 1, position: 'relative', zIndex: 1 }} data-testid="jinx-reminder">
          {activeJinxes.map((jinx) => (
            <Box
              key={`${jinx.character1Id}-${jinx.character2Id}`}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 0.75,
                p: 1,
                mb: 0.5,
                borderRadius: 1.5,
                bgcolor: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
              }}
            >
              <Typography sx={{ fontSize: '1rem', lineHeight: 1.4, flexShrink: 0 }}>⚡</Typography>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 700, color: '#f59e0b', lineHeight: 1.3 }}
                >
                  Jinx: {jinx.character2Name}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: 'rgba(255,255,255,0.75)', display: 'block', lineHeight: 1.3 }}
                >
                  {jinx.description}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Phase 4: Available reminder tokens → below separator, above checklist */}
      {!reminderSegments && characterDef && characterDef.reminders.length > 0 && (
        <Box
          data-testid="reminder-tokens"
          sx={{
            mb: 1,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 0.5,
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', mr: 0.5 }}>
            Reminders:
          </Typography>
          {characterDef.reminders.map((r) => {
            const placedOn = placedReminders.get(r.id);
            const placedCharDef =
              placedOn?.characterId && characterLookup
                ? characterLookup(placedOn.characterId)
                : undefined;
            const placedText = placedOn
              ? `${placedOn.playerName}${placedCharDef ? ` (${placedCharDef.name})` : ''}`
              : undefined;
            return (
              <ReminderTokenChip
                key={r.id}
                token={{ id: r.id, label: r.text, sourceCharacterId: r.sourceCharacterId }}
                size="small"
                placed={!!placedOn}
                placedInfo={placedText}
                sourceName={placedText ?? r.text}
                onClick={onReminderTokenClick ? () => onReminderTokenClick(r.text) : undefined}
              />
            );
          })}
        </Box>
      )}

      {/* Sub-action checklist + choice selectors + signal controls */}
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', position: 'relative', zIndex: 1 }}>
        <SubActionChecklist
          subActions={entry.subActions}
          checkedStates={checkedStates}
          onToggle={onToggleSubAction}
          readOnly={readOnly}
        />

        {/* Phase 3: Signal recording controls — inline after sub-actions */}
        {signalInfos.some((s) => s !== 'none') && (
          <Box data-testid="signal-controls" sx={{ mt: 1 }}>
            {signalInfos.map((signalType, idx) => {
              if (signalType === 'none') return null;
              const signalKey = `${entry.id}__signal__${idx}`;
              const currentSignal =
                typeof selectionValue === 'object' && !Array.isArray(selectionValue) ? '' : '';
              // Signal values are stored as selections with a special key prefix
              const storedSignal = (() => {
                // Look up signal from compound selection array or direct selection
                if (typeof selectionValue === 'string' && selectionValue.startsWith('signal:')) {
                  return selectionValue.replace('signal:', '');
                }
                return '';
              })();

              if (signalType === 'finger') {
                return (
                  <Box key={signalKey} sx={{ mt: 1 }}>
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                      <InputLabel
                        id={`signal-finger-${idx}`}
                        sx={{ color: 'rgba(255,255,255,0.6)' }}
                      >
                        Finger signal
                      </InputLabel>
                      <Select
                        labelId={`signal-finger-${idx}`}
                        value={storedSignal || currentSignal}
                        label="Finger signal"
                        disabled={readOnly}
                        onChange={(e) => {
                          onSelectionChange?.(`signal:${e.target.value}`);
                        }}
                        sx={{
                          color: 'rgba(255,255,255,0.9)',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255,255,255,0.2)',
                          },
                        }}
                      >
                        <MenuItem value="">
                          <em>None</em>
                        </MenuItem>
                        {[0, 1, 2, 3, 4, 5].map((n) => (
                          <MenuItem key={n} value={String(n)}>
                            {n === 5 ? '5+' : String(n)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                );
              }

              if (signalType === 'thumbsUpDown') {
                return (
                  <Box key={signalKey} sx={{ mt: 1 }}>
                    <Typography
                      variant="caption"
                      sx={{ color: 'rgba(255,255,255,0.5)', mb: 0.5, display: 'block' }}
                    >
                      Signal
                    </Typography>
                    <ToggleButtonGroup
                      value={storedSignal || currentSignal}
                      exclusive
                      onChange={(_, val) => {
                        if (val !== null && !readOnly) {
                          onSelectionChange?.(`signal:${val}`);
                        }
                      }}
                      size="small"
                    >
                      <ToggleButton value="thumbsUp" sx={{ color: '#66bb6a' }}>
                        👍 Yes
                      </ToggleButton>
                      <ToggleButton value="thumbsDown" sx={{ color: '#ef5350' }}>
                        👎 No
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Box>
                );
              }

              return null;
            })}
          </Box>
        )}

        {/* Night choice selector(s) — directly below instruction steps */}
        {parsedChoices.length > 0 && onSelectionChange && (
          <Box>
            {parsedChoices.map((choice, idx) => {
              const isPlayerFacing =
                choice.type === 'player' ||
                choice.type === 'livingPlayer' ||
                choice.type === 'deadPlayer' ||
                choice.type === 'character';
              return (
                <Box
                  key={`${entry.id}-choice-${idx}`}
                  sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}
                >
                  <Box sx={{ flexGrow: 1 }}>
                    <NightChoiceSelector
                      type={choice.type}
                      multiple={choice.multiple}
                      maxSelections={choice.maxSelections}
                      value={getCompoundValue(idx)}
                      onChange={(v) => handleCompoundChange(idx, v)}
                      players={players}
                      characters={scriptCharacters}
                      previousValue={getCompoundPrev(idx)}
                      label={choice.label}
                      readOnly={readOnly}
                      characterLookup={characterLookup}
                    />
                  </Box>
                  {isPlayerFacing && (
                    <IconButton
                      size="small"
                      onClick={() => setChoiceShowMessage(choice.label)}
                      sx={{
                        mt: 2.5,
                        color: 'rgba(255,255,255,0.5)',
                        '&:hover': { color: 'rgba(255,255,255,0.8)' },
                      }}
                      aria-label={`Show "${choice.label}" fullscreen`}
                      data-testid={`choice-fullscreen-${idx}`}
                    >
                      <FullscreenIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              );
            })}
          </Box>
        )}
      </Box>

      {/* Show Player icon — right-aligned above the notes divider */}
      {!readOnly && onOpenShowDrawer && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', position: 'relative', zIndex: 1 }}>
          <IconButton
            size="small"
            onClick={onOpenShowDrawer}
            data-testid="show-player-btn"
            sx={{
              color: 'rgba(255,255,255,0.5)',
              '&:hover': { color: 'rgba(255,255,255,0.8)', bgcolor: 'rgba(255,255,255,0.08)' },
            }}
            aria-label="Show player"
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      <Divider
        sx={{
          borderColor: 'rgba(255,255,255,0.12)',
          mt: 1,
          mb: 1.5,
          position: 'relative',
          zIndex: 1,
        }}
      />

      {/* Phase 5: Notes field — subtle background, vertical growth */}
      <Box
        data-testid="notes-section"
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1,
          position: 'relative',
          zIndex: 1,
          bgcolor: 'rgba(255,255,255,0.06)',
          borderRadius: 1.5,
          p: 1,
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <Typography
          variant="body2"
          sx={{ color: 'rgba(255,255,255,0.5)', mt: 0.75, flexShrink: 0 }}
        >
          📝
        </Typography>
        <TextField
          placeholder={previousNotes ? 'Notes (pre-filled from last night)…' : 'Notes…'}
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          disabled={readOnly}
          multiline
          maxRows={6}
          size="small"
          fullWidth
          sx={{
            '& .MuiInputBase-root': {
              color: '#fff',
              fontSize: '0.85rem',
              maxHeight: '15vh',
              overflow: 'auto',
            },
            '& .MuiInputBase-root.Mui-disabled': {
              '-webkit-text-fill-color': '#fff',
            },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255,255,255,0.15)',
            },
            '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255,255,255,0.3)',
            },
            '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: typeColor,
            },
          }}
        />
      </Box>

      {/* Choice fullscreen overlay */}
      <PlayerShowScreen
        open={choiceShowMessage !== null}
        onClose={() => setChoiceShowMessage(null)}
        variant="text"
        message={choiceShowMessage ?? ''}
      />

      {/* Character Detail Modal */}
      <CharacterDetailModal
        open={detailOpen}
        character={characterDef ?? null}
        onClose={() => setDetailOpen(false)}
      />
    </Box>
  );
}
