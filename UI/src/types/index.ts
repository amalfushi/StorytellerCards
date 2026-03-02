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

/** Full storyteller instructions for one night phase. */
export interface NightAction {
  /** Position in the master night order. */
  order: number;
  /** Complete storyteller help text. */
  helpText: string;
  /** Broken-down individual instruction steps. */
  subActions: NightSubAction[];
}

/** A reminder token that can be placed on the Grimoire. */
export interface ReminderToken {
  id: string;
  text: string;
  icon?: string;
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

/** Top-level shape of the nightOrder.json data file. */
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
// Player / Seat
// ──────────────────────────────────────────────

/** A status token that can be placed on a player in the Grimoire. */
export interface PlayerToken {
  id: string;
  type: 'drunk' | 'poisoned' | 'custom';
  label: string;
  /** Which character placed this token (optional). */
  sourceCharacterId?: string;
  color?: string;
}

/** A single player seat in a running game. */
export interface PlayerSeat {
  /** Seat number (1–20). */
  seat: number;
  playerName: string;
  characterId: string;
  alive: boolean;
  ghostVoteUsed: boolean;
  visibleAlignment: Alignment;
  actualAlignment: Alignment;
  startingAlignment: Alignment;
  /** IDs of active reminder tokens placed on this seat. */
  activeReminders: string[];
  isTraveller: boolean;
  /** Status tokens placed on this player (drunk, poisoned, custom). */
  tokens: PlayerToken[];
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
  players: PlayerSeat[];
  nightHistory: NightHistoryEntry[];
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
  defaultPlayers: Array<{ seat: number; playerName: string }>;
  gameIds: string[];
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

/** Current in-flight night walkthrough progress. */
export interface NightProgress {
  currentCardIndex: number;
  subActionStates: Record<string, boolean[]>;
  notes: Record<string, string>;
  /** characterId → selected value(s) from night choice dropdowns. */
  selections: Record<string, string | string[]>;
  totalCards: number;
}
