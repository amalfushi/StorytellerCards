import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';

import type { PgPlayer, PgSlot } from './types.ts';

interface Props {
  slots: PgSlot[];
  players: PgPlayer[];
  /** Diameter in pixels. */
  size?: number;
  onAddSeat: () => void;
  onAddSpacer: () => void;
  onRemoveSlot: (slotId: string) => void;
  /** Called when a seat's assigned player changes. `playerId === null` clears. */
  onAssignSeat: (slotId: string, playerId: string | null) => void;
  /**
   * When true, hides the Add Seat / Add Spacer / per-slot remove (×) controls
   * and replaces the center caption. Use for views where the slot list comes
   * from another source (e.g., the active game inherits its slots from the
   * template, so structural edits happen there, not here).
   */
  readOnlySlots?: boolean;
  /** Optional caption to render in the center (default: "Seating Template"). */
  centerLabel?: string;
}

const TOKEN_RADIUS = 36;

/**
 * Playground template circle — renders {@link PgSlot}s around a circle with
 * Add Seat / Add Spacer buttons in the center. Spacers occupy arc but render
 * as a faded marker. Seat slots show an inline player picker.
 *
 * Intentionally NOT a reuse of `TownSquareLayout`: that component is tied to
 * `PlayerSeat[]` with game-engine fields, and synthesizing fakes would be more
 * code than this ~50-line layout.
 */
export function TemplateCircle({
  slots,
  players,
  size = 360,
  onAddSeat,
  onAddSpacer,
  onRemoveSlot,
  onAssignSeat,
  readOnlySlots = false,
  centerLabel,
}: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const pad = TOKEN_RADIUS + 4;
  const r = Math.max(size / 2 - pad, 30);
  const n = slots.length;

  return (
    <Box
      sx={{
        position: 'relative',
        width: size,
        height: size,
        mx: 'auto',
        border: '1px dashed',
        borderColor: 'divider',
        borderRadius: '50%',
      }}
      data-testid="template-circle"
    >
      {/* Center controls */}
      <Stack
        spacing={0.5}
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          alignItems: 'center',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {centerLabel ?? 'Seating Template'}
        </Typography>
        {!readOnlySlots && (
          <>
            <Button size="small" variant="outlined" onClick={onAddSeat}>
              + Add Seat
            </Button>
            <Button size="small" variant="outlined" onClick={onAddSpacer}>
              + Add Spacer
            </Button>
          </>
        )}
      </Stack>

      {slots.map((slot, i) => {
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        return (
          <Box
            key={slot.id}
            sx={{
              position: 'absolute',
              left: x,
              top: y,
              transform: 'translate(-50%, -50%)',
              width: 96,
            }}
          >
            {slot.kind === 'spacer' ? (
              <SpacerCell
                index={i}
                onRemove={() => onRemoveSlot(slot.id)}
                showRemove={!readOnlySlots}
              />
            ) : (
              <SeatCell
                index={i}
                slotId={slot.id}
                playerId={slot.playerId}
                players={players}
                onRemove={() => onRemoveSlot(slot.id)}
                onAssign={(pid) => onAssignSeat(slot.id, pid)}
                showRemove={!readOnlySlots}
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
}

function SpacerCell({
  index,
  onRemove,
  showRemove,
}: {
  index: number;
  onRemove: () => void;
  showRemove: boolean;
}) {
  return (
    <Box
      sx={{
        opacity: 0.5,
        textAlign: 'center',
        border: '1px dashed',
        borderColor: 'text.disabled',
        borderRadius: 1,
        py: 0.5,
        position: 'relative',
      }}
      data-testid={`template-spacer-${index}`}
    >
      <Chip size="small" label="spacer" />
      {showRemove && (
        <IconButton
          size="small"
          onClick={onRemove}
          aria-label={`remove spacer ${index + 1}`}
          sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'background.paper' }}
        >
          <CloseIcon fontSize="inherit" />
        </IconButton>
      )}
    </Box>
  );
}

interface SeatCellProps {
  index: number;
  slotId: string;
  playerId: string | null;
  players: PgPlayer[];
  onRemove: () => void;
  onAssign: (playerId: string | null) => void;
  showRemove: boolean;
}

function SeatCell({
  index,
  slotId,
  playerId,
  players,
  onRemove,
  onAssign,
  showRemove,
}: SeatCellProps) {
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: '2px solid',
        borderColor: playerId ? 'primary.main' : 'divider',
        borderRadius: 1,
        textAlign: 'center',
        position: 'relative',
        p: 0.5,
      }}
      data-testid={`template-seat-${index}`}
    >
      <Typography variant="caption" component="div" color="text.secondary">
        Seat {index + 1}
      </Typography>
      <Select
        size="small"
        value={playerId ?? ''}
        onChange={(e) => onAssign(e.target.value || null)}
        displayEmpty
        fullWidth
        inputProps={{ 'aria-label': `assign player to seat ${index + 1}` }}
        sx={{ fontSize: '0.75rem' }}
      >
        <MenuItem value="">
          <em>(empty)</em>
        </MenuItem>
        {players.map((p) => (
          <MenuItem key={p.id} value={p.id}>
            {p.name}
          </MenuItem>
        ))}
      </Select>
      {showRemove && (
        <IconButton
          size="small"
          onClick={onRemove}
          aria-label={`remove seat ${index + 1}`}
          sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'background.paper' }}
          data-slot-id={slotId}
        >
          <CloseIcon fontSize="inherit" />
        </IconButton>
      )}
    </Box>
  );
}
