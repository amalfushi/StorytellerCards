// ──────────────────────────────────────────────
// Enum-like constants (erasableSyntaxOnly compatible)
// ──────────────────────────────────────────────

export const CharacterType = {
  Townsfolk: 'Townsfolk',
  Outsider: 'Outsider',
  Minion: 'Minion',
  Demon: 'Demon',
  Traveller: 'Traveller',
  Fabled: 'Fabled',
  Loric: 'Loric',
} as const;
export type CharacterType = (typeof CharacterType)[keyof typeof CharacterType];

export const Alignment = {
  Good: 'Good',
  Evil: 'Evil',
  Unknown: 'Unknown',
} as const;
export type Alignment = (typeof Alignment)[keyof typeof Alignment];

export const Phase = {
  Day: 'Day',
  Night: 'Night',
} as const;
export type Phase = (typeof Phase)[keyof typeof Phase];

export const VoteStatus = {
  Infinite: 'Infinite',
  GhostVote: 'GhostVote',
  NoVotes: 'NoVotes',
} as const;
export type VoteStatus = (typeof VoteStatus)[keyof typeof VoteStatus];

export const NightChoiceType = {
  Player: 'player',
  LivingPlayer: 'livingPlayer',
  DeadPlayer: 'deadPlayer',
  Character: 'character',
  Alignment: 'alignment',
  YesNo: 'yesno',
  AlignmentChange: 'alignment-change',
} as const;
export type NightChoiceType = (typeof NightChoiceType)[keyof typeof NightChoiceType];

export const ReminderPickerScope = {
  Players: 'players',
  GoodCharacters: 'goodCharacters',
} as const;
export type ReminderPickerScope = (typeof ReminderPickerScope)[keyof typeof ReminderPickerScope];

export const Edition = {
  TroubleBrewing: 'tb',
  BadMoonRising: 'bmr',
  SectsAndViolets: 'snv',
  Experimental: 'carousel',
  Fabled: 'fabled',
  Loric: 'loric',
} as const;
export type Edition = (typeof Edition)[keyof typeof Edition];

/** Human-readable label for each edition. */
export const EditionLabel: Record<Edition, string> = {
  tb: 'Trouble Brewing',
  bmr: 'Bad Moon Rising',
  snv: 'Sects & Violets',
  carousel: 'Experimental',
  fabled: 'Fabled',
  loric: 'Loric',
} as const;

// ──────────────────────────────────────────────
// Character definition (master, read-only data)
// ──────────────────────────────────────────────

/** Icon asset paths and a fallback placeholder colour. */
export interface CharacterIcon {
  small?: string;
  medium?: string;
  large?: string;
  /** CSS colour or gradient used when no image is available. */
  placeholder: string;
}

/** A single step within a night action's instructions. */
export interface NightSubAction {
  /** Unique within the character's night action (e.g. "noble-fn-1"). */
  id: string;
  /** Human-readable instruction (e.g. "Wake the character"). */
  description: string;
  /** `true` when the instruction is conditional (prefixed with "If…"). */
  isConditional: boolean;
}

/** A declarative description of a single interactive choice within a night action. */
export interface NightChoice {
  /** What kind of selection this represents. */
  type: NightChoiceType;
  /** Maximum number of selections (e.g. 2 for "choose 2 players"). */
  maxSelections: number;
  /** Label shown above the selector (e.g. "Choose 2 players"). */
  label: string;
  /** Optional character/player filtering hint for reusable selectors. */
  filter?: string;
}

/** Full storyteller instructions for one night phase. */
export interface NightAction {
  /** Position in the master night order. */
  order: number;
  /** Complete storyteller help text. */
  helpText: string;
  /** Broken-down individual instruction steps. */
  subActions: NightSubAction[];
  /**
   * Declarative list of interactive choices for this night action.
   * Replaces regex parsing of helpText. Absent in legacy data (treated as empty).
   */
  choices?: NightChoice[];
}

/** A reminder token that can be placed on the Grimoire. */
export interface ReminderToken {
  id: string;
  text: string;
  icon?: string;
  /** Which inline picker option set should be used when placing this reminder. Defaults to players. */
  pickerScope?: ReminderPickerScope;
  /** True when this reminder applies even if the character is not in play. */
  isGlobal?: boolean;
  /** The character this reminder belongs to (for displaying the source character's icon). */
  sourceCharacterId?: string;
}

// ──────────────────────────────────────────────
// M6 extension types
// ──────────────────────────────────────────────

/** Describes how a character modifies the standard player-count distribution. */
export interface SetupModification {
  /** Human-readable description of the modification. */
  description: string;
}

/** A pre-game decision the Storyteller must make for this character. */
export interface StorytellerSetup {
  /** Human-readable description of what the ST needs to decide. */
  description: string;
  /** Unique key for this setup step (used for state tracking). */
  id: string;
}

/** Reminder-token setup the Storyteller should place before Night 1 begins. */
export interface FirstNightReminderSetup {
  /** Unique key for this setup reminder step. */
  id: string;
  /** Human-readable description of what reminder tokens to place. */
  description: string;
  /** Reminder token IDs this setup step is preparing. */
  reminderTokenIds: string[];
}

/** Describes how a Fabled or Loric character overrides standard game rules. */
export interface GameRuleOverride {
  /** Human-readable description of the override. */
  description: string;
  /** Unique key for this rule override. */
  id: string;
}

/** A jinx interaction between two characters (stub for M5). */
export interface Jinx {
  /** ID of the other character involved in the jinx. */
  characterId: string;
  /** Description of the interaction / rule override. */
  description: string;
}

/** Master character definition – immutable reference data. */
export interface CharacterDef {
  /** Lowercase, no-space key (e.g. "nodashii"). */
  id: string;
  /** Display name (e.g. "No Dashii"). */
  name: string;
  type: CharacterType;
  defaultAlignment: Alignment;
  /** One-line ability description. */
  abilityShort: string;
  /** Longer rules text (optional, added later). */
  abilityDetailed?: string;
  wikiLink?: string;
  /** First-night action, or `null` if the character has none. */
  firstNight: NightAction | null;
  /** Other-nights action, or `null` if the character has none. */
  otherNights: NightAction | null;
  icon?: CharacterIcon;
  reminders: ReminderToken[];

  // ── M6 extensions (all optional for backward compat) ──

  /** Setup modifications this character causes (e.g., Baron: +2 Outsiders). */
  setupModification?: SetupModification;
  /** Steps the Storyteller must complete during game setup. */
  storytellerSetup?: StorytellerSetup[];
  /** Reminder-token placements to prepare before Night 1 starts. */
  firstNightReminderSetup?: FirstNightReminderSetup[];
  /** Game rule overrides (for Fabled/Loric characters). */
  gameRuleOverrides?: GameRuleOverride[];
  /** Jinx interactions with other characters (M5). */
  jinxes?: Jinx[];

  // ── M22 extensions (BotC official data import) ──

  /** Atmospheric flavor text from official BotC data. */
  flavor?: string;
  /** Edition this character belongs to (e.g. 'tb', 'bmr', 'snv', 'carousel', 'fabled', 'loric'). */
  edition?: Edition;
  /** True when this character modifies game setup (e.g. Baron adds +2 Outsiders). */
  setup?: boolean;
  /** True when this character has a once-per-game ability the player may need to opt into. */
  oncePerGame?: boolean;
  /** Reminder tokens that apply even when this character is not in play. */
  remindersGlobal?: ReminderToken[];
}

// ──────────────────────────────────────────────
// Night Order
// ──────────────────────────────────────────────

/** An entry in the master night order list. */
export interface NightOrderEntry {
  /** Sequential position within the respective night (starting from 0). */
  order: number;
  /** 'structural' for phases like dusk/dawn/info steps; 'character' for actual characters. */
  type: 'structural' | 'character';
  /** Character ID or structural ID (e.g. "dusk", "minioninfo", "demoninfo", "dawn"). */
  id: string;
  /** Display name. */
  name: string;
  /** Full storyteller instructions. */
  helpText: string;
  /** Broken-down individual instruction steps. */
  subActions: NightSubAction[];
}

/** Top-level shape of the night-order data returned by buildNightOrder(). */
export interface NightOrderData {
  firstNight: NightOrderEntry[];
  otherNights: NightOrderEntry[];
}

// ──────────────────────────────────────────────
// Script
// ──────────────────────────────────────────────

/** A parsed script definition. */
export interface Script {
  /** Stable ID derived from the script name (lowercase, no spaces). */
  id: string;
  name: string;
  author: string;
  /** Ordered list of character IDs on this script. */
  characterIds: string[];
}

// ──────────────────────────────────────────────
// Player / Slot / Participant (M41 seating model)
// ──────────────────────────────────────────────

/**
 * M41 sync contract version. Bumped when Session/Game JSON shape changes in an
 * incompatible way. Older clients refuse to load newer payloads.
 */
export const SEATING_MODEL_VERSION = 2;

/** Stable uuid for a Player across the session and any games inside it. */
export type PlayerId = string;
/** Stable uuid for a Slot (seat / spacer / storyteller) inside a template or game. */
export type SlotId = string;

/** A status token that can be placed on a player in the Grimoire. */
export interface PlayerToken {
  id: string;
  type: 'drunk' | 'poisoned' | 'custom';
  label: string;
  /** Which inline picker option set should be used when placing this reminder. Defaults to players. */
  pickerScope?: ReminderPickerScope;
  /** Which character placed this token (optional). */
  sourceCharacterId?: string;
  color?: string;
}

/** Session-level player identity. Per-game state lives in Game.playerState. */
export interface Player {
  id: PlayerId;
  name: string;
}

/**
 * One slot in a seating arrangement (template or game). Three kinds:
 * - `seat`: counts toward the displayed seat number (1..N), can hold a PlayerId.
 * - `spacer`: a gap in the circle to reflect IRL layout; never numbered.
 * - `storyteller`: storyteller orientation marker (typically singleton); never numbered.
 *
 * The display seat number is derived from position by counting only `seat` kinds
 * (see `utils/seating/displaySeat.ts`).
 */
export type Slot =
  | { kind: 'seat'; id: SlotId; playerId: PlayerId | null }
  | { kind: 'spacer'; id: SlotId }
  | { kind: 'storyteller'; id: SlotId };

/** A session-level seating template — copied into each new game at creation. */
export interface SeatingTemplate {
  slots: Slot[];
}

/** Whether a propagating mutation should also touch the template and/or sibling games. */
export interface PropagationPreference {
  /** When mutating a game's slots, also mirror onto the session template. */
  toTemplate: boolean;
  /** When mutating a game's slots, also mirror onto sibling games. */
  toOtherGames: boolean;
}

/** Game-level membership for a Player. */
export interface Participant {
  playerId: PlayerId;
  /** True when this participant plays as a Traveller (does not count toward role counts). */
  isTraveller: boolean;
}

/**
 * Per-player state inside a single Game. Every field here used to live on the old
 * `PlayerSeat` row; under M41 those rows are gone and per-player state is keyed by
 * `PlayerId` instead of seat number.
 */
export interface PlayerGameState {
  characterId: string;
  alive: boolean;
  ghostVoteUsed: boolean;
  visibleAlignment: Alignment;
  actualAlignment: Alignment;
  startingAlignment: Alignment;
  /** IDs of active reminder tokens placed on this player. */
  activeReminders: string[];
  /** Status tokens placed on this player (drunk, poisoned, custom). May be absent in legacy/API data. */
  tokens?: PlayerToken[];
  /** Character ID this player believes they are (for Drunk/Marionette concealment). */
  apparentCharacterId?: string;
  /** M35: history of alignment changes for this player (Cult Leader, Mezepheles, etc.). */
  alignmentHistory?: AlignmentChange[];
  /** M35: secondary character ability layered on top of base (Cannibal, Pixie, Philosopher, etc.). */
  gainedAbility?: GainedAbility;
}

// ──────────────────────────────────────────────
// Game
// ──────────────────────────────────────────────

/** A single game (one Demon, one winner). */
export interface Game {
  id: string;
  sessionId: string;
  scriptId: string;
  currentDay: number;
  currentPhase: Phase;
  isFirstNight: boolean;
  /**
   * Slot layout for this game. Snapshot of the session template at game-creation
   * time; mutated independently afterward (with optional propagation back to the
   * template and/or sibling games via {@link PropagationPreference}).
   */
  slots: Slot[];
  /** Players "in" this game. Need not match seated slots (travellers + unseated planning). */
  participants: Participant[];
  /** Per-player state keyed by PlayerId. */
  playerState: Record<PlayerId, PlayerGameState>;
  /**
   * Override for the character-assignment role count. When null, role counts derive
   * from `participants.length`. Useful when planning for travellers separately.
   */
  playerCountOverride: number | null;
  nightHistory: NightHistoryEntry[];
  /** Character IDs of active Fabled game modifiers. */
  activeFabled?: string[];
  /** Character IDs of active Loric game modifiers. */
  activeLoric?: string[];
  /** Character IDs selected as in-play for this game (subset of script). */
  inPlayCharacterIds?: string[];
  /** Character IDs of the 3 not-in-play good characters shown to the Demon as bluffs. */
  demonBluffs?: string[];
  /** Character IDs of the 3 good characters shown to the Lunatic as fake bluffs. */
  lunaticBluffs?: string[];
  /** Per-player bluffs keyed by PlayerId. Supports multiple demons/lunatics with distinct bluffs. */
  playerBluffs?: Record<PlayerId, string[]>;
  /** Custom messages the Storyteller can show to players fullscreen. Key = characterId. */
  customPlayerMessages?: Record<string, string>;
  /** Sync version — incremented on each server-side save. */
  version?: number;
  /** ISO 8601 timestamp of the last server-side update. */
  updatedAt?: string;
}

// ──────────────────────────────────────────────
// Session
// ──────────────────────────────────────────────

/** A play session that may contain multiple games. */
export interface Session {
  id: string;
  name: string;
  createdAt: string;
  defaultScriptId: string;
  /** Roster of named players that can be seated in the template or any game. */
  players: Player[];
  /** Seating template copied into each new game at creation. */
  template: SeatingTemplate;
  /** Sticky default for propagation checkboxes inside games. */
  propagationDefault: PropagationPreference;
  gameIds: string[];
  /** Sync version — incremented on each server-side save. */
  version?: number;
  /** ISO 8601 timestamp of the last server-side update. */
  updatedAt?: string;
}

// ──────────────────────────────────────────────
// Night History & Progress
// ──────────────────────────────────────────────

/** Saved record of a completed night walkthrough. */
export interface NightHistoryEntry {
  dayNumber: number;
  isFirstNight: boolean;
  completedAt: string;
  /** characterId → array of checkmark booleans for each sub-action. */
  subActionStates: Record<string, boolean[]>;
  /** characterId → free-text notes. */
  notes: Record<string, string>;
  /** characterId → selected value(s) from night choice dropdowns. */
  selections: Record<string, string | string[]>;
  /** characterId → snapshot of player tokens active when this night was completed. */
  tokenSnapshot?: Record<string, PlayerToken[]>;
}

/** A single actionable summary line for a night history entry. */
export interface NightSummaryLine {
  characterName: string;
  playerName?: string;
  action: string;
}

/** A resolved jinx pair where both characters are on the active script. */
export interface ActiveJinx {
  character1Id: string;
  character1Name: string;
  character2Id: string;
  character2Name: string;
  description: string;
}

/** Current in-flight night walkthrough progress. */
export interface NightProgress {
  currentCardIndex: number;
  subActionStates: Record<string, boolean[]>;
  notes: Record<string, string>;
  /** characterId → selected value(s) from night choice dropdowns. */
  selections: Record<string, string | string[]>;
  totalCards: number;
}

// ──────────────────────────────────────────────
// Sync (M30)
// ──────────────────────────────────────────────

/** Current sync connection status. */
export const SyncStatus = {
  Idle: 'idle',
  Syncing: 'syncing',
  Error: 'error',
  Offline: 'offline',
} as const;
export type SyncStatus = (typeof SyncStatus)[keyof typeof SyncStatus];

/** Lightweight version info returned by the /version endpoints. */
export interface VersionInfo {
  version: number;
  updatedAt: string;
}

// ──────────────────────────────────────────────
// M35 generalized character primitives
// ──────────────────────────────────────────────

export interface AlignmentChange {
  id: string;
  day: number;
  nightPhase: 'first' | 'other' | 'day' | 'manual';
  newAlignment: Alignment;
  reason: string;
  timestamp: number;
}

export interface GainedAbility {
  characterId: string;
  source: 'cannibal' | 'pixie' | 'philosopher' | 'alchemist' | 'boffin' | 'manual';
  hostSeat: number;
  grantedDay: number;
}

// ──────────────────────────────────────────────
// M36 Show-to-player redesign
// ──────────────────────────────────────────────

export type ShowToPlayerMessage = {
  id: string;
  seat: number;
  text: string;
  templateId?: string;
  createdAt: string;
  lastShownAt?: string;
  pinned?: boolean;
};

export type ShowToPlayerTemplate = {
  id: string;
  text: string;
  scope: 'script' | 'global';
  scriptId?: string;
  usageCount: number;
  lastUsedAt: string;
};

export interface Game {
  /** M36: Per-player, multi-slot messages waiting to be shown or recently shown. */
  showMessages?: ShowToPlayerMessage[];
  /** M36: User-pinned and recently used show-to-player templates. */
  showTemplates?: ShowToPlayerTemplate[];
}
