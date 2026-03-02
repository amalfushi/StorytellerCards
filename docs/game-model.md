# Game Data Model

> All types are defined in [`UI/src/types/index.ts`](../UI/src/types/index.ts).

## Entity Hierarchy

```
Session
├── id, name, createdAt
├── defaultScriptId
├── defaultPlayers: [{seat, playerName}]
├── gameIds: string[]
│
└── Game
    ├── id, sessionId, scriptId
     ├── currentDay, currentPhase (Day|Night)
    ├── isFirstNight: boolean
    ├── nightHistory: NightHistoryEntry[]
    │
    └── PlayerSeat
        ├── seat (1–20), playerName
        ├── characterId (lowercase no-space key)
        ├── alive, ghostVoteUsed
        ├── visibleAlignment, actualAlignment, startingAlignment
        ├── activeReminders: string[]
        ├── isTraveller: boolean
        └── tokens: PlayerToken[]
```

## Script Format

Scripts are JSON files following the official BotC script tool format:

```json
[
  { "id": "_meta", "name": "Boozling", "author": "Author Name" },
  "washerwoman",
  "librarian",
  "investigator",
  "chef",
  "empath",
  "fortuneteller",
  "undertaker",
  "monk",
  "ravenkeeper",
  "virgin",
  "slayer",
  "soldier",
  "mayor",
  "butler",
  "drunk",
  "saint",
  "recluse",
  "baron",
  "scarletwoman",
  "spy",
  "poisoner",
  "imp"
]
```

The first element has `id: "_meta"` with script metadata. All other elements are character ID strings. The [`scriptImporter.ts`](../UI/src/utils/scriptImporter.ts) utility parses this into a `Script` object.

## Character Types and Alignments

### Types (`CharacterType`)
Defined as `as const` objects (not enums):

| Type | Default Alignment | Color |
|------|-------------------|-------|
| `Townsfolk` | Good | `#1976d2` (blue) |
| `Outsider` | Good | `#42a5f5` (lighter blue) |
| `Minion` | Evil | `#d32f2f` (red) |
| `Demon` | Evil | `#b71c1c` (dark red) |
| `Traveller` | Unknown (assigned by ST) | Split blue/red |
| `Fabled` | — | Orange-gold gradient |
| `Loric` | Good | `#558b2f` (mossy green) |

### Alignments (`Alignment`)
- `Good`, `Evil`, `Unknown`
- A player has three alignment fields: `startingAlignment`, `actualAlignment`, `visibleAlignment`
- This supports characters like the Drunk (thinks they're a Townsfolk but is actually the Drunk) or alignment-changing effects

## Character Definition (`CharacterDef`)

Defined as individual TypeScript files in [`UI/src/data/characters/`](../UI/src/data/characters/) (43 characters), organized by type subdirectory (`townsfolk/`, `outsider/`, `minion/`, `demon/`, `fabled/`). Accessed via the barrel export in [`index.ts`](../UI/src/data/characters/index.ts).

```typescript
interface CharacterDef {
  id: string;           // e.g. "nodashii"
  name: string;         // e.g. "No Dashii"
  type: CharacterType;
  defaultAlignment: Alignment;
  abilityShort: string; // one-line ability description
  abilityDetailed?: string;
  wikiLink?: string;
  firstNight: NightAction | null;
  otherNights: NightAction | null;
  icon?: CharacterIcon;
  reminders: ReminderToken[];

  // ── M6 extensions (all optional) ──
  setupModification?: SetupModification;   // e.g., Baron: +2 Outsiders
  storytellerSetup?: StorytellerSetup[];   // pre-game ST decisions
  gameRuleOverrides?: GameRuleOverride[];  // Fabled/Loric rule changes
  jinxes?: Jinx[];                         // character interactions (M5 stub)
}
```

The `NightAction` interface also gained an optional `choices` field in M6:

```typescript
interface NightAction {
  order: number;
  helpText: string;
  subActions: NightSubAction[];
  choices?: NightChoice[];  // declarative night choices (M6)
}
```

Unknown characters (not in the character registry) are handled by `getFallbackCharacter()` which returns a placeholder with `<TODO>` markers.

### M6 Extension Types

| Type | Purpose | Example |
|------|---------|---------|
| `SetupModification` | Character modifies player-count distribution | Baron: `{ description: "+2 Outsiders, -2 Townsfolk" }` |
| `StorytellerSetup` | Pre-game decision the ST must make | Drunk: ST assigns a Townsfolk identity |
| `GameRuleOverride` | Fabled/Loric rule changes | Spirit of Ivory: game rule modification |
| `Jinx` | Interaction between two characters | Spy + Damsel interaction (stub for M5) |
| `NightChoice` | Declarative choice selector for night actions | Fortune Teller: `{ type: 'player', maxSelections: 2, label: 'Choose 2 players' }` |
| `NightChoiceType` | `as const` object for choice types | `'player'`, `'livingPlayer'`, `'deadPlayer'`, `'character'`, `'alignment'`, `'yesno'` |

## Night Order Structure

Night order is **derived** from character definitions via [`buildNightOrder()`](../UI/src/data/characters/_nightOrder.ts) rather than stored in a separate file. Each character's `firstNight.order` and `otherNights.order` fields provide the canonical position.

Structural entries (Minion Info, Demon Info) are defined in [`_nightOrder.ts`](../UI/src/data/characters/_nightOrder.ts). The `buildNightOrder()` function merges character entries with structural entries and sorts by order.

Each entry is either:
- **`structural`**: Phase markers like `minioninfo`, `demoninfo`
- **`character`**: An actual character's night action

```typescript
interface NightOrderEntry {
  order: number;        // sequential position
  type: 'structural' | 'character';
  id: string;           // character ID or structural ID
  name: string;         // display name
  helpText: string;     // full storyteller instructions
  subActions: NightSubAction[];
}
```

The [`nightOrderFilter.ts`](../UI/src/utils/nightOrderFilter.ts) utility filters the derived order to only the characters present in the active game's script.

## Night Progress & History

### `NightProgress` — In-flight walkthrough
```typescript
interface NightProgress {
  currentCardIndex: number;
  subActionStates: Record<string, boolean[]>;  // characterId → checkmarks
  notes: Record<string, string>;               // characterId → free text
  selections: Record<string, string | string[]>; // characterId → dropdown choices
  totalCards: number;
}
```

### `NightHistoryEntry` — Saved completed night
```typescript
interface NightHistoryEntry {
  dayNumber: number;
  isFirstNight: boolean;
  completedAt: string;          // ISO timestamp
  subActionStates: Record<string, boolean[]>;
  notes: Record<string, string>;
  selections: Record<string, string | string[]>;
}
```

Sub-action checkmarks reset at the start of each night. History records are saved when the Storyteller presses "Complete Night".

## Player Count Distribution

Defined in [`playerCountRules.ts`](../UI/src/data/playerCountRules.ts). For each player count (5–20), specifies how many Townsfolk, Outsiders, Minions, and Demons should be assigned. Some characters modify these counts (e.g., Baron adds +2 Outsiders, –2 Townsfolk).

## Phase Flow

```
Day ←→ Night
```

Phases are `Day` and `Night` only — a simple toggle. Dawn and Dusk were removed in M3-4 as they added no value to the Storyteller's workflow.

## Player Tokens

```typescript
interface PlayerToken {
  id: string;
  type: 'drunk' | 'poisoned' | 'custom';
  label: string;
  sourceCharacterId?: string;
  color?: string;
}
```

Two default token types (`drunk`, `poisoned`) plus arbitrary custom tokens. Drunk and Poisoned are distinguished because they have different sources and different clearing logic.

Tokens display around the player's tile in Town Square using atan2-based center-facing positioning with alternating clockwise/counterclockwise fan-out. The [`TokenBadges`](../UI/src/components/TownSquare/TokenManager.tsx) component renders the visual badges; the [`TokenManager`](../UI/src/components/TownSquare/TokenManager.tsx) dialog provides Drunk/Poisoned toggles, character-specific reminder tokens, and custom text tokens.
