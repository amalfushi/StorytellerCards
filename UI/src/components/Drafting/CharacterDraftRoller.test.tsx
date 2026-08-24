import { forwardRef, useImperativeHandle } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Alignment, CharacterType, type CharacterDef } from '@/types/index.ts';
import { CharacterDraftRoller } from '@/components/Drafting/CharacterDraftRoller.tsx';
import type { CharacterWheelHandle } from '@/components/TownSquare/CharacterWheel.tsx';

vi.mock('@/components/TownSquare/CharacterWheel.tsx', () => ({
  CharacterWheel: forwardRef<CharacterWheelHandle>(function MockCharacterWheel(_, ref) {
    useImperativeHandle(ref, () => ({ spinTo: () => Promise.resolve() }));
    return <div data-testid="mock-character-wheel" />;
  }),
}));

function makeCharacter(id: string, type: CharacterDef['type']): CharacterDef {
  return {
    id,
    name: id.toUpperCase(),
    type,
    defaultAlignment:
      type === CharacterType.Minion || type === CharacterType.Demon
        ? Alignment.Evil
        : Alignment.Good,
    abilityShort: id,
    firstNight: null,
    otherNights: null,
    reminders: [],
  };
}

const characters = [
  makeCharacter('chef', CharacterType.Townsfolk),
  makeCharacter('empath', CharacterType.Townsfolk),
  makeCharacter('baron', CharacterType.Minion),
  makeCharacter('imp', CharacterType.Demon),
];
const offer = {
  offeredCharacterIds: ['chef', 'empath', 'baron'] as [string, string, string],
  mulliganCharacterId: 'imp',
};

describe('CharacterDraftRoller', () => {
  it('rolls three columns before exposing choices', async () => {
    render(
      <CharacterDraftRoller
        playerName="Player 1"
        scriptCharacters={characters}
        offer={offer}
        onChoose={vi.fn()}
        onMulligan={vi.fn()}
      />,
    );

    expect(screen.getAllByTestId('mock-character-wheel')).toHaveLength(3);
    expect(screen.queryByTestId('draft-choice-0')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('draft-roll-options'));
    expect(await screen.findByTestId('draft-choice-0')).toHaveTextContent('CHEF');
  });

  it('returns the selected offered character', async () => {
    const onChoose = vi.fn();
    render(
      <CharacterDraftRoller
        playerName="Player 1"
        scriptCharacters={characters}
        offer={offer}
        onChoose={onChoose}
        onMulligan={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId('draft-roll-options'));
    fireEvent.click(await screen.findByTestId('draft-choice-1'));
    expect(onChoose).toHaveBeenCalledWith('empath');
  });

  it('warns that the mulligan is final before resolving it', async () => {
    const onMulligan = vi.fn();
    render(
      <CharacterDraftRoller
        playerName="Player 1"
        scriptCharacters={characters}
        offer={offer}
        onChoose={vi.fn()}
        onMulligan={onMulligan}
      />,
    );

    fireEvent.click(screen.getByTestId('draft-roll-options'));
    fireEvent.click(await screen.findByTestId('draft-mulligan'));
    expect(screen.getByText(/result is final and must be played/i)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('confirm-draft-mulligan'));

    await waitFor(() => expect(onMulligan).toHaveBeenCalledWith('imp'));
  });
});
