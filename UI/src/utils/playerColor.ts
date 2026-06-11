/**
 * Ordered 20-color palette for player identity colors.
 *
 * Used to color-code roster + seat chips so it's easy to visually
 * pair a player with their seat. Colors are assigned in stable
 * insertion order by player index (not by seat or by hash) so that
 * adding or removing seats doesn't shuffle existing player colors.
 *
 * The palette is hand-picked for:
 *   - high contrast against the default app background
 *   - decent perceptual separation between adjacent indices
 *   - colorblind-friendly avoidance of red/green adjacency
 *   - readability of small text overlays
 */
export const PLAYER_COLOR_PALETTE = [
  '#1976d2', // 1 — blue
  '#d32f2f', // 2 — red
  '#388e3c', // 3 — green
  '#f57c00', // 4 — orange
  '#7b1fa2', // 5 — purple
  '#0097a7', // 6 — teal
  '#c2185b', // 7 — pink
  '#5d4037', // 8 — brown
  '#455a64', // 9 — blue-grey
  '#fbc02d', // 10 — yellow
  '#303f9f', // 11 — indigo
  '#689f38', // 12 — light green
  '#e64a19', // 13 — deep orange
  '#0288d1', // 14 — light blue
  '#512da8', // 15 — deep purple
  '#00796b', // 16 — dark teal
  '#afb42b', // 17 — lime
  '#ad1457', // 18 — magenta
  '#6d4c41', // 19 — dark brown
  '#37474f', // 20 — dark blue-grey
] as const;

export const PLAYER_COLOR_COUNT = PLAYER_COLOR_PALETTE.length;

/**
 * Returns a stable color for the player at `index` in the roster.
 * Indices beyond the palette wrap around using modulo so we never throw.
 */
export function getPlayerColor(index: number): string {
  if (!Number.isInteger(index) || index < 0) return PLAYER_COLOR_PALETTE[0];
  return PLAYER_COLOR_PALETTE[index % PLAYER_COLOR_COUNT];
}

/**
 * Resolve a player's color by id given the current roster order.
 * Returns `undefined` if the id isn't present.
 */
export function getPlayerColorById(
  playerId: string,
  rosterIds: readonly string[],
): string | undefined {
  const idx = rosterIds.indexOf(playerId);
  if (idx < 0) return undefined;
  return getPlayerColor(idx);
}
