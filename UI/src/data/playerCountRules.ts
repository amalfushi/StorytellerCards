/**
 * Player count distribution rules for Blood on the Clocktower.
 *
 * Defines how many Townsfolk, Outsiders, Minions, and Demons
 * should be in play based on the total player count.
 */

export interface Distribution {
  townsfolk: number;
  outsiders: number;
  minions: number;
  demons: number;
}

export const PLAYER_COUNT_DISTRIBUTION: Record<number, Distribution> = {
  5: { townsfolk: 3, outsiders: 0, minions: 1, demons: 1 },
  6: { townsfolk: 3, outsiders: 1, minions: 1, demons: 1 },
  7: { townsfolk: 5, outsiders: 0, minions: 1, demons: 1 },
  8: { townsfolk: 5, outsiders: 1, minions: 1, demons: 1 },
  9: { townsfolk: 5, outsiders: 2, minions: 1, demons: 1 },
  10: { townsfolk: 7, outsiders: 0, minions: 2, demons: 1 },
  11: { townsfolk: 7, outsiders: 1, minions: 2, demons: 1 },
  12: { townsfolk: 7, outsiders: 3, minions: 2, demons: 1 },
  13: { townsfolk: 9, outsiders: 0, minions: 3, demons: 1 },
  14: { townsfolk: 9, outsiders: 1, minions: 3, demons: 1 },
  15: { townsfolk: 9, outsiders: 2, minions: 3, demons: 1 },
};

/**
 * Get the character distribution for a given player count.
 *
 * For counts below 5 defaults to the 5-player distribution.
 * For counts above 15 defaults to the 15-player distribution.
 */
export function getDistribution(playerCount: number): Distribution {
  if (playerCount <= 5) return { ...PLAYER_COUNT_DISTRIBUTION[5] };
  if (playerCount >= 15) return { ...PLAYER_COUNT_DISTRIBUTION[15] };
  return { ...PLAYER_COUNT_DISTRIBUTION[playerCount] };
}
