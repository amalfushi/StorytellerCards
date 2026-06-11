import { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import EventSeatIcon from '@mui/icons-material/EventSeat';
import { CharacterIconImage } from '@/components/common/CharacterIconImage.tsx';
import { getCharacterTypeColor } from '@/components/common/characterTypeColor.ts';
import type { Slot, SlotId } from '@/types/index.ts';
import type { TownSquarePlayer } from '@/components/TownSquare/PlayerToken.tsx';

export interface TokenPosition {
  x: number;
  y: number;
  angle: number;
}

/** Lightweight character data for corner displays. */
export interface CornerCharacter {
  id: string;
  name: string;
  abilityShort: string;
  type?: string;
}

export interface TownSquareLayoutProps {
  slots: Slot[];
  playersBySlotId: Map<SlotId, TownSquarePlayer>;
  renderToken: (player: TownSquarePlayer, position: TokenPosition) => React.ReactNode;
  shape: 'circle' | 'ovoid';
  containerWidth: number;
  containerHeight: number;
  /** Half-width of the largest token (px) — used as inset padding so tokens don't clip edges. */
  tokenRadius?: number;
  /**
   * Token badge layout mode. When `'linear'`, the player circle is shrunk
   * inward so reminder tokens along card edges have more room and aren't
   * clipped by the container boundary.
   */
  tokenLayout?: 'radial' | 'linear';
  /** Active Fabled characters shown in upper-left corner. */
  activeFabled?: CornerCharacter[];
  /** Active Loric characters shown in upper-right corner. */
  activeLoric?: CornerCharacter[];
}

/**
 * Layout engine that positions seating slots in a circle or ovoid (ellipse).
 *
 * - **Circle:** equal `rx` and `ry` radius (tablet ≥ 600 px).
 * - **Ovoid:** `ry > rx` so the ellipse is taller than wide (phone portrait).
 *
 * Slot positions follow `game.slots` order so spacers and storyteller markers
 * reserve layout gaps while only occupied seats render player tokens.
 */
/**
 * Scale factor applied to the player-token ellipse radii when using the
 * linear reminder-token layout. Pulling the ring inward by 12 % gives
 * reminder tokens along card edges enough room so they aren't clipped by
 * the container boundary.
 */
const LINEAR_RADIUS_SCALE = 0.88;

export function TownSquareLayout({
  slots,
  playersBySlotId,
  renderToken,
  shape,
  containerWidth,
  containerHeight,
  tokenRadius = 36,
  tokenLayout = 'radial',
  activeFabled = [],
  activeLoric = [],
}: TownSquareLayoutProps) {
  const [abilityDialog, setAbilityDialog] = useState<CornerCharacter | null>(null);

  const positions = useMemo(() => {
    const n = slots.length;
    if (n === 0 || containerWidth === 0 || containerHeight === 0) return [];

    const cx = containerWidth / 2;
    const cy = containerHeight / 2;

    // Leave room for half a token on each side
    const pad = tokenRadius + 4;

    let rx: number;
    let ry: number;

    if (shape === 'circle') {
      const r = Math.min(cx, cy) - pad;
      rx = r;
      ry = r;
    } else {
      // Ovoid — taller than wide
      rx = cx - pad;
      ry = cy - pad;
      // Ensure ry ≥ rx for portrait emphasis
      if (ry < rx) {
        const tmp = ry;
        ry = rx;
        rx = tmp;
      }
    }

    // In linear mode, shrink radii so edge-placed reminder tokens aren't clipped
    if (tokenLayout === 'linear') {
      rx *= LINEAR_RADIUS_SCALE;
      ry *= LINEAR_RADIUS_SCALE;
    }

    // Clamp radii to minimum so the layout stays usable
    rx = Math.max(rx, 30);
    ry = Math.max(ry, 30);

    return slots.map((_, i): TokenPosition => {
      // Start at 12-o'clock (-π/2) and go clockwise
      const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
      const x = cx + rx * Math.cos(angle);
      const y = cy + ry * Math.sin(angle);
      return { x, y, angle };
    });
  }, [slots, containerWidth, containerHeight, shape, tokenRadius, tokenLayout]);

  if (containerWidth === 0 || containerHeight === 0) return null;

  return (
    <Box
      sx={{
        position: 'relative',
        width: containerWidth,
        height: containerHeight,
        mx: 'auto',
      }}
    >
      {/* Subtle centre label */}
      <Typography
        variant="caption"
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'text.disabled',
          fontSize: '0.65rem',
          pointerEvents: 'none',
          userSelect: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        Town Square
      </Typography>

      {slots.map((slot, i) => {
        const pos = positions[i];
        if (!pos) return null;

        if (slot.kind === 'spacer') {
          return (
            <Box
              key={slot.id}
              data-testid={`spacer-marker-${slot.id}`}
              aria-label="seating gap"
              sx={{
                position: 'absolute',
                left: pos.x,
                top: pos.y,
                transform: 'translate(-50%, -50%)',
                width: 24,
                height: 24,
                borderRadius: '50%',
                border: '2px dashed',
                borderColor: 'divider',
                opacity: 0.55,
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            />
          );
        }

        if (slot.kind === 'storyteller') {
          return (
            <Box
              key={slot.id}
              data-testid={`storyteller-marker-${slot.id}`}
              aria-label="storyteller position"
              sx={{
                position: 'absolute',
                left: pos.x,
                top: pos.y,
                transform: 'translate(-50%, -50%)',
                width: 36,
                height: 36,
                borderRadius: '50%',
                bgcolor: 'background.paper',
                border: '2px solid',
                borderColor: 'primary.main',
                color: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                userSelect: 'none',
                boxShadow: 1,
              }}
            >
              <EventSeatIcon fontSize="small" />
            </Box>
          );
        }

        const player = playersBySlotId.get(slot.id);
        if (!player) return null;
        return (
          <Box
            key={slot.id}
            sx={{
              position: 'absolute',
              left: pos.x,
              top: pos.y,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {renderToken(player, pos)}
          </Box>
        );
      })}

      {/* Setup powers corner — Fabled and Loric */}
      {[...activeFabled, ...activeLoric].length > 0 && (
        <Box
          data-testid="setup-powers-corner"
          sx={{
            position: 'absolute',
            top: 4,
            left: 4,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
            zIndex: 2,
            alignItems: 'flex-start',
          }}
        >
          {[
            ...activeFabled.map((ch) => ({ ...ch, setupType: 'Fabled' as const })),
            ...activeLoric.map((ch) => ({ ...ch, setupType: 'Loric' as const })),
          ].map((ch) => {
            const typeColor = getCharacterTypeColor(ch.setupType);
            return (
              <IconButton
                key={`${ch.setupType}-${ch.id}`}
                size="small"
                data-testid={`${ch.setupType === 'Fabled' ? 'fabled' : 'loric'}-chip-${ch.id}`}
                onClick={() => setAbilityDialog(ch)}
                aria-label={`${ch.setupType}: ${ch.name}`}
                title={`${ch.setupType}: ${ch.name}`}
                sx={{ p: 0.25 }}
              >
                <CharacterIconImage
                  characterId={ch.id}
                  characterName={ch.name}
                  typeColor={typeColor}
                  borderColor={typeColor}
                  size={34}
                />
              </IconButton>
            );
          })}
        </Box>
      )}

      {/* Ability text dialog */}
      <Dialog
        open={abilityDialog !== null}
        onClose={() => setAbilityDialog(null)}
        maxWidth="xs"
        fullWidth
      >
        {abilityDialog && (
          <>
            <DialogTitle>{abilityDialog.name}</DialogTitle>
            <DialogContent>
              <Typography variant="body2">{abilityDialog.abilityShort}</Typography>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
}
