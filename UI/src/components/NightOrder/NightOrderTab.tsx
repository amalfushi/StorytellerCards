import { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import Typography from '@mui/material/Typography';
import { useGame } from '@/context/GameContext.tsx';
import { useCharacterLookup } from '@/hooks/useCharacterLookup.ts';
import { useNightOrder } from '@/hooks/useNightOrder.ts';
import { NightOrderEntry } from '@/components/NightOrder/NightOrderEntry.tsx';

interface NightOrderTabProps {
  scriptCharacterIds: string[];
}

/**
 * Night Order tab — shows filtered night order for the current script.
 * Toggle between "First Night" and "Other Nights".
 * Character entries show which player has the character assigned.
 */
export function NightOrderTab({ scriptCharacterIds }: NightOrderTabProps) {
  const { state } = useGame();
  const { getCharacter } = useCharacterLookup();

  // Default to first night if the game says it is, otherwise other nights
  const gameIsFirstNight = state.game?.isFirstNight ?? true;
  const [isFirstNight, setIsFirstNight] = useState(gameIsFirstNight);

  const entries = useNightOrder(scriptCharacterIds, isFirstNight);
  const players = useMemo(() => state.game?.players ?? [], [state.game?.players]);

  // Build a map of characterId → PlayerSeat for quick lookup
  const playerByCharacter = useMemo(() => {
    const map = new Map<string, (typeof players)[number]>();
    for (const p of players) {
      if (p.characterId) {
        map.set(p.characterId, p);
      }
    }
    return map;
  }, [players]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Night type toggle */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          py: 1,
          px: 1,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'grey.50',
        }}
      >
        <ToggleButtonGroup
          value={isFirstNight ? 'first' : 'other'}
          exclusive
          onChange={(_, val) => {
            if (val !== null) setIsFirstNight(val === 'first');
          }}
          size="small"
        >
          <ToggleButton value="first">First Night</ToggleButton>
          <ToggleButton value="other">Other Nights</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Night order list */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {entries.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">No night order entries for this script.</Typography>
          </Box>
        ) : (
          entries.map((entry, index) => (
            <NightOrderEntry
              key={`${entry.id}-${index}`}
              entry={entry}
              character={entry.type === 'character' ? getCharacter(entry.id) : undefined}
              assignedPlayer={
                entry.type === 'character' ? playerByCharacter.get(entry.id) : undefined
              }
            />
          ))
        )}
      </Box>
    </Box>
  );
}
