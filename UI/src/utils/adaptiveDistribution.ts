/**
 * Adaptive Distribution Engine — calculates real-time distribution targets
 * that respond to which characters are selected, handling all setup-affecting
 * characters including Baron, Fang Gu, Vigormortis, Balloonist, Hermit,
 * Godfather, Xaan, Kazali, Lord of Typhon, Sentinel, Legion, Atheist,
 * Lil' Monsta, and Village Idiot.
 *
 * Design principle: "Guide, don't gatekeep" — all targets are advisory.
 */

import { getDistribution } from '@/data/playerCountRules.ts';
import { getCharacter } from '@/data/characters/index.ts';

// ── Types ──

export interface ModifierExplanation {
  characterId: string;
  characterName: string;
  /** Human-readable label, e.g. "+2 Outsiders (Baron)" */
  description: string;
}

export interface AdaptiveTargets {
  townsfolk: number;
  outsiders: number;
  minions: number;
  demons: number;
  total: number;
  modifiers: ModifierExplanation[];
  warnings: string[];
}

// ── Options ──

export interface AdaptiveDistributionOptions {
  /** When Xaan is selected, set this to the chosen X value. */
  xaanX?: number;
  /** Number of extra Village Idiot copies (0-2). */
  extraVillageIdiots?: number;
  /** Number of extra Legion copies beyond the first. */
  extraLegionCopies?: number;
  /**
   * Explicit outsider-adjustment values chosen by the Storyteller for
   * variable-modifier characters (Balloonist, Hermit, Godfather, Kazali,
   * Sentinel).  Key = character ID, value = outsider delta.
   * When a character's value is set, it becomes a fixed modifier instead of
   * "variable".
   */
  variableModifierValues?: Record<string, number>;
}

// ── Helpers ──

function charName(id: string): string {
  return getCharacter(id)?.name ?? id;
}

// ── Legion distribution lookup ──

/**
 * For a Legion game the good/evil ratio is reversed.
 * These values match the milestone doc:
 * 5p → 4 Legion + 1 good; 6p → 4+2; 7p → 5+2; 8p → 6+2;
 * 9p → 6+3; 10p → 7+3; 11p → 8+3; 12p → 9+3;
 * 13p → 10+3; 14p → 11+3; 15p → 12+3
 */
const LEGION_GOOD_COUNTS: Record<number, number> = {
  5: 1,
  6: 2,
  7: 2,
  8: 2,
  9: 3,
  10: 3,
  11: 3,
  12: 3,
  13: 3,
  14: 3,
  15: 3,
};

function getLegionGoodCount(playerCount: number): number {
  const clamped = Math.min(15, Math.max(5, playerCount));
  return LEGION_GOOD_COUNTS[clamped] ?? 3;
}

// ── Main calculation ──

/**
 * Calculate adaptive distribution targets based on player count and the
 * currently selected character IDs. Handles all setup-affecting characters
 * and their interactions (stacking, overrides, reversals).
 */
export function calculateAdaptiveTargets(
  playerCount: number,
  selectedCharacterIds: string[],
  options: AdaptiveDistributionOptions = {},
): AdaptiveTargets {
  const idSet = new Set(selectedCharacterIds);
  const modifiers: ModifierExplanation[] = [];
  const warnings: string[] = [];

  const base = getDistribution(playerCount);

  // ── Special full-game modes (checked first) ──

  // Atheist: no evil characters at all
  if (idSet.has('atheist')) {
    modifiers.push({
      characterId: 'atheist',
      characterName: charName('atheist'),
      description: 'No evil characters — all slots are good',
    });
    const total = playerCount;
    // All slots filled with Townsfolk + Outsiders using base ratio as guide
    return {
      townsfolk: total - base.outsiders,
      outsiders: base.outsiders,
      minions: 0,
      demons: 0,
      total,
      modifiers,
      warnings,
    };
  }

  // Legion: reversed distribution
  if (idSet.has('legion')) {
    const goodCount = getLegionGoodCount(playerCount);
    const legionCount = playerCount - goodCount;
    modifiers.push({
      characterId: 'legion',
      characterName: charName('legion'),
      description: `Distribution reversed — ${legionCount} Legion + ${goodCount} good`,
    });

    const extraCopies = options.extraLegionCopies ?? (legionCount > 1 ? legionCount - 1 : 0);

    return {
      townsfolk: goodCount,
      outsiders: 0,
      minions: 0,
      demons: 1 + extraCopies,
      total: goodCount + 1 + extraCopies,
      modifiers,
      warnings,
    };
  }

  // ── Start with base distribution ──

  let townsfolk = base.townsfolk;
  let outsiders = base.outsiders;
  let minions = base.minions;
  let demons = base.demons;

  // ── Lil' Monsta: demon is a token, not a player ──
  if (idSet.has('lilmonsta')) {
    demons = 0;
    minions += 1;
    modifiers.push({
      characterId: 'lilmonsta',
      characterName: charName('lilmonsta'),
      description: 'Demon is a token, not a player (+1 Minion, 0 Demons)',
    });
  }

  // ── Lord of Typhon: +1 Minion + variable Outsiders ──
  if (idSet.has('lordoftyphon')) {
    minions += 1;
    townsfolk = Math.max(0, townsfolk - 1);
    modifiers.push({
      characterId: 'lordoftyphon',
      characterName: charName('lordoftyphon'),
      description: '+1 Minion (evil must be in a continuous line)',
    });
    // Variable outsider component handled below if not overridden by Xaan
  }

  // ── Outsider modifiers (may be overridden by Xaan) ──

  let outsiderDelta = 0;
  let hasVariableOutsider = false;
  const outsiderModifierIds: string[] = [];

  // Baron: +2 Outsiders
  if (idSet.has('baron')) {
    outsiderDelta += 2;
    outsiderModifierIds.push('baron');
    modifiers.push({
      characterId: 'baron',
      characterName: charName('baron'),
      description: '+2 Outsiders',
    });
  }

  // Fang Gu: +1 Outsider
  if (idSet.has('fanggu')) {
    outsiderDelta += 1;
    outsiderModifierIds.push('fanggu');
    modifiers.push({
      characterId: 'fanggu',
      characterName: charName('fanggu'),
      description: '+1 Outsider',
    });
  }

  // Vigormortis: -1 Outsider
  if (idSet.has('vigormortis')) {
    outsiderDelta -= 1;
    outsiderModifierIds.push('vigormortis');
    modifiers.push({
      characterId: 'vigormortis',
      characterName: charName('vigormortis'),
      description: '-1 Outsider',
    });
  }

  // Balloonist: +0 or +1 Outsider (variable unless ST chooses)
  if (idSet.has('balloonist')) {
    const val = options.variableModifierValues?.balloonist;
    outsiderModifierIds.push('balloonist');
    if (val !== undefined) {
      outsiderDelta += val;
      modifiers.push({
        characterId: 'balloonist',
        characterName: charName('balloonist'),
        description: `+${val} Outsider`,
      });
    } else {
      hasVariableOutsider = true;
      modifiers.push({
        characterId: 'balloonist',
        characterName: charName('balloonist'),
        description: '+0 or +1 Outsider (variable)',
      });
    }
  }

  // Hermit: -0 or -1 Outsider (variable unless ST chooses)
  if (idSet.has('hermit')) {
    const val = options.variableModifierValues?.hermit;
    outsiderModifierIds.push('hermit');
    if (val !== undefined) {
      outsiderDelta += val;
      modifiers.push({
        characterId: 'hermit',
        characterName: charName('hermit'),
        description: `${val} Outsider`,
      });
    } else {
      hasVariableOutsider = true;
      modifiers.push({
        characterId: 'hermit',
        characterName: charName('hermit'),
        description: '-0 or -1 Outsider (variable)',
      });
    }
  }

  // Godfather: -1 or +1 Outsider (variable unless ST chooses)
  if (idSet.has('godfather')) {
    const val = options.variableModifierValues?.godfather;
    outsiderModifierIds.push('godfather');
    if (val !== undefined) {
      outsiderDelta += val;
      modifiers.push({
        characterId: 'godfather',
        characterName: charName('godfather'),
        description: `${val > 0 ? '+' : ''}${val} Outsider`,
      });
    } else {
      hasVariableOutsider = true;
      modifiers.push({
        characterId: 'godfather',
        characterName: charName('godfather'),
        description: '-1 or +1 Outsider (variable)',
      });
    }
  }

  // Kazali: variable outsiders (ST chooses)
  if (idSet.has('kazali')) {
    const val = options.variableModifierValues?.kazali;
    outsiderModifierIds.push('kazali');
    if (val !== undefined) {
      outsiderDelta += val;
      modifiers.push({
        characterId: 'kazali',
        characterName: charName('kazali'),
        description: `${val > 0 ? '+' : ''}${val} Outsiders`,
      });
    } else {
      hasVariableOutsider = true;
      modifiers.push({
        characterId: 'kazali',
        characterName: charName('kazali'),
        description: 'Variable Outsiders (ST chooses)',
      });
    }
  }

  // Lord of Typhon variable outsider component
  if (idSet.has('lordoftyphon')) {
    hasVariableOutsider = true;
    outsiderModifierIds.push('lordoftyphon');
    // Modifier already added above for the +1 Minion
  }

  // Sentinel: variable Outsiders (ST chooses)
  if (idSet.has('sentinel')) {
    const val = options.variableModifierValues?.sentinel;
    outsiderModifierIds.push('sentinel');
    if (val !== undefined) {
      outsiderDelta += val;
      modifiers.push({
        characterId: 'sentinel',
        characterName: charName('sentinel'),
        description: `+${val} Outsider${val !== 1 ? 's' : ''}`,
      });
    } else {
      hasVariableOutsider = true;
      modifiers.push({
        characterId: 'sentinel',
        characterName: charName('sentinel'),
        description: '±1 Outsider (variable)',
      });
    }
  }

  // ── Xaan override: X Outsiders ──
  if (idSet.has('xaan')) {
    const xVal = options.xaanX;
    if (xVal !== undefined && xVal >= 0) {
      // Xaan overrides ALL other outsider modifiers
      outsiders = xVal;
      townsfolk = Math.max(0, townsfolk + base.outsiders - xVal);
      outsiderDelta = 0;
      modifiers.push({
        characterId: 'xaan',
        characterName: charName('xaan'),
        description: `X=${xVal} → ${xVal} Outsiders (overrides all other outsider modifiers)`,
      });
    } else {
      hasVariableOutsider = true;
      modifiers.push({
        characterId: 'xaan',
        characterName: charName('xaan'),
        description: 'X Outsiders — choose X (overrides all other outsider modifiers)',
      });
      warnings.push('Xaan is selected but X has not been set — outsider count is variable');
    }
  } else {
    // Apply fixed outsider delta (Xaan not in play)
    if (outsiderDelta !== 0) {
      outsiders = Math.max(0, outsiders + outsiderDelta);
      townsfolk = Math.max(0, townsfolk - outsiderDelta);
    }
  }

  // Add warning for variable outsiders (when Xaan doesn't override)
  if (hasVariableOutsider && !idSet.has('xaan')) {
    warnings.push('Outsider count may vary — Storyteller decides');
  }

  // ── Village Idiot: extra copies fill Townsfolk slots ──
  const extraVI = options.extraVillageIdiots ?? 0;
  if (idSet.has('villageidiot') && extraVI > 0) {
    // Village Idiot copies ARE Townsfolk — they count toward the Townsfolk
    // target, not against it. No reduction needed.
    modifiers.push({
      characterId: 'villageidiot',
      characterName: charName('villageidiot'),
      description: `+${extraVI} extra cop${extraVI === 1 ? 'y' : 'ies'} (filling Townsfolk slot${extraVI === 1 ? '' : 's'})`,
    });
  }

  const total = townsfolk + outsiders + minions + demons;

  if (total !== playerCount) {
    warnings.push(`Distribution total (${total}) ≠ player count (${playerCount})`);
  }

  return {
    townsfolk,
    outsiders,
    minions,
    demons,
    total,
    modifiers,
    warnings,
  };
}
