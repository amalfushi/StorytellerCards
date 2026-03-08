import type { ActiveJinx } from '@/types/index.ts';
import { characterMap } from '@/data/characters/index.ts';

/**
 * Find all active jinx pairs on a script.
 *
 * A jinx is "active" when **both** characters in the pair are present in
 * `scriptCharacterIds`. Because jinx data is mirrored (A→B and B→A), we
 * deduplicate by only emitting the pair when we encounter the first
 * character in alphabetical order.
 */
export function getActiveJinxes(scriptCharacterIds: string[]): ActiveJinx[] {
  const onScript = new Set(scriptCharacterIds);
  const results: ActiveJinx[] = [];

  for (const id of scriptCharacterIds) {
    const charDef = characterMap.get(id);
    if (!charDef?.jinxes) continue;

    for (const jinx of charDef.jinxes) {
      if (!onScript.has(jinx.characterId)) continue;

      // Deduplicate mirrored pairs: only emit when id < partnerId
      if (id >= jinx.characterId) continue;

      const partner = characterMap.get(jinx.characterId);
      results.push({
        character1Id: id,
        character1Name: charDef.name,
        character2Id: jinx.characterId,
        character2Name: partner?.name ?? jinx.characterId,
        description: jinx.description,
      });
    }
  }

  return results;
}

/**
 * Get active jinxes for a specific character within a script.
 *
 * Returns every active jinx that involves `characterId`. If
 * `scriptCharacterIds` is empty, returns **all** jinxes defined on the
 * character (useful when there is no script context).
 */
export function getCharacterActiveJinxes(
  characterId: string,
  scriptCharacterIds: string[],
): ActiveJinx[] {
  const charDef = characterMap.get(characterId);
  if (!charDef?.jinxes) return [];

  // No script context → return all jinxes for this character
  if (scriptCharacterIds.length === 0) {
    return charDef.jinxes.map((jinx) => {
      const partner = characterMap.get(jinx.characterId);
      return {
        character1Id: characterId,
        character1Name: charDef.name,
        character2Id: jinx.characterId,
        character2Name: partner?.name ?? jinx.characterId,
        description: jinx.description,
      };
    });
  }

  const onScript = new Set(scriptCharacterIds);
  if (!onScript.has(characterId)) return [];

  return charDef.jinxes
    .filter((jinx) => onScript.has(jinx.characterId))
    .map((jinx) => {
      const partner = characterMap.get(jinx.characterId);
      return {
        character1Id: characterId,
        character1Name: charDef.name,
        character2Id: jinx.characterId,
        character2Name: partner?.name ?? jinx.characterId,
        description: jinx.description,
      };
    });
}
