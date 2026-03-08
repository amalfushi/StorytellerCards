/**
 * Detects characters on a script that modify the default player distribution
 * during setup (e.g. Baron adds +2 Outsiders, Vigormortis removes -1 Outsider).
 *
 * Returns a list of modifiers the Storyteller should be aware of when setting
 * up the game, along with a computed net adjustment per distribution slot.
 */

import { getCharacter } from '@/data/characters/index.ts';

// ── Types ──

export interface SetupModifier {
  /** ID of the character producing this modifier. */
  characterId: string;
  /** Display name of the character. */
  characterName: string;
  /** Human-readable label, e.g. "+2 Outsiders". */
  description: string;
  /** Which distribution slot is affected. */
  type: 'outsider' | 'minion';
  /** Fixed numeric delta, or 'variable' when the ST decides. */
  adjustment: number | 'variable';
}

export interface NetAdjustment {
  outsiders: number | 'variable';
  minions: number | 'variable';
}

// ── Known modifier rules (hard-coded by character ID) ──

interface ModifierRule {
  type: 'outsider' | 'minion';
  adjustment: number | 'variable';
  description: string;
}

const KNOWN_MODIFIERS: Record<string, ModifierRule[]> = {
  baron: [{ type: 'outsider', adjustment: 2, description: '+2 Outsiders' }],
  fanggu: [{ type: 'outsider', adjustment: 1, description: '+1 Outsider' }],
  vigormortis: [{ type: 'outsider', adjustment: -1, description: '-1 Outsider' }],
  balloonist: [{ type: 'outsider', adjustment: 'variable', description: '+0 or +1 Outsider' }],
  hermit: [{ type: 'outsider', adjustment: 'variable', description: '-0 or -1 Outsider' }],
  xaan: [{ type: 'outsider', adjustment: 'variable', description: 'X Outsiders (ST chooses)' }],
  kazali: [
    { type: 'outsider', adjustment: 'variable', description: '-? to +? Outsiders (ST chooses)' },
  ],
  lordoftyphon: [
    { type: 'minion', adjustment: 1, description: '+1 Minion' },
    { type: 'outsider', adjustment: 'variable', description: '-? to +? Outsiders (ST chooses)' },
  ],
  sentinel: [{ type: 'outsider', adjustment: 'variable', description: '±1 Outsider (ST chooses)' }],
};

// ── Public API ──

/**
 * Scan a list of script character IDs and return every applicable setup
 * modifier, resolved from the character registry.
 */
export function getSetupModifiers(scriptCharacterIds: string[]): SetupModifier[] {
  const modifiers: SetupModifier[] = [];

  for (const id of scriptCharacterIds) {
    const rules = KNOWN_MODIFIERS[id];
    if (!rules) continue;

    const charDef = getCharacter(id);
    const charName = charDef?.name ?? id;

    for (const rule of rules) {
      modifiers.push({
        characterId: id,
        characterName: charName,
        description: rule.description,
        type: rule.type,
        adjustment: rule.adjustment,
      });
    }
  }

  return modifiers;
}

/**
 * Compute the net fixed adjustment for each distribution slot, ignoring
 * variable modifiers. If any variable modifier is present for a slot the
 * net value for that slot is `'variable'`.
 */
export function getNetAdjustment(modifiers: SetupModifier[]): NetAdjustment {
  let outsiderSum = 0;
  let minionSum = 0;
  let outsiderVariable = false;
  let minionVariable = false;

  for (const m of modifiers) {
    if (m.type === 'outsider') {
      if (m.adjustment === 'variable') {
        outsiderVariable = true;
      } else {
        outsiderSum += m.adjustment;
      }
    } else {
      if (m.adjustment === 'variable') {
        minionVariable = true;
      } else {
        minionSum += m.adjustment;
      }
    }
  }

  return {
    outsiders: outsiderVariable ? 'variable' : outsiderSum,
    minions: minionVariable ? 'variable' : minionSum,
  };
}

/**
 * Apply fixed numeric modifiers to a base distribution and return a new copy.
 * Variable modifiers are ignored (the ST must decide manually).
 * Adjusted values are clamped to ≥ 0.
 */
export function applyFixedModifiers(
  base: { townsfolk: number; outsiders: number; minions: number; demons: number },
  modifiers: SetupModifier[],
): { townsfolk: number; outsiders: number; minions: number; demons: number } {
  const net = getNetAdjustment(modifiers);
  const outsiderDelta = typeof net.outsiders === 'number' ? net.outsiders : 0;
  const minionDelta = typeof net.minions === 'number' ? net.minions : 0;

  return {
    townsfolk: Math.max(0, base.townsfolk - outsiderDelta - minionDelta),
    outsiders: Math.max(0, base.outsiders + outsiderDelta),
    minions: Math.max(0, base.minions + minionDelta),
    demons: base.demons,
  };
}
