import { describe, it, expect } from 'vitest';
import { generateId } from './idGenerator.ts';

describe('generateId', () => {
  it('returns a string', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
  });

  it('returns a non-empty string', () => {
    const id = generateId();
    expect(id.length).toBeGreaterThan(0);
  });

  it('returns unique values on consecutive calls', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  it('returns 8-character uppercase alphanumeric strings', () => {
    const id = generateId();
    expect(id).toMatch(/^[23456789A-HJ-NP-Z]{8}$/);
    expect(id.length).toBe(8);
  });

  it('excludes ambiguous characters (0, O, 1, I)', () => {
    // Generate many IDs and verify none contain ambiguous chars
    for (let i = 0; i < 200; i++) {
      const id = generateId();
      expect(id).not.toMatch(/[01OI]/);
    }
  });

  it('produces no collisions in a batch of 1000 IDs', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      ids.add(generateId());
    }
    expect(ids.size).toBe(1000);
  });

  it('handles being called rapidly in succession', () => {
    const ids: string[] = [];
    for (let i = 0; i < 100; i++) {
      ids.push(generateId());
    }
    const unique = new Set(ids);
    expect(unique.size).toBe(100);
    ids.forEach((id) => {
      expect(typeof id).toBe('string');
      expect(id.length).toBe(8);
    });
  });
});
