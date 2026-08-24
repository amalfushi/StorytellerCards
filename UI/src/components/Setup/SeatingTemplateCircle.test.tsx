import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { SeatingTemplateCircle } from '@/components/Setup/SeatingTemplateCircle.tsx';
import { buildDisplaySeatNumberMap } from '@/utils/seating/index.ts';
import type { Player, Slot } from '@/types/index.ts';

function wrap(ui: React.ReactElement) {
  return render(<DndContext>{ui}</DndContext>);
}

const players: Player[] = [
  { id: 'p1', name: 'Alice' },
  { id: 'p2', name: 'Bob' },
  { id: 'p3', name: 'Carol' },
];

const mixedSlots: Slot[] = [
  { kind: 'seat', id: 's1', playerId: 'p1' },
  { kind: 'spacer', id: 'sp1' },
  { kind: 'seat', id: 's2', playerId: null },
  { kind: 'storyteller', id: 'st1' },
  { kind: 'seat', id: 's3', playerId: 'p2' },
];

function renderCircle(overrides: Partial<React.ComponentProps<typeof SeatingTemplateCircle>> = {}) {
  const handlers = {
    onRemoveSlot: vi.fn(),
    onAssignSeat: vi.fn(),
    onMoveSlot: vi.fn(),
  };
  const slots = overrides.slots ?? mixedSlots;
  const view = wrap(
    <SeatingTemplateCircle
      slots={slots}
      players={players}
      displaySeatNumbers={buildDisplaySeatNumberMap(slots)}
      {...handlers}
      {...overrides}
    />,
  );
  return { ...view, ...handlers };
}

describe('SeatingTemplateCircle', () => {
  it('renders empty state placeholder', () => {
    renderCircle({ slots: [] });
    expect(screen.getByText(/empty seating template/i)).toBeInTheDocument();
  });

  it('renders seats with stable display numbers ignoring spacers/storyteller', () => {
    renderCircle();
    expect(screen.getByTestId('template-seat-1')).toBeInTheDocument();
    expect(screen.getByTestId('template-seat-2')).toBeInTheDocument();
    expect(screen.getByTestId('template-seat-3')).toBeInTheDocument();
    expect(screen.getByTestId('template-spacer-1')).toBeInTheDocument();
    expect(screen.getByTestId('template-storyteller-3')).toBeInTheDocument();
  });

  it('invokes remove handler with the correct slot id', () => {
    const { onRemoveSlot } = renderCircle();
    fireEvent.click(screen.getByRole('button', { name: /remove seat 1/i }));
    expect(onRemoveSlot).toHaveBeenCalledWith('s1');
  });

  it('greys out players seated elsewhere but keeps the current seat assignee selectable', () => {
    renderCircle();
    // Open the empty seat picker (seat 2 → slot s2)
    fireEvent.mouseDown(screen.getByLabelText('assign player to seat 2'));
    const listbox = screen.getByRole('listbox');
    const aliceOption = within(listbox).getByRole('option', { name: /alice/i });
    const bobOption = within(listbox).getByRole('option', { name: /bob/i });
    const carolOption = within(listbox).getByRole('option', { name: /carol/i });
    expect(aliceOption).toHaveAttribute('aria-disabled', 'true');
    expect(bobOption).toHaveAttribute('aria-disabled', 'true');
    expect(carolOption).not.toHaveAttribute('aria-disabled', 'true');
  });

  it('emits onAssignSeat when a player is picked', () => {
    const { onAssignSeat } = renderCircle();
    fireEvent.mouseDown(screen.getByLabelText('assign player to seat 2'));
    fireEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: /carol/i }));
    expect(onAssignSeat).toHaveBeenCalledWith('s2', 'p3');
  });

  it('emits onAssignSeat(null) when the empty option is picked', () => {
    const { onAssignSeat } = renderCircle();
    fireEvent.mouseDown(screen.getByLabelText('assign player to seat 1'));
    fireEvent.click(
      within(screen.getByRole('listbox')).getByRole('option', { name: /\(empty\)/i }),
    );
    expect(onAssignSeat).toHaveBeenCalledWith('s1', null);
  });

  it('provides touch-safe buttons for moving slots in either direction', () => {
    const { onMoveSlot } = renderCircle();

    fireEvent.click(screen.getByRole('button', { name: /move slot 1 clockwise/i }));
    expect(onMoveSlot).toHaveBeenCalledWith('s1', 1);

    fireEvent.click(screen.getByRole('button', { name: /move slot 1 counterclockwise/i }));
    expect(onMoveSlot).toHaveBeenCalledWith('s1', mixedSlots.length - 1);
  });
});
