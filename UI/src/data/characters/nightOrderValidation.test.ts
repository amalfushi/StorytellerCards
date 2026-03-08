/**
 * Night order validation test — compares our character night order numbers
 * against the canonical nightsheet.json from the official BotC data.
 *
 * The nightsheet.json contains ordered arrays of character IDs.
 * Array position implies ordering (lower index = earlier in night).
 * Our characters use numeric `order` values in firstNight/otherNights.
 *
 * This test validates that our ordering matches the canonical source,
 * and documents any intentional deviations.
 */

import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { allCharacters } from './index.ts';

interface NightSheet {
  firstNight: string[];
  otherNight: string[];
}

// Structural entries in our system that appear in nightsheet.json
const STRUCTURAL_IDS = new Set(['dusk', 'minioninfo', 'demoninfo', 'dawn']);

const nightsheetPath = path.resolve(
  __dirname,
  '../../../../../botc-release/resources/data/nightsheet.json',
);

// Only run these tests when nightsheet.json is available (CI may not have botc-release)
const nightsheetExists = fs.existsSync(nightsheetPath);

describe.skipIf(!nightsheetExists)('Night order validation against nightsheet.json', () => {
  let nightsheet: NightSheet;

  if (nightsheetExists) {
    nightsheet = JSON.parse(fs.readFileSync(nightsheetPath, 'utf-8'));
  }

  it('our first night order matches canonical relative ordering', () => {
    const canonicalOrder = nightsheet.firstNight;

    // Build map: characterId → canonical position
    const canonicalPositions = new Map<string, number>();
    canonicalOrder.forEach((id, index) => {
      canonicalPositions.set(id, index);
    });

    // Get our characters that have first night actions, sorted by our order
    const ourChars = allCharacters
      .filter((c) => c.firstNight !== null)
      .sort((a, b) => a.firstNight!.order - b.firstNight!.order);

    // Check that all characters in canonical list exist in our list (and vice versa)
    const ourIds = new Set(ourChars.map((c) => c.id));
    const canonicalCharIds = canonicalOrder.filter((id) => !STRUCTURAL_IDS.has(id));
    const ourCharIds = [...ourIds];

    // Find characters missing from either side
    const missingFromUs = canonicalCharIds.filter((id) => !ourIds.has(id));
    const missingFromCanonical = ourCharIds.filter((id) => !canonicalPositions.has(id));

    // Report but don't fail on missing — some characters may not have night actions
    if (missingFromUs.length > 0) {
      console.log('Characters in canonical but not in our first night:', missingFromUs);
    }
    if (missingFromCanonical.length > 0) {
      console.log('Characters in our first night but not in canonical:', missingFromCanonical);
    }

    // Validate relative ordering: for characters in both lists,
    // their relative order should match
    const inversions: string[] = [];
    for (let i = 0; i < ourChars.length; i++) {
      for (let j = i + 1; j < ourChars.length; j++) {
        const a = ourChars[i];
        const b = ourChars[j];
        const posA = canonicalPositions.get(a.id);
        const posB = canonicalPositions.get(b.id);
        if (posA === undefined || posB === undefined) continue;
        // a comes before b in our order (i < j), so posA should be < posB
        if (posA > posB) {
          inversions.push(
            `${a.id}(our:${a.firstNight!.order},canon:${posA}) vs ${b.id}(our:${b.firstNight!.order},canon:${posB})`,
          );
        }
      }
    }

    expect(inversions).toEqual([]);
  });

  it('our other nights order matches canonical relative ordering', () => {
    const canonicalOrder = nightsheet.otherNight;

    const canonicalPositions = new Map<string, number>();
    canonicalOrder.forEach((id, index) => {
      canonicalPositions.set(id, index);
    });

    const ourChars = allCharacters
      .filter((c) => c.otherNights !== null)
      .sort((a, b) => a.otherNights!.order - b.otherNights!.order);

    const ourIds = new Set(ourChars.map((c) => c.id));
    const canonicalCharIds = canonicalOrder.filter((id) => !STRUCTURAL_IDS.has(id));
    const ourCharIds = [...ourIds];

    const missingFromUs = canonicalCharIds.filter((id) => !ourIds.has(id));
    const missingFromCanonical = ourCharIds.filter((id) => !canonicalPositions.has(id));

    if (missingFromUs.length > 0) {
      console.log('Characters in canonical but not in our other nights:', missingFromUs);
    }
    if (missingFromCanonical.length > 0) {
      console.log('Characters in our other nights but not in canonical:', missingFromCanonical);
    }

    const inversions: string[] = [];
    for (let i = 0; i < ourChars.length; i++) {
      for (let j = i + 1; j < ourChars.length; j++) {
        const a = ourChars[i];
        const b = ourChars[j];
        const posA = canonicalPositions.get(a.id);
        const posB = canonicalPositions.get(b.id);
        if (posA === undefined || posB === undefined) continue;
        if (posA > posB) {
          inversions.push(
            `${a.id}(our:${a.otherNights!.order},canon:${posA}) vs ${b.id}(our:${b.otherNights!.order},canon:${posB})`,
          );
        }
      }
    }

    expect(inversions).toEqual([]);
  });

  it('structural entries are in correct relative position', () => {
    const fnOrder = nightsheet.firstNight;
    const minionPos = fnOrder.indexOf('minioninfo');
    const demonPos = fnOrder.indexOf('demoninfo');

    // Minion info should come before demon info
    expect(minionPos).toBeLessThan(demonPos);
    expect(minionPos).toBeGreaterThan(0); // Not the first entry
  });
});
