/**
 * SeatingTemplateCircle — radial template editor for session setup.
 *
 * Production port of `pages/playground/m40/TemplateCircle.tsx`. Differences:
 *  - uses production `Slot` discriminated union from `@/types`
 *  - seat numbering comes from a {@link buildDisplaySeatNumberMap} result the
 *    parent already computes, instead of recounting inline
 *  - seat border + player chip are tinted via {@link getPlayerColorById} so the
 *    parked/seated pill in the roster can match
 *  - the player picker greys out players already seated elsewhere (the current
 *    seat's own player stays selectable as a no-op)
 */
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
import type { ReactNode } from 'react';

import type { Player, PlayerId, Slot, SlotId } from '@/types/index.ts';
import { getPlayerColorById } from '@/utils/playerColor.ts';

/** dnd-kit id prefixes — shared with parent `handleDragEnd`. */
export const SEAT_DROPPABLE_PREFIX = 'tseat:';
export const SLOT_DRAGGABLE_PREFIX = 'tslot:';
export const SLOT_POSITION_DROPPABLE_PREFIX = 'tslotpos:';

const TOKEN_SIZE = 96;
const TOKEN_RADIUS = TOKEN_SIZE / 2;
const RING_PADDING = 8;

interface Props {
  slots: Slot[];
  players: Player[];
  /** Built once in the parent via `buildDisplaySeatNumberMap`. */
  displaySeatNumbers: Map<SlotId, number>;
  /** Diameter in pixels. */
  size?: number;
  onAddSeat: () => void;
  onAddSpacer: () => void;
  onAddStoryteller: () => void;
  onRemoveSlot: (slotId: SlotId) => void;
  onAssignSeat: (slotId: SlotId, playerId: PlayerId | null) => void;
}

export function SeatingTemplateCircle({
  slots,
  players,
  displaySeatNumbers,
  size = 480,
  onAddSeat,
  onAddSpacer,
  onAddStoryteller,
  onRemoveSlot,
  onAssignSeat,
}: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const r = Math.max(size / 2 - TOKEN_RADIUS - RING_PADDING, 30);
  const n = slots.length;
  const hasStoryteller = slots.some((s) => s.kind === 'storyteller');
  const playerIdsInOrder = players.map((p) => p.id);
  const seatedIds = new Set<PlayerId>(
    slots
      .filter((s): s is Extract<Slot, { kind: 'seat' }> => s.kind === 'seat')
      .map((s) => s.playerId)
      .filter((id): id is PlayerId => id !== null),
  );

  return (
    <Box
      sx={{
        position: 'relative',
        width: size,
        height: size,
        mx: 'auto',
        my: 1,
        border: '1px dashed',
        borderColor: 'divider',
        borderRadius: '50%',
      }}
      data-testid="seating-template-circle"
    >
      <Stack
        spacing={0.5}
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          alignItems: 'center',
          width: TOKEN_SIZE * 2,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {n === 0 ? 'Empty seating template' : `${displaySeatNumbers.size} seats`}
        </Typography>
        <Button size="small" variant="outlined" onClick={onAddSeat}>
          + Add Seat
        </Button>
        <Button size="small" variant="outlined" onClick={onAddSpacer}>
          + Add Spacer
        </Button>
        <Button
          size="small"
          variant="outlined"
          onClick={onAddStoryteller}
          disabled={hasStoryteller}
        >
          + Storyteller
        </Button>
      </Stack>

      {slots.map((slot, i) => {
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);

        return (
          <SlotPositionWrapper key={slot.id} slotId={slot.id} x={x} y={y}>
            {slot.kind === 'spacer' ? (
              <SpacerCell
                index={i}
                onRemove={() => onRemoveSlot(slot.id)}
                dragHandle={<SlotDragHandle id={`${SLOT_DRAGGABLE_PREFIX}${slot.id}`} />}
              />
            ) : slot.kind === 'storyteller' ? (
              <StorytellerCell
                index={i}
                angle={angle}
                onRemove={() => onRemoveSlot(slot.id)}
                dragHandle={<SlotDragHandle id={`${SLOT_DRAGGABLE_PREFIX}${slot.id}`} />}
              />
            ) : (
              <SeatCell
                seatNumber={displaySeatNumbers.get(slot.id) ?? i + 1}
                slot={slot}
                players={players}
                playerIdsInOrder={playerIdsInOrder}
                seatedIds={seatedIds}
                onRemove={() => onRemoveSlot(slot.id)}
                onAssign={(pid) => onAssignSeat(slot.id, pid)}
                dragHandle={<SlotDragHandle id={`${SLOT_DRAGGABLE_PREFIX}${slot.id}`} />}
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
  x,
  y,
  children,
}: {
  slotId: SlotId;
  x: number;
  y: number;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `${SLOT_POSITION_DROPPABLE_PREFIX}${slotId}` });
  return (
    <Box
      ref={setNodeRef}
      sx={{
        position: 'absolute',
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
        width: TOKEN_SIZE,
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
        touchAction: 'none',
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
  dragHandle,
}: {
  index: number;
  onRemove: () => void;
  dragHandle: ReactNode;
}) {
  return (
    <Box
      sx={{
        opacity: 0.6,
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
      <IconButton
        size="small"
        onClick={onRemove}
        aria-label={`remove spacer ${index + 1}`}
        sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'background.paper' }}
      >
        <CloseIcon fontSize="inherit" />
      </IconButton>
    </Box>
  );
}

function StorytellerCell({
  index,
  angle,
  onRemove,
  dragHandle,
}: {
  index: number;
  angle: number;
  onRemove: () => void;
  dragHandle: ReactNode;
}) {
  // Rotate the arrow so it points toward the circle center.
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
      <IconButton
        size="small"
        onClick={onRemove}
        aria-label={`remove storyteller marker ${index + 1}`}
        sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'background.paper' }}
      >
        <CloseIcon fontSize="inherit" />
      </IconButton>
    </Box>
  );
}

function SeatCell({
  seatNumber,
  slot,
  players,
  playerIdsInOrder,
  seatedIds,
  onRemove,
  onAssign,
  dragHandle,
}: {
  seatNumber: number;
  slot: Extract<Slot, { kind: 'seat' }>;
  players: Player[];
  playerIdsInOrder: PlayerId[];
  seatedIds: Set<PlayerId>;
  onRemove: () => void;
  onAssign: (playerId: PlayerId | null) => void;
  dragHandle: ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: `${SEAT_DROPPABLE_PREFIX}${slot.id}` });
  const assignedColor = slot.playerId ? getPlayerColorById(slot.playerId, playerIdsInOrder) : null;
  return (
    <Box
      ref={setNodeRef}
      sx={{
        bgcolor: isOver ? 'success.light' : 'background.paper',
        border: '2px solid',
        borderColor: isOver ? 'success.main' : assignedColor ? assignedColor : 'divider',
        borderRadius: 1,
        textAlign: 'center',
        position: 'relative',
        p: 0.5,
      }}
      data-testid={`template-seat-${seatNumber}`}
    >
      {dragHandle}
      <Typography variant="caption" component="div" color="text.secondary" sx={{ lineHeight: 1.1 }}>
        Seat {seatNumber}
      </Typography>
      <Select
        size="small"
        value={slot.playerId ?? ''}
        onChange={(e) => onAssign(e.target.value ? (e.target.value as PlayerId) : null)}
        displayEmpty
        fullWidth
        inputProps={{ 'aria-label': `assign player to seat ${seatNumber}` }}
        sx={{ fontSize: '0.75rem', mt: 0.25 }}
      >
        <MenuItem value="">
          <em>(empty)</em>
        </MenuItem>
        {players.map((p) => {
          // Item 4: greyed out when seated elsewhere; current seat's player stays
          // selectable so re-picking is a no-op (and setSeatPlayer would just
          // vacate-and-reassign it to the same seat).
          const isElsewhere = seatedIds.has(p.id) && slot.playerId !== p.id;
          return (
            <MenuItem key={p.id} value={p.id} disabled={isElsewhere}>
              {p.name}
              {isElsewhere ? ' (seated)' : ''}
            </MenuItem>
          );
        })}
      </Select>
      <IconButton
        size="small"
        onClick={onRemove}
        aria-label={`remove seat ${seatNumber}`}
        sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'background.paper' }}
        data-slot-id={slot.id}
      >
        <CloseIcon fontSize="inherit" />
      </IconButton>
    </Box>
  );
}
