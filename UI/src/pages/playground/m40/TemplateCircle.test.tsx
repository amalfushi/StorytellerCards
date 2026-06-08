import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TemplateCircle } from './TemplateCircle.tsx';
import type { PgPlayer, PgSlot } from './types.ts';

const players: PgPlayer[] = [
  { id: 'p-alice', name: 'Alice' },
  { id: 'p-bob', name: 'Bob' },
];

const slots: PgSlot[] = [
  { kind: 'seat', id: 's1', playerId: 'p-alice' },
  { kind: 'spacer', id: 's2' },
  { kind: 'seat', id: 's3', playerId: null },
];

function setup(overrides: Partial<React.ComponentProps<typeof TemplateCircle>> = {}) {
  const handlers = {
    onAddSeat: vi.fn(),
    onAddSpacer: vi.fn(),
    onRemoveSlot: vi.fn(),
    onAssignSeat: vi.fn(),
  };
  render(<TemplateCircle slots={slots} players={players} {...handlers} {...overrides} />);
  return handlers;
}

describe('TemplateCircle', () => {
  it('renders center Add Seat / Add Spacer controls and dispatches', async () => {
    const user = userEvent.setup();
    const h = setup();
    await user.click(screen.getByRole('button', { name: /add seat/i }));
    await user.click(screen.getByRole('button', { name: /add spacer/i }));
    expect(h.onAddSeat).toHaveBeenCalledTimes(1);
    expect(h.onAddSpacer).toHaveBeenCalledTimes(1);
  });

  it('renders seats and spacers via test ids (seat numbers exclude spacers)', () => {
    setup();
    // slots = [seat, spacer, seat] → seats numbered 1 and 2; spacer keeps its slot-index id
    expect(screen.getByTestId('template-seat-1')).toBeInTheDocument();
    expect(screen.getByTestId('template-spacer-1')).toBeInTheDocument();
    expect(screen.getByTestId('template-seat-2')).toBeInTheDocument();
  });

  it('removes a slot via its close button', async () => {
    const user = userEvent.setup();
    const h = setup();
    await user.click(screen.getByRole('button', { name: /remove seat 1/i }));
    expect(h.onRemoveSlot).toHaveBeenCalledWith('s1');
  });
});
