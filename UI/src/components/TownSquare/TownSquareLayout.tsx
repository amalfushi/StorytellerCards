import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import type { PlayerSeat } from '@/types/index.ts';

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
}

export interface TownSquareLayoutProps {
  players: PlayerSeat[];
  renderToken: (player: PlayerSeat, position: TokenPosition) => React.ReactNode;
  shape: 'circle' | 'ovoid';
  containerWidth: number;
  containerHeight: number;
  /** Half-width of the largest token (px) — used as inset padding so tokens don't clip edges. */
  tokenRadius?: number;
  /** Active Fabled characters shown in upper-left corner. */
  activeFabled?: CornerCharacter[];
  /** Active Loric characters shown in upper-right corner. */
  activeLoric?: CornerCharacter[];
}

/**
 * Layout engine that positions player tokens in a circle or ovoid (ellipse).
 *
 * - **Circle:** equal `rx` and `ry` radius (tablet ≥ 600 px).
 * - **Ovoid:** `ry > rx` so the ellipse is taller than wide (phone portrait).
 *
 * Players are placed clockwise starting from 12-o'clock (seat 1 at top).
 *
 * All tokens use `position: absolute` with `transform: translate(-50%, -50%)`
 * so the calculated (x, y) centre lands exactly on the ellipse.
 */
export function TownSquareLayout({
  players,
  renderToken,
  shape,
  containerWidth,
  containerHeight,
  tokenRadius = 36,
  activeFabled = [],
  activeLoric = [],
}: TownSquareLayoutProps) {
  const [abilityDialog, setAbilityDialog] = useState<CornerCharacter | null>(null);
  const sorted = useMemo(() => [...players].sort((a, b) => a.seat - b.seat), [players]);

  const positions = useMemo(() => {
    const n = sorted.length;
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

    // Clamp radii to minimum so the layout stays usable
    rx = Math.max(rx, 30);
    ry = Math.max(ry, 30);

    return sorted.map((_, i): TokenPosition => {
      // Start at 12-o'clock (-π/2) and go clockwise
      const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
      const x = cx + rx * Math.cos(angle);
      const y = cy + ry * Math.sin(angle);
      return { x, y, angle };
    });
  }, [sorted, containerWidth, containerHeight, shape, tokenRadius]);

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

      {sorted.map((player, i) => {
        const pos = positions[i];
        if (!pos) return null;
        return (
          <Box
            key={player.seat}
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

      {/* Fabled corner — upper-left */}
      {activeFabled.length > 0 && (
        <Box
          data-testid="fabled-corner"
          sx={{
            position: 'absolute',
            top: 4,
            left: 4,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
            zIndex: 2,
          }}
        >
          {activeFabled.map((ch) => (
            <Chip
              key={ch.id}
              label={ch.name}
              size="small"
              data-testid={`fabled-chip-${ch.id}`}
              onClick={() => setAbilityDialog(ch)}
              sx={{
                bgcolor: '#ff9800',
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.65rem',
                cursor: 'pointer',
              }}
            />
          ))}
        </Box>
      )}

      {/* Loric corner — upper-right */}
      {activeLoric.length > 0 && (
        <Box
          data-testid="loric-corner"
          sx={{
            position: 'absolute',
            top: 4,
            right: 4,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
            alignItems: 'flex-end',
            zIndex: 2,
          }}
        >
          {activeLoric.map((ch) => (
            <Chip
              key={ch.id}
              label={ch.name}
              size="small"
              data-testid={`loric-chip-${ch.id}`}
              onClick={() => setAbilityDialog(ch)}
              sx={{
                bgcolor: '#558b2f',
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.65rem',
                cursor: 'pointer',
              }}
            />
          ))}
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
