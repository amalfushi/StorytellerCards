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
 *
 * Sizing: the component fills its parent container (the parent should give it
 * an explicit width and height). A ResizeObserver tracks the rendered box and
 * positions tiles on an ellipse with an 8-px inset around the outer edge. The
 * `shape` prop selects circle (`rx === ry`) or ovoid (`ry > rx` — taller than
 * wide, used on small viewports).
 */
import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { ReactNode } from 'react';

import type { Player, PlayerId, Slot, SlotId } from '@/types/index.ts';
import { getPlayerColorById } from '@/utils/playerColor.ts';

/** dnd-kit id prefixes — shared with parent `handleDragEnd`. */
export const SEAT_DROPPABLE_PREFIX = 'tseat:';
export const SLOT_DRAGGABLE_PREFIX = 'tslot:';
export const SLOT_POSITION_DROPPABLE_PREFIX = 'tslotpos:';

const DEFAULT_TILE_SIZE = 140;
const RING_MARGIN = 8;
const ASSIGNED_BORDER_WIDTH = 4;
const UNASSIGNED_BORDER_WIDTH = 2;

interface Props {
  slots: Slot[];
  players: Player[];
  /** Built once in the parent via `buildDisplaySeatNumberMap`. */
  displaySeatNumbers: Map<SlotId, number>;
  /**
   * Tile (token) width in pixels. Default 140 — wide enough for typical
   * player names in the assign dropdown.
   */
  tileSize?: number;
  /**
   * Layout shape. `'circle'` uses equal `rx === ry`. `'ovoid'` uses
   * `ry > rx` so the ellipse is taller than wide — preferred on narrow
   * viewports.
   */
  shape?: 'circle' | 'ovoid';
  onRemoveSlot: (slotId: SlotId) => void;
  onAssignSeat: (slotId: SlotId, playerId: PlayerId | null) => void;
}

export function SeatingTemplateCircle({
  slots,
  players,
  displaySeatNumbers,
  tileSize = DEFAULT_TILE_SIZE,
  shape = 'circle',
  onRemoveSlot,
  onAssignSeat,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      setSize({ w: rect.width, h: rect.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const n = slots.length;
  const playerIdsInOrder = players.map((p) => p.id);
  const seatedIds = new Set<PlayerId>(
    slots
      .filter((s): s is Extract<Slot, { kind: 'seat' }> => s.kind === 'seat')
      .map((s) => s.playerId)
      .filter((id): id is PlayerId => id !== null),
  );

  const cx = size.w / 2;
  const cy = size.h / 2;
  // Inset by half a tile plus the 8-px ring margin so tiles never clip the
  // outer dashed border.
  const inset = tileSize / 2 + RING_MARGIN;
  let rx = Math.max(cx - inset, 0);
  let ry = Math.max(cy - inset, 0);
  if (shape === 'circle') {
    const r = Math.min(rx, ry);
    rx = r;
    ry = r;
  } else if (ry < rx) {
    // Ovoid: ensure portrait emphasis even if the container ends up square.
    const tmp = ry;
    ry = rx;
    rx = tmp;
  }

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'absolute',
        inset: `${RING_MARGIN}px`,
        border: '1px dashed',
        borderColor: 'divider',
        borderRadius: shape === 'circle' ? '50%' : '50% / 50%',
      }}
      data-testid="seating-template-circle"
    >
      {n === 0 && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          Empty seating template
        </Typography>
      )}

      {slots.map((slot, i) => {
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / Math.max(n, 1);
        const x = cx + rx * Math.cos(angle);
        const y = cy + ry * Math.sin(angle);

        return (
          <SlotPositionWrapper key={slot.id} slotId={slot.id} x={x} y={y} tileSize={tileSize}>
            {({ dragHandle }) =>
              slot.kind === 'spacer' ? (
                <SpacerCell
                  index={i}
                  onRemove={() => onRemoveSlot(slot.id)}
                  dragHandle={dragHandle}
                />
              ) : slot.kind === 'storyteller' ? (
                <StorytellerCell
                  index={i}
                  angle={angle}
                  onRemove={() => onRemoveSlot(slot.id)}
                  dragHandle={dragHandle}
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
                  dragHandle={dragHandle}
                />
              )
            }
          </SlotPositionWrapper>
        );
      })}
    </Box>
  );
}

interface DragHandleSlotProps {
  listeners: ReturnType<typeof useDraggable>['listeners'];
  attributes: ReturnType<typeof useDraggable>['attributes'];
  isDragging: boolean;
}

function SlotPositionWrapper({
  slotId,
  x,
  y,
  tileSize,
  children,
}: {
  slotId: SlotId;
  x: number;
  y: number;
  tileSize: number;
  children: (args: { dragHandle: ReactNode }) => ReactNode;
}) {
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `${SLOT_POSITION_DROPPABLE_PREFIX}${slotId}`,
  });
  const {
    setNodeRef: setDragRef,
    listeners,
    attributes,
    transform,
    isDragging,
  } = useDraggable({ id: `${SLOT_DRAGGABLE_PREFIX}${slotId}` });
  const setRefs = (node: HTMLElement | null) => {
    setDropRef(node);
    setDragRef(node);
  };
  // Apply the dnd-kit translation on top of the centering translate(-50%,-50%)
  // so the whole tile follows the pointer during drag. Without this, users get
  // no visual feedback that a drag is in progress.
  const dndTransform = transform ? CSS.Translate.toString(transform) : '';
  return (
    <Box
      ref={setRefs}
      sx={{
        position: 'absolute',
        left: x,
        top: y,
        transform: dndTransform ? `translate(-50%, -50%) ${dndTransform}` : 'translate(-50%, -50%)',
        width: tileSize,
        outline: isOver ? '2px dashed' : 'none',
        outlineColor: 'info.main',
        outlineOffset: 2,
        borderRadius: 1,
        opacity: isDragging ? 0.6 : 1,
        zIndex: isDragging ? 10 : undefined,
        cursor: isDragging ? 'grabbing' : undefined,
      }}
    >
      {children({
        dragHandle: (
          <SlotDragHandle listeners={listeners} attributes={attributes} isDragging={isDragging} />
        ),
      })}
    </Box>
  );
}

function SlotDragHandle({ listeners, attributes, isDragging }: DragHandleSlotProps) {
  return (
    <Box
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
  const borderWidth = assignedColor ? ASSIGNED_BORDER_WIDTH : UNASSIGNED_BORDER_WIDTH;
  return (
    <Box
      ref={setNodeRef}
      sx={{
        bgcolor: isOver ? 'success.light' : 'background.paper',
        border: `${borderWidth}px solid`,
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
