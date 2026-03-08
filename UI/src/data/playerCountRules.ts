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

// ──────────────────────────────────────────────
// M4: Script-aware distribution suggestions
// ──────────────────────────────────────────────

/** A soft suggestion for adjusting the distribution for a specific script. */
export interface DistributionSuggestion {
  /** Suggested distribution override (partial — only changed fields). */
  suggested: Partial<Distribution>;
  /** Human-readable explanation for why this suggestion exists. */
  reason: string;
}

/**
 * Analyse a script's character IDs and return soft suggestions for adjusting
 * the default distribution.  Returns an empty array for normal scripts.
 *
 * Recognised edge-case characters:
 * - **legion** — all minion slots become Legion copies: suggests `demons = minions + 1`
 * - **atheist** — no evil characters at all: suggests `demons = 0, minions = 0`
 * - **lilmonsta** — the demon is a token, not a player: suggests `demons = 0`
 */
export function getDistributionSuggestions(
  scriptCharacterIds: string[],
  baseDistribution: Distribution,
): DistributionSuggestion[] {
  const idSet = new Set(scriptCharacterIds);
  const suggestions: DistributionSuggestion[] = [];

  if (idSet.has('atheist')) {
    suggestions.push({
      suggested: { demons: 0, minions: 0 },
      reason: 'Atheist: No evil characters in the game. Consider setting Demons and Minions to 0.',
    });
  }

  if (idSet.has('legion')) {
    const legionDemons = baseDistribution.minions + 1;
    suggestions.push({
      suggested: { demons: legionDemons, minions: 0 },
      reason: `Legion: All Minion slots become Legion copies. Consider ${legionDemons} Demons and 0 Minions.`,
    });
  }

  if (idSet.has('lilmonsta')) {
    suggestions.push({
      suggested: { demons: 0 },
      reason:
        "Lil' Monsta: The demon is a token babysat by a Minion, not assigned to a player. Consider 0 Demon players.",
    });
  }

  return suggestions;
}

/** Severity levels for distribution warnings. */
export const DistributionWarningSeverity = {
  Info: 'info',
  Warning: 'warning',
} as const;
export type DistributionWarningSeverity =
  (typeof DistributionWarningSeverity)[keyof typeof DistributionWarningSeverity];

/** A soft warning about unusual distribution values. */
export interface DistributionWarning {
  severity: DistributionWarningSeverity;
  message: string;
}

/**
 * Check a distribution for unusual values and return soft warnings.
 * These are informational — the Storyteller can override them.
 */
export function getDistributionWarnings(
  distribution: Distribution,
  scriptCharacterIds: string[],
): DistributionWarning[] {
  const warnings: DistributionWarning[] = [];
  const idSet = new Set(scriptCharacterIds);

  if (distribution.demons === 0 && !idSet.has('atheist') && !idSet.has('lilmonsta')) {
    warnings.push({
      severity: DistributionWarningSeverity.Warning,
      message:
        "No Demons in distribution. This is unusual unless Atheist or Lil' Monsta is in play.",
    });
  }

  if (distribution.demons > 1 && !idSet.has('legion')) {
    warnings.push({
      severity: DistributionWarningSeverity.Info,
      message: 'Multiple Demons in distribution. This is unusual unless Legion is in play.',
    });
  }

  if (distribution.minions === 0 && !idSet.has('atheist') && !idSet.has('legion')) {
    warnings.push({
      severity: DistributionWarningSeverity.Warning,
      message: 'No Minions in distribution. This is unusual unless Atheist or Legion is in play.',
    });
  }

  return warnings;
}
