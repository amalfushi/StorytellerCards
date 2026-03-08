# Milestone 21 — BotC Official App Data Import (Research)

> **Goal:** Analyze the official Blood on the Clocktower app repository (`botc-release`) to identify valuable data and media that can enhance Storyteller Cards.

## Status: ✅ Complete (Research Phase)

Research completed. This document catalogues findings from the [ThePandemoniumInstitute/botc-release](https://github.com/ThePandemoniumInstitute/botc-release) repository and proposes follow-up milestones for importing valuable data.

---

## 1. Repository Overview

### Tech Stack & Purpose
The `botc-release` repo is **not the app source code** — it's a Jekyll-based GitHub Pages site (`release.botc.app`) that serves as:
- A **download page** for the official BotC desktop app (Tauri-based, Windows/Mac)
- A **public data API** for community toolmakers
- A **World Cup 2025 (WC25)** tournament hub with 16 curated scripts

### Directory Structure
```
botc-release/
├── _config.yml            # Jekyll site config
├── Gemfile                # Ruby/Jekyll dependencies
├── index.md               # Landing page
├── script-schema.json     # JSON Schema for custom scripts (460 lines)
├── README.md              # Homebrew documentation + special features
├── assets/
│   ├── background.webp    # Site background
│   ├── logo.webp          # BotC logo
│   ├── tpi.webp           # TPI logo
│   ├── fonts/             # Goudy Stout font (eot/woff/woff2)
│   └── main.scss          # Site styles
├── resources/
│   ├── data/
│   │   ├── roles.json     # ★ All 179 characters with metadata
│   │   ├── jinxes.json    # ★ All 131 jinx pairs across 27 characters
│   │   └── nightsheet.json # ★ Complete night order (79 first, 99 other)
│   └── characters/        # ★ 353 character icon images (webp)
│       ├── tb/            # Trouble Brewing (59 images)
│       ├── bmr/           # Bad Moon Rising (65 images)
│       ├── snv/           # Sects & Violets (65 images)
│       ├── carousel/      # Carousel (experimental) (143 images)
│       ├── fabled/        # Fabled (12 images)
│       └── loric/         # Loric (9 images)
├── wc25/                  # World Cup 2025 tournament data
│   ├── data.json          # 16 scripts + 9 channels + match results
│   └── <16 script dirs>/  # Each with script.json, logo.webp, script.pdf
└── _plugins/              # Jekyll plugin for directory listing
```

### Key Data Files
| File | Size | Purpose |
|------|------|---------|
| `resources/data/roles.json` | ~140 KB | All 179 official characters |
| `resources/data/jinxes.json` | ~22 KB | 131 jinx interaction pairs |
| `resources/data/nightsheet.json` | ~3 KB | Canonical night order |
| `script-schema.json` | ~15 KB | JSON Schema for script validation |
| `wc25/data.json` | ~8 KB | Tournament metadata |

---

## 2. Findings

### 2.1 Character Data Comparison

#### Character Count: Exact Match ✅
Both repos contain **179 characters** with identical IDs. No characters are missing from either side.

#### Edition Breakdown (from `roles.json`)
| Edition | Count | Description |
|---------|-------|-------------|
| `carousel` | 71 | Experimental / unreleased characters |
| `tb` | 27 | Trouble Brewing (base set) |
| `bmr` | 30 | Bad Moon Rising |
| `snv` | 30 | Sects & Violets |
| `fabled` | 12 | Fabled characters |
| `loric` | 9 | Loric characters |

#### Team Breakdown
| Team | Count |
|------|-------|
| townsfolk | 69 |
| minion | 27 |
| outsider | 23 |
| demon | 19 |
| traveller | 18 |
| fabled | 14 |
| loric | 9 |

#### Field Comparison

**Fields they have that we DON'T:**

| Field | Present In | Description | Value to Us |
|-------|-----------|-------------|-------------|
| `edition` | All 179 | Edition code (`tb`, `bmr`, `snv`, `carousel`, `fabled`, `loric`) | **High** — needed for filtering, grouping, edition-based script building |
| `flavor` | All 179 | Thematic flavor text for each character | **Medium** — adds richness to character modals, nice for immersion |
| `setup` | All 179 | Boolean — character affects game setup | **Medium** — we have `setupModification` but this is a simpler flag (23 characters have `true`) |
| `special` | 20 chars | App integration features (bag-disabled, grimoire, multiplier, etc.) | **Low** — specific to the official app's online multiplayer features |
| `remindersGlobal` | 6 chars | Reminder tokens usable even when character not in play | **Medium** — needed for accurate grimoire simulation |

**Fields WE have that they don't:**

| Our Field | Description | Notes |
|-----------|-------------|-------|
| `type` / `defaultAlignment` | Character type as PascalCase, alignment | They use `team` (lowercase). We derive alignment from type. |
| `abilityDetailed` | Extended rules text with examples | They only have `ability` (short). Our detailed text is hand-written. |
| `wikiLink` | Link to wiki page | Not in their data. |
| `firstNight` / `otherNights` (objects) | Rich night action objects with `order`, `helpText`, `subActions[]`, `choices[]` | They have `firstNightReminder` (text only) + separate `nightsheet.json` for ordering. Our data is much richer. |
| `icon` (CharacterIcon) | Structured icon paths with placeholder colors | They use URL conventions instead. |
| `setupModification` | Descriptive setup modification | They just have `setup: boolean`. |
| `storytellerSetup` | Pre-game ST decisions | Not in their data. |
| `gameRuleOverrides` | Rule overrides for Fabled/Loric | Not in their data. |
| `jinxes` | Jinx array on character | They store jinxes in a separate `jinxes.json` file. |

**Shared fields (different format):**

| Concept | Our Format | Their Format |
|---------|-----------|--------------|
| Ability text | `abilityShort: string` | `ability: string` (identical content) |
| Team/type | `type: 'Townsfolk'` (PascalCase) | `team: 'townsfolk'` (lowercase) |
| Reminders | `reminders: ReminderToken[]` (id + text + icon) | `reminders: string[]` (just text labels) |
| Night order | `firstNight.order: number` on character | Array position in `nightsheet.json` |
| Night instructions | `firstNight.helpText` + `subActions[]` + `choices[]` | `firstNightReminder: string` (raw text only) |

#### Example: Washerwoman Comparison

**Their data:**
```json
{
  "id": "washerwoman",
  "name": "Washerwoman",
  "edition": "tb",
  "team": "townsfolk",
  "firstNightReminder": "Show the Townsfolk character token. Point to both the *TOWNSFOLK* and *WRONG* players.",
  "reminders": ["Townsfolk", "Wrong"],
  "setup": false,
  "ability": "You start knowing that 1 of 2 players is a particular Townsfolk.",
  "flavor": "Bloodstains on a dinner jacket? No, this is cooking sherry. How careless."
}
```

**Our data (additional fields):**
- `abilityDetailed` — multi-line expanded rules text
- `wikiLink` — `https://wiki.bloodontheclocktower.com/Washerwoman`
- `firstNight.subActions` — parsed into checkmark-able steps
- `firstNight.order: 46` — numeric position
- `icon` — full icon path object with placeholder color
- Reminders as objects: `{ id: 'washerwoman-townsfolk', text: 'TOWNSFOLK' }`

### 2.2 Jinx Data

**This is the highest-value finding for our project.** We have jinxes as a planned milestone (M5) but no jinx data yet — this file gives us everything we need.

#### Structure
`jinxes.json` is an array of objects, each with a source character `id` and a `jinx` array of paired characters:

```json
[
  {
    "id": "alchemist",
    "jinx": [
      {
        "id": "boffin",
        "reason": "If the Alchemist has the Boffin ability, the Alchemist does not learn what ability the Demon has."
      },
      {
        "id": "marionette",
        "reason": "An Alchemist-Marionette has no Marionette ability & the Marionette is in play."
      }
    ]
  }
]
```

#### Statistics
| Metric | Count |
|--------|-------|
| Source characters with jinxes | 27 |
| Total jinx pairs | 131 |
| Most jinxed character | Leviathan (13 jinxes) |
| Runner-up | Riot (12 jinxes), Summoner (11 jinxes) |

#### Characters with Jinxes (by count)
| Character | Jinx Count | Notable |
|-----------|-----------|---------|
| leviathan | 13 | Most jinxes; special day-counting mechanic |
| riot | 12 | Alternative win condition interactions |
| summoner | 11 | Creates Demons mid-game |
| alchemist | 8 | Gains Minion abilities |
| boffin | 7 | Demon ability assignment |
| legion | 7 | Multiple Demons |
| vizier | 7 | Public evil character |
| lilmonsta | 6 | Token-babysitting mechanic |
| magician | 6 | Registration manipulation |
| heretic | 6 | Mostly "only 1 jinxed character" |
| pithag | 6 | Character creation |
| plaguedoctor | 9 | ST gains abilities |
| marionette | 5 | Setup modifications |
| cannibal | 4 | Gains dead abilities |
| mathematician | 4 | Meta-information |
| spy | 3 | Grimoire viewing |
| alhadikhia, bountyhunter, butler, cerenovus, lleech, mastermind, recluse, scarletwoman, vortox, widow, yaggababble | 1–2 each | Various |

#### Compatibility with Our Types
Our existing `Jinx` interface in `types/index.ts` is already a good match:
```typescript
export interface Jinx {
  characterId: string;   // maps to jinx[].id
  description: string;   // maps to jinx[].reason
}
```
The `jinxes.json` uses `{ id, reason }` — trivial to map to our `{ characterId, description }`.

#### Import Strategy
The `jinxes.json` structure lists jinxes one-directionally (e.g., Alchemist→Boffin but not Boffin→Alchemist). For our character data, we should:
1. Import all 131 pairs as-is onto the source character's `jinxes[]` array
2. Optionally mirror them so both characters reference each other
3. This data can be imported via a script that reads `jinxes.json` and patches each character's `.ts` file

### 2.3 Media Assets

#### Character Icons

| Metric | Their Images | Our Images |
|--------|-------------|-----------|
| Format | WebP | PNG |
| Count | 353 | 179 |
| Total size | ~7.1 MB | ~26.6 MB |
| Avg file size | ~20.5 KB | ~148.8 KB |
| Min/Max | 8.4 KB / 41.3 KB | varies |
| Variants | Default + evil (_e) + good (_g) | Single icon per character |

**Key differences:**
- **They have alignment variants** — 156 evil (`_e`) + 156 good (`_g`) + 41 neutral/unaligned icons. This means most characters have two colored versions showing their alignment. Our app only uses one icon per character.
- **Their WebP images are dramatically smaller** — averaging 20.5 KB vs our 148.8 KB PNGs. Switching to WebP would reduce our icon payload from ~26.6 MB to potentially ~3.7 MB (an 86% reduction).
- **They organize by edition** — `tb/`, `bmr/`, `snv/`, `carousel/`, `fabled/`, `loric/`. We use a flat directory.

#### Icon URL Convention
Icons are publicly accessible at deterministic URLs:
```
https://release.botc.app/resources/characters/{edition}/{id}_{alignment}.webp
https://release.botc.app/resources/characters/{edition}/{id}.webp
```

#### Other Visual Assets
| Asset | Format | Size | Notes |
|-------|--------|------|-------|
| `assets/background.webp` | WebP | Site background | Dark atmospheric BotC theme |
| `assets/logo.webp` | WebP | BotC logo | Official branding |
| `assets/tpi.webp` | WebP | TPI logo | Publisher branding |
| `assets/fonts/GoudyStM.*` | eot/woff/woff2 | Goudy Stout Medium | The BotC header font |
| WC25 logos | WebP | ~54–79 KB each | Tournament script logos |

### 2.4 Night Order

#### Their Approach: Ordered Arrays
`nightsheet.json` defines two flat arrays of character IDs in wake-up order:

```json
{
  "firstNight": ["dusk", "angel", "buddhist", "toymaker", ..., "dawn", "leviathan", "vizier"],
  "otherNight": ["dusk", "duchess", "toymaker", ..., "riot", "dawn", "leviathan"]
}
```

- **First night:** 79 entries (including structural: `dusk`, `minioninfo`, `demoninfo`, `dawn`)
- **Other nights:** 99 entries (including structural: `dusk`, `dawn`)
- Array position = wake-up priority (no numeric field needed)

#### Our Approach: Numeric Order on Characters
Each character has `firstNight.order` and `otherNights.order` as numeric values. We also have structural entries (`FIRST_NIGHT_STRUCTURAL`, `OTHER_NIGHTS_STRUCTURAL`) defined in `_nightOrder.ts`.

`buildNightOrder()` collects all characters with night actions and sorts by their `order` field.

#### Comparison
| Aspect | Their Approach | Our Approach |
|--------|---------------|-------------|
| Source of truth | Single `nightsheet.json` | Each character file holds its own order |
| Structure | Array position = order | Numeric `order` field |
| Structural entries | Inline in array (`dusk`, `dawn`, etc.) | Separate `FIRST_NIGHT_STRUCTURAL` array |
| Maintenance | Update one file | Update individual character files |
| Flexibility | Easy to reorder globally | Order embedded per-character |

**Key finding:** Their nightsheet includes characters after `dawn` (e.g., `leviathan` at position 80, `vizier` at 81 in first night). These are characters with "always active" abilities that technically don't wake but have ongoing effects. Our system would need to account for post-dawn entries.

#### Recommendation
Our approach is more maintainable for a distributed codebase but we should validate our ordering against theirs. A one-time sync script could compare `nightsheet.json` array positions against our `order` values to catch any discrepancies.

### 2.5 Scripts

#### Their Built-in Scripts
The `botc-release` repo does not include the three official base scripts (Trouble Brewing, Bad Moon Rising, Sects & Violets) as JSON files. However, the `edition` field on each character implicitly defines these scripts — all characters with `edition: "tb"` form Trouble Brewing, etc.

#### WC25 Tournament Scripts
The `wc25/` directory contains **16 community scripts** used in the World Cup 2025 tournament:

| Script | Author | Key Feature |
|--------|--------|-------------|
| Witch Hunt | Nick B | All Minions are Witches |
| Buyer's Remorse | mist | Auction mechanic |
| Council of the Dead | Ember | Dead player voting boon |
| The Djinn's Bargain | Phil | Nominator sacrifice mechanic |
| Show Me Wonders | DinosaurSatan | Hidden Al-Hadikhia |
| Trained Killer | Ekin | Deterministic demon kills |
| The Phantom Detectives | schnauzer | Dead keep abilities |
| One Day More | Robe | 24-hour info delay |
| Stowed Away | CaffeineBoost | Travellers in the bag |
| Off to See the Wizard | Crispy Duck | Wizard wish solving |
| I See Dead People | A terrifying wizard | Hidden deaths |
| The River Styx | Rhea | Amended Ferryman |
| This Is Not My Beautiful House | James Waumsley | Amnesiac as Outsider |
| Binary Supernovae | Hystrex | 2 Demons |
| The Warrens | Zets | Nomination-based character swapping |
| The Ballad of Seat 7 | TrashWarlock | Empty seat mechanic |

Each script directory contains:
- `script.json` — Standard script format (`_meta` + character ID strings)
- `logo.webp` / `logo-clean.webp` — Script artwork
- `script.pdf` — Printable script sheet

#### Script JSON Format (matches our importer)
```json
[
  {"id": "_meta", "name": "The Ballad of Seat 7", "author": "TrashWarlock", ...},
  "noble", "librarian", "shugenja", "balloonist", ...
]
```
This format is identical to what our `scriptImporter.ts` already parses — these scripts are directly importable.

#### Script Schema (`script-schema.json`)
The 460-line JSON Schema defines the complete script format including:
- `_meta` object (name, author, logo, background, almanac, bootlegger rules, custom night order)
- Character entries (either string IDs for official characters, or full objects for homebrew)
- Min 5, max 201 items per script
- Support for custom `firstNight` and `otherNight` arrays in `_meta`

### 2.6 Other Valuable Data

#### Flavor Text (All 179 Characters)
Every character has a `flavor` field — thematic, in-world flavor text. Examples:
- Washerwoman: *"Bloodstains on a dinner jacket? No, this is cooking sherry. How careless."*
- Chef: *"This evening's reservations seem odd. Never before has Mrs. Mayweather kept company with that scamp from Hudson Lane."*
- Philosopher: *"If anything is real, beer is real. Drink, for tomorrow we may die."*

We currently have **zero** flavor text. This would add atmospheric richness to character detail views.

#### Characters with `setup: true` (23 Characters)
These characters modify the game setup. The 23 characters flagged:
`atheist`, `balloonist`, `baron`, `bountyhunter`, `choirboy`, `deusexfiasco`, `drunk`, `fanggu`, `godfather`, `hermit`, `huntsman`, `kazali`, `legion`, `lilmonsta`, `lordoftyphon`, `marionette`, `pope`, `sentinel`, `summoner`, `tinker` (missing from this list — replaced by `tor`), `vigormortis`, `villageidiot`, `xaan`

We already track this via `setupModification` descriptions, but the boolean flag is a useful quick-filter.

#### Global Reminder Tokens (`remindersGlobal`)
6 characters have reminder tokens that apply even when the character isn't in play:

| Character | Global Reminders |
|-----------|-----------------|
| Philosopher | "Is The Philosopher" |
| Alchemist | "Is The Alchemist" |
| Drunk | "Is The Drunk" |
| Marionette | "Is The Marionette" |
| Lil' Monsta | "Is The Demon", "Dead" |

Currently our `ReminderToken` type doesn't distinguish global vs local reminders.

#### Special App Features
20 characters have `special` entries for app integration. While most are specific to the online app, some concepts are relevant:
- `bag-disabled` — characters that can't go in the bag (Drunk, Marionette, Lil' Monsta)
- `bag-duplicate` — characters that can appear multiple times (Village Idiot, Legion)
- `multiplier` — vote count modifiers (Bureaucrat ×3, Thief ×-1)
- `replace-character` — end-game character replacement (Philosopher, Alchemist, Drunk)

#### Goudy Stout Font
The BotC branding uses **Goudy Stout Medium** font (`GoudyStM.woff2`). This could be used for thematic headers in our app.

#### No Localization Data
The repo contains no localization/i18n data — all content is in English only.

---

## 3. Recommended Follow-Up Milestones

### Priority 1: Import Jinx Data → M5 (Jinxes)
- **WHAT:** Import all 131 jinx pairs from `jinxes.json` into our character data files
- **WHY:** Jinxes are a planned milestone (M5) and this is the official canonical data source. Without jinxes, Storytellers must memorize or look up character interactions during play — a major pain point.
- **SCOPE:** Small-medium. Write an import script to read `jinxes.json` and add `jinxes: Jinx[]` arrays to 27 character files. Our `Jinx` interface already matches. Consider bidirectional mirroring so both characters in a pair reference each other. ~2-4 hours.

### Priority 2: Import Flavor Text
- **WHAT:** Add `flavor: string` field to `CharacterDef` and import all 179 flavor texts from `roles.json`
- **WHY:** Adds atmospheric depth to character modals/detail views with zero creative effort. All 179 characters have flavor text ready to import.
- **SCOPE:** Small. Add optional `flavor?: string` to `CharacterDef`, write import script, update character detail UI to display it. ~2-3 hours.

### Priority 3: Import Edition Data
- **WHAT:** Add `edition: string` field to `CharacterDef` and import edition codes from `roles.json`
- **WHY:** Enables filtering characters by edition (TB, BMR, S&V, Experimental), which is essential for script building and browsing. Currently we have no edition tracking.
- **SCOPE:** Small. Add `edition?: string` to `CharacterDef`, import values, update ScriptBuilder filters. ~1-2 hours.

### Priority 4: Migrate Icons to WebP
- **WHAT:** Replace our 179 PNG icons (26.6 MB total, avg 149 KB) with WebP versions from `botc-release` (7.1 MB total, avg 20.5 KB)
- **WHY:** 86% size reduction improves load times dramatically on mobile. WebP is universally supported. Additionally, alignment-variant icons (good/evil) could enhance visual feedback.
- **SCOPE:** Medium. Copy WebP files, update icon paths, potentially add alignment variants. Need to verify visual quality is acceptable. ~3-4 hours.

### Priority 5: Night Order Validation
- **WHAT:** Cross-reference our `order` values against `nightsheet.json` array positions to find discrepancies
- **WHY:** Ensures our night ordering matches the official canonical order. Any differences could cause incorrect night phase walkthroughs.
- **SCOPE:** Small. Write a validation script/test, fix any discrepancies. ~1-2 hours.

### Priority 6: Import WC25 Scripts as Built-in Scripts
- **WHAT:** Bundle the 16 WC25 tournament scripts as pre-loaded script options
- **WHY:** Gives users instant access to high-quality, tournament-tested scripts without manual import. These scripts already use our exact JSON format.
- **SCOPE:** Small. Copy `script.json` files, integrate with script selector UI. ~1-2 hours.

### Priority 7: Add `setup` Flag and Global Reminders
- **WHAT:** Import the `setup: boolean` flag and `remindersGlobal` data
- **WHY:** `setup` enables quick identification of characters that modify game setup (useful for script building warnings). Global reminders are needed for accurate grimoire management.
- **SCOPE:** Small. ~1-2 hours.

---

## 4. Data Format Reference

### `roles.json` — Character Schema
```typescript
interface BotcRole {
  id: string;                    // "washerwoman" — lowercase, no spaces
  name: string;                  // "Washerwoman"
  edition: string;               // "tb" | "bmr" | "snv" | "carousel" | "fabled" | "loric"
  team: string;                  // "townsfolk" | "outsider" | "minion" | "demon" | "traveller" | "fabled" | "loric"
  ability: string;               // Short ability text
  flavor: string;                // Thematic flavor text
  setup: boolean;                // Affects game setup?
  reminders: string[];           // Reminder token labels
  remindersGlobal?: string[];    // Reminder tokens usable when not in play
  firstNightReminder?: string;   // ST instructions for first night (absent if no first night action)
  otherNightReminder?: string;   // ST instructions for other nights (absent if no other night action)
  special?: BotcSpecial[];       // App integration features
}

interface BotcSpecial {
  type: "selection" | "ability" | "signal" | "vote" | "reveal" | "player";
  name: string;                  // Feature identifier
  value?: string | number;       // Parameter value
  time?: string;                 // When ability can be used
  global?: string;               // Character type scope
}
```

### `jinxes.json` — Jinx Schema
```typescript
interface BotcJinxEntry {
  id: string;                    // Source character ID
  jinx: BotcJinxPair[];
}

interface BotcJinxPair {
  id: string;                    // Target character ID
  reason: string;                // Jinx rule explanation
}
```

### `nightsheet.json` — Night Order Schema
```typescript
interface BotcNightsheet {
  firstNight: string[];          // Ordered character IDs (includes "dusk", "minioninfo", "demoninfo", "dawn")
  otherNight: string[];          // Ordered character IDs (includes "dusk", "dawn")
}
```

### `script-schema.json` — Script Format
```typescript
// Script JSON = array of items
type BotcScript = (BotcScriptMeta | string | BotcScriptCharacter)[];

interface BotcScriptMeta {
  id: "_meta";
  name: string;
  author?: string;
  logo?: string;                 // URL
  hideTitle?: boolean;
  background?: string;           // URL
  almanac?: string;              // URL
  bootlegger?: string[];         // Custom homebrew rules (max 10)
  firstNight?: string[];         // Custom first night order
  otherNight?: string[];         // Custom other night order
}

// Official characters can be just their ID string: "washerwoman"
// Homebrew characters need the full object (see script-schema.json)
```

### Field Mapping: BotC → Storyteller Cards
```
roles.json field          →  CharacterDef field
─────────────────────────────────────────────────
id                        →  id (identical)
name                      →  name (identical)
team                      →  type (lowercase → PascalCase)
ability                   →  abilityShort (identical content)
flavor                    →  (NEW: flavor)
edition                   →  (NEW: edition)
setup                     →  (NEW: setup boolean) / setupModification
reminders[]               →  reminders[] (string → ReminderToken object)
remindersGlobal[]         →  (NEW: remindersGlobal or flag on ReminderToken)
firstNightReminder        →  firstNight.helpText (similar content)
otherNightReminder        →  otherNights.helpText (similar content)
special[]                 →  (not imported — app-specific)
```

---

## 5. Licensing Notes

### Community Created Content Policy
The `resources/` directory and all data files are explicitly provided for community toolmakers under the [Blood on the Clocktower Community Created Content Policy](https://bloodontheclocktower.com/pages/community-created-content-policy).

From `resources/index.md`:
> *"As part of our Community Created Content Policy, certain Blood on the Clocktower assets are available for toolmakers to use in their own projects subject to the terms of the policy."*

### Key Licensing Points
1. **Data files** (`roles.json`, `jinxes.json`, `nightsheet.json`) — Provided for community toolmaker use
2. **Character icons** — Provided at public URLs for community use, subject to the content policy
3. **Script schema** — Public specification for interoperability
4. **Fonts** (Goudy Stout) — Separate font license applies; should verify before bundling
5. **WC25 scripts** — Community-created content; authors and sources are attributed

### Recommendation
- Import data (roles, jinxes, night order) is clearly permitted under the community content policy
- Character icons can be used or linked to directly
- Attribute The Pandemonium Institute and individual script authors where appropriate
- Review the full [Community Created Content Policy](https://bloodontheclocktower.com/pages/community-created-content-policy) before shipping any imported assets
