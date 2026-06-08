# Milestone 38 — Live Game Polish (Whose Cult Is It Anyway? follow-ups)

## Status: ✅ Complete

Completed: 2026-06-07

> **Numbering note.** This milestone was originally developed in the `m39/stormcatcher-fixes` worktree as a series of stacked "Post-merge fixes (M39)" commits on top of M37. Because the contents are a single thematic body of work — second-round live-game polish for the **Whose Cult Is It Anyway?** script — they are consolidated here as Milestone 38. The Post-merge fix sections inside `milestone35.md`, `milestone36.md`, and `milestone37.md` reference the same work; this doc is the canonical write-up.

### What shipped

- **Stormcatcher / Stormcaught:** correct picker scope, single-select reminder, full character icons on show-to-player views, "they can only die by execution" tip, and the show-to-player not-in-play list now renders character icons + names.
- **Madness flow (Cerenovus, Pixie):** shared `CharacterIconImage` rendering on player-facing screens, consequence text moved above the icon, Pixie auto-selects the character holding its Mad reminder, Pixie's own info hidden from the player.
- **Cult Leader alignment change:** Good/Evil dropdown wired to the existing alignment-history reducer instead of a character picker.
- **Reminder tokens unified:** pre-game checklist, night flashcards, and Town Square all read/write `PlayerSeat.tokens` as the single source of truth. Setup-power placements no longer leak into other players' Reminders sections, and removals/changes round-trip correctly.
- **Pre-game checklist:** data-driven `firstNightReminderSetup` field on character data picks up Noble, Investigator, Washerwoman, Librarian, Grandmother, Knight, Steward, Balloonist, Lycanthrope, Pixie, Bounty Hunter, and Widow automatically. The picker rows now reuse `NightChoiceSelector` so seat + character icon + character name render consistently with the night flashcards.
- **Stormcatcher picker scope:** dropdown now lists every script Townsfolk/Outsider (not just in-play), appending the seated player in parentheses when assigned.
- **Show-to-player polish:** King first-night `THIS PLAYER IS` deterministically renders the King's icon and seated player. Same treatment applied to other deterministic self-reveals.
- **Multi-select preservation:** Seamstress (and other Yes / No signal cards) no longer reset the underlying player multi-select when the signal button is tapped.
- **Noble KNOW clarity:** "1 and only 1 of these 3 players is evil" replaces the prior ambiguous phrasing.
- **Balloonist bookkeeping:** night card displays previous-night pick alongside the current-night picker. Cursory scan applied to similar storyteller-driven bookkeeping needs.
- **Once-per-game flag:** new character-data flag plus a one-tap "Would you like to use your ability?" show-player prompt for Slayer, Virgin, Fool, Professor, Huntsman, Seamstress, Philosopher, Engineer, Courtier, Artist, Fisherman, Nightwatchman, Assassin, Bone Collector, Judge.
- **Lord of Typhon Outsider modifier:** stepper in the select-characters screen with randomizer support; cursory scan for similar characters.
- **Regression fixes:** stale character assignments are sanitized before the first assignment-dialog render so removed in-play choices such as Cannibal cannot be passed to MUI selects; multi-rule setup modifiers (Lord of Typhon) get unique React keys; React/MUI camelCase `WebkitTextFillColor` replaces the kebab-case style.

---

> **Goal:** Close the gap between "the script can be storytold" (M35) and "the next live game runs without retyping or fighting the app." Every item in this milestone came directly from the second live game's storyteller-side feedback.

---

## 1. Problem Statement

After M35 / M36 / M37 shipped and the script ran live for the second time, the storyteller surfaced a long tail of rough edges. Most were not new features — they were paper-cuts where the M35-era assumptions held up against a single rehearsal but broke on a real table. The work in this milestone is intentionally a grab-bag rather than a single feature, because the underlying request was "make all of these stop biting me."

Themes that recurred across the feedback:

| Theme                                    | Examples                                                                                                                                                                              |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loric / Fabled "characters" leaking into player flows | Storm Catcher appearing in the character-assignment dialog, in player-facing "Choose a character" dropdowns, and rendered as text pills instead of character icons in the grimoire UI |
| Reminder-token state desync              | Pre-game setup placements not visible at night; Stormcaught rendered twice; multiple players selectable for a single token copy                                                       |
| Show-to-player views look unfinished     | Empty white circle instead of the chosen character icon; help text placement that buried the most-important sentence; Pixie's own info shown on the player-facing screen              |
| Pre-game checklist and night flashcards drift apart | Place 3 Noble Know tokens at setup, then the night flashcard says "place 3 Know tokens" again                                                                                         |
| Once-per-game and "you start knowing" cues missing | Storyteller has to remember to ask "do you want to Slay tonight?" or to place a Noble Know token before night 1                                                                       |
| Picker UX inconsistencies                | Different scopes (players vs characters) using different controls; Stormcatcher needs the choose-a-player styling but with characters; Seamstress yes/no reset the player selection   |

---

## 2. Approach

This milestone deliberately does not introduce new architectural primitives. M35 already shipped Pattern A (alignment-change) and Pattern B (gained-ability overlay). M36 already shipped the per-player show-to-player slot model. M37 already shipped seat lock + quick reseat. Everything here either:

1. **Extends an existing primitive** — e.g. `ReminderPickerScope` ('players' | 'goodCharacters' | 'scriptGoodCharacters') threaded through the same `NightChoiceSelector`, or `firstNightReminderSetup` data declared on more characters.
2. **Unifies two stores that had drifted** — pre-game checklist token state and night flashcard token state both now read/write `PlayerSeat.tokens`.
3. **Closes a paper-cut UX gap** — text size / placement on madness screens, deterministic icons on self-reveals, "would you like to use your ability?" prompt on once-per-game characters.

Where a single fix touched more than one milestone's surface (e.g. the unified `PlayerSeat.tokens` reminder store touches M35 character flows, M36 show-to-player screens, and M37 pre-game checklist), the change is documented in this milestone and cross-referenced from each affected milestone's `## Post-merge fixes` section.

---

## 3. Implementation summary

The work was delivered as three batches of stacked commits on `m39/stormcatcher-fixes`. Each batch was driven by a fresh round of feedback from the storyteller as they re-walked the app.

### Batch 1 — Stormcatcher / Stormcaught

- New `ReminderPickerScope` field on reminder-token definitions (`'players'` default, `'goodCharacters'` for Stormcaught). `NightChoiceSelector` consumes the scope and renders the appropriate option list while keeping the visual style identical to the canonical "Choose a player" picker.
- Stormcatcher night card deduplicates reminders contributed by the active Loric card and the setup-power pool, so exactly one Stormcaught chip renders.
- Stormcaught choose-a-character dropdown lists in-play Townsfolk + Outsiders, appending the assigned player name in parentheses when available.

### Batch 2 — Madness, unified reminders, Cult Leader

- `CharacterIconImage` reused on `PlayerShowScreen` so the chosen character renders with full art, border, and alignment color. Applied across Cerenovus, Pixie, and other madness paths.
- Consequence text ("Something bad may happen...", "If you are mad that you are this character...") moved above the icon and bumped one type-scale step.
- `PlayerSeat.tokens` becomes the canonical reminder-token store. Pre-game `SetupChecklist`, `NightFlashcard`, and `TownSquare` all read and write through the same reducer actions; setup placements are visible at night and removals update setup counts.
- Pixie / Bounty Hunter / Widow added to the data-driven `firstNightReminderSetup` registry.
- Pixie show-player view hides the Pixie's own info from the player and auto-picks the character currently holding the Pixie's Mad reminder.
- Setup-power reminders no longer leak into other players' Reminders sections on the night flashcards.
- Cult Leader's player-facing alignment change screen offers a Good / Evil dropdown wired to the existing alignment-change flow rather than a character picker.

### Batch 3 — Pre-game polish, deterministic show-player, once-per-game

- Lord of Typhon gains an Outsider-count stepper in the select-characters screen plus randomizer support; cursory scan applied to other characters with similar variable-modifier abilities.
- Pre-game reminder picker rows reuse `NightChoiceSelector` so the seat row shows character icon + character name, matching the night flashcards.
- Stormcatcher picker scope extended: lists every script Townsfolk / Outsider regardless of in-play status; the player parenthetical only appears for seated characters.
- Stormcaught show-player view adds a tip ("This player is the {icon + name}. They can only die by execution.") and renders the not-in-play list with character icons + names.
- King's first-night `THIS PLAYER IS` show-player renders the King icon + seated player name deterministically; same treatment applied to other deterministic self-reveals identified during the scan.
- Seamstress (and any other Signal: Yes / No card) preserves the underlying player multi-select when the signal button is tapped.
- Noble KNOW show-player text reads "1 and only 1 of these 3 players is evil."
- Balloonist night card displays previous-night pick alongside the current-night picker; cursory scan applied to similar bookkeeping-only characters.
- New `oncePerGame` flag on character data; once-per-game characters render a one-tap "Would you like to use your ability?" show-player prompt. Initial flagged set: Slayer, Virgin, Fool, Professor, Huntsman, Seamstress, Philosopher, Engineer, Courtier, Artist, Fisherman, Nightwatchman, Assassin, Bone Collector, Judge.

### Batch 3 regression fixes (from dev-console feedback)

- Stale character assignments are sanitized before the first assignment-dialog render so removed in-play choices such as `cannibal` cannot be passed to MUI `Select` and surface as `out-of-range value` warnings.
- Multi-rule setup modifiers (Lord of Typhon) get unique React `key` values so the modifier list no longer warns about duplicate `modifier-lordoftyphon` keys.
- The disabled-notes style uses React/MUI camelCase `WebkitTextFillColor` instead of the kebab-case `-webkit-text-fill-color`.

---

## 4. Key files touched

| Area                              | Files                                                                                                       |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Character data flags and registries | `UI/src/data/characters/townsfolk/{noble,investigator,...,pixie,bountyhunter,...}.ts`, `UI/src/data/characters/minion/widow.ts`, `UI/src/data/characters/loric/stormcatcher.ts` |
| Reminder-token unification        | `UI/src/components/TownSquare/TokenManager.tsx`, `UI/src/components/NightPhase/NightFlashcard.tsx`, `UI/src/components/Setup/SetupChecklist.tsx`, `UI/src/components/Setup/buildChecklistItems.ts` |
| Picker scopes                     | `UI/src/components/NightPhase/NightChoiceSelector.tsx`, `UI/src/pages/GameViewPage.tsx`                     |
| Show-to-player                    | `UI/src/components/NightPhase/PlayerShowScreen.tsx`, `UI/src/components/NightPhase/PlayerShowDrawer.tsx`, `UI/src/components/common/CharacterIconImage.tsx` |
| Pre-game character selection      | `UI/src/components/Setup/CharacterSelection.tsx`, `UI/src/components/CharacterAssignment/CharacterAssignmentDialog.tsx`, `UI/src/utils/randomizeCharacters.ts` |
| Types and utilities               | `UI/src/types/index.ts`, `UI/src/utils/infoTokenUtils.ts`                                                   |

Every change has corresponding `*.test.tsx` updates; the structural character-data validation test exercises the new `oncePerGame` and `firstNightReminderSetup` fields automatically.

---

## 5. Acceptance criteria

- [x] No Loric / Fabled character appears in the character-assignment dialog, in any "Choose a character" player-facing dropdown, or as a text pill in the grimoire.
- [x] Each reminder-token copy can be assigned to exactly one player; reassigning a copy moves it atomically without leaving a stale duplicate.
- [x] Pre-game setup token placements are immediately visible on the matching night flashcard and on the Town Square; removing or changing a token in any of the three surfaces is reflected in the other two.
- [x] Stormcaught dropdown lists every script Townsfolk / Outsider with the seated player appended in parentheses when assigned.
- [x] Stormcaught show-to-player view renders the chosen character's full icon plus the "can only die by execution" tip; the not-in-play list also renders icons + names.
- [x] Madness show-to-player screens render the chosen character with full art / border / alignment color; the consequence sentence appears above the icon at a one-step-bumped font size; Pixie's own info is hidden from the player.
- [x] Cult Leader player-facing alignment change uses a Good / Evil dropdown and writes through the existing alignment-history reducer.
- [x] Pre-game checklist picker rows render seat + character icon + character name (matching the night flashcard picker).
- [x] King first-night `THIS PLAYER IS` show-player renders the King icon + seated player name without prompting the storyteller.
- [x] Seamstress (and other Signal: Yes / No cards) does not reset the player multi-select when the signal button is tapped.
- [x] Noble KNOW show-player reads "1 and only 1 of these 3 players is evil."
- [x] Balloonist night card displays the previous-night pick alongside the current-night picker.
- [x] Once-per-game characters (Slayer, Virgin, Fool, Professor, Huntsman, Seamstress, Philosopher, Engineer, Courtier, Artist, Fisherman, Nightwatchman, Assassin, Bone Collector, Judge) render a one-tap "Would you like to use your ability?" show-player prompt.
- [x] Lord of Typhon's Outsider modifier is honored in the select-characters screen and randomizer; cursory scan documented in this doc.
- [x] No MUI `out-of-range value` console warnings when loading the Whose Cult Is It Anyway? script in the assignment dialog.
- [x] No duplicate React `key` warnings on the setup checklist modifier list.
- [x] No "kebab-case CSS in objects" warnings from disabled-notes styles.
- [x] `npm test` is green; `npm run lint` is green; no `eslint-disable` introduced.

---

## 6. Out of scope (intentionally deferred)

- The 500 errors on `PUT /api/sessions/.../games/...` observed during live testing. These reproduce in the existing M30 / M33 sync layer and are not introduced by this milestone; they are tracked separately.
- Any new architectural primitive for character abilities. Once-per-game is a data flag, not a new state machine.
- The longer-tail "would you like to use" prompts for abilities that are not strictly once-per-game (e.g. Pacifist, Innkeeper). Adding the prompt to those characters is a one-line `oncePerGame: true` or `usePrompt: true` change in their data file and can be batched into a follow-up.
- Any change to backend persistence, schema, or sync wire format.
