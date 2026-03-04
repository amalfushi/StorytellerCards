import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  useCharacterLookup,
  humanizeCharacterId,
  getFallbackCharacter,
} from './useCharacterLookup.ts';
import { allCharacters } from '@/data/characters/index.ts';
import { Alignment } from '@/types/index.ts';

describe('humanizeCharacterId', () => {
  it('capitalises the first letter of a lowercase ID', () => {
    expect(humanizeCharacterId('imp')).toBe('Imp');
  });

  it('inserts spaces before capital letters (camelCase)', () => {
    expect(humanizeCharacterId('snakeCharmer')).toBe('Snake Charmer');
  });

  it('handles fully lowercase multi-word IDs without capitals', () => {
    // e.g. "villageidiot" stays "Villageidiot" (no capital boundaries to split on)
    expect(humanizeCharacterId('villageidiot')).toBe('Villageidiot');
  });

  it('handles empty string', () => {
    expect(humanizeCharacterId('')).toBe('');
  });

  it('handles single character', () => {
    expect(humanizeCharacterId('a')).toBe('A');
  });
});

describe('getFallbackCharacter', () => {
  it('returns a CharacterDef with the given id', () => {
    const fallback = getFallbackCharacter('unknownchar');
    expect(fallback.id).toBe('unknownchar');
  });

  it('uses humanized name from the ID', () => {
    const fallback = getFallbackCharacter('mysteryRole');
    expect(fallback.name).toBe('Mystery Role');
  });

  it('sets type to Unknown', () => {
    const fallback = getFallbackCharacter('test');
    expect(fallback.type).toBe('Unknown');
  });

  it('sets defaultAlignment to Unknown', () => {
    const fallback = getFallbackCharacter('test');
    expect(fallback.defaultAlignment).toBe(Alignment.Unknown);
  });

  it('sets abilityShort to <TODO>', () => {
    const fallback = getFallbackCharacter('test');
    expect(fallback.abilityShort).toBe('<TODO>');
  });

  it('has null night actions', () => {
    const fallback = getFallbackCharacter('test');
    expect(fallback.firstNight).toBeNull();
    expect(fallback.otherNights).toBeNull();
  });

  it('uses grey placeholder icon', () => {
    const fallback = getFallbackCharacter('test');
    expect(fallback.icon).toEqual({ placeholder: '#9e9e9e' });
  });

  it('has empty reminders array', () => {
    const fallback = getFallbackCharacter('test');
    expect(fallback.reminders).toEqual([]);
  });
});

describe('useCharacterLookup', () => {
  it('returns an object with getCharacter, getCharactersByIds, and allCharacters', () => {
    const { result } = renderHook(() => useCharacterLookup());
    expect(result.current.getCharacter).toBeDefined();
    expect(typeof result.current.getCharacter).toBe('function');
    expect(result.current.getCharactersByIds).toBeDefined();
    expect(typeof result.current.getCharactersByIds).toBe('function');
    expect(result.current.allCharacters).toBeDefined();
    expect(Array.isArray(result.current.allCharacters)).toBe(true);
  });

  it('allCharacters contains all characters from the registry', () => {
    const { result } = renderHook(() => useCharacterLookup());
    expect(result.current.allCharacters.length).toBe(allCharacters.length);
    expect(result.current.allCharacters).toBe(allCharacters);
  });

  it('can look up known characters by ID (imp)', () => {
    const { result } = renderHook(() => useCharacterLookup());
    const imp = result.current.getCharacter('imp');
    expect(imp).toBeDefined();
    expect(imp!.id).toBe('imp');
    expect(imp!.name).toBe('Imp');
  });

  it('can look up known characters by ID (poisoner)', () => {
    const { result } = renderHook(() => useCharacterLookup());
    const poisoner = result.current.getCharacter('poisoner');
    expect(poisoner).toBeDefined();
    expect(poisoner!.id).toBe('poisoner');
  });

  it('returns a fallback for unknown character IDs', () => {
    const { result } = renderHook(() => useCharacterLookup());
    const unknown = result.current.getCharacter('doesnotexist');
    // getCharacter returns fallback (not undefined) for unknown IDs
    expect(unknown).toBeDefined();
    expect(unknown!.id).toBe('doesnotexist');
    expect(unknown!.abilityShort).toBe('<TODO>');
  });

  it('getCharactersByIds returns array of character defs', () => {
    const { result } = renderHook(() => useCharacterLookup());
    const chars = result.current.getCharactersByIds(['imp', 'poisoner']);
    expect(chars).toHaveLength(2);
    expect(chars[0].id).toBe('imp');
    expect(chars[1].id).toBe('poisoner');
  });

  it('getCharactersByIds returns fallbacks for unknown IDs', () => {
    const { result } = renderHook(() => useCharacterLookup());
    const chars = result.current.getCharactersByIds(['imp', 'unknownchar']);
    expect(chars).toHaveLength(2);
    expect(chars[0].id).toBe('imp');
    expect(chars[1].id).toBe('unknownchar');
    expect(chars[1].abilityShort).toBe('<TODO>');
  });

  it('getCharactersByIds returns empty array for empty input', () => {
    const { result } = renderHook(() => useCharacterLookup());
    const chars = result.current.getCharactersByIds([]);
    expect(chars).toEqual([]);
  });

  it('returns same references on re-render (memoization)', () => {
    const { result, rerender } = renderHook(() => useCharacterLookup());
    const first = result.current;
    rerender();
    const second = result.current;

    expect(second.getCharacter).toBe(first.getCharacter);
    expect(second.getCharactersByIds).toBe(first.getCharactersByIds);
    expect(second.allCharacters).toBe(first.allCharacters);
  });
});
