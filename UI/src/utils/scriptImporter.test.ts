import { describe, it, expect } from 'vitest';
import { importScript } from './scriptImporter';

describe('importScript', () => {
  it('parses a valid Boozling-format script', () => {
    const json = [{ id: '_meta', name: 'Boozling', author: 'Lau' }, 'noble', 'pixie', 'chef'];

    const result = importScript(json);

    expect(result.id).toBe('boozling');
    expect(result.name).toBe('Boozling');
    expect(result.author).toBe('Lau');
    expect(result.characterIds).toEqual(['noble', 'pixie', 'chef']);
  });

  it('throws for invalid format (no _meta)', () => {
    const json = ['noble', 'pixie'];
    expect(() => importScript(json)).toThrow('_meta');
  });

  it('throws for an empty array', () => {
    expect(() => importScript([])).toThrow('must not be empty');
  });

  it('throws for non-array input', () => {
    expect(() => importScript({ name: 'test' })).toThrow('must be an array');
  });

  it('generates script ID from name (lowercase, no special chars)', () => {
    const json = [{ id: '_meta', name: 'My Custom Script!', author: 'Author' }, 'imp'];

    const result = importScript(json);
    expect(result.id).toBe('mycustomscript');
  });

  it('generates script ID with spaces and mixed case', () => {
    const json = [{ id: '_meta', name: 'Trouble Brewing', author: 'TPI' }, 'washerwoman'];

    const result = importScript(json);
    expect(result.id).toBe('troublebrewing');
  });

  it('skips non-string entries after _meta', () => {
    const json = [{ id: '_meta', name: 'Test', author: 'A' }, 'noble', 42, 'pixie', null];

    const result = importScript(json);
    expect(result.characterIds).toEqual(['noble', 'pixie']);
  });

  it('throws when _meta is missing required name field', () => {
    const json = [{ id: '_meta', author: 'Lau' }];
    expect(() => importScript(json)).toThrow('_meta');
  });

  it('throws when _meta is missing required author field', () => {
    const json = [{ id: '_meta', name: 'Test' }];
    expect(() => importScript(json)).toThrow('_meta');
  });
});
