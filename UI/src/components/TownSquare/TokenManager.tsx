import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { PlayerSeat, PlayerToken, CharacterDef, ReminderToken } from '@/types/index.ts';
import { generateId } from '@/utils/idGenerator.ts';

// ──────────────────────────────────────────────
// Token colour constants & limits
// ──────────────────────────────────────────────

const TOKEN_COLORS = {
  drunk: '#1976d2', // blue
  poisoned: '#7b1fa2', // purple
  mad: '#ff9800', // orange
  character: '#00897b', // teal — character-specific reminders
  custom: '#ff9800', // orange fallback
} as const;

/** Maximum number of custom tokens a single player can hold. */
const MAX_CUSTOM_TOKENS = 10;

// ──────────────────────────────────────────────
// TokenBadges — visual display around player tile
// ──────────────────────────────────────────────

export interface TokenBadgesProps {
  /** The player's active tokens. */
  tokens: PlayerToken[];
  /** Position of the tile centre in pixels (container coordinate space). */
  tileX: number;
  tileY: number;
  /** Centre of the town square in pixels (container coordinate space). */
  centerX: number;
  centerY: number;
  /** Width of the player card in pixels — used to offset badges from card centre. */
  cardWidth: number;
  /** Height of the player card in pixels — used to offset badges from card centre. */
  cardHeight: number;
  /**
   * Layout mode for token badges.
   * - `'radial'` — fan pattern radiating from the card centre (default).
   * - `'linear'` — straight line along the card edge furthest from the town square centre.
   */
  tokenLayout?: 'radial' | 'linear';
}

/**
 * Abbreviate a token label for compact badge display.
 * ≤ 5 chars → full, otherwise first 4 + "…"
 */
function abbreviateLabel(label: string): string {
  return label.length <= 5 ? label : `${label.slice(0, 4)}…`;
}

/**
 * Compute badge position for radial (fan) layout.
 */
function computeRadialPosition(
  i: number,
  tokenCount: number,
  angleToCenter: number,
  halfW: number,
  halfH: number,
): { dx: number; dy: number } {
  const badgeRadius = BADGE_SIZE / 2;
  const badgeDistance = Math.max(halfW, halfH) + badgeRadius + 4;
  const maxStep = 35;
  const minStep = 18;
  const stepDeg = tokenCount <= 3 ? maxStep : Math.max(minStep, maxStep - (tokenCount - 3) * 2);
  const offsetStep = (stepDeg * Math.PI) / 180;

  const sign = i % 2 === 0 ? 1 : -1;
  const multiplier = Math.ceil((i + 1) / 2);
  const badgeAngle = i === 0 ? angleToCenter : angleToCenter + sign * multiplier * offsetStep;

  return {
    dx: halfW + badgeDistance * Math.cos(badgeAngle),
    dy: halfH + badgeDistance * Math.sin(badgeAngle),
  };
}

/** Badge diameter in px. */
const BADGE_SIZE = 20;
/** Gap between badges in linear layout, in px. */
const LINEAR_GAP = 5;
/** Offset from card edge to badge centre, in px. */
const EDGE_OFFSET = BADGE_SIZE / 2 + 2;

/**
 * Compute badge position for linear layout.
 *
 * Badges are placed in a line along the card edge furthest from the
 * town square centre, centred on that edge.
 */
function computeLinearPosition(
  i: number,
  tokenCount: number,
  tileX: number,
  tileY: number,
  centerX: number,
  centerY: number,
  halfW: number,
  halfH: number,
): { dx: number; dy: number } {
  // Determine the dominant axis: the one where the tile is further from centre
  const absDx = Math.abs(tileX - centerX);
  const absDy = Math.abs(tileY - centerY);

  // Total span of badges in the line
  const totalSpan = tokenCount * BADGE_SIZE + (tokenCount - 1) * LINEAR_GAP;
  // Offset from the centre of the line for the i-th badge
  const startOffset = -totalSpan / 2 + BADGE_SIZE / 2;
  const linearPos = startOffset + i * (BADGE_SIZE + LINEAR_GAP);

  if (absDx >= absDy) {
    // Horizontal dominant → place tokens left or right of card
    const isRight = tileX >= centerX; // tile is right-of or at centre → tokens go right
    const dx = isRight ? halfW * 2 + EDGE_OFFSET : -EDGE_OFFSET;
    const dy = halfH + linearPos;
    return { dx, dy };
  } else {
    // Vertical dominant → place tokens above or below card
    const isBelow = tileY >= centerY; // tile is below or at centre → tokens go below
    const dx = halfW + linearPos;
    const dy = isBelow ? halfH * 2 + EDGE_OFFSET : -EDGE_OFFSET;
    return { dx, dy };
  }
}

/**
 * Renders small coloured token badges around a player tile.
 *
 * - **Radial mode**: tokens radiate outward from the centre-facing angle of the tile,
 *   alternating clockwise/counterclockwise in a fan pattern.
 * - **Linear mode**: tokens are placed in a straight line along the card edge
 *   furthest from the town square centre.
 */
export function TokenBadges({
  tokens,
  tileX,
  tileY,
  centerX,
  centerY,
  cardWidth,
  cardHeight,
  tokenLayout = 'radial',
}: TokenBadgesProps) {
  if (!tokens || tokens.length === 0) return null;

  // Angle from tile centre to the centre of the town square
  const angleToCenter = Math.atan2(centerY - tileY, centerX - tileX);

  // Offset from card top-left to card centre (badges are positioned
  // relative to the card's top-left via position: absolute)
  const halfW = cardWidth / 2;
  const halfH = cardHeight / 2;

  return (
    <>
      {tokens.map((token, i) => {
        const { dx, dy } =
          tokenLayout === 'linear'
            ? computeLinearPosition(i, tokens.length, tileX, tileY, centerX, centerY, halfW, halfH)
            : computeRadialPosition(i, tokens.length, angleToCenter, halfW, halfH);

        const bgColor = token.color ?? TOKEN_COLORS[token.type] ?? TOKEN_COLORS.custom;

        return (
          <Box
            key={token.id}
            title={token.label}
            sx={{
              position: 'absolute',
              left: dx,
              top: dy,
              transform: 'translate(-50%, -50%)',
              minWidth: 20,
              height: 20,
              borderRadius: '10px',
              bgcolor: bgColor,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              px: 0.4,
              fontSize: '0.55rem',
              fontWeight: 700,
              lineHeight: 1,
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.4)',
              pointerEvents: 'none',
              userSelect: 'none',
              zIndex: 5,
            }}
          >
            {abbreviateLabel(token.label)}
          </Box>
        );
      })}
    </>
  );
}

// ──────────────────────────────────────────────
// Helpers — map ReminderToken → PlayerToken props
// ──────────────────────────────────────────────

/**
 * Determine the PlayerToken `type` and `color` for a given available reminder token.
 */
function tokenPropsForReminder(reminder: ReminderToken): {
  type: PlayerToken['type'];
  color: string;
  sourceCharacterId?: string;
} {
  switch (reminder.id) {
    case 'basic-drunk':
      return { type: 'drunk', color: TOKEN_COLORS.drunk };
    case 'basic-poisoned':
      return { type: 'poisoned', color: TOKEN_COLORS.poisoned };
    case 'basic-mad':
      return { type: 'custom', color: TOKEN_COLORS.mad };
    default:
      // Character-specific reminder — extract source character from the id prefix
      // e.g. "lycanthrope-fauxpaw" → sourceCharacterId = "lycanthrope"
      return {
        type: 'custom',
        color: TOKEN_COLORS.character,
        sourceCharacterId: reminder.id.includes('-')
          ? reminder.id.slice(0, reminder.id.indexOf('-'))
          : undefined,
      };
  }
}

// ──────────────────────────────────────────────
// TokenManagerDialog — add/remove tokens dialog
// ──────────────────────────────────────────────

export interface TokenManagerProps {
  open: boolean;
  player: PlayerSeat | null;
  onClose: () => void;
  onAddToken: (seat: number, token: PlayerToken) => void;
  onRemoveToken: (seat: number, tokenId: string) => void;
  /** Character definition for the player, used to show character-specific reminders. */
  characterDef?: CharacterDef;
  /** All available tokens built from active characters in the game. */
  availableTokens?: ReminderToken[];
}

/**
 * Dialog to add/remove status tokens (Drunk, Poisoned, character reminders, custom) from a player.
 */
export function TokenManager({
  open,
  player,
  onClose,
  onAddToken,
  onRemoveToken,
  characterDef,
  availableTokens,
}: TokenManagerProps) {
  const [customLabel, setCustomLabel] = useState('');

  if (!player) return null;

  const tokens = player.tokens ?? [];
  const reminders = characterDef?.reminders ?? [];

  // Count of custom tokens (includes character reminders that use type 'custom')
  const customTokenCount = tokens.filter((t) => t.type === 'custom').length;

  // Split available tokens into basic (Drunk/Poisoned/Mad) and character-specific
  const basicTokens = (availableTokens ?? []).filter((t) => t.id.startsWith('basic-'));
  const characterTokens = (availableTokens ?? []).filter((t) => !t.id.startsWith('basic-'));

  // Set of this player's character reminder IDs for highlighting
  const playerReminderIds = new Set(reminders.map((r) => r.id));

  /** Toggle a basic token: if it already exists, remove it; otherwise add it. */
  const handleToggleBasic = (reminder: ReminderToken) => {
    const props = tokenPropsForReminder(reminder);
    const existing = tokens.find((t) => t.type === props.type && t.label === reminder.text);
    if (existing) {
      onRemoveToken(player.seat, existing.id);
    } else {
      onAddToken(player.seat, {
        id: generateId(),
        type: props.type,
        label: reminder.text,
        color: props.color,
        sourceCharacterId: props.sourceCharacterId,
      });
    }
  };

  /** Add a character-specific reminder token. */
  const handleAddCharacterReminder = (reminder: ReminderToken) => {
    if (customTokenCount >= MAX_CUSTOM_TOKENS) return;
    const props = tokenPropsForReminder(reminder);
    onAddToken(player.seat, {
      id: generateId(),
      type: props.type,
      label: reminder.text,
      color: props.color,
      sourceCharacterId: props.sourceCharacterId,
    });
  };

  const handleAddCustom = () => {
    if (!customLabel.trim()) return;
    if (customTokenCount >= MAX_CUSTOM_TOKENS) return;
    onAddToken(player.seat, {
      id: generateId(),
      type: 'custom',
      label: customLabel.trim(),
      color: TOKEN_COLORS.custom,
    });
    setCustomLabel('');
  };

  /** Check whether a basic token is currently active on this player. */
  const isBasicActive = (reminder: ReminderToken): boolean => {
    const props = tokenPropsForReminder(reminder);
    return tokens.some((t) => t.type === props.type && t.label === reminder.text);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>
        <Typography component="span" variant="h6">
          Tokens — {player.playerName} (Seat {player.seat})
        </Typography>
      </DialogTitle>
      <DialogContent>
        {/* Current tokens */}
        {tokens.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Active Tokens
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {tokens.map((t) => (
                <Chip
                  key={t.id}
                  label={t.label}
                  size="small"
                  onDelete={() => onRemoveToken(player.seat, t.id)}
                  sx={{
                    bgcolor: t.color ?? TOKEN_COLORS[t.type] ?? '#9e9e9e',
                    color: '#fff',
                    fontWeight: 600,
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Basic tokens (Drunk / Poisoned / Mad) — toggle on/off */}
        {basicTokens.length > 0 && (
          <>
            <Typography variant="subtitle2" gutterBottom>
              Status Tokens
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              {basicTokens.map((bt) => {
                const active = isBasicActive(bt);
                const props = tokenPropsForReminder(bt);
                return (
                  <Button
                    key={bt.id}
                    variant={active ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => handleToggleBasic(bt)}
                    sx={{
                      textTransform: 'none',
                      ...(active && {
                        bgcolor: props.color,
                        '&:hover': { bgcolor: props.color, filter: 'brightness(0.9)' },
                      }),
                    }}
                  >
                    {bt.text}
                  </Button>
                );
              })}
            </Box>
          </>
        )}

        {/* Fallback when no availableTokens provided — hardcoded Drunk/Poisoned */}
        {!availableTokens && (
          <>
            <Typography variant="subtitle2" gutterBottom>
              Status Tokens
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              {(['drunk', 'poisoned'] as const).map((preset) => {
                const existing = tokens.find((t) => t.type === preset);
                const label = preset === 'drunk' ? 'Drunk' : 'Poisoned';
                const color = TOKEN_COLORS[preset];
                return (
                  <Button
                    key={preset}
                    variant={existing ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => {
                      if (existing) {
                        onRemoveToken(player.seat, existing.id);
                      } else {
                        onAddToken(player.seat, {
                          id: generateId(),
                          type: preset,
                          label,
                          color,
                        });
                      }
                    }}
                    sx={{
                      textTransform: 'none',
                      ...(existing && {
                        bgcolor: color,
                        '&:hover': { bgcolor: color, filter: 'brightness(0.9)' },
                      }),
                    }}
                  >
                    {label}
                  </Button>
                );
              })}
            </Box>
          </>
        )}

        {/* Character-specific reminder tokens from ALL active characters */}
        {characterTokens.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Character Reminders
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {characterTokens.map((r) => {
                const isPlayerReminder = playerReminderIds.has(r.id);
                return (
                  <Button
                    key={r.id}
                    variant="outlined"
                    size="small"
                    onClick={() => handleAddCharacterReminder(r)}
                    disabled={customTokenCount >= MAX_CUSTOM_TOKENS}
                    sx={{
                      textTransform: 'none',
                      fontSize: '0.75rem',
                      borderColor: isPlayerReminder ? TOKEN_COLORS.character : undefined,
                      color: isPlayerReminder ? TOKEN_COLORS.character : undefined,
                      fontWeight: isPlayerReminder ? 700 : 400,
                    }}
                  >
                    {r.text}
                  </Button>
                );
              })}
            </Box>
          </Box>
        )}

        {/* Fallback: character-specific reminders when no availableTokens provided */}
        {!availableTokens && reminders.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              {characterDef?.name} Reminders
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {reminders.map((r) => (
                <Button
                  key={r.id}
                  variant="outlined"
                  size="small"
                  onClick={() => handleAddCharacterReminder(r)}
                  disabled={customTokenCount >= MAX_CUSTOM_TOKENS}
                  sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                >
                  {r.text}
                </Button>
              ))}
            </Box>
          </Box>
        )}

        {/* Custom token input */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField
            label={
              customTokenCount >= MAX_CUSTOM_TOKENS
                ? `Limit reached (${MAX_CUSTOM_TOKENS})`
                : 'Custom token'
            }
            size="small"
            fullWidth
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddCustom();
            }}
            disabled={customTokenCount >= MAX_CUSTOM_TOKENS}
          />
          <Button
            variant="contained"
            size="small"
            onClick={handleAddCustom}
            disabled={!customLabel.trim() || customTokenCount >= MAX_CUSTOM_TOKENS}
          >
            Add
          </Button>
        </Box>
        {customTokenCount >= MAX_CUSTOM_TOKENS && (
          <Typography variant="caption" color="warning.main" sx={{ mt: 0.5, display: 'block' }}>
            Maximum of {MAX_CUSTOM_TOKENS} custom tokens reached.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
