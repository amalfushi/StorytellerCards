import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SetupChecklist } from '@/components/Setup/SetupChecklist.tsx';
import { buildChecklistItems } from '@/components/Setup/buildChecklistItems.ts';
import type { Participant, Player, PlayerGameState, PlayerId } from '@/types/index.ts';
import { Alignment } from '@/types/index.ts';

vi.mock('@/data/characters/index.ts', () => {
  const chars: Record<string, Record<string, unknown>> = {
    drunk: {
      id: 'drunk',
      name: 'Drunk',
      type: 'Outsider' as const,
      defaultAlignment: 'Good' as const,
      abilityShort: 'You think you are a Townsfolk.',
      firstNight: null,
      otherNights: null,
      reminders: [],
      setup: true,
      storytellerSetup: [{ id: 'drunk-assignment', description: 'Choose a Townsfolk character.' }],
      remindersGlobal: [
        {
          id: 'drunk-global-isthedrunk',
          text: 'Is The Drunk',
          isGlobal: true,
          sourceCharacterId: 'drunk',
        },
      ],
    },
    baron: {
      id: 'baron',
      name: 'Baron',
      type: 'Minion' as const,
      defaultAlignment: 'Evil' as const,
      abilityShort: '+2 Outsiders',
      firstNight: null,
      otherNights: null,
      reminders: [],
      setup: true,
      setupModification: { description: '+2 Outsiders' },
    },
    lordoftyphon: {
      id: 'lordoftyphon',
      name: 'Lord of Typhon',
      type: 'Demon' as const,
      defaultAlignment: 'Evil' as const,
      abilityShort: '+1 Minion. Outsiders may vary.',
      firstNight: null,
      otherNights: null,
      reminders: [],
      setup: true,
      setupModification: { description: '+1 Minion and variable Outsiders' },
    },
    marionette: {
      id: 'marionette',
      name: 'Marionette',
      type: 'Minion' as const,
      defaultAlignment: 'Evil' as const,
      abilityShort: 'You think you are good.',
      firstNight: {
        order: 21,
        helpText: 'Wake the Demon.',
        subActions: [{ id: 'mar-fn-1', description: 'Wake Demon', isConditional: false }],
      },
      otherNights: null,
      reminders: [],
      setup: true,
      remindersGlobal: [
        {
          id: 'marionette-global-isthemarionette',
          text: 'Is The Marionette',
          isGlobal: true,
          sourceCharacterId: 'marionette',
        },
      ],
    },
    imp: {
      id: 'imp',
      name: 'Imp',
      type: 'Demon' as const,
      defaultAlignment: 'Evil' as const,
      abilityShort: 'Kill each night.',
      firstNight: null,
      otherNights: null,
      reminders: [{ id: 'imp-dead', text: 'Dead', sourceCharacterId: 'imp' }],
    },
    washerwoman: {
      id: 'washerwoman',
      name: 'Washerwoman',
      type: 'Townsfolk' as const,
      defaultAlignment: 'Good' as const,
      abilityShort: 'Learn 2 players.',
      firstNight: null,
      otherNights: null,
      reminders: [],
    },
    noble: {
      id: 'noble',
      name: 'Noble',
      type: 'Townsfolk' as const,
      defaultAlignment: 'Good' as const,
      abilityShort: 'You start knowing 3 players.',
      firstNight: null,
      otherNights: null,
      reminders: [
        { id: 'noble-know-1', text: 'Know', sourceCharacterId: 'noble' },
        { id: 'noble-know-2', text: 'Know', sourceCharacterId: 'noble' },
        { id: 'noble-know-3', text: 'Know', sourceCharacterId: 'noble' },
      ],
      firstNightReminderSetup: [
        {
          id: 'know-tokens',
          description: 'Place 3 Know reminders on the players Noble will learn.',
          reminderTokenIds: ['noble-know-1', 'noble-know-2', 'noble-know-3'],
        },
      ],
    },
  };
  return {
    getCharacter: (id: string) => chars[id],
    allCharacters: Object.values(chars),
    characterMap: new Map(Object.entries(chars)),
  };
});

function makeState(characterId: string, overrides: Partial<PlayerGameState> = {}): PlayerGameState {
  const evil = ['baron', 'lordoftyphon', 'marionette', 'imp'].includes(characterId);
  return {
    characterId,
    alive: true,
    ghostVoteUsed: false,
    visibleAlignment: Alignment.Unknown,
    actualAlignment: evil ? Alignment.Evil : Alignment.Good,
    startingAlignment: evil ? Alignment.Evil : Alignment.Good,
    activeReminders: [],
    tokens: [],
    ...overrides,
  };
}

function makeFixture(
  characterIds: string[],
  overrides: Record<number, Partial<PlayerGameState>> = {},
) {
  const sessionPlayers: Player[] = characterIds.map((_, index) => ({
    id: `player-${index + 1}`,
    name: `Player ${index + 1}`,
  }));
  const participants: Participant[] = sessionPlayers.map((player) => ({
    playerId: player.id,
    isTraveller: false,
  }));
  const playerState: Record<PlayerId, PlayerGameState> = {};
  characterIds.forEach((characterId, index) => {
    playerState[`player-${index + 1}`] = makeState(characterId, overrides[index + 1]);
  });
  return { sessionPlayers, participants, playerState };
}

function renderChecklist(
  characterIds: string[],
  props: Partial<React.ComponentProps<typeof SetupChecklist>> = {},
  stateOverrides: Record<number, Partial<PlayerGameState>> = {},
) {
  const fixture = makeFixture(characterIds, stateOverrides);
  const fullProps: React.ComponentProps<typeof SetupChecklist> = {
    gameId: 'test-game-1',
    participants: fixture.participants,
    playerState: fixture.playerState,
    sessionPlayers: fixture.sessionPlayers,
    inPlayCharacterIds: characterIds,
    scriptCharacterIds: characterIds,
    onStartNight: vi.fn(),
    ...props,
  };
  return render(<SetupChecklist {...fullProps} />);
}

describe('buildChecklistItems', () => {
  it('generates storytellerSetup items', () => {
    const fixture = makeFixture(['drunk']);
    const items = buildChecklistItems(
      fixture.participants,
      fixture.playerState,
      ['drunk'],
      ['drunk'],
    );
    const setupItems = items.filter((item) => item.category === 'setup');
    expect(setupItems.length).toBeGreaterThanOrEqual(1);
    expect(setupItems[0].label).toContain('Drunk');
    expect(setupItems[0].label).toContain('Choose a Townsfolk');
    expect(setupItems[0].critical).toBe(true);
  });

  it('generates distribution modifier items', () => {
    const fixture = makeFixture(['baron']);
    const items = buildChecklistItems(
      fixture.participants,
      fixture.playerState,
      ['baron'],
      ['baron'],
    );
    const modItems = items.filter((item) => item.category === 'modifier');
    expect(modItems).toHaveLength(1);
    expect(modItems[0].label).toContain('Baron');
    expect(modItems[0].label).toContain('+2 Outsiders');
  });

  it('generates unique distribution modifier item IDs for multi-modifier characters', () => {
    const fixture = makeFixture(['lordoftyphon']);
    const items = buildChecklistItems(
      fixture.participants,
      fixture.playerState,
      ['lordoftyphon'],
      ['lordoftyphon'],
    );
    const modIds = items.filter((item) => item.category === 'modifier').map((item) => item.id);
    expect(modIds).toEqual(['modifier-lordoftyphon-minion', 'modifier-lordoftyphon-outsider']);
    expect(new Set(modIds).size).toBe(modIds.length);
  });

  it('generates global reminder items', () => {
    const fixture = makeFixture(['marionette']);
    const items = buildChecklistItems(
      fixture.participants,
      fixture.playerState,
      ['marionette'],
      ['marionette'],
    );
    const reminderItems = items.filter((item) => item.category === 'reminder');
    expect(reminderItems.length).toBeGreaterThanOrEqual(1);
    expect(reminderItems[0].label).toContain('Is The Marionette');
  });

  it('generates data-driven first-night reminder setup items', () => {
    const fixture = makeFixture(['noble']);
    const items = buildChecklistItems(
      fixture.participants,
      fixture.playerState,
      ['noble'],
      ['noble'],
    );
    const reminderItems = items.filter((item) => item.category === 'reminder');
    expect(reminderItems).toHaveLength(1);
    expect(reminderItems[0].label).toContain('Noble');
    expect(reminderItems[0].label).toContain('Place 3 Know reminders');
    expect(reminderItems[0].description).toContain('Know, Know, Know');
  });

  it('generates Marionette setup prompt items', () => {
    const fixture = makeFixture(['marionette']);
    const items = buildChecklistItems(
      fixture.participants,
      fixture.playerState,
      ['marionette'],
      ['marionette'],
    );
    const promptItems = items.filter((item) => item.category === 'prompt');
    expect(promptItems.length).toBeGreaterThanOrEqual(1);
    expect(promptItems.some((item) => item.label.includes('Marionette'))).toBe(true);
  });

  it('returns empty array when no setup characters are in play', () => {
    const fixture = makeFixture(['washerwoman']);
    const items = buildChecklistItems(
      fixture.participants,
      fixture.playerState,
      ['washerwoman'],
      ['washerwoman'],
    );
    expect(items).toHaveLength(0);
  });
});

describe('SetupChecklist', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders checklist with items', () => {
    renderChecklist(['drunk', 'imp']);
    expect(screen.getByTestId('setup-checklist')).toBeInTheDocument();
    expect(screen.getByText('Pre-Game Setup')).toBeInTheDocument();
  });

  it('shows setup decision items', () => {
    renderChecklist(['drunk', 'imp']);
    expect(screen.getByText(/Choose a Townsfolk/)).toBeInTheDocument();
  });

  it('items are checkable', () => {
    renderChecklist(['drunk', 'imp']);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    expect(checkboxes[0]).toBeChecked();
  });

  it('persists checked state to localStorage', () => {
    renderChecklist(['drunk', 'imp']);
    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    const stored = localStorage.getItem('storyteller-setup-checklist-test-game-1');
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored ?? '{}') as Record<string, boolean>;
    expect(Object.values(parsed).some((value) => value)).toBe(true);
  });

  it('Start Night 1 button is disabled when critical items are unchecked', () => {
    renderChecklist(['drunk', 'imp']);
    expect(screen.getByRole('button', { name: /Start Night 1/i })).toBeDisabled();
  });

  it('Start Night 1 button enables when all critical items are checked', () => {
    renderChecklist(['drunk', 'imp']);
    screen.getAllByRole('checkbox').forEach((checkbox) => fireEvent.click(checkbox));
    expect(screen.getByRole('button', { name: /Start Night 1/i })).not.toBeDisabled();
  });

  it('calls onStartNight when button is clicked', () => {
    const onStartNight = vi.fn();
    renderChecklist(['drunk', 'imp'], { onStartNight });
    screen.getAllByRole('checkbox').forEach((checkbox) => fireEvent.click(checkbox));
    fireEvent.click(screen.getByRole('button', { name: /Start Night 1/i }));
    expect(onStartNight).toHaveBeenCalledTimes(1);
  });

  it('places first-night reminder tokens through the canonical token callbacks', () => {
    const onAddToken = vi.fn();
    renderChecklist(['noble', 'imp'], {
      onAddToken,
      inPlayCharacterIds: ['noble'],
      scriptCharacterIds: ['noble', 'imp'],
    });
    fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
    fireEvent.click(screen.getByRole('option', { name: /Player 2 \(Imp\)/ }));
    expect(onAddToken).toHaveBeenCalledWith(
      'player-2',
      expect.objectContaining({ id: 'noble-know-1', label: 'Know', sourceCharacterId: 'noble' }),
    );
  });

  it('updates first-night reminder placement count from player token state', () => {
    const { rerender } = renderChecklist(
      ['noble', 'imp'],
      { inPlayCharacterIds: ['noble'], scriptCharacterIds: ['noble', 'imp'] },
      {
        1: {
          tokens: [
            { id: 'noble-know-1', type: 'custom', label: 'Know', sourceCharacterId: 'noble' },
          ],
        },
      },
    );
    expect(screen.getByText('1/3 placed')).toBeInTheDocument();
    const fixture = makeFixture(['noble', 'imp']);
    rerender(
      <SetupChecklist
        gameId="test-game-1"
        participants={fixture.participants}
        playerState={fixture.playerState}
        sessionPlayers={fixture.sessionPlayers}
        inPlayCharacterIds={['noble']}
        scriptCharacterIds={['noble', 'imp']}
        onStartNight={vi.fn()}
      />,
    );
    expect(screen.getByText('0/3 placed')).toBeInTheDocument();
  });

  it('shows ready-to-start state when no items are needed', () => {
    renderChecklist(['washerwoman']);
    expect(screen.getByText(/No setup steps required/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start Night 1/i })).not.toBeDisabled();
  });
});
