# Game Data Model

> All types are defined in [`UI/src/types/index.ts`](../../UI/src/types/index.ts).

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
    ├── currentDay, currentPhase (Day|Night|Dawn|Dusk)
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

The first element has `id: "_meta"` with script metadata. All other elements are character ID strings. The [`scriptImporter.ts`](../../UI/src/utils/scriptImporter.ts) utility parses this into a `Script` object.

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

Defined in [`characters.json`](../../UI/src/data/characters.json) (43 characters). Each entry:

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
}
```

Unknown characters (not in `characters.json`) are handled by `getFallbackCharacter()` which returns a placeholder with `<TODO>` markers.

## Night Order Structure

Defined in [`nightOrder.json`](../../UI/src/data/nightOrder.json) (168 entries total). Two arrays: `firstNight` and `otherNights`.

Each entry is either:
- **`structural`**: Phase markers like `dusk`, `dawn`, `minioninfo`, `demoninfo`
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

The [`nightOrderFilter.ts`](../../UI/src/utils/nightOrderFilter.ts) utility filters the master list to only the characters present in the active game's script.

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

Defined in [`playerCountRules.ts`](../../UI/src/data/playerCountRules.ts). For each player count (5–20), specifies how many Townsfolk, Outsiders, Minions, and Demons should be assigned. Some characters modify these counts (e.g., Baron adds +2 Outsiders, –2 Townsfolk).

## Phase Flow

```
Day ←→ Night
```

Phases are defined as: `Dawn`, `Day`, `Dusk`, `Night` — but **Dawn and Dusk are being removed** per M3-4 as they add no value to the Storyteller's workflow. After removal, it will be a simple Day ↔ Night toggle.

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

Two default token types (`drunk`, `poisoned`) plus arbitrary custom tokens. Tokens display around the player's tile in Town Square, radiating from the angle that points toward center. Implementation in [`TokenManager.tsx`](../../UI/src/components/TownSquare/TokenManager.tsx) (partially complete — M3-12).
