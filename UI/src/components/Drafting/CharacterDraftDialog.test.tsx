import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Alignment, CharacterType, type CharacterDef } from '@/types/index.ts';
import { CharacterDraftDialog } from '@/components/Drafting/CharacterDraftDialog.tsx';
import { toDraftCharacters } from '@/utils/drafting/draftSession.ts';
import {
  createGameCharacterDraft,
  getHiddenOutsiderRolls,
  selectGameCharacterDraftPlayer,
} from '@/utils/drafting/gameCharacterDraft.ts';

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

const boozlingCharacters = [
  ...Array.from({ length: 13 }, (_, index) => character(`town${index}`, CharacterType.Townsfolk)),
  character('drunk', CharacterType.Outsider),
  character('mutant', CharacterType.Outsider),
  character('baron', CharacterType.Minion),
  character('cerenovus', CharacterType.Minion),
  character('scarletwoman', CharacterType.Minion),
  { ...character('marionette', CharacterType.Minion), name: 'Marionette' },
  character('nodashii', CharacterType.Demon),
  character('fanggu', CharacterType.Demon),
  character('imp', CharacterType.Demon),
];

const outsiderHiddenCharacters = [
  ...Array.from({ length: 13 }, (_, index) => character(`town${index}`, CharacterType.Townsfolk)),
  character('butler', CharacterType.Outsider),
  character('recluse', CharacterType.Outsider),
  character('saint', CharacterType.Outsider),
  { ...character('drunk', CharacterType.Outsider), name: 'Drunk' },
  { ...character('lunatic', CharacterType.Outsider), name: 'Lunatic' },
  character('baron', CharacterType.Minion),
  character('poisoner', CharacterType.Minion),
  character('scarletwoman', CharacterType.Minion),
  character('imp', CharacterType.Demon),
  character('fanggu', CharacterType.Demon),
  character('nodashii', CharacterType.Demon),
  character('vortox', CharacterType.Demon),
];

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

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

  it('keeps the selected character private until the player confirms the hand-back', () => {
    const playerIds = ['p1', 'p2', 'p3', 'p4', 'p5'];
    const config = {
      playerCount: playerIds.length,
      scriptCharacters: toDraftCharacters(scriptCharacters),
      setupMode: 'standard' as const,
      presentationMode: 'open' as const,
    };
    const created = createGameCharacterDraft(playerIds, config, () => 0.5);
    const activeDraft = selectGameCharacterDraftPlayer(created, config, 'p1', () => 0.5);
    const selectedCharacterId = activeDraft.entries[0]?.offer.offeredCharacterIds[0];
    if (!selectedCharacterId) throw new Error('Expected a draft choice.');
    const onDraftChange = vi.fn();

    render(
      <CharacterDraftDialog
        open
        playerIds={playerIds}
        playerNames={{ p1: 'Alice', p2: 'Bob', p3: 'Cara', p4: 'Dan', p5: 'Eve' }}
        scriptCharacters={scriptCharacters}
        draftState={activeDraft}
        onClose={vi.fn()}
        onDraftChange={onDraftChange}
        onDraftComplete={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /hand device to alice/i }));
    act(() => privateDraftChoose?.(selectedCharacterId));

    expect(onDraftChange).toHaveBeenCalledOnce();
    expect(screen.getByTestId('private-draft-confirmation')).toBeVisible();
    expect(screen.getByRole('heading', { name: selectedCharacterId })).toBeVisible();
    expect(screen.queryByText('Storyteller board')).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: /confirm and return to storyteller board/i }),
    );

    expect(screen.getByText('Storyteller board')).toBeVisible();
  });

  it('confirms a hidden-role draft using only the apparent character', () => {
    const playerIds = Array.from({ length: 10 }, (_, index) => `p${index + 1}`);
    const playerNames = Object.fromEntries(
      playerIds.map((playerId, index) => [playerId, `Player ${index + 1}`]),
    );
    const config = {
      playerCount: 10,
      scriptCharacters: toDraftCharacters(boozlingCharacters),
      setupMode: 'standard' as const,
      presentationMode: 'open' as const,
    };
    const created = createGameCharacterDraft(playerIds, config, () => 0.999);
    const reservedPlayerId = created.marionetteRoll?.playerId;
    if (!reservedPlayerId) throw new Error('Expected a reserved Marionette player.');
    const activeDraft = selectGameCharacterDraftPlayer(
      created,
      config,
      reservedPlayerId,
      () => 0.5,
    );
    const selectedCharacterId = activeDraft.entries[0]?.offer.offeredCharacterIds[0];
    if (!selectedCharacterId) throw new Error('Expected an apparent draft choice.');

    render(
      <CharacterDraftDialog
        open
        playerIds={playerIds}
        playerNames={playerNames}
        scriptCharacters={boozlingCharacters}
        draftState={activeDraft}
        onClose={vi.fn()}
        onDraftChange={vi.fn()}
        onDraftComplete={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: new RegExp(`hand device to ${playerNames[reservedPlayerId]}`, 'i'),
      }),
    );
    act(() => privateDraftChoose?.(selectedCharacterId));

    expect(screen.getByTestId('private-draft-confirmation')).toBeVisible();
    expect(screen.getByRole('heading', { name: selectedCharacterId })).toBeVisible();
    expect(screen.queryByText('Marionette')).not.toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Marionette' })).not.toBeInTheDocument();
  });

  it('warns the Storyteller inline before handing off a hidden character offer', () => {
    render(
      <CharacterDraftDialog
        open
        playerIds={['p1']}
        playerNames={{ p1: 'Alice' }}
        scriptCharacters={[
          ...scriptCharacters,
          {
            ...character('marionette', CharacterType.Minion),
            name: 'Marionette',
          },
        ]}
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
                actualCharacterIdsByOfferedId: { t1: 'marionette' },
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

    expect(screen.getByTestId('draft-player-hidden-warning-p1')).toBeVisible();
    const currentPlayerWarning = screen.getByTestId('current-player-hidden-identity-warning');
    expect(currentPlayerWarning).toHaveTextContent(/hidden character.*storyteller eyes only/i);
    expect(within(currentPlayerWarning).getByRole('img', { name: 'Marionette' })).toBeVisible();
    expect(currentPlayerWarning).toHaveTextContent(
      /player's fake draft shows t1.*any selection secretly assigns marionette/i,
    );

    fireEvent.click(screen.getByRole('button', { name: /hand device to alice/i }));

    expect(screen.getByTestId('private-draft')).toHaveTextContent('Alice');
    expect(screen.queryByText('Marionette')).not.toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Marionette' })).not.toBeInTheDocument();
  });

  it('shows the Storyteller warning for a production-generated Marionette roll', () => {
    const playerIds = Array.from({ length: 10 }, (_, index) => `p${index + 1}`);
    const playerNames = Object.fromEntries(
      playerIds.map((playerId, index) => [playerId, `Player ${index + 1}`]),
    );
    const config = {
      playerCount: 10,
      scriptCharacters: toDraftCharacters(boozlingCharacters),
      setupMode: 'standard' as const,
      presentationMode: 'open' as const,
    };
    const created = createGameCharacterDraft(playerIds, config, () => 0.999);
    const reservedPlayerId = created.marionetteRoll?.playerId;
    if (!reservedPlayerId) throw new Error('Expected a reserved Marionette player.');

    const { rerender } = render(
      <CharacterDraftDialog
        open
        playerIds={playerIds}
        playerNames={playerNames}
        scriptCharacters={boozlingCharacters}
        draftState={created}
        onClose={vi.fn()}
        onDraftChange={vi.fn()}
        onDraftComplete={vi.fn()}
      />,
    );

    expect(screen.getByTestId(`draft-player-hidden-warning-${reservedPlayerId}`)).toBeVisible();

    const draftState = selectGameCharacterDraftPlayer(created, config, reservedPlayerId, () => 0.5);

    rerender(
      <CharacterDraftDialog
        open
        playerIds={playerIds}
        playerNames={playerNames}
        scriptCharacters={boozlingCharacters}
        draftState={draftState}
        onClose={vi.fn()}
        onDraftChange={vi.fn()}
        onDraftComplete={vi.fn()}
      />,
    );

    const warning = screen.getByTestId('current-player-hidden-identity-warning');
    expect(within(warning).getByRole('img', { name: 'Marionette' })).toBeVisible();
    expect(warning).toHaveTextContent(/any selection secretly assigns marionette/i);
  });

  it.each([
    ['Drunk', 'drunk'],
    ['Lunatic', 'lunatic'],
  ] as const)(
    'shows the Storyteller warning for a production-generated %s roll',
    (name, hiddenId) => {
      const playerIds = Array.from({ length: 12 }, (_, index) => `p${index + 1}`);
      const playerNames = Object.fromEntries(
        playerIds.map((playerId, index) => [playerId, `Player ${index + 1}`]),
      );
      const config = {
        playerCount: 12,
        scriptCharacters: toDraftCharacters(outsiderHiddenCharacters),
        setupMode: 'standard' as const,
        presentationMode: 'secret-two-types' as const,
      };
      const created = Array.from({ length: 1_000 }, (_, index) =>
        createGameCharacterDraft(playerIds, config, seededRandom(index + 1)),
      ).find((state) =>
        getHiddenOutsiderRolls(state).some((roll) => roll.characterId === hiddenId),
      );
      const reservedPlayerId = created
        ? getHiddenOutsiderRolls(created).find((roll) => roll.characterId === hiddenId)?.playerId
        : undefined;
      if (!created || !reservedPlayerId) {
        throw new Error(`Expected a reserved ${name} player.`);
      }
      const draftState = selectGameCharacterDraftPlayer(
        created,
        config,
        reservedPlayerId,
        () => 0.5,
      );

      render(
        <CharacterDraftDialog
          open
          playerIds={playerIds}
          playerNames={playerNames}
          scriptCharacters={outsiderHiddenCharacters}
          draftState={draftState}
          onClose={vi.fn()}
          onDraftChange={vi.fn()}
          onDraftComplete={vi.fn()}
        />,
      );

      expect(screen.getByTestId(`draft-player-hidden-warning-${reservedPlayerId}`)).toBeVisible();
      const warning = screen.getByTestId('current-player-hidden-identity-warning');
      expect(within(warning).getByRole('img', { name })).toBeVisible();
      expect(warning).toHaveTextContent(
        new RegExp(`any selection secretly assigns ${hiddenId}`, 'i'),
      );
    },
  );

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
    const { rerender } = render(<CharacterDraftDialog {...baseProps} draftState={activeDraft} />);

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
