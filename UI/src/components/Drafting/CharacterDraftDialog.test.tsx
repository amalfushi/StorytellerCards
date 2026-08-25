import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Alignment, CharacterType, type CharacterDef } from '@/types/index.ts';
import { CharacterDraftDialog } from '@/components/Drafting/CharacterDraftDialog.tsx';

vi.mock('@/components/Drafting/CharacterDraftRoller.tsx', () => ({
  CharacterDraftRoller: ({ playerName }: { playerName: string }) => (
    <div data-testid="private-draft">{playerName}</div>
  ),
}));

function character(id: string, type: CharacterDef['type']): CharacterDef {
  return {
    id,
    name: id,
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

const scriptCharacters = [
  ...Array.from({ length: 6 }, (_, index) => character(`t${index}`, CharacterType.Townsfolk)),
  character('o1', CharacterType.Outsider),
  character('m1', CharacterType.Minion),
  character('m2', CharacterType.Minion),
  character('d1', CharacterType.Demon),
  character('d2', CharacterType.Demon),
];

describe('CharacterDraftDialog', () => {
  it('configures and creates a persisted draft', () => {
    const onDraftChange = vi.fn();
    render(
      <CharacterDraftDialog
        open
        playerIds={['p1', 'p2', 'p3', 'p4', 'p5']}
        playerNames={{ p1: 'Alice', p2: 'Bob', p3: 'Cara', p4: 'Dan', p5: 'Eve' }}
        scriptCharacters={scriptCharacters}
        onClose={vi.fn()}
        onDraftChange={onDraftChange}
        onDraftComplete={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Drafting mode')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /generate draft/i }));
    expect(onDraftChange).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'drafting', playerOrder: expect.any(Array) }),
    );
  });

  it('keeps diagnostics off the private handoff screen', () => {
    render(
      <CharacterDraftDialog
        open
        playerIds={['p1']}
        playerNames={{ p1: 'Alice' }}
        scriptCharacters={scriptCharacters}
        draftState={{
          status: 'drafting',
          setupMode: 'standard',
          presentationMode: 'open',
          playerOrder: ['p1'],
          currentPlayerIndex: 0,
          entries: [
            {
              playerId: 'p1',
              offer: {
                offeredCharacterIds: ['t1'],
                mulliganCharacterId: null,
                rolledCharacterTypes: [],
                legalCandidateCount: 1,
              },
            },
          ],
          revision: 1,
        }}
        onClose={vi.fn()}
        onDraftChange={vi.fn()}
        onDraftComplete={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /hand device to alice/i }));
    expect(screen.getByTestId('private-draft')).toHaveTextContent('Alice');
    expect(screen.queryByText('Storyteller board')).not.toBeInTheDocument();
  });

  it('lets the Storyteller choose any unresolved player', () => {
    const onDraftChange = vi.fn();
    render(
      <CharacterDraftDialog
        open
        playerIds={['p1', 'p2', 'p3', 'p4', 'p5']}
        playerNames={{ p1: 'Alice', p2: 'Bob', p3: 'Cara', p4: 'Dan', p5: 'Eve' }}
        playerColors={{ p1: '#111111', p2: '#222222' }}
        scriptCharacters={scriptCharacters}
        draftState={{
          status: 'drafting',
          setupMode: 'standard',
          presentationMode: 'open',
          playerOrder: ['p1', 'p2', 'p3', 'p4', 'p5'],
          currentPlayerIndex: 0,
          entries: [],
          revision: 1,
        }}
        onClose={vi.fn()}
        onDraftChange={onDraftChange}
        onDraftComplete={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId('draft-player-p2'));
    expect(onDraftChange).toHaveBeenCalledWith(
      expect.objectContaining({
        activePlayerId: 'p2',
        entries: [expect.objectContaining({ playerId: 'p2' })],
      }),
    );
  });
});
