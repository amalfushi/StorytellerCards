# Milestone 28 — Alignment-Based Icon Variants

## Status: ✅ Complete

**Completed:** 2026-03-09

**Summary:** Implemented alignment-based icon variants for character tokens. Player tokens now show `_g.webp` (good) or `_e.webp` (evil) icons based on the player's current alignment. Reminder tokens continue to use the default/neutral icon. Fabled/Loric characters gracefully fall back to the base icon since they have no alignment variants.

**Key changes:**
- Copied 312 alignment-variant icon files (156 `_e` + 156 `_g`) from botc-release
- Updated `getCharacterIconPath()` to accept optional alignment parameter
- Added `getDefaultCharacterIconPath()` for type-appropriate defaults
- Updated `CharacterIconImage` with fallback chain: alignment variant → base → letter circle
- Updated `PlayerToken`, `PlayerRow`, `NightFlashcard` to pass player alignment
- Updated `CharacterSelection` and `CharacterAssignmentDialog` to use default alignment icons
- 21 new tests (3849 total across 70 files)

> **Goal:** Use the official BotC alignment-variant character icons (`_e.webp` for evil, `_g.webp` for good, no suffix for neutral) so player character tokens reflect their current alignment, while reminder tokens always show the character's default alignment icon.

---

## 1. Problem Statement

The `botc-release` repo provides alignment-variant icons that we're not using:

| Suffix | Meaning | Count | Used For |
|--------|---------|-------|----------|
| `{id}.webp` | Neutral/unaligned | ~36 | Fabled, Loric, Travellers (no inherent alignment) |
| `{id}_g.webp` | Good variant | ~156 | Townsfolk, Outsiders, or characters reassigned to good |
| `{id}_e.webp` | Evil variant | ~156 | Minions, Demons, or characters reassigned to evil |

Currently we use a single icon per character (`{id}Icon.webp` in a flat directory). This means:
- A Minion who was reassigned to good (e.g., via Pit-Hag) still shows the evil icon
- Travellers show the same icon regardless of alignment
- The Marionette's apparent character doesn't visually match good alignment

### Icon Rules

- **Townsfolk/Outsiders**: Use `_g.webp` by default. If reassigned evil (Bounty Hunter, Fang Gu, etc.), use `_e.webp`.
- **Minion/Demon**: Use `_e.webp` by default. If reassigned good (rare), use `_g.webp`.
- **Travellers**: Use base `.webp` (no suffix) when alignment is Unknown. Use `_g.webp` or `_e.webp` when alignment is assigned.
- **Fabled/Loric**: Always use base `.webp` (no suffix) — they don't have alignment variants.
- **Reminder tokens**: Always show the character's **default alignment** icon (not the player's current alignment). E.g., a Washerwoman reminder always shows the good Washerwoman icon.

---

## 2. Solution Overview

### 2.1 Copy Alignment Variant Icons

Copy all `_e.webp` and `_g.webp` variants from `botc-release/resources/characters/` into our `UI/public/icons/characters/` directory.

Current state: we have `{id}Icon.webp` files (copied from the base/neutral variants in M22).

New structure:
```
UI/public/icons/characters/
  impIcon.webp        ← keep existing (rename from neutral if needed)
  impIcon_e.webp      ← evil variant (NEW)
  impIcon_g.webp      ← good variant (NEW)
  washerwomanIcon.webp
  washerwomanIcon_e.webp  (NEW)
  washerwomanIcon_g.webp  (NEW)
  angelIcon.webp      ← Fabled: no _e/_g variants exist
  ...
```

### 2.2 Update Icon Resolution Logic

Update `characterIcon.ts` to support alignment-based paths:

```typescript
export function getCharacterIconPath(characterId: string, alignment?: string): string {
  const suffix = alignment === 'Good' ? '_g' : alignment === 'Evil' ? '_e' : '';
  return `/icons/characters/${characterId}Icon${suffix}.webp`;
}
```

### 2.3 Update Rendering

- **Player character icons** (TownSquare, PlayerList, NightFlashcard player info): Pass the player's current alignment to get the matching variant.
- **Reminder token icons**: Always use `getCharacterIconPath(sourceCharacterId)` WITHOUT alignment (gets default/neutral icon, which is the character's type-appropriate icon).
- **Character detail modal / script views**: Show default alignment icon (from `CharacterDef.defaultAlignment`).
- **CharacterIconImage fallback**: If the alignment variant doesn't exist (Fabled/Loric), fall back to base icon.

---

## 3. Task List

### Phase 1: Copy Icon Variants
- [x] Write a script to copy `_e.webp` and `_g.webp` files from `botc-release/resources/characters/` editions into `UI/public/icons/characters/`
- [x] Flatten edition subdirectories (tb/, bmr/, snv/, carousel/) into our flat structure
- [x] Name format: `{id}Icon_e.webp`, `{id}Icon_g.webp`
- [x] Verify 156 `_e` + 156 `_g` files copied (~312 new files)
- [x] Fabled/Loric have no variants — skip (12 + 9 = 21 base-only icons)

### Phase 2: Update Icon Resolution
- [x] Update `getCharacterIconPath()` in `characterIcon.ts` to accept optional `alignment` parameter
- [x] When alignment provided: append `_e` or `_g` suffix
- [x] When no alignment (or 'Unknown'): use base path (no suffix)
- [x] Add `getDefaultCharacterIconPath(characterId: string, characterType: string)` helper that returns the type-appropriate default (`_g` for Townsfolk/Outsider, `_e` for Minion/Demon, base for others)
- [x] Update `CharacterIconImage.tsx` to handle fallback: if alignment variant fails to load, try base icon before showing letter fallback

### Phase 3: Update Player Icon Rendering
- [x] **TownSquare PlayerToken**: Pass player's `actualAlignment` (or `visibleAlignment` depending on day/night mode) to `getCharacterIconPath`
- [x] **PlayerList PlayerRow**: Same — pass alignment for player icon
- [x] **NightFlashcard player info**: Pass alignment
- [x] **CharacterAssignmentDialog**: Show default alignment icons (not player-specific)
- [x] **CharacterSelection**: Show default alignment icons

### Phase 4: Reminder Token Icons — Keep Default
- [x] Verify `ReminderTokenChip` uses `getCharacterIconPath(sourceCharacterId)` WITHOUT alignment — shows default type icon
- [x] This should already work since reminder tokens don't pass alignment — verify and add test

### Phase 5: Traveller Alignment Handling
- [x] Travellers with `Unknown` alignment: show base icon (no suffix)
- [x] When Traveller alignment is set to Good/Evil (via game action): show `_g`/`_e` variant
- [x] Verify traveller characters have `defaultAlignment: 'Unknown'` or handle appropriately

### Phase 6: Tests & Documentation
- [x] Test `getCharacterIconPath` with all alignment variants
- [x] Test `CharacterIconImage` fallback chain (alignment variant → base → letter)
- [x] Test PlayerToken renders correct variant based on alignment
- [x] Test ReminderTokenChip uses default (no alignment) icon
- [x] Update milestone28.md with `## Status: ✅ Complete`
- [x] Update docs/progress.md
- [x] Update AGENTS.md test stats
- [x] Check all task checkboxes

---

## 4. Files Affected

### New Files
| File | Purpose |
|------|---------|
| `scripts/copyIconVariants.js` | One-time copy script |
| `UI/public/icons/characters/*_e.webp` | ~156 evil variant icons |
| `UI/public/icons/characters/*_g.webp` | ~156 good variant icons |

### Modified
| File | Change |
|------|--------|
| `UI/src/utils/characterIcon.ts` | `getCharacterIconPath` alignment parameter, `getDefaultCharacterIconPath` |
| `UI/src/utils/characterIcon.test.ts` | Tests for alignment variants |
| `UI/src/components/common/CharacterIconImage.tsx` | Fallback chain for missing variants |
| `UI/src/components/TownSquare/PlayerToken.tsx` | Pass player alignment for icon |
| `UI/src/components/PlayerList/PlayerRow.tsx` | Pass player alignment for icon |
| `UI/src/components/NightPhase/NightFlashcard.tsx` | Pass alignment for player info icon |
| `UI/src/components/common/ReminderTokenChip.tsx` | Verify uses default (no alignment) — no change expected |

---

## 5. Dependencies

- **M22** (BotC Data Import) ✅ — base WebP icons already imported
- **M27** (Character Selection Redesign) ✅ — alignment handling in place
- No blockers.

---

## 6. Acceptance Criteria

- [x] Evil characters (Minion/Demon) show `_e.webp` icon on player tokens
- [x] Good characters (Townsfolk/Outsider) show `_g.webp` icon on player tokens
- [x] Travellers show base `.webp` when Unknown, `_g`/`_e` when alignment assigned
- [x] Fabled/Loric always show base `.webp` (no variants exist)
- [x] Characters reassigned (Pit-Hag, Bounty Hunter) show the alignment-appropriate variant
- [x] Reminder tokens always show default alignment icon (not player's current alignment)
- [x] CharacterIconImage gracefully falls back if variant doesn't exist
- [x] ~312 new icon files copied from botc-release
- [x] All tests pass, 0 TS/ESLint errors
