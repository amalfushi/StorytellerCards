import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Alignment, CharacterType, type CharacterDef } from '@/types/index.ts';
import { CharacterDraftDialog } from '@/components/Drafting/CharacterDraftDialog.tsx';

let privateDraftChoose: ((characterId: string) => void) | undefined;

vi.mock('@/components/Drafting/CharacterDraftRoller.tsx', () => ({
  CharacterDraftRoller: ({
    playerName,
    onChoose,
  }: {
    playerName: string;
    onChoose: (characterId: string) => void;
  }) => {
    privateDraftChoose = onChoose;
    return <div data-testid="private-draft">{playerName}</div>;
  },
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
  character('villageidiot', CharacterType.Townsfolk),
  character('godfather', CharacterType.Minion),
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
    expect(screen.queryByText('Variable setup choices')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Village Idiot copies')).not.toBeInTheDocument();
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
          activePlayerId: 'p1',
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

  it('expires a private handoff safely when its active player is cleared', () => {
    const onDraftChange = vi.fn();
    const baseProps = {
      open: true,
      playerIds: ['p1'],
      playerNames: { p1: 'Alice' },
      scriptCharacters,
      onClose: vi.fn(),
      onDraftChange,
      onDraftComplete: vi.fn(),
    };
    const activeDraft = {
      status: 'drafting' as const,
      setupMode: 'standard' as const,
      presentationMode: 'open' as const,
      playerOrder: ['p1'],
      currentPlayerIndex: 0,
      activePlayerId: 'p1',
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
      revision: 2,
    };
    const { rerender } = render(
      <CharacterDraftDialog {...baseProps} draftState={activeDraft} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /hand device to alice/i }));
    expect(screen.getByTestId('private-draft')).toBeVisible();
    const staleChoose = privateDraftChoose;

    rerender(
      <CharacterDraftDialog
        {...baseProps}
        draftState={{ ...activeDraft, activePlayerId: undefined, revision: 3 }}
      />,
    );

    expect(screen.getByTestId('draft-offer-expired')).toBeVisible();
    expect(() => act(() => staleChoose?.('t1'))).not.toThrow();
    expect(onDraftChange).not.toHaveBeenCalled();
    expect(screen.getByTestId('draft-offer-expired')).toHaveTextContent(/offer expired/i);
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

  it('requests a variable setup value only after its character is selected', () => {
    const onDraftChange = vi.fn();
    render(
      <CharacterDraftDialog
        open
        playerIds={['p1', 'p2', 'p3', 'p4', 'p5']}
        playerNames={{ p1: 'Alice', p2: 'Bob', p3: 'Cara', p4: 'Dan', p5: 'Eve' }}
        scriptCharacters={scriptCharacters}
        draftState={{
          status: 'drafting',
          setupMode: 'standard',
          presentationMode: 'open',
          playerOrder: ['p1', 'p2', 'p3', 'p4', 'p5'],
          currentPlayerIndex: 1,
          entries: [
            {
              playerId: 'p1',
              offer: {
                offeredCharacterIds: ['godfather'],
                mulliganCharacterId: null,
                rolledCharacterTypes: [],
                legalCandidateCount: 1,
              },
              selectedCharacterId: 'godfather',
              actualCharacterId: 'godfather',
              apparentCharacterId: 'godfather',
              resolution: 'choice',
            },
          ],
          revision: 2,
        }}
        onClose={vi.fn()}
        onDraftChange={onDraftChange}
        onDraftComplete={vi.fn()}
      />,
    );

    expect(screen.getByTestId('pending-variable-setup-choice')).toHaveTextContent(
      /godfather was selected/i,
    );
    fireEvent.click(screen.getByTestId('draft-player-p2'));
    expect(onDraftChange).not.toHaveBeenCalled();

    fireEvent.mouseDown(screen.getByLabelText('Godfather Outsider change'));
    fireEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: '+1' }));
    expect(onDraftChange).toHaveBeenCalledWith(
      expect.objectContaining({
        variableModifierValues: { godfather: 1 },
        revision: 3,
      }),
    );
  });

  it('requests the Village Idiot copy target after the first copy is selected', () => {
    const onDraftChange = vi.fn();
    render(
      <CharacterDraftDialog
        open
        playerIds={['p1', 'p2', 'p3', 'p4', 'p5']}
        playerNames={{ p1: 'Alice', p2: 'Bob', p3: 'Cara', p4: 'Dan', p5: 'Eve' }}
        scriptCharacters={scriptCharacters}
        draftState={{
          status: 'drafting',
          setupMode: 'standard',
          presentationMode: 'open',
          playerOrder: ['p1', 'p2', 'p3', 'p4', 'p5'],
          currentPlayerIndex: 1,
          entries: [
            {
              playerId: 'p1',
              offer: {
                offeredCharacterIds: ['villageidiot'],
                mulliganCharacterId: null,
                rolledCharacterTypes: [],
                legalCandidateCount: 1,
              },
              selectedCharacterId: 'villageidiot',
              actualCharacterId: 'villageidiot',
              apparentCharacterId: 'villageidiot',
              resolution: 'choice',
            },
          ],
          revision: 2,
        }}
        onClose={vi.fn()}
        onDraftChange={onDraftChange}
        onDraftComplete={vi.fn()}
      />,
    );

    expect(screen.getByTestId('pending-village-idiot-copy-target')).toHaveTextContent(
      'Village Idiot was selected',
    );
    fireEvent.mouseDown(screen.getByLabelText('Village Idiot copies'));
    fireEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: '2' }));
    expect(onDraftChange).toHaveBeenCalledWith(
      expect.objectContaining({
        characterCopyTargets: { villageidiot: 2 },
        revision: 3,
      }),
    );
  });
});
