/**
 * Randomly selects characters from a script following BotC distribution rules.
 *
 * Uses the adaptive distribution engine to account for setup-affecting
 * characters (Baron, Atheist, Legion, etc.) and picks random characters
 * from each type to fill the required slots.
 */

import { getDistribution } from '@/data/playerCountRules.ts';
import { getCharacter } from '@/data/characters/index.ts';
import type { CharacterDef } from '@/types/index.ts';

// ── Helpers ──

/** Fisher-Yates shuffle (returns a new array). */
function shuffled<T>(arr: readonly T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Pick `count` random items from an array (without replacement). */
function pickRandom<T>(arr: readonly T[], count: number): T[] {
  return shuffled(arr).slice(0, count);
}

// ── Setup modifier detection ──

interface OutsiderAdjustment {
  outsiderDelta: number;
  townsfolkDelta: number;
}

/**
 * Calculate outsider/townsfolk adjustments caused by a set of selected characters.
 * Only handles fixed modifiers — variable ones use a sensible default.
 */
function getSetupAdjustments(selectedIds: Set<string>): OutsiderAdjustment {
  let outsiderDelta = 0;

  // Baron: +2 outsiders, -2 townsfolk
  if (selectedIds.has('baron')) outsiderDelta += 2;

  // Fang Gu: +1 outsider
  if (selectedIds.has('fanggu')) outsiderDelta += 1;

  // Vigormortis: -1 outsider
  if (selectedIds.has('vigormortis')) outsiderDelta -= 1;

  // Godfather: variable, default to -1 townsfolk / +1 outsider
  if (selectedIds.has('godfather')) outsiderDelta += 1;

  // Lord of Typhon: +1 minion and variable Outsiders handled in the main pass.
  // Balloonist: +0 or +1, default to 0
  // Hermit: -0 or -1, default to 0
  // Kazali: highly variable, default to 0
  // Sentinel: ±1, default to 0

  return {
    outsiderDelta,
    townsfolkDelta: -outsiderDelta,
  };
}

// ── Main function ──

/**
 * Randomly select characters from a script following BotC distribution rules.
 *
 * @param scriptCharacterIds - All character IDs on the script
 * @param playerCount - Number of players (determines distribution)
 * @returns Array of selected character IDs (length === playerCount, or fewer if insufficient characters)
 */
export function randomizeCharacters(scriptCharacterIds: string[], playerCount: number): string[] {
  // Resolve character definitions
  const characters = scriptCharacterIds
    .map((id) => getCharacter(id))
    .filter((ch): ch is CharacterDef => ch !== undefined);

  // Separate by type (only the four counted types)
  const townsfolk = characters.filter((c) => c.type === 'Townsfolk');
  const outsiders = characters.filter((c) => c.type === 'Outsider');
  const minions = characters.filter((c) => c.type === 'Minion');
  const demons = characters.filter((c) => c.type === 'Demon');

  const base = getDistribution(playerCount);

  // ── Standard distribution (first pass) ──
  // Pick demons and minions first, then check for special characters

  const targetDemons = Math.min(base.demons, demons.length);
  let targetMinions = Math.min(base.minions, minions.length);

  const selectedDemons = pickRandom(demons, targetDemons);
  const selectedMinions = pickRandom(minions, targetMinions);

  // ── Check if special characters were randomly selected ──
  const selectedEvilIds = new Set([
    ...selectedDemons.map((c) => c.id),
    ...selectedMinions.map((c) => c.id),
  ]);

  // ── Atheist: only if randomly selected as a townsfolk ──
  // Atheist is a Townsfolk — it might be picked in the townsfolk pool below.
  // We pre-check: should we force an Atheist game? Only with low probability.
  const hasAtheistOnScript = townsfolk.some((c) => c.id === 'atheist');
  const forceAtheist = hasAtheistOnScript && Math.random() < 1 / townsfolk.length;

  if (forceAtheist) {
    // Atheist game: no evil characters, all good
    const totalGood = playerCount;
    const targetOutsidersAtheist = Math.min(base.outsiders, outsiders.length);
    const targetTownsfolkAtheist = Math.min(totalGood - targetOutsidersAtheist, townsfolk.length);

    const selected = [
      ...pickRandom(townsfolk, targetTownsfolkAtheist),
      ...pickRandom(outsiders, targetOutsidersAtheist),
    ];

    // Ensure atheist is in the selection
    if (!selected.some((c) => c.id === 'atheist')) {
      const atheistChar = characters.find((c) => c.id === 'atheist');
      if (atheistChar && selected.length > 0) {
        const townsfolkIndices = selected
          .map((c, i) => (c.type === 'Townsfolk' ? i : -1))
          .filter((i) => i >= 0);
        if (townsfolkIndices.length > 0) {
          selected[townsfolkIndices[0]] = atheistChar;
        }
      }
    }

    return selected.map((c) => c.id);
  }

  // ── Legion: only if randomly selected as a demon ──
  if (selectedDemons.some((c) => c.id === 'legion')) {
    const goodCount = Math.min(
      playerCount <= 5 ? 1 : playerCount <= 8 ? 2 : 3,
      townsfolk.length + outsiders.length,
    );
    const legionCount = playerCount - goodCount;

    const goodPool = [...townsfolk, ...outsiders];
    const selectedGood = pickRandom(goodPool, goodCount);

    const legionIds = Array.from({ length: legionCount }, () => 'legion');

    return [...selectedGood.map((c) => c.id), ...legionIds];
  }

  // ── Standard distribution (continued) ──

  const adjustments = getSetupAdjustments(selectedEvilIds);

  // Lord of Typhon: +1 Minion and Storyteller-variable Outsiders.
  // For random setup, pick a legal Outsider count across the available good slots.
  if (selectedEvilIds.has('lordoftyphon')) {
    targetMinions = Math.min(base.minions + 1, minions.length);
    const maxOutsiders = Math.min(outsiders.length, base.townsfolk + base.outsiders - 1);
    adjustments.outsiderDelta += Math.floor(Math.random() * (maxOutsiders + 1)) - base.outsiders;
  }

  let targetOutsiders = Math.max(0, base.outsiders + adjustments.outsiderDelta);
  let targetTownsfolk = Math.max(0, base.townsfolk + adjustments.townsfolkDelta);

  // Clamp to available characters
  targetOutsiders = Math.min(targetOutsiders, outsiders.length);
  targetTownsfolk = Math.min(targetTownsfolk, townsfolk.length);

  // Ensure total equals player count: adjust townsfolk to fill remaining slots
  const evilSlots = selectedDemons.length + selectedMinions.length;
  const remainingSlots = playerCount - evilSlots;
  const goodSlots = targetTownsfolk + targetOutsiders;

  if (goodSlots < remainingSlots) {
    // Need more good characters — add townsfolk if available
    const extraNeeded = remainingSlots - goodSlots;
    targetTownsfolk = Math.min(targetTownsfolk + extraNeeded, townsfolk.length);
  } else if (goodSlots > remainingSlots) {
    // Too many good characters — reduce townsfolk first
    const excess = goodSlots - remainingSlots;
    targetTownsfolk = Math.max(0, targetTownsfolk - excess);
    // If still too many, reduce outsiders
    if (targetTownsfolk + targetOutsiders > remainingSlots) {
      targetOutsiders = Math.max(0, remainingSlots - targetTownsfolk);
    }
  }

  const selectedOutsiders = pickRandom(outsiders, targetOutsiders);
  const selectedTownsfolk = pickRandom(townsfolk, targetTownsfolk);

  return [
    ...selectedTownsfolk.map((c) => c.id),
    ...selectedOutsiders.map((c) => c.id),
    ...selectedMinions.map((c) => c.id),
    ...selectedDemons.map((c) => c.id),
  ];
}
