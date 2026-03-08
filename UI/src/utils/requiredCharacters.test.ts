import { describe, it, expect } from 'vitest';
import { getRequiredCharacters, getSetupPrompts } from './requiredCharacters';

describe('getRequiredCharacters', () => {
  it('returns an empty array when no characters have requirements', () => {
    expect(getRequiredCharacters(['washerwoman', 'imp', 'drunk'])).toEqual([]);
  });

  it('flags Choirboy when King is missing from the script', () => {
    const result = getRequiredCharacters(['choirboy', 'imp']);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      sourceCharacterId: 'choirboy',
      sourceCharacterName: 'Choirboy',
      requiredCharacterId: 'king',
      requiredCharacterName: 'King',
    });
    expect(result[0].reason).toContain('Choirboy');
    expect(result[0].reason).toContain('King');
  });

  it('does NOT flag Choirboy when King is already on the script', () => {
    const result = getRequiredCharacters(['choirboy', 'king', 'imp']);
    expect(result).toEqual([]);
  });

  it('flags Huntsman when Damsel is missing from the script', () => {
    const result = getRequiredCharacters(['huntsman', 'imp']);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      sourceCharacterId: 'huntsman',
      sourceCharacterName: 'Huntsman',
      requiredCharacterId: 'damsel',
      requiredCharacterName: 'Damsel',
    });
  });

  it('does NOT flag Huntsman when Damsel is already on the script', () => {
    const result = getRequiredCharacters(['huntsman', 'damsel', 'imp']);
    expect(result).toEqual([]);
  });

  it('flags both Choirboy and Huntsman when both are missing their required chars', () => {
    const result = getRequiredCharacters(['choirboy', 'huntsman', 'imp']);
    expect(result).toHaveLength(2);
    const ids = result.map((r) => r.sourceCharacterId);
    expect(ids).toContain('choirboy');
    expect(ids).toContain('huntsman');
  });

  it('ignores unknown character IDs gracefully', () => {
    expect(getRequiredCharacters(['unknownchar'])).toEqual([]);
  });

  it('preserves input order', () => {
    const result = getRequiredCharacters(['huntsman', 'choirboy']);
    expect(result[0].sourceCharacterId).toBe('huntsman');
    expect(result[1].sourceCharacterId).toBe('choirboy');
  });
});

describe('getSetupPrompts', () => {
  it('returns an empty array when no characters have setup prompts', () => {
    expect(getSetupPrompts(['washerwoman', 'imp'])).toEqual([]);
  });

  it('returns a prompt for Bounty Hunter', () => {
    const result = getSetupPrompts(['bountyhunter', 'imp']);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      characterId: 'bountyhunter',
      characterName: 'Bounty Hunter',
    });
    expect(result[0].prompt).toContain('evil');
    expect(result[0].prompt).toContain('Townsfolk');
  });

  it('does not flag Bounty Hunter as a required character', () => {
    const required = getRequiredCharacters(['bountyhunter', 'imp']);
    expect(required).toEqual([]);
  });

  it('ignores unknown character IDs gracefully', () => {
    expect(getSetupPrompts(['unknownchar'])).toEqual([]);
  });
});
