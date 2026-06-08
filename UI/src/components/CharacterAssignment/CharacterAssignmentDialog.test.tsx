import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CharacterAssignmentDialog } from '@/components/CharacterAssignment/CharacterAssignmentDialog.tsx';
import { getCharacter } from '@/data/characters/index.ts';
import type {
  CharacterDef,
  Participant,
  Player,
  PlayerGameState,
  PlayerId,
  Slot,
} from '@/types/index.ts';
import { Alignment, CharacterType } from '@/types/index.ts';

const makeChar = (overrides: Partial<CharacterDef> = {}): CharacterDef => ({
  id: 'noble',
  name: 'Noble',
  type: CharacterType.Townsfolk,
  defaultAlignment: Alignment.Good,
  abilityShort: 'Test',
  firstNight: null,
  otherNights: null,
  reminders: [],
  ...overrides,
});

const mockScriptCharacters: CharacterDef[] = [
  makeChar({ id: 'noble', name: 'Noble', type: CharacterType.Townsfolk }),
  makeChar({ id: 'fortuneteller', name: 'Fortune Teller', type: CharacterType.Townsfolk }),
  makeChar({ id: 'slayer', name: 'Slayer', type: CharacterType.Townsfolk }),
  makeChar({ id: 'drunk', name: 'Drunk', type: CharacterType.Outsider }),
  makeChar({
    id: 'poisoner',
    name: 'Poisoner',
    type: CharacterType.Minion,
    defaultAlignment: Alignment.Evil,
  }),
  makeChar({ id: 'imp', name: 'Imp', type: CharacterType.Demon, defaultAlignment: Alignment.Evil }),
];

const whoseCultScriptIds = [
  'noble',
  'pixie',
  'balloonist',
  'preacher',
  'villageidiot',
  'king',
  'cultleader',
  'oracle',
  'lycanthrope',
  'savant',
  'seamstress',
  'cannibal',
  'choirboy',
  'recluse',
  'mutant',
  'zealot',
  'puzzlemaster',
  'witch',
  'cerenovus',
  'fearmonger',
  'goblin',
  'lilmonsta',
  'nodashii',
  'fanggu',
  'lordoftyphon',
  'harlot',
  'butcher',
  'bonecollector',
  'beggar',
  'bishop',
  'stormcatcher',
];

const whoseCultCharacters = whoseCultScriptIds
  .map((id) => getCharacter(id))
  .filter((character): character is CharacterDef => character !== undefined);

function makePlayerState(characterId = ''): PlayerGameState {
  const isEvil = ['poisoner', 'imp', 'marionette'].includes(characterId);
  return {
    characterId,
    alive: true,
    ghostVoteUsed: false,
    visibleAlignment: Alignment.Unknown,
    actualAlignment: isEvil ? Alignment.Evil : characterId ? Alignment.Good : Alignment.Unknown,
    startingAlignment: isEvil ? Alignment.Evil : characterId ? Alignment.Good : Alignment.Unknown,
    activeReminders: [],
    tokens: [],
  };
}

interface Fixture {
  slots: Slot[];
  participants: Participant[];
  playerState: Record<PlayerId, PlayerGameState>;
  sessionPlayers: Player[];
  playerCountOverride: number | null;
  scriptCharacters: CharacterDef[];
  inPlayCharacterIds?: string[];
}

function makeFixture(
  count: number,
  options: {
    scriptCharacters?: CharacterDef[];
    inPlayCharacterIds?: string[];
    assignments?: Record<number, Partial<PlayerGameState>>;
    travellers?: number[];
    names?: Record<number, string>;
    playerCountOverride?: number | null;
  } = {},
): Fixture {
  const travellerSeats = new Set(options.travellers ?? []);
  const sessionPlayers: Player[] = Array.from({ length: count }, (_, index) => ({
    id: `player-${index + 1}`,
    name: options.names?.[index + 1] ?? `Player ${index + 1}`,
  }));
  const slots: Slot[] = sessionPlayers.map((player, index) => ({
    kind: 'seat',
    id: `slot-${index + 1}`,
    playerId: player.id,
  }));
  const participants: Participant[] = sessionPlayers.map((player, index) => ({
    playerId: player.id,
    isTraveller: travellerSeats.has(index + 1),
  }));
  const playerState: Record<PlayerId, PlayerGameState> = {};
  sessionPlayers.forEach((player, index) => {
    const assignment = options.assignments?.[index + 1];
    playerState[player.id] = { ...makePlayerState(assignment?.characterId), ...assignment };
  });
  return {
    slots,
    participants,
    playerState,
    sessionPlayers,
    playerCountOverride: options.playerCountOverride ?? null,
    scriptCharacters: options.scriptCharacters ?? mockScriptCharacters,
    inPlayCharacterIds: options.inPlayCharacterIds,
  };
}

function renderDialog(
  fixture: Fixture = makeFixture(5),
  overrides: Partial<React.ComponentProps<typeof CharacterAssignmentDialog>> = {},
) {
  const onClose = vi.fn();
  const onConfirm = vi.fn();
  const onPlayerCountChange = vi.fn();
  const props: React.ComponentProps<typeof CharacterAssignmentDialog> = {
    open: true,
    onClose,
    onConfirm,
    onPlayerCountChange,
    slots: fixture.slots,
    participants: fixture.participants,
    playerState: fixture.playerState,
    sessionPlayers: fixture.sessionPlayers,
    playerCountOverride: fixture.playerCountOverride,
    scriptCharacters: fixture.scriptCharacters,
    inPlayCharacterIds: fixture.inPlayCharacterIds,
    ...overrides,
  };
  return {
    ...render(<CharacterAssignmentDialog {...props} />),
    onClose,
    onConfirm,
    onPlayerCountChange,
  };
}

describe('CharacterAssignmentDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('clears stale assigned characters that are not in the selected in-play pool', () => {
    const fixture = makeFixture(5, {
      assignments: { 1: { characterId: 'cannibal' } },
      inPlayCharacterIds: ['noble', 'fortuneteller', 'slayer', 'drunk', 'imp'],
    });
    const { onConfirm } = renderDialog(fixture);

    fireEvent.click(screen.getByText('Confirm'));

    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ 'player-1': expect.objectContaining({ characterId: '' }) }),
    );
  });

  it('does not pass stale Whose Cult assignments to MUI select values', () => {
    const fixture = makeFixture(10, {
      scriptCharacters: whoseCultCharacters,
      assignments: { 1: { characterId: 'cannibal' } },
      inPlayCharacterIds: [
        'balloonist',
        'king',
        'noble',
        'savant',
        'seamstress',
        'zealot',
        'fearmonger',
        'goblin',
        'witch',
        'lordoftyphon',
      ],
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    let consoleCalls: unknown[] = [];
    try {
      renderDialog(fixture);
      consoleCalls = [...errorSpy.mock.calls, ...warnSpy.mock.calls].flat();
    } finally {
      errorSpy.mockRestore();
      warnSpy.mockRestore();
    }

    expect(consoleCalls).not.toContainEqual(
      expect.stringContaining('out-of-range value `cannibal`'),
    );
  });

  it('renders nothing visible when not open', () => {
    const { container } = renderDialog(makeFixture(5), { open: false });
    expect(screen.queryByText('Assign Characters')).not.toBeInTheDocument();
    expect(container).toBeTruthy();
  });

  it('shows dialog title when open', () => {
    renderDialog();
    expect(screen.getByText('Assign Characters')).toBeInTheDocument();
  });

  it('shows distribution section with player count', () => {
    renderDialog();
    expect(screen.getByText('Distribution (5 players)')).toBeInTheDocument();
  });

  it('updates player count override through the callback', () => {
    const { onPlayerCountChange } = renderDialog();
    fireEvent.change(screen.getByLabelText('Player Count'), { target: { value: '7' } });
    expect(onPlayerCountChange).toHaveBeenCalledWith(7);
  });

  it('has a Randomize button', () => {
    renderDialog();
    expect(screen.getByRole('button', { name: /randomize/i })).toBeInTheDocument();
  });

  it('shows available character types in distribution section', () => {
    renderDialog();
    expect(screen.getByText('Townsfolk: 3')).toBeInTheDocument();
    expect(screen.getByText('Outsider: 0')).toBeInTheDocument();
    expect(screen.getByText('Minion: 1')).toBeInTheDocument();
    expect(screen.getByText('Demon: 1')).toBeInTheDocument();
  });

  it('shows player assignment rows for non-traveller participants', () => {
    const fixture = makeFixture(6, {
      travellers: [6],
      names: { 6: 'TravJack' },
      assignments: {
        6: {
          characterId: 'spiritofivory',
          actualAlignment: Alignment.Good,
          startingAlignment: Alignment.Good,
          visibleAlignment: Alignment.Good,
        },
      },
    });
    renderDialog(fixture);

    expect(screen.getByText('Player Assignments')).toBeInTheDocument();
    for (let i = 1; i <= 5; i++) expect(screen.getByText(`Player ${i}`)).toBeInTheDocument();
    expect(screen.queryByText('TravJack')).not.toBeInTheDocument();
  });

  it('shows character select dropdowns for each non-traveller participant', () => {
    renderDialog();
    expect(screen.getAllByLabelText('Character')).toHaveLength(5);
  });

  it('calls onClose when Cancel is clicked', () => {
    const { onClose } = renderDialog();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when close icon button is clicked', () => {
    const { onClose } = renderDialog();
    fireEvent.click(screen.getByRole('button', { name: 'close' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onConfirm and onClose when Confirm is clicked', () => {
    const { onClose, onConfirm } = renderDialog();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('randomize assigns unassigned characters without showing an error', () => {
    renderDialog(
      makeFixture(5, {
        inPlayCharacterIds: ['noble', 'fortuneteller', 'slayer', 'poisoner', 'imp'],
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: /randomize/i }));
    expect(screen.queryByText(/not enough/i)).not.toBeInTheDocument();
  });

  it('excludes travellers from assignment rows while participant count still drives distribution', () => {
    renderDialog(makeFixture(6, { travellers: [6] }));
    expect(screen.getByText('Distribution (6 players)')).toBeInTheDocument();
    expect(screen.getAllByLabelText('Character')).toHaveLength(5);
  });

  it('has Confirm and Cancel action buttons', () => {
    renderDialog();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('handles empty script characters gracefully', () => {
    renderDialog(makeFixture(5, { scriptCharacters: [] }));
    expect(screen.getByText('Townsfolk: 3')).toBeInTheDocument();
    expect(screen.getByText('Demon: 1')).toBeInTheDocument();
  });

  describe('character pool', () => {
    it('shows unassigned characters as chips when inPlayCharacterIds are provided', () => {
      renderDialog(
        makeFixture(5, {
          inPlayCharacterIds: ['noble', 'fortuneteller', 'slayer', 'poisoner', 'imp'],
        }),
      );
      expect(screen.getByTestId('character-pool')).toBeInTheDocument();
      expect(screen.getByTestId('pool-chip-noble')).toBeInTheDocument();
      expect(screen.getByTestId('pool-chip-imp')).toBeInTheDocument();
    });

    it('shows the Unassigned Characters heading', () => {
      renderDialog(makeFixture(5, { inPlayCharacterIds: ['noble', 'imp'] }));
      expect(screen.getByText('Unassigned Characters')).toBeInTheDocument();
    });
  });

  describe('tap-to-assign', () => {
    it('shows assignment hint when a chip is tapped', () => {
      renderDialog(makeFixture(5, { inPlayCharacterIds: ['noble', 'imp'] }));
      fireEvent.click(screen.getByTestId('pool-chip-noble'));
      expect(screen.getByText(/Tap a player below to assign/)).toBeInTheDocument();
    });
  });

  describe('multi-instance dropdown', () => {
    const villageidiotChar = makeChar({
      id: 'villageidiot',
      name: 'Village Idiot',
      type: CharacterType.Townsfolk,
    });
    const multiInstanceScript = [
      villageidiotChar,
      makeChar({ id: 'fortuneteller', name: 'Fortune Teller', type: CharacterType.Townsfolk }),
      makeChar({
        id: 'poisoner',
        name: 'Poisoner',
        type: CharacterType.Minion,
        defaultAlignment: Alignment.Evil,
      }),
      makeChar({
        id: 'imp',
        name: 'Imp',
        type: CharacterType.Demon,
        defaultAlignment: Alignment.Evil,
      }),
    ];

    it('shows multiple unassigned chips for duplicate characters', () => {
      renderDialog(
        makeFixture(6, {
          scriptCharacters: multiInstanceScript,
          inPlayCharacterIds: [
            'villageidiot',
            'villageidiot',
            'villageidiot',
            'fortuneteller',
            'poisoner',
            'imp',
          ],
        }),
      );
      expect(screen.getAllByTestId('pool-chip-villageidiot')).toHaveLength(3);
    });

    it('computes distribution from inPlayCharacterIds type counts', () => {
      renderDialog(
        makeFixture(6, {
          scriptCharacters: multiInstanceScript,
          inPlayCharacterIds: [
            'villageidiot',
            'villageidiot',
            'villageidiot',
            'fortuneteller',
            'poisoner',
            'imp',
          ],
        }),
      );
      expect(screen.getByText('Townsfolk: 3')).toBeInTheDocument();
      expect(screen.getByText('Outsider: 1')).toBeInTheDocument();
      expect(screen.getByText('Minion: 1')).toBeInTheDocument();
      expect(screen.getByText('Demon: 1')).toBeInTheDocument();
    });
  });

  describe('identity concealment', () => {
    it('shows concealment prompt when Drunk is assigned without apparent character', () => {
      renderDialog(makeFixture(5, { assignments: { 1: { characterId: 'drunk' } } }));
      expect(screen.getByTestId('concealment-prompt-drunk')).toBeInTheDocument();
      expect(screen.getByText(/Townsfolk the Drunk believes/)).toBeInTheDocument();
    });

    it('shows concealment prompt when Marionette is assigned without apparent character', () => {
      const charsWithMarionette = [
        ...mockScriptCharacters,
        makeChar({
          id: 'marionette',
          name: 'Marionette',
          type: CharacterType.Minion,
          defaultAlignment: Alignment.Evil,
        }),
      ];
      renderDialog(
        makeFixture(5, {
          scriptCharacters: charsWithMarionette,
          assignments: { 1: { characterId: 'marionette' } },
        }),
      );
      expect(screen.getByTestId('concealment-prompt-marionette')).toBeInTheDocument();
      expect(screen.getByText(/good character the Marionette believes/)).toBeInTheDocument();
    });

    it('does not show concealment prompt when apparent character is set', () => {
      renderDialog(
        makeFixture(5, {
          assignments: { 1: { characterId: 'drunk', apparentCharacterId: 'noble' } },
        }),
      );
      expect(screen.queryByTestId('concealment-prompt-drunk')).not.toBeInTheDocument();
    });
  });
});
