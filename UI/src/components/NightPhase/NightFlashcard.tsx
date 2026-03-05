import { useMemo, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import PersonIcon from '@mui/icons-material/Person';
import type { NightOrderEntry, PlayerSeat, CharacterDef } from '@/types/index.ts';
import { getCharacterTypeColor } from '@/components/common/characterTypeColor.ts';
import { CharacterDetailModal } from '@/components/common/CharacterDetailModal.tsx';
import { CharacterIconImage } from '@/components/common/CharacterIconImage.tsx';
import { TokenChips } from '@/components/common/TokenChips.tsx';
import { getAlignmentBorderColor } from '@/utils/characterIcon.ts';
import { SubActionChecklist } from './SubActionChecklist.tsx';
import { NightChoiceSelector } from './NightChoiceSelector.tsx';

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
}: NightFlashcardProps) {
  const [detailOpen, setDetailOpen] = useState(false);
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

      {/* Character icon placeholder */}
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
        <CharacterIconImage
          characterId={entry.id}
          characterName={entry.name}
          typeColor={typeColor}
          size={80}
          borderColor={getAlignmentBorderColor(
            playerSeat?.actualAlignment ?? characterDef?.defaultAlignment,
            typeColor,
          )}
          isDead={isDead}
          onClick={characterDef ? () => setDetailOpen(true) : undefined}
          sx={{ mb: 1.5, boxShadow: `0 0 20px ${typeColor}44` }}
        />

        {/* Character name */}
        <Typography
          variant="h5"
          sx={{
            fontWeight: 'bold',
            color: '#fff',
            textAlign: 'center',
            mb: 0.5,
          }}
        >
          {entry.name}
        </Typography>

        {/* Type chip */}
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

        {/* Short ability description */}
        {characterDef?.abilityShort && (
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255,255,255,0.7)',
              textAlign: 'center',
              fontStyle: 'italic',
              mt: 1,
              px: 1,
              fontSize: '0.85rem',
              lineHeight: 1.4,
            }}
          >
            {characterDef.abilityShort}
          </Typography>
        )}

        {/* Active tokens indicator (F3-18) */}
        {playerSeat && playerSeat.tokens.length > 0 && (
          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center' }}>
            <TokenChips tokens={playerSeat.tokens} size="medium" />
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

      <Divider
        sx={{ borderColor: 'rgba(255,255,255,0.12)', mb: 1, position: 'relative', zIndex: 1 }}
      />

      {/* Sub-action checklist + choice selectors inline */}
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', position: 'relative', zIndex: 1 }}>
        <SubActionChecklist
          subActions={entry.subActions}
          checkedStates={checkedStates}
          onToggle={onToggleSubAction}
          readOnly={readOnly}
        />

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
                characters={scriptCharacters}
                previousValue={getCompoundPrev(idx)}
                label={choice.label}
                readOnly={readOnly}
              />
            ))}
          </Box>
        )}
      </Box>

      <Divider
        sx={{
          borderColor: 'rgba(255,255,255,0.12)',
          mt: 1,
          mb: 1.5,
          position: 'relative',
          zIndex: 1,
        }}
      />

      {/* Notes field */}
      <Box
        sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, position: 'relative', zIndex: 1 }}
      >
        <Typography
          variant="body2"
          sx={{ color: 'rgba(255,255,255,0.5)', mt: 0.75, flexShrink: 0 }}
        >
          📝
        </Typography>
        <TextField
          placeholder="Notes…"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          disabled={readOnly}
          multiline
          maxRows={2}
          size="small"
          fullWidth
          sx={{
            '& .MuiInputBase-root': {
              color: 'rgba(255,255,255,0.9)',
              fontSize: '0.85rem',
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
      {/* Character Detail Modal */}
      <CharacterDetailModal
        open={detailOpen}
        character={characterDef ?? null}
        onClose={() => setDetailOpen(false)}
      />
    </Box>
  );
}
