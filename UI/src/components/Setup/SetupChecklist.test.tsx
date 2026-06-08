import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SetupChecklist } from '@/components/Setup/SetupChecklist.tsx';
import { buildChecklistItems } from '@/components/Setup/buildChecklistItems.ts';
import type { PlayerSeat } from '@/types/index.ts';
import { Alignment } from '@/types/index.ts';

// ── Mock character registry ──
// Note: vi.mock is hoisted, so we cannot reference variables defined after it.
// Instead, define mock data inline within the factory.

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

// ── Test helpers ──

function makePlayer(seat: number, characterId: string): PlayerSeat {
  const isEvil =
    characterId === 'baron' ||
    characterId === 'lordoftyphon' ||
    characterId === 'marionette' ||
    characterId === 'imp';
  return {
    seat,
    playerName: `Player ${seat}`,
    characterId,
    alive: true,
    ghostVoteUsed: false,
    visibleAlignment: Alignment.Unknown,
    actualAlignment: isEvil ? Alignment.Evil : Alignment.Good,
    startingAlignment: isEvil ? Alignment.Evil : Alignment.Good,
    activeReminders: [],
    isTraveller: false,
    tokens: [],
  };
}

// ── Tests ──

describe('buildChecklistItems', () => {
  it('generates storytellerSetup items', () => {
    const players = [makePlayer(1, 'drunk')];
    const items = buildChecklistItems(players, ['drunk'], ['drunk']);
    const setupItems = items.filter((i) => i.category === 'setup');
    expect(setupItems.length).toBeGreaterThanOrEqual(1);
    expect(setupItems[0].label).toContain('Drunk');
    expect(setupItems[0].label).toContain('Choose a Townsfolk');
    expect(setupItems[0].critical).toBe(true);
  });

  it('generates distribution modifier items', () => {
    const players = [makePlayer(1, 'baron')];
    const items = buildChecklistItems(players, ['baron'], ['baron']);
    const modItems = items.filter((i) => i.category === 'modifier');
    expect(modItems.length).toBe(1);
    expect(modItems[0].label).toContain('Baron');
    expect(modItems[0].label).toContain('+2 Outsiders');
  });

  it('generates unique distribution modifier item IDs for multi-modifier characters', () => {
    const players = [makePlayer(1, 'lordoftyphon')];
    const items = buildChecklistItems(players, ['lordoftyphon'], ['lordoftyphon']);
    const modItems = items.filter((i) => i.category === 'modifier');
    const modIds = modItems.map((item) => item.id);

    expect(modItems).toHaveLength(2);
    expect(new Set(modIds).size).toBe(modIds.length);
    expect(modIds).toEqual(['modifier-lordoftyphon-minion', 'modifier-lordoftyphon-outsider']);
  });

  it('generates global reminder items', () => {
    const players = [makePlayer(1, 'marionette')];
    const items = buildChecklistItems(players, ['marionette'], ['marionette']);
    const reminderItems = items.filter((i) => i.category === 'reminder');
    expect(reminderItems.length).toBeGreaterThanOrEqual(1);
    expect(reminderItems[0].label).toContain('Is The Marionette');
  });

  it('generates data-driven first-night reminder setup items', () => {
    const players = [makePlayer(1, 'noble')];
    const items = buildChecklistItems(players, ['noble'], ['noble']);
    const reminderItems = items.filter((i) => i.category === 'reminder');
    expect(reminderItems).toHaveLength(1);
    expect(reminderItems[0].label).toContain('Noble');
    expect(reminderItems[0].label).toContain('Place 3 Know reminders');
    expect(reminderItems[0].description).toContain('Know, Know, Know');
  });

  it('generates Marionette setup prompt items', () => {
    const players = [makePlayer(1, 'marionette')];
    const items = buildChecklistItems(players, ['marionette'], ['marionette']);
    const promptItems = items.filter((i) => i.category === 'prompt');
    expect(promptItems.length).toBeGreaterThanOrEqual(1);
    expect(promptItems.some((p) => p.label.includes('Marionette'))).toBe(true);
    expect(promptItems.some((p) => p.label.includes('Swap') || p.label.includes('token'))).toBe(
      true,
    );
  });

  it('returns empty array when no setup characters', () => {
    const players = [makePlayer(1, 'washerwoman')];
    const items = buildChecklistItems(players, ['washerwoman'], ['washerwoman']);
    expect(items.length).toBe(0);
  });
});

describe('SetupChecklist', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const defaultProps = {
    gameId: 'test-game-1',
    players: [makePlayer(1, 'drunk'), makePlayer(2, 'imp')],
    inPlayCharacterIds: ['drunk', 'imp'],
    scriptCharacterIds: ['drunk', 'imp'],
    onStartNight: vi.fn(),
  };

  it('renders checklist with items', () => {
    render(<SetupChecklist {...defaultProps} />);
    expect(screen.getByTestId('setup-checklist')).toBeInTheDocument();
    expect(screen.getByText('Pre-Game Setup')).toBeInTheDocument();
  });

  it('shows setup decision items', () => {
    render(<SetupChecklist {...defaultProps} />);
    expect(screen.getByText(/Choose a Townsfolk/)).toBeInTheDocument();
  });

  it('items are checkable', () => {
    render(<SetupChecklist {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(checkboxes[0]);
    expect(checkboxes[0]).toBeChecked();
  });

  it('persists checked state to localStorage', () => {
    render(<SetupChecklist {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    const stored = localStorage.getItem('storyteller-setup-checklist-test-game-1');
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(Object.values(parsed).some((v) => v === true)).toBe(true);
  });

  it('Start Night 1 button is disabled when critical items unchecked', () => {
    render(<SetupChecklist {...defaultProps} />);
    const startButton = screen.getByRole('button', { name: /Start Night 1/i });
    expect(startButton).toBeDisabled();
  });

  it('Start Night 1 button enables when all critical items checked', () => {
    render(<SetupChecklist {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach((cb) => fireEvent.click(cb));
    const startButton = screen.getByRole('button', { name: /Start Night 1/i });
    expect(startButton).not.toBeDisabled();
  });

  it('calls onStartNight when button clicked', () => {
    const onStartNight = vi.fn();
    render(<SetupChecklist {...defaultProps} onStartNight={onStartNight} />);
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach((cb) => fireEvent.click(cb));
    fireEvent.click(screen.getByRole('button', { name: /Start Night 1/i }));
    expect(onStartNight).toHaveBeenCalledTimes(1);
  });

  it('calls onReseat when reseat button is clicked', () => {
    const onReseat = vi.fn();
    render(<SetupChecklist {...defaultProps} onReseat={onReseat} />);
    fireEvent.click(screen.getByRole('button', { name: /Reseat/i }));
    expect(onReseat).toHaveBeenCalledTimes(1);
  });

  it('places first-night reminder tokens through the canonical token callbacks', () => {
    const onAddToken = vi.fn();
    render(
      <SetupChecklist
        {...defaultProps}
        players={[makePlayer(1, 'noble'), makePlayer(2, 'imp')]}
        inPlayCharacterIds={['noble']}
        scriptCharacterIds={['noble', 'imp']}
        onAddToken={onAddToken}
      />,
    );
    fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
    fireEvent.click(screen.getByRole('option', { name: /Player 2 \(Imp\)/ }));
    expect(onAddToken).toHaveBeenCalledWith(
      2,
      expect.objectContaining({
        id: 'noble-know-1',
        label: 'Know',
        sourceCharacterId: 'noble',
      }),
    );
  });

  it('updates first-night reminder placement count from player token state', () => {
    const players = [
      {
        ...makePlayer(1, 'noble'),
        tokens: [
          {
            id: 'noble-know-1',
            type: 'custom' as const,
            label: 'Know',
            sourceCharacterId: 'noble',
          },
        ],
      },
      makePlayer(2, 'imp'),
    ];
    const { rerender } = render(
      <SetupChecklist
        {...defaultProps}
        players={players}
        inPlayCharacterIds={['noble']}
        scriptCharacterIds={['noble', 'imp']}
      />,
    );
    expect(screen.getByText('1/3 placed')).toBeInTheDocument();
    rerender(
      <SetupChecklist
        {...defaultProps}
        players={[makePlayer(1, 'noble'), makePlayer(2, 'imp')]}
        inPlayCharacterIds={['noble']}
        scriptCharacterIds={['noble', 'imp']}
      />,
    );
    expect(screen.getByText('0/3 placed')).toBeInTheDocument();
  });

  it('shows "ready to start" when no items needed', () => {
    render(
      <SetupChecklist
        {...defaultProps}
        players={[makePlayer(1, 'washerwoman')]}
        inPlayCharacterIds={['washerwoman']}
        scriptCharacterIds={['washerwoman']}
      />,
    );
    expect(screen.getByText(/No setup steps required/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start Night 1/i })).not.toBeDisabled();
  });
});
