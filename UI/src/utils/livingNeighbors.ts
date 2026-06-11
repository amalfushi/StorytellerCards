import type { Player, PlayerGameState, PlayerId, Slot } from '@/types/index.ts';
import { Alignment } from '@/types/index.ts';
import { buildDisplaySeatNumberMap, seatSlotsOnly } from '@/utils/seating/index.ts';

export interface LivingNeighbor {
  playerId: PlayerId;
  /** 1-based seat number from buildDisplaySeatNumberMap. */
  displaySeat: number;
  playerName: string;
  characterId: string;
  actualAlignment: Alignment;
}

/**
 * Find the nearest living neighbor in each direction (left + right) around the
 * circle of seated slots (spacers/storyteller markers are skipped). Returns an
 * empty array if `fromPlayerId` isn't seated, or if there's no other living player.
 */
export function findLivingNeighbors(
  slots: Slot[],
  playerState: Record<PlayerId, PlayerGameState>,
  sessionPlayers: Player[],
  fromPlayerId: PlayerId,
): LivingNeighbor[] {
  const seatSlots = seatSlotsOnly(slots);
  const index = seatSlots.findIndex((slot) => slot.playerId === fromPlayerId);
  if (index === -1 || seatSlots.length <= 1) return [];

  const displaySeatNumbers = buildDisplaySeatNumberMap(slots);
  const playersById = new Map(sessionPlayers.map((player) => [player.id, player]));
  const neighbors: LivingNeighbor[] = [];
  const seenPlayerIds = new Set<PlayerId>();
  const directions = [-1, 1] as const;

  for (const direction of directions) {
    for (let distance = 1; distance < seatSlots.length; distance += 1) {
      const candidate =
        seatSlots[(index + direction * distance + seatSlots.length) % seatSlots.length];
      const candidatePlayerId = candidate.playerId;
      if (candidatePlayerId === null || candidatePlayerId === fromPlayerId) continue;
      if (playerState[candidatePlayerId]?.alive === false) continue;
      if (seenPlayerIds.has(candidatePlayerId)) break;

      neighbors.push({
        playerId: candidatePlayerId,
        displaySeat: displaySeatNumbers.get(candidate.id) ?? 0,
        playerName: playersById.get(candidatePlayerId)?.name ?? '',
        characterId: playerState[candidatePlayerId]?.characterId ?? '',
        actualAlignment: playerState[candidatePlayerId]?.actualAlignment ?? Alignment.Unknown,
      });
      seenPlayerIds.add(candidatePlayerId);
      break;
    }
  }

  return neighbors;
}
