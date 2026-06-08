/**
 * M40 Playground — local data model (decoupled from production Session/Game).
 * See: docs/milestones/40 - seating template rework/milestone40.md
 */

export type PlayerId = string;
export type SlotId = string;
export type GameId = string;

export interface PgPlayer {
  id: PlayerId;
  name: string;
}

export type PgSlot =
  | { kind: 'seat'; id: SlotId; playerId: PlayerId | null }
  | { kind: 'spacer'; id: SlotId }
  | { kind: 'storyteller'; id: SlotId };

export interface PgSeatingTemplate {
  slots: PgSlot[];
}

export interface PgParticipant {
  playerId: PlayerId;
  isTraveller: boolean;
}

export interface PgGame {
  id: GameId;
  name: string;
  /** Snapshot of template slots at game-creation time; mutated independently afterward. */
  slots: PgSlot[];
  /** Players "in" the game. Need not match seated slots (travellers, pre-game planning). */
  participants: PgParticipant[];
  /** Override for the character-assignment role count. null → derive from participants.length. */
  playerCountOverride: number | null;
  /** playerId → characterId */
  characterAssignments: Record<PlayerId, string>;
}

export interface PgPropagationPreference {
  /** When assigning a seat in a game, also apply to template? */
  toTemplate: boolean;
  /** When assigning a seat in a game, also apply to other games? */
  toOtherGames: boolean;
}

export interface PgSession {
  players: PgPlayer[];
  template: PgSeatingTemplate;
  games: PgGame[];
  activeGameId: GameId | null;
  propagationDefault: PgPropagationPreference;
}

export const initialPgSession: PgSession = {
  players: [],
  template: { slots: [] },
  games: [],
  activeGameId: null,
  propagationDefault: { toTemplate: true, toOtherGames: true },
};
