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
import type { CharacterDef, ActiveJinx, PlayerToken } from '@/types/index.ts';
import type { NightOrderPlayer, NightOrderViewEntry } from '@/utils/nightOrderFilter.ts';
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
import {
  getTokenDisplayText,
  isCharacterIdentityToken,
  isSelectedYouToken,
} from '@/utils/infoTokenUtils.ts';

export interface NightFlashcardProps {
  entry: NightOrderViewEntry;
  playerSeat?: NightOrderPlayer;
  characterDef?: CharacterDef;
  checkedStates: boolean[];
  notes: string;
  onToggleSubAction: (index: number) => void;
  onNotesChange: (notes: string) => void;
  isDead: boolean;
  readOnly?: boolean;
  /** All players in the game (for choice dropdowns). */
  players?: NightOrderPlayer[];
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
  /** Callback when a reminder token is clicked. */
  onReminderTokenClick?: (
    token: import('@/types/index.ts').PlayerToken,
    event: React.MouseEvent<HTMLElement>,
  ) => void;
  /** Lunatic bluff character definitions (shown on Lunatic's first-night card). */
  lunaticBluffCharacters?: CharacterDef[];
  /** Demon bluff character definitions (shown for demon characters). */
  demonBluffCharacters?: CharacterDef[];
  /** Active setup powers whose reminders are globally available. */
  activeSetupPowers?: CharacterDef[];
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
  activeSetupPowers = [],
  onOpenShowDrawer,
}: NightFlashcardProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [choiceShowMessage, setChoiceShowMessage] = useState<string | null>(null);
  const [tokenShowPhrase, setTokenShowPhrase] = useState<string | null>(null);
  const [lunaticBluffsFullscreenOpen, setLunaticBluffsFullscreenOpen] = useState(false);
  const typeColor = characterDef ? getCharacterTypeColor(characterDef.type) : '#9e9e9e';
  const signalPrefix = 'signal:';

  const extractStoredSignal = useCallback((value: string | string[] | undefined): string => {
    if (typeof value === 'string')
      return value.startsWith(signalPrefix) ? value.slice(signalPrefix.length) : '';
    if (Array.isArray(value)) {
      const signalValue = value.find((item) => item.startsWith(signalPrefix));
      return signalValue ? signalValue.slice(signalPrefix.length) : '';
    }
    return '';
  }, []);

  const stripSignalValues = useCallback(
    (value: string[]): string[] => value.filter((item) => !item.startsWith(signalPrefix)),
    [],
  );

  const typeName = characterDef?.type ?? 'Unknown';

  const filterCharactersForChoice = useCallback(
    (filter?: string) => {
      if (!filter) return scriptCharacters;
      const inPlayIds = new Set(players.map((player) => player.characterId).filter(Boolean));
      switch (filter) {
        case 'townsfolk':
          return scriptCharacters.filter((character) => character.type === 'Townsfolk');
        case 'townsfolk-not-in-play-or-any-townsfolk':
          return scriptCharacters.filter((character) => character.type === 'Townsfolk');
        case 'minion-not-in-play':
          return scriptCharacters.filter(
            (character) => character.type === 'Minion' && !inPlayIds.has(character.id),
          );
        case 'good-not-in-play':
          return scriptCharacters.filter(
            (character) => character.defaultAlignment === 'Good' && !inPlayIds.has(character.id),
          );
        default:
          return scriptCharacters;
      }
    },
    [players, scriptCharacters],
  );

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
        filter: c.filter,
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
        // Single choice — use selectionValue directly, excluding stored signal answers.
        const choice = parsedChoices[0];
        if (!choice) return '';
        if (Array.isArray(selectionValue)) {
          const choiceValues = stripSignalValues(selectionValue);
          return choice.multiple ? choiceValues : (choiceValues[0] ?? '');
        }
        if (typeof selectionValue === 'string' && selectionValue.startsWith(signalPrefix)) {
          return choice.multiple ? [] : '';
        }
        return selectionValue ?? (choice.multiple ? [] : '');
      }
      // Compound — selectionValue should be string[] with one entry per selector
      if (!Array.isArray(selectionValue)) return '';
      return (selectionValue[index] as string) ?? '';
    },
    [isCompound, parsedChoices, selectionValue, stripSignalValues],
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
        const storedSignal = extractStoredSignal(selectionValue);
        if (storedSignal) {
          const valueWithoutSignal = Array.isArray(value) ? value : value ? [value] : [];
          onSelectionChange([...valueWithoutSignal, `${signalPrefix}${storedSignal}`]);
          return;
        }
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
    [extractStoredSignal, onSelectionChange, isCompound, selectionValue, parsedChoices.length],
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
  const availableReminderTokens = useMemo(() => {
    const tokensById = new Map<string, NonNullable<CharacterDef['reminders']>[number]>();
    for (const token of characterDef?.reminders ?? []) {
      tokensById.set(token.id, token);
    }
    for (const setupPower of activeSetupPowers.filter((power) => power.id === entry.id)) {
      for (const token of setupPower.reminders) {
        if (!tokensById.has(token.id)) tokensById.set(token.id, token);
      }
    }
    return Array.from(tokensById.values());
  }, [activeSetupPowers, characterDef, entry]);

  const placedReminders = useMemo(() => {
    const map = new Map<string, NightOrderPlayer>();
    for (const player of players) {
      for (const token of player.tokens ?? []) {
        if (availableReminderTokens.some((r) => r.id === token.id)) map.set(token.id, player);
      }
    }
    return map;
  }, [availableReminderTokens, players]);

  // Phase 4: Separate affecting tokens (from OTHER characters) from this character's tokens
  const affectingTokens = useMemo(
    () =>
      playerSeat ? (playerSeat.tokens ?? []).filter((t) => t.sourceCharacterId !== entry.id) : [],
    [playerSeat, entry.id],
  );

  // Enhanced token fullscreen: source character, madness character, and messaging
  const tokenSourceCharacter = useMemo(() => {
    if (!tokenShowPhrase || !characterDef) return undefined;
    if (isSelectedYouToken(tokenShowPhrase)) return characterDef;
    return undefined;
  }, [tokenShowPhrase, characterDef]);

  const tokenMadnessCharacter = useMemo(() => {
    if (!tokenShowPhrase || !characterDef) return undefined;
    if (isSelectedYouToken(tokenShowPhrase) && characterDef.id === 'cerenovus') {
      if (isCompound && Array.isArray(selectionValue) && selectionValue[1]) {
        const characterValue = selectionValue[1];
        if (typeof characterValue === 'string') {
          return (
            characterLookup?.(characterValue) ??
            scriptCharacters.find((character) => character.name === characterValue)
          );
        }
      }
    }
    return undefined;
  }, [
    tokenShowPhrase,
    characterDef,
    isCompound,
    selectionValue,
    characterLookup,
    scriptCharacters,
  ]);

  const stormcaughtCharacter = useMemo(() => {
    if (characterDef?.id !== 'stormcatcher') return undefined;
    const placed = placedReminders.get('stormcatcher-stormcaught');
    return placed?.characterId ? characterLookup?.(placed.characterId) : undefined;
  }, [characterDef, characterLookup, placedReminders]);

  const tokenAdditionalLabel = useMemo(() => {
    if (!tokenShowPhrase || !characterDef) return undefined;
    if (isSelectedYouToken(tokenShowPhrase) && characterDef.id === 'cerenovus') {
      return 'You are now MAD that you are:';
    }
    if (tokenShowPhrase === 'STORMCAUGHT') return 'This player is the:';
    return undefined;
  }, [tokenShowPhrase, characterDef]);

  const tokenInstructionText = useMemo(() => {
    if (!tokenShowPhrase || !characterDef) return undefined;
    if (isSelectedYouToken(tokenShowPhrase)) {
      if (characterDef.id === 'cerenovus') {
        return 'Something bad may happen if you do not pretend to be the character you are mad about.';
      }
      if (characterDef.id === 'harpy') {
        return 'You must be MAD that the player being pointed to is evil, or one or both of you might die.';
      }
    }
    if (tokenShowPhrase === 'MAD' && characterDef.id === 'pixie') {
      return 'If you are MAD that you are this character, you may gain their ability when they die.';
    }
    if (tokenShowPhrase === 'STORMCAUGHT' && stormcaughtCharacter) {
      return `This player is the ${stormcaughtCharacter.name}. They can only die by execution.`;
    }
    if (tokenShowPhrase === 'THIS PLAYER IS' && characterDef.id === 'king' && playerSeat) {
      return `${playerSeat.playerName} is the King.`;
    }
    return undefined;
  }, [tokenShowPhrase, characterDef, playerSeat, stormcaughtCharacter]);

  const tokenDisplayCharacter = useMemo(() => {
    if (tokenShowPhrase === 'STORMCAUGHT') return stormcaughtCharacter;
    if (tokenShowPhrase === 'THIS PLAYER IS' && characterDef?.id === 'king') return characterDef;
    return tokenMadnessCharacter;
  }, [characterDef, stormcaughtCharacter, tokenMadnessCharacter, tokenShowPhrase]);

  const tokenCharacterList = useMemo(() => {
    if (tokenShowPhrase === 'THESE CHARACTERS ARE NOT IN PLAY' && stormcaughtCharacter) {
      return [stormcaughtCharacter];
    }
    return undefined;
  }, [stormcaughtCharacter, tokenShowPhrase]);

  const effectiveShowCharacterPicker = useMemo(() => {
    if (!tokenShowPhrase) return false;
    if (isCharacterIdentityToken(tokenShowPhrase)) return true;
    if (tokenShowPhrase === 'MAD' && characterDef?.id === 'pixie') return true;
    return false;
  }, [tokenShowPhrase, characterDef]);

  const effectiveShowAlignmentPicker = useMemo(
    () =>
      !!tokenShowPhrase &&
      isCharacterIdentityToken(tokenShowPhrase) &&
      characterDef?.id === 'cultleader',
    [tokenShowPhrase, characterDef],
  );

  const tokenPickerCharacters = useMemo(() => {
    if (tokenShowPhrase === 'MAD' && characterDef?.id === 'pixie') {
      return scriptCharacters.filter(
        (character) => character.type === 'Townsfolk' && character.id !== 'pixie',
      );
    }
    return scriptCharacters;
  }, [characterDef, scriptCharacters, tokenShowPhrase]);

  const initialTokenCharacterId = useMemo(() => {
    if (tokenShowPhrase !== 'MAD' || characterDef?.id !== 'pixie') return undefined;
    return players.find((player) => (player.tokens ?? []).some((token) => token.id === 'pixie-mad'))
      ?.characterId;
  }, [characterDef, players, tokenShowPhrase]);

  const effectiveTokenText = useMemo(() => {
    if (!tokenShowPhrase) return '';
    if (tokenShowPhrase === 'MAD' && characterDef?.id === 'pixie') {
      return 'You must be MAD that you are:';
    }
    if (tokenShowPhrase === 'STORMCAUGHT') return 'STORMCAUGHT';
    return getTokenDisplayText(tokenShowPhrase);
  }, [tokenShowPhrase, characterDef]);

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
                      type: 'custom',
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
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
            <Typography
              variant="subtitle2"
              sx={{
                color: '#42a5f5',
                fontWeight: 700,
                textAlign: 'center',
                flexGrow: 1,
              }}
            >
              Show these bluffs to the Lunatic
            </Typography>
            <IconButton
              size="small"
              onClick={() => setLunaticBluffsFullscreenOpen(true)}
              sx={{ color: 'rgba(255,255,255,0.6)', ml: 0.5 }}
              aria-label="Show Lunatic bluffs fullscreen"
              data-testid="lunatic-bluffs-fullscreen-btn"
            >
              <FullscreenIcon fontSize="small" />
            </IconButton>
          </Box>
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
      {!reminderSegments && availableReminderTokens.length > 0 && (
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
          {availableReminderTokens.map((r) => {
            const placedOn = placedReminders.get(r.id);
            const placedCharDef =
              placedOn?.characterId && characterLookup
                ? characterLookup(placedOn.characterId)
                : undefined;
            const placedText = placedOn
              ? `${placedOn.playerName}${placedCharDef ? ` (${placedCharDef.name})` : ''}`
              : undefined;
            const token: PlayerToken = {
              id: r.id,
              type: 'custom',
              label: r.text,
              ...(r.pickerScope ? { pickerScope: r.pickerScope } : {}),
              sourceCharacterId: r.sourceCharacterId,
            };
            return (
              <Box
                key={r.id}
                onClick={
                  onReminderTokenClick ? (event) => onReminderTokenClick(token, event) : undefined
                }
                sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}
              >
                <ReminderTokenChip
                  token={token}
                  size="small"
                  placed={!!placedOn}
                  placedInfo={placedText}
                  sourceName={placedText ?? r.text}
                />
                {r.id === 'stormcatcher-stormcaught' && placedOn && (
                  <IconButton
                    size="small"
                    aria-label="Show Stormcaught player"
                    onClick={(event) => {
                      event.stopPropagation();
                      setTokenShowPhrase('STORMCAUGHT');
                    }}
                    sx={{ color: 'rgba(255,255,255,0.55)' }}
                  >
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
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
          choiceLabels={parsedChoices
            .filter(
              (c) =>
                c.type === 'player' ||
                c.type === 'livingPlayer' ||
                c.type === 'deadPlayer' ||
                c.type === 'character',
            )
            .map((c) => c.label)}
          onShowChoiceFullscreen={(label) => setChoiceShowMessage(label)}
          onShowTokenFullscreen={(phrase) => setTokenShowPhrase(phrase)}
        />

        {/* Phase 3: Signal recording controls — inline after sub-actions */}
        {signalInfos.some((s) => s !== 'none') && (
          <Box data-testid="signal-controls" sx={{ mt: 1 }}>
            {signalInfos.map((signalType, idx) => {
              if (signalType === 'none') return null;
              const signalKey = `${entry.id}__signal__${idx}`;
              const storedSignal = extractStoredSignal(selectionValue);
              const updateSignal = (signal: string) => {
                const signalValue = `${signalPrefix}${signal}`;
                if (Array.isArray(selectionValue)) {
                  onSelectionChange?.([...stripSignalValues(selectionValue), signalValue]);
                  return;
                }
                if (
                  typeof selectionValue === 'string' &&
                  selectionValue &&
                  !selectionValue.startsWith(signalPrefix)
                ) {
                  onSelectionChange?.([selectionValue, signalValue]);
                  return;
                }
                onSelectionChange?.(signalValue);
              };

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
                        value={storedSignal}
                        label="Finger signal"
                        disabled={readOnly}
                        onChange={(e) => updateSignal(e.target.value)}
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
                      value={storedSignal}
                      exclusive
                      onChange={(_, val) => {
                        if (val !== null && !readOnly) {
                          updateSignal(val);
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
            {parsedChoices.map((choice, idx) => (
              <NightChoiceSelector
                key={`${entry.id}-choice-${idx}`}
                type={choice.type}
                multiple={choice.multiple}
                maxSelections={choice.maxSelections}
                value={getCompoundValue(idx)}
                onChange={(v) => handleCompoundChange(idx, v)}
                players={players}
                characters={filterCharactersForChoice(choice.filter)}
                previousValue={getCompoundPrev(idx)}
                label={choice.label}
                filter={choice.filter}
                readOnly={readOnly}
                characterLookup={characterLookup}
              />
            ))}
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
              WebkitTextFillColor: '#fff',
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

      {/* Lunatic bluffs fullscreen overlay */}
      {lunaticBluffCharacters && lunaticBluffCharacters.length > 0 && (
        <PlayerShowScreen
          open={lunaticBluffsFullscreenOpen}
          onClose={() => setLunaticBluffsFullscreenOpen(false)}
          variant="bluffs"
          bluffCharacters={lunaticBluffCharacters}
        />
      )}

      {/* Token fullscreen overlay */}
      <PlayerShowScreen
        key={`token-show-${tokenShowPhrase ?? 'none'}-${initialTokenCharacterId ?? ''}`}
        open={tokenShowPhrase !== null}
        onClose={() => setTokenShowPhrase(null)}
        variant="token"
        tokenText={effectiveTokenText}
        showCharacterPicker={effectiveShowCharacterPicker}
        scriptCharacters={tokenPickerCharacters}
        sourceCharacter={tokenSourceCharacter}
        additionalCharacter={tokenDisplayCharacter}
        characterList={
          tokenShowPhrase === 'THESE CHARACTERS ARE NOT IN PLAY' && characterDef?.id === 'lunatic'
            ? lunaticBluffCharacters
            : tokenCharacterList
        }
        additionalLabel={tokenAdditionalLabel}
        instructionText={tokenInstructionText}
        initialSelectedCharacterId={initialTokenCharacterId}
        showAlignmentPicker={effectiveShowAlignmentPicker}
        alignmentValue={typeof selectionValue === 'string' ? selectionValue : ''}
        onAlignmentChange={(value) => onSelectionChange?.(value)}
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
