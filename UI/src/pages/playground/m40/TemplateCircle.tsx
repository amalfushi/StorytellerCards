import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { useDroppable, useDraggable } from '@dnd-kit/core';

import type { PgPlayer, PgSlot } from './types.ts';

interface Props {
  slots: PgSlot[];
  players: PgPlayer[];
  /** Diameter in pixels. */
  size?: number;
  onAddSeat: () => void;
  onAddSpacer: () => void;
  /** Optional. When omitted, no "+ Storyteller" button is rendered. */
  onAddStoryteller?: () => void;
  onRemoveSlot: (slotId: string) => void;
  /** Called when a seat's assigned player changes. `playerId === null` clears. */
  onAssignSeat: (slotId: string, playerId: string | null) => void;
  /** Hides the Add Seat / Add Spacer / Storyteller buttons in the center. */
  hideAddControls?: boolean;
  /** Hides the per-slot × remove buttons. */
  hideRemoveControls?: boolean;
  /** Optional caption to render in the center (default: "Seating Template"). */
  centerLabel?: string;
  /**
   * dnd-kit droppable ID prefix for each seat. Defaults to "tseat:".
   */
  droppableSeatPrefix?: string;
  /**
   * dnd-kit draggable ID prefix for each slot's drag-to-reorder handle.
   * When omitted, drag handles are not rendered.
   */
  draggableSlotPrefix?: string;
  /**
   * dnd-kit droppable ID prefix for each slot's position drop target.
   * When omitted, slot positions are not droppable for reorder.
   */
  droppableSlotPosPrefix?: string;
}

const TOKEN_RADIUS = 36;

/**
 * Playground template circle — renders {@link PgSlot}s around a circle with
 * Add Seat / Add Spacer / Storyteller buttons in the center. Spacers and
 * storyteller markers occupy arc but render as faded markers. Seat slots show
 * an inline player picker.
 *
 * Intentionally NOT a reuse of `TownSquareLayout`: that component is tied to
 * `PlayerSeat[]` with game-engine fields, and synthesizing fakes would be more
 * code than this layout.
 */
export function TemplateCircle({
  slots,
  players,
  size = 360,
  onAddSeat,
  onAddSpacer,
  onAddStoryteller,
  onRemoveSlot,
  onAssignSeat,
  hideAddControls = false,
  hideRemoveControls = false,
  centerLabel,
  droppableSeatPrefix = 'tseat:',
  draggableSlotPrefix,
  droppableSlotPosPrefix,
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
        {!hideAddControls && (
          <>
            <Button size="small" variant="outlined" onClick={onAddSeat}>
              + Add Seat
            </Button>
            <Button size="small" variant="outlined" onClick={onAddSpacer}>
              + Add Spacer
            </Button>
            {onAddStoryteller && (
              <Button
                size="small"
                variant="outlined"
                onClick={onAddStoryteller}
                disabled={slots.some((s) => s.kind === 'storyteller')}
              >
                + Storyteller
              </Button>
            )}
          </>
        )}
      </Stack>

      {slots.map((slot, i) => {
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        // Seat number = 1-based count of `kind:'seat'` slots up to (and incl) this one.
        // Spacers and storyteller markers do not consume a seat number
        // ("9 seats + 2 spacers" → seats numbered 1-9).
        const seatNumber =
          slot.kind === 'seat' ? slots.slice(0, i + 1).filter((s) => s.kind === 'seat').length : 0;
        return (
          <SlotPositionWrapper
            key={slot.id}
            slotId={slot.id}
            droppableSlotPosPrefix={droppableSlotPosPrefix}
            x={x}
            y={y}
          >
            {slot.kind === 'spacer' ? (
              <SpacerCell
                index={i}
                onRemove={() => onRemoveSlot(slot.id)}
                showRemove={!hideRemoveControls}
                dragHandle={
                  draggableSlotPrefix ? (
                    <SlotDragHandle id={`${draggableSlotPrefix}${slot.id}`} />
                  ) : null
                }
              />
            ) : slot.kind === 'storyteller' ? (
              <StorytellerCell
                index={i}
                angle={angle}
                onRemove={() => onRemoveSlot(slot.id)}
                showRemove={!hideRemoveControls}
                dragHandle={
                  draggableSlotPrefix ? (
                    <SlotDragHandle id={`${draggableSlotPrefix}${slot.id}`} />
                  ) : null
                }
              />
            ) : (
              <SeatCell
                seatNumber={seatNumber}
                slotId={slot.id}
                playerId={slot.playerId}
                players={players}
                onRemove={() => onRemoveSlot(slot.id)}
                onAssign={(pid) => onAssignSeat(slot.id, pid)}
                showRemove={!hideRemoveControls}
                droppableId={`${droppableSeatPrefix}${slot.id}`}
                dragHandle={
                  draggableSlotPrefix ? (
                    <SlotDragHandle id={`${draggableSlotPrefix}${slot.id}`} />
                  ) : null
                }
              />
            )}
          </SlotPositionWrapper>
        );
      })}
    </Box>
  );
}

function SlotPositionWrapper({
  slotId,
  droppableSlotPosPrefix,
  x,
  y,
  children,
}: {
  slotId: string;
  droppableSlotPosPrefix: string | undefined;
  x: number;
  y: number;
  children: React.ReactNode;
}) {
  // Always call hook; ignore ref when no prefix provided.
  const { setNodeRef, isOver } = useDroppable({
    id: droppableSlotPosPrefix ? `${droppableSlotPosPrefix}${slotId}` : `__noop__:${slotId}`,
    disabled: !droppableSlotPosPrefix,
  });
  return (
    <Box
      ref={droppableSlotPosPrefix ? setNodeRef : undefined}
      sx={{
        position: 'absolute',
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
        width: 96,
        outline: isOver ? '2px dashed' : 'none',
        outlineColor: 'info.main',
        outlineOffset: 2,
        borderRadius: 1,
      }}
    >
      {children}
    </Box>
  );
}

function SlotDragHandle({ id }: { id: string }) {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({ id });
  return (
    <Box
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      sx={{
        position: 'absolute',
        top: -8,
        left: -8,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '50%',
        cursor: 'grab',
        opacity: isDragging ? 0.5 : 0.9,
        width: 20,
        height: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      data-testid={`slot-drag-${id}`}
      aria-label="drag to reorder slot"
    >
      <DragIndicatorIcon sx={{ fontSize: 14 }} />
    </Box>
  );
}

function SpacerCell({
  index,
  onRemove,
  showRemove,
  dragHandle,
}: {
  index: number;
  onRemove: () => void;
  showRemove: boolean;
  dragHandle: React.ReactNode;
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
      {dragHandle}
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

function StorytellerCell({
  index,
  angle,
  onRemove,
  showRemove,
  dragHandle,
}: {
  index: number;
  angle: number;
  onRemove: () => void;
  showRemove: boolean;
  dragHandle: React.ReactNode;
}) {
  // ArrowUpward points up by default. Compute rotation so the arrow points
  // toward circle center from this slot's position. Math angle of position is
  // `angle`; direction-to-center math angle is `angle + π`. Convert to CSS
  // clockwise-from-up rotation: rot = angle + 3π/2 (mod 2π).
  const rotationRad = angle + (3 * Math.PI) / 2;
  return (
    <Box
      sx={{
        textAlign: 'center',
        border: '1px dashed',
        borderColor: 'warning.main',
        borderRadius: 1,
        py: 0.5,
        position: 'relative',
        bgcolor: 'background.paper',
      }}
      data-testid={`template-storyteller-${index}`}
    >
      {dragHandle}
      <Box sx={{ transform: `rotate(${rotationRad}rad)`, display: 'inline-flex' }}>
        <ArrowUpwardIcon fontSize="small" color="warning" />
      </Box>
      <Typography variant="caption" component="div" color="text.secondary">
        ST
      </Typography>
      {showRemove && (
        <IconButton
          size="small"
          onClick={onRemove}
          aria-label={`remove storyteller marker ${index + 1}`}
          sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'background.paper' }}
        >
          <CloseIcon fontSize="inherit" />
        </IconButton>
      )}
    </Box>
  );
}

interface SeatCellProps {
  seatNumber: number;
  slotId: string;
  playerId: string | null;
  players: PgPlayer[];
  onRemove: () => void;
  onAssign: (playerId: string | null) => void;
  showRemove: boolean;
  droppableId: string;
  dragHandle: React.ReactNode;
}

function SeatCell({
  seatNumber,
  slotId,
  playerId,
  players,
  onRemove,
  onAssign,
  showRemove,
  droppableId,
  dragHandle,
}: SeatCellProps) {
  const { isOver, setNodeRef } = useDroppable({ id: droppableId });
  return (
    <Box
      ref={setNodeRef}
      sx={{
        bgcolor: isOver ? 'success.light' : 'background.paper',
        border: '2px solid',
        borderColor: isOver ? 'success.main' : playerId ? 'primary.main' : 'divider',
        borderRadius: 1,
        textAlign: 'center',
        position: 'relative',
        p: 0.5,
      }}
      data-testid={`template-seat-${seatNumber}`}
    >
      {dragHandle}
      <Typography variant="caption" component="div" color="text.secondary">
        Seat {seatNumber}
      </Typography>
      <Select
        size="small"
        value={playerId ?? ''}
        onChange={(e) => onAssign(e.target.value || null)}
        displayEmpty
        fullWidth
        inputProps={{ 'aria-label': `assign player to seat ${seatNumber}` }}
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
          aria-label={`remove seat ${seatNumber}`}
          sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'background.paper' }}
          data-slot-id={slotId}
        >
          <CloseIcon fontSize="inherit" />
        </IconButton>
      )}
    </Box>
  );
}
