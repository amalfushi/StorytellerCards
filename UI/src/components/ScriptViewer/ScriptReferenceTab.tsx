import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { CharacterType } from '@/types/index.ts';
import type { CharacterDef } from '@/types/index.ts';
import { useCharacterLookup } from '@/hooks/useCharacterLookup.ts';
import { sortScriptCharacters } from '@/utils/scriptSortRules.ts';
import { getActiveJinxes } from '@/utils/jinxUtils.ts';
import { getCharacterTypeColor } from '@/components/common/characterTypeColor.ts';
import { CharacterCard } from '@/components/ScriptViewer/CharacterCard.tsx';
import { CharacterIconImage } from '@/components/common/CharacterIconImage.tsx';

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

  const activeJinxes = useMemo(() => getActiveJinxes(scriptCharacterIds), [scriptCharacterIds]);

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

      {/* Jinxes section — only shown when active jinxes exist */}
      {activeJinxes.length > 0 && (
        <Box data-testid="jinxes-section">
          <Box
            sx={{
              px: 1.5,
              py: 0.75,
              bgcolor: '#f59e0b',
              color: '#fff',
              position: 'sticky',
              top: 0,
              zIndex: 1,
            }}
          >
            <Typography variant="subtitle2" fontWeight={700}>
              ⚡ Jinxes ({activeJinxes.length})
            </Typography>
          </Box>

          {activeJinxes.map((jinx, idx) => (
            <Box key={`${jinx.character1Id}-${jinx.character2Id}`}>
              <Box sx={{ px: 1.5, py: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                  <CharacterIconImage
                    characterId={jinx.character1Id}
                    characterName={jinx.character1Name}
                    typeColor="#f59e0b"
                    size={28}
                    borderColor="#f59e0b"
                  />
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {jinx.character1Name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mx: 0.25 }}>
                    ↔
                  </Typography>
                  <CharacterIconImage
                    characterId={jinx.character2Id}
                    characterName={jinx.character2Name}
                    typeColor="#f59e0b"
                    size={28}
                    borderColor="#f59e0b"
                  />
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {jinx.character2Name}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ pl: 0.5 }}>
                  {jinx.description}
                </Typography>
              </Box>
              {idx < activeJinxes.length - 1 && <Divider />}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
