import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import type { Game, Player, PlayerGameState } from '@/types/index.ts';
import { Alignment, Phase } from '@/types/index.ts';
import { TownSquareEditMode } from './TownSquareEditMode.tsx';

const players: Player[] = [
  { id: 'p1', name: 'Alice' },
  { id: 'p2', name: 'Bob' },
  { id: 'p3', name: 'Carol' },
];

function makeState(characterId = ''): PlayerGameState {
  return {
    characterId,
    alive: true,
    ghostVoteUsed: false,
    visibleAlignment: Alignment.Unknown,
    actualAlignment: Alignment.Unknown,
    startingAlignment: Alignment.Unknown,
    activeReminders: [],
    tokens: [],
  };
}

const game: Game = {
  id: 'game-1',
  sessionId: 'session-1',
  scriptId: 'script-1',
  currentDay: 1,
  currentPhase: Phase.Day,
  isFirstNight: true,
  slots: [
    { kind: 'seat', id: 's1', playerId: 'p1' },
    { kind: 'seat', id: 's2', playerId: 'p2' },
  ],
  participants: [
    { playerId: 'p1', isTraveller: false },
    { playerId: 'p2', isTraveller: false },
  ],
  playerState: { p1: makeState('washerwoman'), p2: makeState('imp') },
  playerCountOverride: null,
  seatingConfirmed: false,
  inPlayCharacterIds: ['washerwoman', 'imp'],
  nightHistory: [],
};

const characters = [
  {
    id: 'washerwoman',
    name: 'Washerwoman',
    type: 'Townsfolk' as const,
    defaultAlignment: Alignment.Good,
    abilityShort: 'Test',
    firstNight: null,
    otherNights: null,
    reminders: [],
  },
  {
    id: 'drunk',
    name: 'Drunk',
    type: 'Outsider' as const,
    defaultAlignment: Alignment.Good,
    abilityShort: 'Test',
    firstNight: null,
    otherNights: null,
    reminders: [],
  },
  {
    id: 'imp',
    name: 'Imp',
    type: 'Demon' as const,
    defaultAlignment: Alignment.Evil,
    abilityShort: 'Test',
    firstNight: null,
    otherNights: null,
    reminders: [],
  },
  {
    id: 'harlot',
    name: 'Harlot',
    type: 'Traveller' as const,
    defaultAlignment: Alignment.Unknown,
    abilityShort: 'Test',
    firstNight: null,
    otherNights: null,
    reminders: [],
  },
];

const resizeObserver = vi.fn().mockImplementation(function MockResizeObserver(
  this: { observe: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> },
  callback: ResizeObserverCallback,
) {
  this.observe = vi.fn((element: Element) => {
    callback(
      [
        {
          target: element,
          contentRect: {
            width: 360,
            height: 500,
            top: 0,
            left: 0,
            right: 360,
            bottom: 500,
            x: 0,
            y: 0,
            toJSON: () => ({}),
          },
          borderBoxSize: [],
          contentBoxSize: [],
          devicePixelContentBoxSize: [],
        },
      ],
      this as unknown as ResizeObserver,
    );
  });
  this.disconnect = vi.fn();
});

function renderEditor(
  gameValue = game,
  propagationDefault = { toTemplate: false, toOtherGames: false },
) {
  const onSave = vi.fn();
  const onCancel = vi.fn();
  const onOpenCharacterSelection = vi.fn();
  const onOpenCharacterAssignment = vi.fn();
  render(
    <TownSquareEditMode
      game={gameValue}
      sessionPlayers={players}
      scriptCharacters={characters}
      propagationDefault={propagationDefault}
      onSave={onSave}
      onCancel={onCancel}
      onOpenCharacterSelection={onOpenCharacterSelection}
      onOpenCharacterAssignment={onOpenCharacterAssignment}
    />,
  );
  return {
    onSave,
    onCancel,
    onOpenCharacterSelection,
    onOpenCharacterAssignment,
  };
}

describe('TownSquareEditMode', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', resizeObserver);
  });

  it('keeps edits in a draft until review and save', () => {
    const { onSave } = renderEditor();
    fireEvent.click(screen.getByRole('button', { name: 'Add Spacer' }));
    expect(onSave).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /review & save/i }));
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0]).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: 'spacer' })]),
    );
  });

  it('always shows assigned characters while editing seating', () => {
    renderEditor();

    expect(screen.getByTestId('seat-character-p1')).toHaveTextContent('Washerwoman');
    expect(screen.getByTestId('seat-character-p2')).toHaveTextContent('Imp');
    expect(screen.getByRole('img', { name: 'Washerwoman' })).toBeVisible();
    expect(screen.getByRole('img', { name: 'Imp' })).toBeVisible();
  });

  it('shows actual and apparent identities for illusion drafts', () => {
    renderEditor({
      ...game,
      playerState: {
        ...game.playerState,
        p1: {
          ...makeState('drunk'),
          apparentCharacterId: 'washerwoman',
        },
      },
    });

    expect(screen.getByTestId('seat-character-p1')).toHaveTextContent(
      'Drunk (appears Washerwoman)',
    );
  });

  it('randomizes assigned seating locally before save', () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);
    const { onSave } = renderEditor();

    fireEvent.click(screen.getByRole('button', { name: /randomize seating/i }));
    expect(onSave).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /review & save/i }));
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    expect(onSave.mock.calls[0][0]).toEqual([
      { kind: 'seat', id: 's1', playerId: 'p2' },
      { kind: 'seat', id: 's2', playerId: 'p1' },
    ]);
    random.mockRestore();
  });

  it('adds a roster player to the game with an assigned seat', () => {
    const { onSave } = renderEditor(game, {
      toTemplate: false,
      toOtherGames: true,
    });

    fireEvent.click(screen.getByRole('button', { name: /add carol to game/i }));
    expect(screen.getByTestId('edit-player-p3')).toHaveTextContent('Carol · Seated');
    expect(screen.getByRole('switch', { name: /update other games/i })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /review & save/i }));
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    expect(onSave.mock.calls[0][1]).toEqual(
      expect.arrayContaining([{ playerId: 'p3', isTraveller: false }]),
    );
    expect(onSave.mock.calls[0][2].p3).toEqual(expect.objectContaining({ characterId: '' }));
    expect(onSave.mock.calls[0][0]).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: 'seat', playerId: 'p3' })]),
    );
    expect(onSave.mock.calls[0][3].toOtherGames).toBe(false);
  });

  it('assigns only from the separately selected character pool', () => {
    const { onSave } = renderEditor({
      ...game,
      playerState: {
        ...game.playerState,
        p2: makeState(),
      },
    });
    fireEvent.click(screen.getByTestId('edit-player-p1'));
    fireEvent.mouseDown(screen.getByLabelText('assign character to Alice'));
    fireEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: 'Imp' }));
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    fireEvent.click(screen.getByRole('button', { name: /review & save/i }));
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    expect(onSave.mock.calls[0][2].p1).toEqual(
      expect.objectContaining({
        characterId: 'imp',
        actualAlignment: Alignment.Evil,
      }),
    );
  });

  it('disables a unique character already assigned to another participant', () => {
    renderEditor();
    fireEvent.click(screen.getByTestId('edit-player-p1'));
    fireEvent.mouseDown(screen.getByLabelText('assign character to Alice'));

    expect(
      within(screen.getByRole('listbox')).getByRole('option', { name: 'Imp' }),
    ).toHaveAttribute('aria-disabled', 'true');
  });

  it('uses Traveller characters from the script for Traveller participants', () => {
    const { onSave } = renderEditor();
    fireEvent.click(screen.getByTestId('edit-player-p1'));
    fireEvent.click(screen.getByRole('switch', { name: 'Traveller' }));
    fireEvent.mouseDown(screen.getByLabelText('assign character to Alice'));
    const listbox = within(screen.getByRole('listbox'));
    expect(listbox.getByRole('option', { name: 'Harlot' })).toBeInTheDocument();
    expect(listbox.queryByRole('option', { name: 'Imp' })).not.toBeInTheDocument();
    fireEvent.click(listbox.getByRole('option', { name: 'Harlot' }));
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    fireEvent.click(screen.getByRole('button', { name: /review & save/i }));
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    expect(onSave.mock.calls[0][1]).toContainEqual({
      playerId: 'p1',
      isTraveller: true,
    });
    expect(onSave.mock.calls[0][2].p1).toEqual(
      expect.objectContaining({
        characterId: 'harlot',
        actualAlignment: Alignment.Unknown,
      }),
    );
  });

  it('clears stale apparent identity when changing away from a concealment role', () => {
    const concealmentGame: Game = {
      ...game,
      inPlayCharacterIds: ['drunk', 'imp'],
      playerState: {
        ...game.playerState,
        p1: {
          ...game.playerState.p1,
          characterId: 'drunk',
          apparentCharacterId: 'washerwoman',
        },
      },
    };
    const { onSave } = renderEditor(concealmentGame);
    fireEvent.click(screen.getByTestId('edit-player-p1'));
    fireEvent.mouseDown(screen.getByLabelText('assign character to Alice'));
    fireEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: 'Imp' }));
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    fireEvent.click(screen.getByRole('button', { name: /review & save/i }));
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    expect(onSave.mock.calls[0][2].p1.apparentCharacterId).toBe('');
  });

  it('shows only Character Selection when the game has no character pool', () => {
    const { onOpenCharacterSelection, onOpenCharacterAssignment } = renderEditor({
      ...game,
      inPlayCharacterIds: [],
    });

    fireEvent.click(screen.getByRole('button', { name: /^select characters$/i }));

    expect(onOpenCharacterSelection).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button', { name: /^assign characters$/i })).not.toBeInTheDocument();
    expect(onOpenCharacterAssignment).not.toHaveBeenCalled();
  });

  it('shows only Character Assignment when selection is complete but assignments are missing', () => {
    const { onOpenCharacterSelection, onOpenCharacterAssignment } = renderEditor({
      ...game,
      playerState: {
        ...game.playerState,
        p1: makeState(),
      },
    });

    fireEvent.click(screen.getByRole('button', { name: /^select characters$/i }));

    expect(onOpenCharacterSelection).not.toHaveBeenCalled();
    expect(onOpenCharacterAssignment).toHaveBeenCalledOnce();
  });

  it('hides character preparation actions after assignments are complete or play has started', () => {
    const { rerender } = render(
      <TownSquareEditMode
        game={game}
        sessionPlayers={players}
        scriptCharacters={characters}
        propagationDefault={{ toTemplate: false, toOtherGames: false }}
        onSave={vi.fn()}
        onCancel={vi.fn()}
        onOpenCharacterSelection={vi.fn()}
        onOpenCharacterAssignment={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: /^select characters$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^assign characters$/i })).not.toBeInTheDocument();

    rerender(
      <TownSquareEditMode
        game={{
          ...game,
          currentPhase: 'Night',
          playerState: { ...game.playerState, p1: makeState() },
        }}
        sessionPlayers={players}
        scriptCharacters={characters}
        propagationDefault={{ toTemplate: false, toOtherGames: false }}
        onSave={vi.fn()}
        onCancel={vi.fn()}
        onOpenCharacterSelection={vi.fn()}
        onOpenCharacterAssignment={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: /^select characters$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^assign characters$/i })).not.toBeInTheDocument();
  });

  it('saves the explicit template and sibling-game propagation scope', () => {
    const { onSave } = renderEditor();
    fireEvent.click(screen.getByRole('switch', { name: /update session template/i }));
    fireEvent.click(screen.getByRole('switch', { name: /update other games/i }));
    fireEvent.click(screen.getByRole('button', { name: /review & save/i }));
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    expect(onSave.mock.calls[0][3]).toEqual({
      toTemplate: true,
      toOtherGames: true,
    });
  });

  it('keeps sibling-game propagation available for untouched API-normalized state', () => {
    renderEditor(
      {
        ...game,
        playerState: Object.fromEntries(
          Object.entries(game.playerState).map(([playerId, state]) => [
            playerId,
            { ...state, tokens: undefined },
          ]),
        ),
      },
      { toTemplate: false, toOtherGames: true },
    );

    const updateOtherGames = screen.getByRole('switch', { name: /update other games/i });
    expect(updateOtherGames).toBeEnabled();
    expect(updateOtherGames).toBeChecked();
    expect(
      screen.queryByText(/other-game updates are unavailable because this draft changes/i),
    ).not.toBeInTheDocument();
  });
});
