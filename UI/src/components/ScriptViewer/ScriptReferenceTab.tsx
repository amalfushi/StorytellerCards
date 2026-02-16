import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { CharacterType } from '@/types/index.ts';
import type { CharacterDef } from '@/types/index.ts';
import { useCharacterLookup } from '@/hooks/useCharacterLookup.ts';
import { sortScriptCharacters } from '@/utils/scriptSortRules.ts';
import { getCharacterTypeColor } from '@/components/common/characterTypeColor.ts';
import { CharacterCard } from '@/components/ScriptViewer/CharacterCard.tsx';

interface ScriptReferenceTabProps {
  scriptCharacterIds: string[];
}

/** Type groups in display order. */
const TYPE_SECTIONS: { type: string; label: string }[] = [
  { type: CharacterType.Townsfolk, label: 'Townsfolk' },
  { type: CharacterType.Outsider, label: 'Outsiders' },
  { type: CharacterType.Minion, label: 'Minions' },
  { type: CharacterType.Demon, label: 'Demons' },
  { type: CharacterType.Traveller, label: 'Travellers' },
  { type: CharacterType.Fabled, label: 'Fabled' },
  { type: CharacterType.Loric, label: 'Loric' },
];

/**
 * Script Reference tab — shows all characters on the active script,
 * grouped by type and sorted using official rules.
 */
export function ScriptReferenceTab({ scriptCharacterIds }: ScriptReferenceTabProps) {
  const { getCharactersByIds } = useCharacterLookup();

  const characters = useMemo(
    () => getCharactersByIds(scriptCharacterIds),
    [getCharactersByIds, scriptCharacterIds],
  );

  const sorted = useMemo(() => sortScriptCharacters(characters), [characters]);

  // Group sorted characters by type
  const grouped = useMemo(() => {
    const groups = new Map<string, CharacterDef[]>();
    for (const ch of sorted) {
      const list = groups.get(ch.type) ?? [];
      list.push(ch);
      groups.set(ch.type, list);
    }
    return groups;
  }, [sorted]);

  if (characters.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">No characters on this script.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      {TYPE_SECTIONS.map(({ type, label }) => {
        const group = grouped.get(type);
        if (!group || group.length === 0) return null;

        const color = getCharacterTypeColor(type);

        return (
          <Box key={type}>
            {/* Section header */}
            <Box
              sx={{
                px: 1.5,
                py: 0.75,
                bgcolor: color,
                color: '#fff',
                position: 'sticky',
                top: 0,
                zIndex: 1,
              }}
            >
              <Typography variant="subtitle2" fontWeight={700}>
                {label} ({group.length})
              </Typography>
            </Box>

            {/* Character cards */}
            {group.map((ch) => (
              <CharacterCard key={ch.id} character={ch} />
            ))}
          </Box>
        );
      })}
    </Box>
  );
}
