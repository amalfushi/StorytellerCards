import type { PlayerSeat } from '@/types/index.ts';

export interface LivingNeighbor {
  seat: number;
  playerName: string;
  characterId: string;
  actualAlignment: PlayerSeat['actualAlignment'];
}

export function findLivingNeighbors(players: PlayerSeat[], seat: number): LivingNeighbor[] {
  const sorted = [...players].sort((a, b) => a.seat - b.seat);
  const index = sorted.findIndex((player) => player.seat === seat);
  if (index === -1 || sorted.length <= 1) return [];

  const neighbors: LivingNeighbor[] = [];
  const seenSeats = new Set<number>();
  const directions = [-1, 1] as const;

  for (const direction of directions) {
    for (let distance = 1; distance < sorted.length; distance += 1) {
      const candidate = sorted[(index + direction * distance + sorted.length) % sorted.length];
      if (candidate.seat === seat) continue;
      if (!candidate.alive) continue;
      if (!seenSeats.has(candidate.seat)) {
        neighbors.push({
          seat: candidate.seat,
          playerName: candidate.playerName,
          characterId: candidate.characterId,
          actualAlignment: candidate.actualAlignment,
        });
        seenSeats.add(candidate.seat);
      }
      break;
    }
  }

  return neighbors;
}
