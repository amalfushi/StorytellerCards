import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import PersonIcon from '@mui/icons-material/Person';
import type { NightOrderEntry, PlayerSeat, CharacterDef } from '@/types/index.ts';
import { getCharacterTypeColor } from '@/components/common/characterTypeColor.ts';
import { SubActionChecklist } from './SubActionChecklist.tsx';
import { NightChoiceSelector } from './NightChoiceSelector.tsx';
import { parseHelpTextForChoice } from './NightChoiceHelper.ts';

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
  const typeColor = characterDef ? getCharacterTypeColor(characterDef.type) : '#9e9e9e';

  const typeName = characterDef?.type ?? 'Unknown';

  // Parse helpText to detect if this character needs a choice dropdown
  const parsedChoice = useMemo(() => parseHelpTextForChoice(entry.helpText), [entry.helpText]);

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        bgcolor: 'rgba(30, 30, 50, 0.95)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        p: 2.5,
        mx: 1,
        minHeight: 0,
        flex: 1,
        overflow: 'auto',
        opacity: isDead ? 0.7 : 1,
        filter: isDead ? 'saturate(0.3)' : 'none',
        transition: 'opacity 0.3s ease, filter 0.3s ease',
      }}
    >
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
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: typeColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 1.5,
            boxShadow: `0 0 20px ${typeColor}44`,
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#fff',
            textTransform: 'uppercase',
          }}
        >
          {entry.name.charAt(0)}
        </Box>

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
            backgroundColor: `${typeColor}33`,
            color: typeColor,
            fontWeight: 600,
            borderColor: typeColor,
            border: '1px solid',
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
      </Box>

      {/* Player info */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          mb: 1.5,
          px: 0.5,
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

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)', mb: 1 }} />

      {/* Sub-action checklist */}
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <SubActionChecklist
          subActions={entry.subActions}
          checkedStates={checkedStates}
          onToggle={onToggleSubAction}
          readOnly={readOnly}
        />
      </Box>

      {/* Night choice selector (if helpText requires a player/character choice) */}
      {parsedChoice && onSelectionChange && (
        <NightChoiceSelector
          type={parsedChoice.type}
          multiple={parsedChoice.multiple}
          maxSelections={parsedChoice.maxSelections}
          value={selectionValue ?? (parsedChoice.multiple ? [] : '')}
          onChange={onSelectionChange}
          players={players}
          characters={scriptCharacters}
          previousValue={previousSelection}
          label={parsedChoice.label}
          readOnly={readOnly}
        />
      )}

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)', mt: 1, mb: 1.5 }} />

      {/* Notes field */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
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
    </Box>
  );
}
