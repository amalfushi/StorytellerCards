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

  it('returns strings of consistent format (alphanumeric with possible dots)', () => {
    const id = generateId();
    // base-36 timestamp + base-36 random → alphanumeric characters
    expect(id).toMatch(/^[a-z0-9]+$/);
  });

  it('returns strings of reasonable length', () => {
    const id = generateId();
    // Timestamp part ~8-9 chars, random part ~10-11 chars ≈ 18-20 total
    expect(id.length).toBeGreaterThanOrEqual(10);
    expect(id.length).toBeLessThanOrEqual(30);
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
    // All should be unique even when called rapidly
    const unique = new Set(ids);
    expect(unique.size).toBe(100);
    // All should be valid strings
    ids.forEach((id) => {
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });
  });
});
