# Milestone 35 — Whose Cult Is It Anyway? script readiness + generalized character primitives

## Status: ✅ Complete

Completed: 2026-06-01

### What shipped

- Generalized alignment-history and gained-ability primitives for Pattern A/B characters.
- Whose Cult setup readiness: script-import setup powers, Loric/Fabled night order and reminder tokens, and unified setup powers drawer.
- Character wiring for Cult Leader, Mezepheles, Cannibal, Pixie, Philosopher, Alchemist, and Boffin.
- Inline night reminder-token player picker, overlay token display, and focused regression tests.

## Post-merge fixes (M38)

Loric and Fabled characters are now excluded from player-facing character selection, assignment, and gained-ability choices because they are storyteller setup powers, not player characters.

The unified Setup Powers drawer keeps its upper-left location and shared structure, but Loric/Fabled entries render as character icons instead of text pills so they match the rest of the grimoire UI.

Inline reminder-token placement now treats each token copy as single-select: choosing a new player reassigns that exact copy from its previous player atomically.

The reminder-token player picker now reuses the NightChoiceSelector “Choose a player” control, with an Unassigned option for clearing a placement, to avoid maintaining duplicate dropdown styling.

Character-ability choices such as Philosopher, Cannibal, Pixie, Alchemist, and Boffin consistently filter out Loric/Fabled setup powers so players cannot gain storyteller-only abilities.

## Post-merge fixes (M39)

Stormcatcher’s Stormcaught reminder now declares a `goodCharacters` picker scope, so the inline night picker reuses NightChoiceSelector styling while listing in-play Townsfolk/Outsiders instead of seated players, including assigned player names when available.

The Stormcatcher night card now deduplicates reminders contributed by the current Loric card and the active setup-power pool, so exactly one Stormcaught reminder chip is rendered.

### Summary

Make the app ready to storytell the **Whose Cult Is It Anyway?** script (Aero, 31 characters) in a live game, plus land the most-requested QoL fix from the last live game (the night-flashcard reminder-token flow).

Rather than wire up the script's awkward characters one-off, this milestone builds **two generalized primitives** that cover not just the in-script characters but also a known set of out-of-script characters that share the same mechanics, so future scripts using Philosopher / Alchemist / Mezepheles / Boffin land for free.

The other two pieces of live-game feedback (show-to-player workflow, pre-game setup flow) are deferred to M36 and M37.

---

> **Goal:** Ship the smallest set of changes that unblocks the next live game with the Whose Cult script, while quietly building two reusable primitives that future scripts depend on.

---

## 1. Problem Statement

### 1a. Script-specific gaps

The script roster:

```
townsfolk: noble, pixie, balloonist, preacher, villageidiot, king, cultleader,
           oracle, lycanthrope, savant, seamstress, cannibal, choirboy
outsider:  recluse, mutant, zealot, puzzlemaster
minion:    witch, cerenovus, fearmonger, goblin
demon:     lilmonsta, nodashii, fanggu, lordoftyphon
traveller: harlot, butcher, bonecollector, beggar, bishop
loric:     stormcatcher
```

All 31 characters exist in the app's data registry. Most are correctly handled by existing systems (Lil' Monsta no-demon-in-play distribution, Lord of Typhon adjacent-evil seating, Fang Gu +1 outsider, Village Idiot extras with one drunk, Choirboy King requirement, Marionette adjacency for `mutant`, etc.).

What is **not** handled today:

| Character | Gap |
|---|---|
| **Cult Leader** | The character's whole mechanic — nightly alignment swing based on neighbors — has no in-app surface. No reminders, no choice selector, no per-player alignment-history view. ST has to remember manually each night. |
| **Cannibal** | Gains the executed Townsfolk's ability the next day. App has the Lunch reminder but no surface for the gained ability and no way to inject the gained character's night entry into the Cannibal's seat. ST mentally swaps. |
| **Pixie** | Gains a Townsfolk ability on their own death. Same shape as Cannibal — reminder exists, no in-app surface. |
| **Stormcatcher (Loric)** | Auto-population of `activeLoric` from the imported script does not happen — ST must manually add. The Loric chip drawer is in the upper-right while Fabled is upper-left, splitting setup-power surfaces awkwardly. First-night order entry (order 4) needs to flow through the existing night order generator. The `STORMCAUGHT` reminder needs to be in the placeable reminder pool. |
| **Bishop (Traveller) first-night info** | Should render; verify only. |
| **Lord of Typhon first-night line** | Adjacent-line check exists; verify the generated night order for this lineup renders sanely. |
| **No Dashii poisoned-neighbor hint** | Has 2 poisoned reminders, no automatic "these two are alive neighbors" hint. Minor QoL, **deferred**. |
| **Lycanthrope Faux-Paw normalization** | Only matters if Empath/Undertaker/Investigator-style "registers as" info characters are in play — none are in this script. **No action.** |

### 1b. Last-game feedback #3 — reminder-token clicks yank the ST out of the night view

`GameViewPage.tsx:338` `handleReminderTokenClick` switches `viewMode` to `'day'` and `tabIndex` to `0`, dropping the ST out of the night flashcards entirely to pick a player. The carousel page is local component state and is lost on the way out. Returning to Night re-enters at the last `currentEntryIndex` but only if Night view persisted it; the click flow loses any in-progress flashcard context.

The other two feedback items (show-to-player workflow, pre-game setup flow) are deferred to **M36** and **M37**.

### 1c. Generalization opportunity

A pattern sweep across the full character registry reveals that the Cult Leader and Cannibal/Pixie behaviors are not one-offs:

- **Cult Leader's** alignment-change-tracking pattern is shared by Mezepheles (mid-game flip), Politician (end-game flip), and Bounty Hunter (setup-time flip). Building the data model + UI primitive once covers all of them.
- **Cannibal's / Pixie's** "I gain a different character's ability" pattern is shared by Philosopher (chooses any good character), Alchemist (has a Minion ability at setup), Boffin (the Demon gets a Townsfolk ability), and Lunatic (performs as the Demon). Building the data model + UI primitive once covers all of them.

A third pattern — full character replacement (Pit-Hag, Hatter, Barber, Snake Charmer, Fang Gu, Scarlet Woman, Summoner) — is **already supported** by the existing `PlayerActionsModal` character + alignment swap. No new work needed for these.

---

## 2. Architecture

### 2.1 Pattern A — Alignment-change facility (player keeps character)

A first-class per-player **alignment history** with a reducer action that any character flashcard can dispatch.

**Data model addition (`UI/src/types/index.ts`):**

```ts
export type AlignmentChange = {
  newAlignment: Alignment;
  reason: string;       // 'cultleader-night', 'mezepheles-word', 'bountyhunter-setup', ...
  day: number;
  nightPhase?: 'firstNight' | 'otherNight' | 'day';
  timestamp: string;    // ISO
};

// PlayerSeat additions (append-only):
alignmentHistory?: AlignmentChange[];
```

**Reducer action (`GameContext.tsx`):**

```ts
| { type: 'RECORD_ALIGNMENT_CHANGE'; payload: {
    seat: number;
    newAlignment: Alignment;
    reason: string;
    day: number;
    nightPhase?: 'firstNight' | 'otherNight' | 'day';
  } }
```

The reducer appends to `alignmentHistory` AND updates `actualAlignment` so existing consumers (TownSquare alignment dots, etc.) work unchanged.

**Wired-up characters this milestone:**

| Character | Trigger | UX |
|---|---|---|
| Cult Leader | each night | Flashcard shows the two living neighbors (walk outward skipping dead) with their current alignments + manual `Good / Evil / Unchanged` radio. Logs to `alignmentHistory` with reason `cultleader-night`. |
| Mezepheles | day phase, optional | Flashcard adds a "pick a good player who said the word tonight" control. Flips chosen player to Evil with reason `mezepheles-word`. May be skipped. |

### 2.2 Pattern B — Gained-ability overlay (player keeps base character, layered secondary)

A first-class per-player **gained ability** with night-order injection and an overlay token visual.

**Data model addition:**

```ts
export type GainedAbility = {
  characterId: string;     // the character whose ability is gained
  source: string;          // 'cannibal-lunch', 'pixie-death', 'philosopher-choice', 'alchemist-setup', 'boffin-grant'
  hostSeat: number;        // seat that gets the ability — usually self, but Boffin grants to the Demon
  appliedDay: number;
};

// PlayerSeat additions (append-only):
gainedAbility?: GainedAbility;
```

**Reducer actions:**

```ts
| { type: 'SET_GAINED_ABILITY'; payload: { hostSeat: number; characterId: string; source: string } }
| { type: 'CLEAR_GAINED_ABILITY'; payload: { hostSeat: number } }
```

**Night-order builder extension:**

For each player with a `gainedAbility`, the builder emits an additional synthetic night entry **at the host's seat** using the **gained character's** wake order (firstNight / otherNights). The entry is rendered in the night flashcards using the gained character's `helpText` and `subActions`, with the host's seat number and name displayed.

**`OverlayToken` component (`UI/src/components/common/OverlayToken.tsx`):**

Renders two character tokens stacked. Top (gained) is offset ~50% from the bottom (base) so both names/icons are legible. Reused across all Pattern B characters and in the TownSquare for any player with a `gainedAbility`.

**Wired-up characters this milestone:**

| Character | hostSeat | When set | UX |
|---|---|---|---|
| Cannibal | self | Day phase after a Townsfolk execution | Flashcard "pick the executed Townsfolk ability gained" choice → `SET_GAINED_ABILITY` |
| Pixie | self | When Pixie dies | Flashcard "pick the Townsfolk ability gained" choice → `SET_GAINED_ABILITY` |
| Philosopher | self | First/other night (existing 'character' choice) | Wire existing choice to dispatch `SET_GAINED_ABILITY`; preserve existing drunk-handling for in-play original |
| Alchemist | self | First night setup | New first-night choice "pick a not-in-play Minion" → `SET_GAINED_ABILITY` |
| Boffin | **current Demon's seat** | First night setup | First-night choice "pick a not-in-play Good character" → `SET_GAINED_ABILITY` with `hostSeat = demonSeat`. Overlay renders on the Demon, not the Boffin. |

### 2.3 Loric / Fabled fixes

- **Auto-populate from script.** On script import / new game from script, dispatch `ADD_LORIC` / `ADD_FABLED` for any Loric/Fabled character in the imported script.
- **Unified Setup Powers drawer (upper-left).** Merge the existing `TownSquareLayout` Fabled drawer (upper-left, line 172) and Loric drawer (upper-right, line 205) into a single "Setup Powers" drawer in the upper-left. Type-tagged chips (Loric vs Fabled). Open chip → existing ability dialog.
- **Night order inclusion.** `filterNightOrder` extension: any active Loric/Fabled with a `firstNight` or `otherNights` entry appears in the generated night panel and flashcards (ST drives, no player to wake).
- **Reminder pool inclusion.** The reminder-token pool source includes reminders from active Loric/Fabled (e.g. Stormcatcher `STORMCAUGHT`), independent of player assignment.

### 2.4 Inline reminder-token player picker

Replace `handleReminderTokenClick` in `GameViewPage.tsx:338`. Today it sets `viewMode='day'` and `tabIndex=0` — yanking the ST out of the night flashcards. The new flow opens an inline dropdown directly in the flashcard, matching the existing `NightChoiceSelector` player picker style. It lists all seated players with the currently-marked one highlighted. Place / move / remove without leaving the flashcard.

---

## 3. Task List

### Phase 1 — Foundation

- [x] **m35-bootstrap** — `npm run install:all` in the milestone35 worktree. Confirm baseline tests pass. MANDATORY before any code change.
- [x] **m35-verify-infra** — Read `filterNightOrder`, the reminder-token pool source, the script importer, and the `PlayerActionsModal` character-swap path. Confirm Pattern C is fully covered. Identify exact insertion points for the two primitives and the Loric/Fabled hooks.

### Phase 2 — Primitives

- [x] **m35-pattern-a-primitive** — Add `alignmentHistory` to `PlayerSeat` in `types/index.ts`. Add `RECORD_ALIGNMENT_CHANGE` reducer action to `GameContext.tsx` (append-only). Unit tests covering: append, multi-day, no-duplicate-same-night, consistent `actualAlignment` update.
- [x] **m35-pattern-b-primitive** — Add `gainedAbility` field to `PlayerSeat`. Add `SET_GAINED_ABILITY` / `CLEAR_GAINED_ABILITY` reducer actions. Extend the night-order builder to emit a synthetic entry at `hostSeat` ordered by the gained character's wake. Unit tests: own-seat host, off-seat host (Boffin → Demon), gained character with no nightly entry (no-op), clear-on-character-change.
- [x] **m35-overlay-token** — Build `UI/src/components/common/OverlayToken.tsx`. Renders two tokens stacked, top offset ~50%. Storybook story. Used by all Pattern B consumers.

### Phase 3 — Pattern A characters

- [x] **m35-cultleader** — Compute two living neighbors walking outward from the CL seat skipping dead players. Render their current alignments. Add a manual `Good / Evil / Unchanged` choice that dispatches `RECORD_ALIGNMENT_CHANGE`. Edge cases: all-dead-besides-CL, 2-player table, CL is dead. Tests.
- [x] **m35-mezepheles** — On the Mezepheles otherNights flashcard add an optional "pick a good player who said the word" control that dispatches `RECORD_ALIGNMENT_CHANGE` to flip the target to Evil. Skip if nothing happened.

### Phase 4 — Pattern B characters

- [x] **m35-cannibal** — Flashcard "pick the executed Townsfolk" choice → `SET_GAINED_ABILITY` (host = self). Verify the gained character's night entry appears at the Cannibal seat next phase. Overlay token renders.
- [x] **m35-pixie** — Same shape as Cannibal but triggered on Pixie's death (choice = the Townsfolk ability she gains).
- [x] **m35-philosopher** — Wire the existing `firstNight` / `otherNights` character choice in `philosopher.ts` to dispatch `SET_GAINED_ABILITY` (host = self). Preserve the existing drunk-handling reminder when the chosen character is in play.
- [x] **m35-alchemist** — Add a first-night choice "pick a not-in-play Minion" to `alchemist.ts`. Dispatch `SET_GAINED_ABILITY` (host = self). One-shot at setup.
- [x] **m35-boffin** — Add a first-night choice "pick a not-in-play Good character" to `boffin.ts`. Dispatch `SET_GAINED_ABILITY` with `hostSeat = currentDemonSeat`. Confirm the overlay renders on the Demon, not the Boffin.

### Phase 5 — Loric / Fabled

- [x] **m35-loric-fabled-autopopulate** — On script import or new-game-from-script, dispatch `ADD_LORIC` / `ADD_FABLED` for any Loric/Fabled character in the script. Tests with the Whose Cult script (Stormcatcher).
- [x] **m35-setup-powers-drawer** — Merge Fabled (upper-left) and Loric (upper-right) chip drawers in `TownSquareLayout.tsx` into a single "Setup Powers" drawer in the upper-left. Type-tagged chips. Open chip = existing ability dialog. Update tests.
- [x] **m35-loric-fabled-night-order** — Extend `filterNightOrder` so active Loric/Fabled with `firstNight` or `otherNights` entries appear in the panel and flashcards. ST-driven, no player wake. Tests with Stormcatcher (firstNight order 4).
- [x] **m35-loric-fabled-reminder-pool** — Trace the reminder-token pool source and extend it to include reminders from active Loric/Fabled (e.g. Stormcatcher `STORMCAUGHT`). Tests.

### Phase 6 — Reminder-token flow + verification

- [x] **m35-inline-token-picker** — Replace `handleReminderTokenClick` in `GameViewPage.tsx:338`. Inline dropdown matching `NightChoiceSelector` style. Lists seated players with current placement highlighted. Tests cover place / move / remove and lossless flashcard state.
- [x] **m35-verify-script-night-order** — Smoke-check the generated night order for the Whose Cult script: Lord of Typhon adjacent-line, Bishop traveller first night, Stormcatcher first night, Cannibal/Pixie injected entries (when overlays set). Add regression snapshots.

### Phase 7 — Integration tests + docs

- [x] **m35-tests-integration** — End-to-end tests covering: Cult Leader nightly alignment flip, Cannibal gained ability across multiple days, Pixie on-death gain, Philosopher gain + drunk, Alchemist setup-time, Boffin host-on-Demon overlay + injection, Loric autopopulate, inline token picker.
- [x] **m35-docs** — This milestone file's status updated to ✅ Complete with PR links. Add row to `docs/progress.md`. Verify test count update in `AGENTS.md` if changed.

---

## 4. Files Affected

### New files

| File | Purpose |
|---|---|
| `UI/src/components/common/OverlayToken.tsx` | Two-token stacked overlay (Pattern B visual) |
| `UI/src/components/common/OverlayToken.stories.tsx` | Storybook story |
| `UI/src/components/common/SetupPowersDrawer.tsx` | Unified Fabled + Loric drawer |
| `UI/src/components/NightPhase/InlineReminderTokenPicker.tsx` | Inline player picker for reminder tokens |

### Modified files

| File | Change |
|---|---|
| `UI/src/types/index.ts` | Append `AlignmentChange`, `GainedAbility`, and the new `PlayerSeat` fields |
| `UI/src/context/GameContext.tsx` | New reducer actions: `RECORD_ALIGNMENT_CHANGE`, `SET_GAINED_ABILITY`, `CLEAR_GAINED_ABILITY`. Script-import handlers auto-populate `activeLoric` / `activeFabled` |
| `UI/src/utils/nightOrderFilter.ts` (or equivalent) | Include active Loric/Fabled entries; inject synthetic gained-ability entries |
| `UI/src/components/TownSquare/TownSquareLayout.tsx` | Replace separate Fabled/Loric drawers with `SetupPowersDrawer` (upper-left) |
| `UI/src/pages/GameViewPage.tsx` | Replace `handleReminderTokenClick` viewMode swap with inline picker |
| `UI/src/components/NightPhase/NightFlashcard.tsx` | Render Cult Leader neighbor view, Pattern B overlay tokens, inline picker mount |
| `UI/src/data/characters/townsfolk/cultleader.ts` | Add alignment-change choice |
| `UI/src/data/characters/townsfolk/cannibal.ts` | Add gained-ability choice |
| `UI/src/data/characters/townsfolk/pixie.ts` | Add gained-ability choice |
| `UI/src/data/characters/townsfolk/philosopher.ts` | Wire existing choice to `SET_GAINED_ABILITY` |
| `UI/src/data/characters/townsfolk/alchemist.ts` | Add setup-time Minion choice |
| `UI/src/data/characters/minion/boffin.ts` | Add setup-time Good-char choice (host = Demon) |
| `UI/src/data/characters/minion/mezepheles.ts` | Add manual flip control |
| `docs/progress.md` | Append M35 row |
| `AGENTS.md` | Test-count refresh if changed |

---

## 5. Out of Scope

- **Show-to-player redesign** — deferred to **M36**
- **Pre-game setup-flow rework** — deferred to **M37**
- **No Dashii neighbor visualization** — minor QoL, not in this script's critical path
- **Lycanthrope Faux-Paw normalization** — no relevant "registers as" info characters in this script
- **Politician end-of-game alignment flip** — no nightly UX needed
- **Lunatic** — already handled by existing Demon-info flow
- **Pattern C polish (Pit-Hag / Hatter / Barber / Snake Charmer / Fang Gu / Scarlet Woman / Summoner)** — already-working `PlayerActionsModal` mid-game character + alignment swap is acceptable; guided flows can come later

---

## 6. Acceptance Criteria

- [x] All 31 Whose Cult script characters render correctly in the script panel and character selection
- [x] Cult Leader's two living neighbors with current alignments are visible on the CL flashcard each night, and the ST can record the alignment change in one tap
- [x] Cannibal flashcard shows a chosen-ability dropdown after a Townsfolk execution; the gained character's night entry appears at the Cannibal's seat the following phase; OverlayToken renders on the Cannibal's grimoire seat
- [x] Pixie flashcard shows a chosen-ability dropdown on death; injection + overlay behave like Cannibal
- [x] Philosopher, Alchemist, Boffin choices write through the same `SET_GAINED_ABILITY` primitive; Boffin's overlay renders on the Demon's seat
- [x] Mezepheles flashcard provides an optional manual flip control
- [x] Stormcatcher (Loric) is auto-added to `activeLoric` for any new game on the Whose Cult script; its first-night entry appears in the night panel; the `STORMCAUGHT` reminder is placeable
- [x] Upper-left "Setup Powers" drawer shows all active Fabled and Loric in one place
- [x] Clicking a reminder token in a night flashcard no longer leaves the night view; an inline player picker opens
- [x] Full test suite passes; no new lint suppressions
