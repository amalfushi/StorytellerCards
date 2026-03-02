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
import type { PlayerSeat, PlayerToken, CharacterDef } from '@/types/index.ts';
import { generateId } from '@/utils/idGenerator.ts';

// ──────────────────────────────────────────────
// Token colour constants & limits
// ──────────────────────────────────────────────

const TOKEN_COLORS = {
  drunk: '#1976d2', // blue
  poisoned: '#7b1fa2', // purple
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
  /** Position of the tile centre in pixels. */
  tileX: number;
  tileY: number;
  /** Centre of the town square in pixels. */
  centerX: number;
  centerY: number;
}

/**
 * Abbreviate a token label for compact badge display.
 * ≤ 5 chars → full, otherwise first 4 + "…"
 */
function abbreviateLabel(label: string): string {
  return label.length <= 5 ? label : `${label.slice(0, 4)}…`;
}

/**
 * Renders small coloured token badges around a player tile.
 *
 * Tokens radiate outward from the centre-facing angle of the tile,
 * alternating clockwise/counterclockwise in a fan pattern.
 */
export function TokenBadges({ tokens, tileX, tileY, centerX, centerY }: TokenBadgesProps) {
  if (!tokens || tokens.length === 0) return null;

  // Angle from tile to the centre of the town square
  const angleToCenter = Math.atan2(centerY - tileY, centerX - tileX);

  // Distance from tile centre to each badge
  const badgeDistance = 40;
  // Angular offset between consecutive badges — shrinks as token count grows
  // so that many badges (up to 12) still fit without excessive overlap.
  const maxStep = 35; // degrees for ≤3 tokens
  const minStep = 18; // degrees floor for many tokens
  const stepDeg =
    tokens.length <= 3 ? maxStep : Math.max(minStep, maxStep - (tokens.length - 3) * 2);
  const offsetStep = (stepDeg * Math.PI) / 180;

  return (
    <>
      {tokens.map((token, i) => {
        // Fan layout: 0 → center angle, 1 → +offset, 2 → -offset, 3 → +2*offset, …
        const sign = i % 2 === 0 ? 1 : -1;
        const multiplier = Math.ceil((i + 1) / 2);
        const badgeAngle = i === 0 ? angleToCenter : angleToCenter + sign * multiplier * offsetStep;

        const dx = badgeDistance * Math.cos(badgeAngle);
        const dy = badgeDistance * Math.sin(badgeAngle);

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
}

/**
 * Dialog to add/remove status tokens (Drunk, Poisoned, custom) from a player.
 */
export function TokenManager({
  open,
  player,
  onClose,
  onAddToken,
  onRemoveToken,
  characterDef,
}: TokenManagerProps) {
  const [customLabel, setCustomLabel] = useState('');

  if (!player) return null;

  const tokens = player.tokens ?? [];
  const reminders = characterDef?.reminders ?? [];

  // Lookup existing drunk / poisoned tokens for toggle behaviour
  const existingDrunk = tokens.find((t) => t.type === 'drunk');
  const existingPoisoned = tokens.find((t) => t.type === 'poisoned');

  // Count of custom tokens (includes character reminders that use type 'custom')
  const customTokenCount = tokens.filter((t) => t.type === 'custom').length;

  /** Toggle a preset token: if it already exists, remove it; otherwise add it. */
  const handleTogglePreset = (type: 'drunk' | 'poisoned', label: string, color: string) => {
    const existing = type === 'drunk' ? existingDrunk : existingPoisoned;
    if (existing) {
      onRemoveToken(player.seat, existing.id);
    } else {
      onAddToken(player.seat, {
        id: generateId(),
        type,
        label,
        color,
      });
    }
  };

  const handleAddReminder = (text: string) => {
    if (customTokenCount >= MAX_CUSTOM_TOKENS) return;
    onAddToken(player.seat, {
      id: generateId(),
      type: 'custom',
      label: text,
      sourceCharacterId: characterDef?.id,
      color: TOKEN_COLORS.custom,
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

        {/* Preset toggle buttons (on/off — max 1 each) */}
        <Typography variant="subtitle2" gutterBottom>
          Status Tokens
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Button
            variant={existingDrunk ? 'contained' : 'outlined'}
            size="small"
            onClick={() => handleTogglePreset('drunk', 'Drunk', TOKEN_COLORS.drunk)}
            sx={{ textTransform: 'none' }}
          >
            🍺 Drunk
          </Button>
          <Button
            variant={existingPoisoned ? 'contained' : 'outlined'}
            size="small"
            onClick={() => handleTogglePreset('poisoned', 'Poisoned', TOKEN_COLORS.poisoned)}
            sx={{ textTransform: 'none' }}
          >
            ☠️ Poisoned
          </Button>
        </Box>

        {/* Character-specific reminder tokens */}
        {reminders.length > 0 && (
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
                  onClick={() => handleAddReminder(r.text)}
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
