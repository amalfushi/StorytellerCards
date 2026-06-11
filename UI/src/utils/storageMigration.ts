/**
 * One-time storage migration for the M41 seating-model rewrite.
 *
 * M41 reshapes Session / Game JSON in ways that are incompatible with the M40
 * (and earlier) shape. Rather than versioning each blob, we wipe every
 * `storyteller-*` localStorage key the first time the user boots an M41 client
 * and stamp a version marker so the wipe is idempotent.
 *
 * Exported as a function so the boot path can call it before any provider
 * mounts; the providers then hydrate from a clean slate.
 */

import { SEATING_MODEL_VERSION } from '@/types/index.ts';

const VERSION_KEY = 'storyteller-data-version';

export function applyM41StorageMigration(storage: Storage = localStorage): void {
  let current: string | null;
  try {
    current = storage.getItem(VERSION_KEY);
  } catch {
    return;
  }
  if (current === String(SEATING_MODEL_VERSION)) return;

  const keysToRemove: string[] = [];
  try {
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (k && k.startsWith('storyteller-') && k !== VERSION_KEY) {
        keysToRemove.push(k);
      }
    }
    for (const k of keysToRemove) storage.removeItem(k);
    storage.setItem(VERSION_KEY, String(SEATING_MODEL_VERSION));
  } catch {
    /* storage may be unavailable; nothing safe to do */
  }
}
