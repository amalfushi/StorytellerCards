import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StructuralCard } from '@/components/NightPhase/StructuralCard.tsx';
import type { NightOrderEntry, CharacterDef } from '@/types/index.ts';
import { CharacterType, Alignment } from '@/types/index.ts';

// ──────────────────────────────────────────────
// Mock structural entries
// ──────────────────────────────────────────────

const duskEntry: NightOrderEntry = {
  order: 0,
  type: 'structural',
  id: 'dusk',
  name: 'Dusk',
  helpText: 'Begin the night phase.',
  subActions: [{ id: 'dusk-1', description: 'Close your eyes', isConditional: false }],
};

const minionInfoEntry: NightOrderEntry = {
  order: 1,
  type: 'structural',
  id: 'minioninfo',
  name: 'Minion Info',
  helpText: 'Show the Minions who the Demon is.',
  subActions: [
    { id: 'mi-1', description: 'Wake all Minions', isConditional: false },
    { id: 'mi-2', description: 'Show them the Demon', isConditional: false },
    { id: 'mi-3', description: 'Put Minions to sleep', isConditional: false },
  ],
};

const demonInfoEntry: NightOrderEntry = {
  order: 2,
  type: 'structural',
  id: 'demoninfo',
  name: 'Demon Info',
  helpText: 'Show the Demon who the Minions are.',
  subActions: [
    { id: 'di-1', description: 'Wake the Demon', isConditional: false },
    { id: 'di-2', description: 'Show them the Minions', isConditional: false },
    { id: 'di-3', description: 'Show three not-in-play characters', isConditional: false },
  ],
};

const dawnEntry: NightOrderEntry = {
  order: 99,
  type: 'structural',
  id: 'dawn',
  name: 'Dawn',
  helpText: 'The night is over.',
  subActions: [{ id: 'dawn-1', description: 'Open your eyes', isConditional: false }],
};

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe('StructuralCard', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <StructuralCard entry={duskEntry} checkedStates={[false]} onToggleSubAction={vi.fn()} />,
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('displays the structural entry name (Dusk)', () => {
    render(
      <StructuralCard entry={duskEntry} checkedStates={[false]} onToggleSubAction={vi.fn()} />,
    );
    expect(screen.getByText('Dusk')).toBeInTheDocument();
  });

  it('displays the structural entry name (Minion Info)', () => {
    render(
      <StructuralCard
        entry={minionInfoEntry}
        checkedStates={[false, false, false]}
        onToggleSubAction={vi.fn()}
      />,
    );
    expect(screen.getByText('Minion Info')).toBeInTheDocument();
  });

  it('displays the structural entry name (Demon Info)', () => {
    render(
      <StructuralCard
        entry={demonInfoEntry}
        checkedStates={[false, false, false]}
        onToggleSubAction={vi.fn()}
      />,
    );
    expect(screen.getByText('Demon Info')).toBeInTheDocument();
  });

  it('shows help text content for dusk', () => {
    render(
      <StructuralCard entry={duskEntry} checkedStates={[false]} onToggleSubAction={vi.fn()} />,
    );
    // Dusk uses structuralHelpHint override
    expect(
      screen.getByText('Begin the night. Ask all players to close their eyes.'),
    ).toBeInTheDocument();
  });

  it('shows help text content for dawn', () => {
    render(
      <StructuralCard entry={dawnEntry} checkedStates={[false]} onToggleSubAction={vi.fn()} />,
    );
    expect(
      screen.getByText('The night is over. Ask all players to open their eyes.'),
    ).toBeInTheDocument();
  });

  it('shows help hint for minioninfo', () => {
    render(
      <StructuralCard
        entry={minionInfoEntry}
        checkedStates={[false, false, false]}
        onToggleSubAction={vi.fn()}
      />,
    );
    expect(
      screen.getByText('Show the Minions who the Demon is and who the other Minions are.'),
    ).toBeInTheDocument();
  });

  it('shows sub-action checklist when entry has more than 1 sub-action', () => {
    render(
      <StructuralCard
        entry={minionInfoEntry}
        checkedStates={[false, false, false]}
        onToggleSubAction={vi.fn()}
      />,
    );
    // Minion info has 3 sub-actions, but only first is actionable (gets checkbox)
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(1);
    expect(screen.getByText('Wake all Minions')).toBeInTheDocument();
    expect(screen.getByText('Show them the Demon')).toBeInTheDocument();
    expect(screen.getByText('Put Minions to sleep')).toBeInTheDocument();
  });

  it('does not show sub-action checklist when entry has only 1 sub-action', () => {
    render(
      <StructuralCard entry={duskEntry} checkedStates={[false]} onToggleSubAction={vi.fn()} />,
    );
    // Dusk has only 1 sub-action → checklist should NOT be rendered
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  });

  it('shows structural icon for dusk (moon)', () => {
    render(
      <StructuralCard entry={duskEntry} checkedStates={[false]} onToggleSubAction={vi.fn()} />,
    );
    expect(screen.getByText('🌙')).toBeInTheDocument();
  });

  it('shows structural icon for dawn (sunrise)', () => {
    render(
      <StructuralCard entry={dawnEntry} checkedStates={[false]} onToggleSubAction={vi.fn()} />,
    );
    expect(screen.getByText('🌅')).toBeInTheDocument();
  });

  it('shows structural icon for minion info', () => {
    render(
      <StructuralCard
        entry={minionInfoEntry}
        checkedStates={[false, false, false]}
        onToggleSubAction={vi.fn()}
      />,
    );
    expect(screen.getByText('😈')).toBeInTheDocument();
  });

  it('shows structural icon for demon info', () => {
    render(
      <StructuralCard
        entry={demonInfoEntry}
        checkedStates={[false, false, false]}
        onToggleSubAction={vi.fn()}
      />,
    );
    expect(screen.getByText('👹')).toBeInTheDocument();
  });

  it('falls back to gear icon for unknown structural type', () => {
    const unknownEntry: NightOrderEntry = {
      order: 50,
      type: 'structural',
      id: 'unknownphase',
      name: 'Unknown Phase',
      helpText: 'Some unknown structural step.',
      subActions: [],
    };
    render(<StructuralCard entry={unknownEntry} checkedStates={[]} onToggleSubAction={vi.fn()} />);
    expect(screen.getByText('⚙️')).toBeInTheDocument();
  });

  it('falls back to entry helpText when no hint override exists', () => {
    const unknownEntry: NightOrderEntry = {
      order: 50,
      type: 'structural',
      id: 'unknownphase',
      name: 'Unknown Phase',
      helpText: 'Some unknown structural step.',
      subActions: [],
    };
    render(<StructuralCard entry={unknownEntry} checkedStates={[]} onToggleSubAction={vi.fn()} />);
    expect(screen.getByText('Some unknown structural step.')).toBeInTheDocument();
  });

  // ── Demon Bluffs display on demoninfo ──

  describe('Demon Bluffs on demoninfo', () => {
    const bluffCharacters: CharacterDef[] = [
      {
        id: 'chef',
        name: 'Chef',
        type: CharacterType.Townsfolk,
        defaultAlignment: Alignment.Good,
        abilityShort: 'You know how many evil pairs there are.',
        firstNight: null,
        otherNights: null,
        reminders: [],
      },
      {
        id: 'empath',
        name: 'Empath',
        type: CharacterType.Townsfolk,
        defaultAlignment: Alignment.Good,
        abilityShort: 'You learn how many neighbours are evil.',
        firstNight: null,
        otherNights: null,
        reminders: [],
      },
      {
        id: 'butler',
        name: 'Butler',
        type: CharacterType.Outsider,
        defaultAlignment: Alignment.Good,
        abilityShort: 'Choose a player for your vote master.',
        firstNight: null,
        otherNights: null,
        reminders: [],
      },
    ];

    it('shows bluff display section on demoninfo when bluffCharacters are provided', () => {
      render(
        <StructuralCard
          entry={demonInfoEntry}
          checkedStates={[false, false, false]}
          onToggleSubAction={vi.fn()}
          bluffCharacters={bluffCharacters}
        />,
      );
      expect(screen.getByTestId('demoninfo-bluffs')).toBeInTheDocument();
      expect(screen.getByText('Show these bluffs to the Demon')).toBeInTheDocument();
    });

    it('displays all 3 bluff character names', () => {
      render(
        <StructuralCard
          entry={demonInfoEntry}
          checkedStates={[false, false, false]}
          onToggleSubAction={vi.fn()}
          bluffCharacters={bluffCharacters}
        />,
      );
      expect(screen.getByText('Chef')).toBeInTheDocument();
      expect(screen.getByText('Empath')).toBeInTheDocument();
      expect(screen.getByText('Butler')).toBeInTheDocument();
    });

    it('renders bluff character test IDs', () => {
      render(
        <StructuralCard
          entry={demonInfoEntry}
          checkedStates={[false, false, false]}
          onToggleSubAction={vi.fn()}
          bluffCharacters={bluffCharacters}
        />,
      );
      expect(screen.getByTestId('bluff-display-chef')).toBeInTheDocument();
      expect(screen.getByTestId('bluff-display-empath')).toBeInTheDocument();
      expect(screen.getByTestId('bluff-display-butler')).toBeInTheDocument();
    });

    it('does not show bluff section on demoninfo when no bluffCharacters', () => {
      render(
        <StructuralCard
          entry={demonInfoEntry}
          checkedStates={[false, false, false]}
          onToggleSubAction={vi.fn()}
        />,
      );
      expect(screen.queryByTestId('demoninfo-bluffs')).not.toBeInTheDocument();
    });

    it('does not show bluff section on non-demoninfo entries even with bluffCharacters', () => {
      render(
        <StructuralCard
          entry={minionInfoEntry}
          checkedStates={[false, false, false]}
          onToggleSubAction={vi.fn()}
          bluffCharacters={bluffCharacters}
        />,
      );
      expect(screen.queryByTestId('demoninfo-bluffs')).not.toBeInTheDocument();
    });

    it('does not show bluff section when bluffCharacters is empty array', () => {
      render(
        <StructuralCard
          entry={demonInfoEntry}
          checkedStates={[false, false, false]}
          onToggleSubAction={vi.fn()}
          bluffCharacters={[]}
        />,
      );
      expect(screen.queryByTestId('demoninfo-bluffs')).not.toBeInTheDocument();
    });

    it('shows fullscreen button when bluffs are displayed', () => {
      render(
        <StructuralCard
          entry={demonInfoEntry}
          checkedStates={[false, false, false]}
          onToggleSubAction={vi.fn()}
          bluffCharacters={bluffCharacters}
        />,
      );
      expect(screen.getByTestId('demoninfo-bluffs-fullscreen-btn')).toBeInTheDocument();
    });

    it('opens fullscreen overlay when fullscreen button is clicked', () => {
      render(
        <StructuralCard
          entry={demonInfoEntry}
          checkedStates={[false, false, false]}
          onToggleSubAction={vi.fn()}
          bluffCharacters={bluffCharacters}
        />,
      );
      fireEvent.click(screen.getByTestId('demoninfo-bluffs-fullscreen-btn'));
      expect(screen.getByText('These characters are not in play.')).toBeInTheDocument();
      expect(
        screen.getByText(
          'You may pretend to be these characters. Try to share this information with your minions.',
        ),
      ).toBeInTheDocument();
    });
  });
});
