import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { applyM41StorageMigration } from './storageMigration.ts';

const VERSION_KEY = 'storyteller-data-version';

class FakeStorage implements Storage {
  private map = new Map<string, string>();
  get length(): number {
    return this.map.size;
  }
  clear(): void {
    this.map.clear();
  }
  getItem(key: string): string | null {
    return this.map.has(key) ? (this.map.get(key) as string) : null;
  }
  key(index: number): string | null {
    return Array.from(this.map.keys())[index] ?? null;
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

describe('applyM41StorageMigration', () => {
  let storage: FakeStorage;

  beforeEach(() => {
    storage = new FakeStorage();
  });

  afterEach(() => {
    storage.clear();
  });

  it('wipes every storyteller-* key the first time it runs', () => {
    storage.setItem('storyteller-sessions', JSON.stringify({ stale: true }));
    storage.setItem('storyteller-game-abc', 'stale');
    storage.setItem('storyteller-script-xyz', 'keep-shape-but-wipe-anyway');
    storage.setItem('other-app', 'leave-alone');

    applyM41StorageMigration(storage);

    expect(storage.getItem('storyteller-sessions')).toBeNull();
    expect(storage.getItem('storyteller-game-abc')).toBeNull();
    expect(storage.getItem('storyteller-script-xyz')).toBeNull();
    expect(storage.getItem('other-app')).toBe('leave-alone');
    expect(storage.getItem(VERSION_KEY)).toBe('2');
  });

  it('is idempotent — second run leaves data alone', () => {
    applyM41StorageMigration(storage);
    storage.setItem('storyteller-sessions', JSON.stringify({ keep: true }));

    applyM41StorageMigration(storage);

    expect(storage.getItem('storyteller-sessions')).toBe(
      JSON.stringify({ keep: true }),
    );
  });

  it('does not touch keys that lack the storyteller- prefix', () => {
    storage.setItem('unrelated', 'value');
    applyM41StorageMigration(storage);
    expect(storage.getItem('unrelated')).toBe('value');
  });
});
