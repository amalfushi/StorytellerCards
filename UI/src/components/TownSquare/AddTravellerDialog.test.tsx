import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { CharacterDef } from '@/types/index.ts';
import { Alignment, CharacterType } from '@/types/index.ts';
import { AddTravellerDialog } from './AddTravellerDialog.tsx';

const travellers: CharacterDef[] = [
  {
    id: 'scapegoat',
    name: 'Scapegoat',
    type: CharacterType.Traveller,
    defaultAlignment: Alignment.Good,
    abilityShort:
      'If you nominate and execute the player of your alignment, you might die instead.',
    firstNight: null,
    otherNights: null,
    reminders: [],
  },
  {
    id: 'gunslinger',
    name: 'Gunslinger',
    type: CharacterType.Traveller,
    defaultAlignment: Alignment.Good,
    abilityShort:
      'Each day, after the 1st vote has been tallied, you may choose a player who voted.',
    firstNight: null,
    otherNights: null,
    reminders: [],
  },
];

describe('AddTravellerDialog', () => {
  it('adds an existing roster player to the first empty seat by default', () => {
    const onAdd = vi.fn();
    render(
      <AddTravellerDialog
        open
        players={[{ id: 'player-1', name: 'Alice' }]}
        slots={[{ kind: 'seat', id: 'seat-1', playerId: null }]}
        scriptCharacterIds={['scapegoat']}
        characters={travellers}
        onClose={vi.fn()}
        onAdd={onAdd}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add Traveller' }));

    expect(onAdd).toHaveBeenCalledWith({
      playerId: 'player-1',
      newPlayerName: undefined,
      characterId: 'scapegoat',
      alignment: Alignment.Good,
      seatSlotId: 'seat-1',
    });
  });

  it('supports creating a new roster player and appending a seat', () => {
    const onAdd = vi.fn();
    render(
      <AddTravellerDialog
        open
        players={[]}
        slots={[]}
        scriptCharacterIds={['scapegoat']}
        characters={travellers}
        onClose={vi.fn()}
        onAdd={onAdd}
      />,
    );

    fireEvent.change(screen.getByLabelText('Player name'), { target: { value: 'Bob' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add Traveller' }));

    expect(onAdd).toHaveBeenCalledWith({
      playerId: undefined,
      newPlayerName: 'Bob',
      characterId: 'scapegoat',
      alignment: Alignment.Good,
      seatSlotId: undefined,
    });
  });

  it('shows icons and descriptions while excluding Travellers already in play', () => {
    render(
      <AddTravellerDialog
        open
        players={[{ id: 'player-1', name: 'Alice' }]}
        slots={[]}
        scriptCharacterIds={['scapegoat', 'gunslinger']}
        characters={travellers}
        unavailableCharacterIds={['scapegoat']}
        onClose={vi.fn()}
        onAdd={vi.fn()}
      />,
    );

    fireEvent.mouseDown(screen.getByLabelText('Traveller character'));

    expect(screen.queryByRole('option', { name: /Scapegoat/ })).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Gunslinger' })).toBeInTheDocument();
    expect(screen.getByText(/Each day, after the 1st vote/)).toBeInTheDocument();
  });

  it('disables arrival when every Traveller character is already in play', () => {
    render(
      <AddTravellerDialog
        open
        players={[{ id: 'player-1', name: 'Alice' }]}
        slots={[]}
        scriptCharacterIds={[]}
        characters={travellers}
        unavailableCharacterIds={travellers.map((traveller) => traveller.id)}
        onClose={vi.fn()}
        onAdd={vi.fn()}
      />,
    );

    expect(screen.getByText('All Traveller characters are already in play.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Traveller' })).toBeDisabled();
  });
});
