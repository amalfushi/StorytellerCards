import { describe, it, expect } from 'vitest';
import { getSetupModifiers, getNetAdjustment, applyFixedModifiers } from './setupModifiers';
import type { SetupModifier } from './setupModifiers';

describe('getSetupModifiers', () => {
  it('returns an empty array for a script with no modifier characters', () => {
    expect(getSetupModifiers(['washerwoman', 'imp', 'drunk'])).toEqual([]);
  });

  it('detects Baron (+2 Outsiders)', () => {
    const result = getSetupModifiers(['baron']);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      characterId: 'baron',
      characterName: 'Baron',
      description: '+2 Outsiders',
      type: 'outsider',
      adjustment: 2,
    });
  });

  it('detects Fang Gu (+1 Outsider)', () => {
    const result = getSetupModifiers(['fanggu']);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      characterId: 'fanggu',
      characterName: 'Fang Gu',
      type: 'outsider',
      adjustment: 1,
    });
  });

  it('detects Vigormortis (-1 Outsider)', () => {
    const result = getSetupModifiers(['vigormortis']);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      characterId: 'vigormortis',
      characterName: 'Vigormortis',
      type: 'outsider',
      adjustment: -1,
    });
  });

  it('detects Balloonist as variable', () => {
    const result = getSetupModifiers(['balloonist']);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      characterId: 'balloonist',
      type: 'outsider',
      adjustment: 'variable',
    });
  });

  it('detects Hermit as variable', () => {
    const result = getSetupModifiers(['hermit']);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      characterId: 'hermit',
      type: 'outsider',
      adjustment: 'variable',
    });
  });

  it('detects Xaan as variable outsider modifier', () => {
    const result = getSetupModifiers(['xaan']);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      characterId: 'xaan',
      type: 'outsider',
      adjustment: 'variable',
    });
  });

  it('detects Kazali as variable outsider modifier', () => {
    const result = getSetupModifiers(['kazali']);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      characterId: 'kazali',
      type: 'outsider',
      adjustment: 'variable',
    });
  });

  it('detects Lord of Typhon with two modifiers (+1 Minion and variable Outsiders)', () => {
    const result = getSetupModifiers(['lordoftyphon']);
    expect(result).toHaveLength(2);
    const minion = result.find((m) => m.type === 'minion');
    const outsider = result.find((m) => m.type === 'outsider');
    expect(minion).toMatchObject({ adjustment: 1, type: 'minion' });
    expect(outsider).toMatchObject({ adjustment: 'variable', type: 'outsider' });
  });

  it('detects Sentinel as variable outsider modifier', () => {
    const result = getSetupModifiers(['sentinel']);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      characterId: 'sentinel',
      type: 'outsider',
      adjustment: 'variable',
    });
  });

  it('combines multiple modifier characters from the same script', () => {
    const result = getSetupModifiers(['baron', 'vigormortis', 'drunk']);
    expect(result).toHaveLength(2);
    const ids = result.map((m) => m.characterId);
    expect(ids).toContain('baron');
    expect(ids).toContain('vigormortis');
  });

  it('ignores unknown character IDs gracefully', () => {
    expect(getSetupModifiers(['unknownchar'])).toEqual([]);
  });

  it('preserves input order', () => {
    const result = getSetupModifiers(['vigormortis', 'baron']);
    expect(result[0].characterId).toBe('vigormortis');
    expect(result[1].characterId).toBe('baron');
  });
});

describe('getNetAdjustment', () => {
  it('returns zero for an empty modifier list', () => {
    expect(getNetAdjustment([])).toEqual({ outsiders: 0, minions: 0 });
  });

  it('sums fixed outsider modifiers', () => {
    const modifiers: SetupModifier[] = [
      {
        characterId: 'baron',
        characterName: 'Baron',
        description: '+2 Outsiders',
        type: 'outsider',
        adjustment: 2,
      },
      {
        characterId: 'vigormortis',
        characterName: 'Vigormortis',
        description: '-1 Outsider',
        type: 'outsider',
        adjustment: -1,
      },
    ];
    expect(getNetAdjustment(modifiers)).toEqual({ outsiders: 1, minions: 0 });
  });

  it('returns variable when any outsider modifier is variable', () => {
    const modifiers: SetupModifier[] = [
      {
        characterId: 'baron',
        characterName: 'Baron',
        description: '+2 Outsiders',
        type: 'outsider',
        adjustment: 2,
      },
      {
        characterId: 'balloonist',
        characterName: 'Balloonist',
        description: '+0 or +1 Outsider',
        type: 'outsider',
        adjustment: 'variable',
      },
    ];
    expect(getNetAdjustment(modifiers).outsiders).toBe('variable');
  });

  it('sums fixed minion modifiers', () => {
    const modifiers: SetupModifier[] = [
      {
        characterId: 'lordoftyphon',
        characterName: 'Lord of Typhon',
        description: '+1 Minion',
        type: 'minion',
        adjustment: 1,
      },
    ];
    expect(getNetAdjustment(modifiers)).toEqual({ outsiders: 0, minions: 1 });
  });

  it('handles mixed outsider and minion modifiers', () => {
    const modifiers: SetupModifier[] = [
      {
        characterId: 'baron',
        characterName: 'Baron',
        description: '+2 Outsiders',
        type: 'outsider',
        adjustment: 2,
      },
      {
        characterId: 'lordoftyphon',
        characterName: 'Lord of Typhon',
        description: '+1 Minion',
        type: 'minion',
        adjustment: 1,
      },
    ];
    expect(getNetAdjustment(modifiers)).toEqual({ outsiders: 2, minions: 1 });
  });
});

describe('applyFixedModifiers', () => {
  const base = { townsfolk: 5, outsiders: 1, minions: 1, demons: 1 };

  it('returns an unchanged copy when there are no modifiers', () => {
    const result = applyFixedModifiers(base, []);
    expect(result).toEqual(base);
    expect(result).not.toBe(base); // new object
  });

  it('applies Baron +2 Outsiders (reduces townsfolk by 2)', () => {
    const modifiers: SetupModifier[] = [
      {
        characterId: 'baron',
        characterName: 'Baron',
        description: '+2 Outsiders',
        type: 'outsider',
        adjustment: 2,
      },
    ];
    const result = applyFixedModifiers(base, modifiers);
    expect(result).toEqual({ townsfolk: 3, outsiders: 3, minions: 1, demons: 1 });
  });

  it('applies Baron +2 and Vigormortis -1 (net +1 Outsider)', () => {
    const modifiers: SetupModifier[] = [
      {
        characterId: 'baron',
        characterName: 'Baron',
        description: '+2 Outsiders',
        type: 'outsider',
        adjustment: 2,
      },
      {
        characterId: 'vigormortis',
        characterName: 'Vigormortis',
        description: '-1 Outsider',
        type: 'outsider',
        adjustment: -1,
      },
    ];
    const result = applyFixedModifiers(base, modifiers);
    expect(result).toEqual({ townsfolk: 4, outsiders: 2, minions: 1, demons: 1 });
  });

  it('applies Lord of Typhon +1 Minion (reduces townsfolk)', () => {
    const modifiers: SetupModifier[] = [
      {
        characterId: 'lordoftyphon',
        characterName: 'Lord of Typhon',
        description: '+1 Minion',
        type: 'minion',
        adjustment: 1,
      },
    ];
    const result = applyFixedModifiers(base, modifiers);
    expect(result).toEqual({ townsfolk: 4, outsiders: 1, minions: 2, demons: 1 });
  });

  it('ignores variable modifiers', () => {
    const modifiers: SetupModifier[] = [
      {
        characterId: 'balloonist',
        characterName: 'Balloonist',
        description: '+0 or +1 Outsider',
        type: 'outsider',
        adjustment: 'variable',
      },
    ];
    const result = applyFixedModifiers(base, modifiers);
    expect(result).toEqual(base);
  });

  it('clamps townsfolk to 0 when modifiers exceed available', () => {
    const tinyBase = { townsfolk: 1, outsiders: 0, minions: 1, demons: 1 };
    const modifiers: SetupModifier[] = [
      {
        characterId: 'baron',
        characterName: 'Baron',
        description: '+2 Outsiders',
        type: 'outsider',
        adjustment: 2,
      },
    ];
    const result = applyFixedModifiers(tinyBase, modifiers);
    expect(result.townsfolk).toBe(0);
    expect(result.outsiders).toBe(2);
  });

  it('clamps outsiders to 0 when net modifier is negative beyond base', () => {
    const noOutsiders = { townsfolk: 5, outsiders: 0, minions: 1, demons: 1 };
    const modifiers: SetupModifier[] = [
      {
        characterId: 'vigormortis',
        characterName: 'Vigormortis',
        description: '-1 Outsider',
        type: 'outsider',
        adjustment: -1,
      },
    ];
    const result = applyFixedModifiers(noOutsiders, modifiers);
    expect(result.outsiders).toBe(0);
    // Townsfolk gains 1 back from the removed outsider
    expect(result.townsfolk).toBe(6);
  });

  it('does not modify demons', () => {
    const modifiers: SetupModifier[] = [
      {
        characterId: 'baron',
        characterName: 'Baron',
        description: '+2 Outsiders',
        type: 'outsider',
        adjustment: 2,
      },
    ];
    expect(applyFixedModifiers(base, modifiers).demons).toBe(1);
  });
});
