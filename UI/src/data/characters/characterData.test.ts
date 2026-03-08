import { describe, it, expect } from 'vitest';
import { allCharacters, characterMap, getCharacter } from './index.ts';
import { CharacterType, Alignment, NightChoiceType, Edition } from '@/types/index.ts';

// ── Valid value sets ──

const validCharacterTypes = Object.values(CharacterType) as string[];
const validAlignments = Object.values(Alignment) as string[];
const validNightChoiceTypes = Object.values(NightChoiceType) as string[];
const validEditions = Object.values(Edition) as string[];

// ── Expected type→alignment mapping ──

const typeAlignmentMap: Record<string, string> = {
  Townsfolk: 'Good',
  Outsider: 'Good',
  Minion: 'Evil',
  Demon: 'Evil',
  Traveller: 'Unknown',
};

// ══════════════════════════════════════════════════
// Per-character structural validation
// ══════════════════════════════════════════════════

describe.each(allCharacters)('Character: $name ($id)', (char) => {
  // ── 1. Required fields ──

  it('has valid required fields', () => {
    expect(typeof char.id).toBe('string');
    expect(char.id.length).toBeGreaterThan(0);

    expect(typeof char.name).toBe('string');
    expect(char.name.length).toBeGreaterThan(0);

    expect(validCharacterTypes).toContain(char.type);
    expect(validAlignments).toContain(char.defaultAlignment);

    expect(typeof char.abilityShort).toBe('string');
    expect(char.abilityShort.length).toBeGreaterThan(0);

    expect(Array.isArray(char.reminders)).toBe(true);
  });

  // ── 2. ID format ──

  it('has valid ID format', () => {
    expect(char.id).toBe(char.id.toLowerCase());
    expect(char.id).not.toMatch(/\s/);
    expect(char.id).toMatch(/^[a-z0-9]+$/);
  });

  // ── 3. Type-alignment consistency ──

  it('has correct default alignment for its type', () => {
    const expectedAlignment = typeAlignmentMap[char.type];
    if (expectedAlignment) {
      // Townsfolk, Outsider, Minion, Demon, Traveller have enforced alignment
      expect(char.defaultAlignment).toBe(expectedAlignment);
    }
    // Fabled and Loric: no enforcement (any alignment is valid)
  });

  // ── 4. NightAction structure (firstNight) ──

  it('has valid firstNight structure (if present)', () => {
    if (char.firstNight === null) return;

    const fn = char.firstNight;
    expect(typeof fn.order).toBe('number');
    expect(fn.order).toBeGreaterThan(0);

    expect(typeof fn.helpText).toBe('string');
    expect(fn.helpText.length).toBeGreaterThan(0);

    expect(Array.isArray(fn.subActions)).toBe(true);
    expect(fn.subActions.length).toBeGreaterThan(0);

    fn.subActions.forEach((sa) => {
      expect(typeof sa.id).toBe('string');
      expect(sa.id.length).toBeGreaterThan(0);
      expect(typeof sa.description).toBe('string');
      expect(sa.description.length).toBeGreaterThan(0);
      expect(typeof sa.isConditional).toBe('boolean');
    });
  });

  // ── 4b. NightAction structure (otherNights) ──

  it('has valid otherNights structure (if present)', () => {
    if (char.otherNights === null) return;

    const on = char.otherNights;
    expect(typeof on.order).toBe('number');
    expect(on.order).toBeGreaterThan(0);

    expect(typeof on.helpText).toBe('string');
    expect(on.helpText.length).toBeGreaterThan(0);

    expect(Array.isArray(on.subActions)).toBe(true);
    expect(on.subActions.length).toBeGreaterThan(0);

    on.subActions.forEach((sa) => {
      expect(typeof sa.id).toBe('string');
      expect(sa.id.length).toBeGreaterThan(0);
      expect(typeof sa.description).toBe('string');
      expect(sa.description.length).toBeGreaterThan(0);
      expect(typeof sa.isConditional).toBe('boolean');
    });
  });

  // ── 6. NightChoice validation ──

  it('has valid NightChoice entries (if present)', () => {
    const nightActions = [char.firstNight, char.otherNights].filter(Boolean);
    for (const action of nightActions) {
      if (!action!.choices) continue;
      for (const choice of action!.choices) {
        expect(validNightChoiceTypes).toContain(choice.type);
        expect(typeof choice.label).toBe('string');
        expect(choice.label.length).toBeGreaterThan(0);
        expect(typeof choice.maxSelections).toBe('number');
        expect(choice.maxSelections).toBeGreaterThan(0);
      }
    }
  });

  // ── 7. ReminderToken validation ──

  it('has valid reminder tokens', () => {
    for (const reminder of char.reminders) {
      expect(typeof reminder.id).toBe('string');
      expect(reminder.id.length).toBeGreaterThan(0);
      expect(typeof reminder.text).toBe('string');
      expect(reminder.text.length).toBeGreaterThan(0);
    }

    // No duplicate reminder IDs within a single character
    const reminderIds = char.reminders.map((r) => r.id);
    expect(new Set(reminderIds).size).toBe(reminderIds.length);
  });

  // ── 8. SetupModification validation ──

  it('has valid setupModification (if present)', () => {
    if (!char.setupModification) return;

    expect(typeof char.setupModification.description).toBe('string');
    expect(char.setupModification.description.length).toBeGreaterThan(0);
  });

  // ── 9. StorytellerSetup validation ──

  it('has valid storytellerSetup (if present)', () => {
    if (!char.storytellerSetup) return;

    expect(Array.isArray(char.storytellerSetup)).toBe(true);
    for (const step of char.storytellerSetup) {
      expect(typeof step.id).toBe('string');
      expect(step.id.length).toBeGreaterThan(0);
      expect(typeof step.description).toBe('string');
      expect(step.description.length).toBeGreaterThan(0);
    }
  });

  // ── 10. M22: Flavor text validation ──

  it('has non-empty flavor text', () => {
    expect(typeof char.flavor).toBe('string');
    expect(char.flavor!.length).toBeGreaterThan(0);
  });

  // ── 11. M22: Edition validation ──

  it('has a valid edition', () => {
    expect(char.edition).toBeDefined();
    expect(validEditions).toContain(char.edition);
  });

  // ── 12. M22: Jinx validation (if present) ──

  it('has valid jinx entries (if present)', () => {
    if (!char.jinxes || char.jinxes.length === 0) return;
    for (const jinx of char.jinxes) {
      expect(typeof jinx.characterId).toBe('string');
      expect(jinx.characterId.length).toBeGreaterThan(0);
      expect(typeof jinx.description).toBe('string');
      expect(jinx.description.length).toBeGreaterThan(0);
    }
  });

  // ── 13. M22: Setup flag validation ──

  it('has valid setup flag (if present)', () => {
    if (char.setup !== undefined) {
      expect(typeof char.setup).toBe('boolean');
    }
  });

  // ── 14. M22: Global reminders validation ──

  it('has valid remindersGlobal (if present)', () => {
    if (!char.remindersGlobal) return;
    expect(Array.isArray(char.remindersGlobal)).toBe(true);
    for (const r of char.remindersGlobal) {
      expect(typeof r.id).toBe('string');
      expect(r.id.length).toBeGreaterThan(0);
      expect(typeof r.text).toBe('string');
      expect(r.text.length).toBeGreaterThan(0);
      expect(r.isGlobal).toBe(true);
    }
  });
});

// ══════════════════════════════════════════════════
// Cross-character validations
// ══════════════════════════════════════════════════

describe('Cross-character validations', () => {
  // ── 2b. No duplicate IDs ──

  it('has no duplicate character IDs', () => {
    const ids = allCharacters.map((c) => c.id);
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(duplicates).toEqual([]);
  });

  // ── 5. Night order uniqueness ──

  it('has unique firstNight order numbers', () => {
    const firstNightChars = allCharacters.filter((c) => c.firstNight !== null);
    const seen = new Map<number, string[]>();

    for (const char of firstNightChars) {
      const order = char.firstNight!.order;
      const existing = seen.get(order) ?? [];
      existing.push(`${char.name} (${char.id})`);
      seen.set(order, existing);
    }

    const duplicates = [...seen.entries()]
      .filter(([, names]) => names.length > 1)
      .map(([order, names]) => `order ${order}: ${names.join(', ')}`);

    expect(duplicates).toEqual([]);
  });

  it('has unique otherNights order numbers', () => {
    const otherNightsChars = allCharacters.filter((c) => c.otherNights !== null);
    const seen = new Map<number, string[]>();

    for (const char of otherNightsChars) {
      const order = char.otherNights!.order;
      const existing = seen.get(order) ?? [];
      existing.push(`${char.name} (${char.id})`);
      seen.set(order, existing);
    }

    const duplicates = [...seen.entries()]
      .filter(([, names]) => names.length > 1)
      .map(([order, names]) => `order ${order}: ${names.join(', ')}`);

    expect(duplicates).toEqual([]);
  });
});

// ══════════════════════════════════════════════════
// Character registry consistency
// ══════════════════════════════════════════════════

describe('Character registry consistency', () => {
  // ── 10a. Array and map sizes match ──

  it('allCharacters.length equals characterMap.size', () => {
    expect(allCharacters.length).toBe(characterMap.size);
  });

  // ── 10b. Every character is findable via getCharacter() ──

  it('every character is findable via getCharacter()', () => {
    for (const char of allCharacters) {
      const found = getCharacter(char.id);
      expect(found).toBeDefined();
      expect(found!.id).toBe(char.id);
    }
  });

  // ── 10c. characterMap returns the same object as the array entry ──

  it('characterMap returns the same object reference as the array entry', () => {
    for (const char of allCharacters) {
      const mapped = characterMap.get(char.id);
      expect(mapped).toBe(char); // strict reference equality
    }
  });
});

// ══════════════════════════════════════════════════
// Summary stats
// ══════════════════════════════════════════════════

describe('Character registry summary', () => {
  it('prints character count summary', () => {
    const counts: Record<string, number> = {};
    for (const char of allCharacters) {
      counts[char.type] = (counts[char.type] ?? 0) + 1;
    }

    const lines: string[] = [`Character Registry: ${allCharacters.length} total`];
    for (const type of validCharacterTypes) {
      if (counts[type]) {
        lines.push(`  - ${type}: ${counts[type]}`);
      }
    }

    // Log the summary (visible in verbose test output)
    console.log('\n' + lines.join('\n') + '\n');

    // Sanity: total must match
    const sum = Object.values(counts).reduce((a, b) => a + b, 0);
    expect(sum).toBe(allCharacters.length);
  });
});

// ══════════════════════════════════════════════════
// M22: BotC data import validations
// ══════════════════════════════════════════════════

describe('M22 — Jinx data validation', () => {
  it('has at least 27 characters with jinxes', () => {
    const withJinxes = allCharacters.filter((c) => c.jinxes && c.jinxes.length > 0);
    expect(withJinxes.length).toBeGreaterThanOrEqual(27);
  });

  it('has bidirectional jinx mirroring', () => {
    // For every jinx A→B, there should be B→A
    const missingMirrors: string[] = [];
    for (const char of allCharacters) {
      if (!char.jinxes) continue;
      for (const jinx of char.jinxes) {
        const other = allCharacters.find((c) => c.id === jinx.characterId);
        if (!other) continue;
        const mirror = other.jinxes?.find((j) => j.characterId === char.id);
        if (!mirror) {
          missingMirrors.push(`${char.id} → ${jinx.characterId}`);
        }
      }
    }
    expect(missingMirrors).toEqual([]);
  });

  it('all jinx characterIds reference existing characters', () => {
    const invalid: string[] = [];
    for (const char of allCharacters) {
      if (!char.jinxes) continue;
      for (const jinx of char.jinxes) {
        if (!characterMap.has(jinx.characterId)) {
          invalid.push(`${char.id} → ${jinx.characterId}`);
        }
      }
    }
    expect(invalid).toEqual([]);
  });
});

describe('M22 — Setup flag validation', () => {
  it('has exactly 23 characters with setup: true', () => {
    const withSetup = allCharacters.filter((c) => c.setup === true);
    expect(withSetup.length).toBe(23);
  });
});

describe('M22 — Global reminders validation', () => {
  it('has exactly 5 characters with remindersGlobal', () => {
    const withGlobal = allCharacters.filter(
      (c) => c.remindersGlobal && c.remindersGlobal.length > 0,
    );
    expect(withGlobal.length).toBe(5);
  });

  it('all global reminders have isGlobal: true', () => {
    for (const char of allCharacters) {
      if (!char.remindersGlobal) continue;
      for (const r of char.remindersGlobal) {
        expect(r.isGlobal).toBe(true);
      }
    }
  });
});

describe('M22 — Edition data validation', () => {
  it('has all editions represented', () => {
    const editionsFound = new Set(allCharacters.map((c) => c.edition).filter(Boolean));
    for (const edition of validEditions) {
      expect(editionsFound.has(edition)).toBe(true);
    }
  });
});

describe('M22 — WebP icon paths', () => {
  it('all character icon paths use .webp extension', () => {
    const wrongExtension: string[] = [];
    for (const char of allCharacters) {
      if (!char.icon) continue;
      const paths = [char.icon.small, char.icon.medium, char.icon.large].filter(Boolean);
      for (const p of paths) {
        if (p && !p.endsWith('.webp')) {
          wrongExtension.push(`${char.id}: ${p}`);
        }
      }
    }
    expect(wrongExtension).toEqual([]);
  });
});
