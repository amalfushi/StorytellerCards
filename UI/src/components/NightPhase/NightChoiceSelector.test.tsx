import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { NightChoiceSelector } from '@/components/NightPhase/NightChoiceSelector.tsx';
import type { PlayerSeat, CharacterDef } from '@/types/index.ts';
import { Alignment, CharacterType } from '@/types/index.ts';

// ──────────────────────────────────────────────
// Mock data
// ──────────────────────────────────────────────

const mockPlayers: PlayerSeat[] = [
  {
    seat: 1,
    playerName: 'Alice',
    characterId: 'noble',
    alive: true,
    ghostVoteUsed: false,
    visibleAlignment: Alignment.Unknown,
    actualAlignment: Alignment.Good,
    startingAlignment: Alignment.Good,
    activeReminders: [],
    isTraveller: false,
    tokens: [],
  },
  {
    seat: 2,
    playerName: 'Bob',
    characterId: 'imp',
    alive: true,
    ghostVoteUsed: false,
    visibleAlignment: Alignment.Unknown,
    actualAlignment: Alignment.Evil,
    startingAlignment: Alignment.Evil,
    activeReminders: [],
    isTraveller: false,
    tokens: [],
  },
  {
    seat: 3,
    playerName: 'Charlie',
    characterId: 'fortuneteller',
    alive: false,
    ghostVoteUsed: false,
    visibleAlignment: Alignment.Unknown,
    actualAlignment: Alignment.Good,
    startingAlignment: Alignment.Good,
    activeReminders: [],
    isTraveller: false,
    tokens: [],
  },
];

const mockCharacters: CharacterDef[] = [
  {
    id: 'noble',
    name: 'Noble',
    type: CharacterType.Townsfolk,
    defaultAlignment: Alignment.Good,
    abilityShort: 'You learn 3 players.',
    firstNight: null,
    otherNights: null,
    reminders: [],
  },
  {
    id: 'imp',
    name: 'Imp',
    type: CharacterType.Demon,
    defaultAlignment: Alignment.Evil,
    abilityShort: 'Each night, choose a player: they die.',
    firstNight: null,
    otherNights: null,
    reminders: [],
  },
];

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe('NightChoiceSelector', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <NightChoiceSelector
        type="player"
        value=""
        onChange={vi.fn()}
        players={mockPlayers}
      />,
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders player dropdown for "player" type', () => {
    render(
      <NightChoiceSelector
        type="player"
        value=""
        onChange={vi.fn()}
        players={mockPlayers}
        label="Choose a player"
      />,
    );
    expect(screen.getByLabelText('Choose a player')).toBeInTheDocument();
  });

  it('shows correct label for player choice', () => {
    render(
      <NightChoiceSelector
        type="player"
        value=""
        onChange={vi.fn()}
        players={mockPlayers}
        label="Select target"
      />,
    );
    expect(screen.getByLabelText('Select target')).toBeInTheDocument();
  });

  it('handles player choice type — shows all player names in dropdown', () => {
    render(
      <NightChoiceSelector
        type="player"
        value=""
        onChange={vi.fn()}
        players={mockPlayers}
        label="Choose"
      />,
    );
    // Open the dropdown by clicking the select
    const combobox = screen.getByRole('combobox');
    fireEvent.mouseDown(combobox);
    // The listbox should now appear with player options
    const listbox = screen.getByRole('listbox');
    expect(within(listbox).getByText('Alice (Seat 1)')).toBeInTheDocument();
    expect(within(listbox).getByText('Bob (Seat 2)')).toBeInTheDocument();
    expect(within(listbox).getByText('Charlie (Seat 3)')).toBeInTheDocument();
  });

  it('handles livingPlayer type — shows only alive players', () => {
    render(
      <NightChoiceSelector
        type="livingPlayer"
        value=""
        onChange={vi.fn()}
        players={mockPlayers}
        label="Choose"
      />,
    );
    const combobox = screen.getByRole('combobox');
    fireEvent.mouseDown(combobox);
    const listbox = screen.getByRole('listbox');
    expect(within(listbox).getByText('Alice (Seat 1)')).toBeInTheDocument();
    expect(within(listbox).getByText('Bob (Seat 2)')).toBeInTheDocument();
    expect(within(listbox).queryByText('Charlie (Seat 3)')).not.toBeInTheDocument();
  });

  it('handles deadPlayer type — shows only dead players', () => {
    render(
      <NightChoiceSelector
        type="deadPlayer"
        value=""
        onChange={vi.fn()}
        players={mockPlayers}
        label="Choose"
      />,
    );
    const combobox = screen.getByRole('combobox');
    fireEvent.mouseDown(combobox);
    const listbox = screen.getByRole('listbox');
    expect(within(listbox).queryByText('Alice (Seat 1)')).not.toBeInTheDocument();
    expect(within(listbox).getByText('Charlie (Seat 3)')).toBeInTheDocument();
  });

  it('handles character choice type — shows character names', () => {
    render(
      <NightChoiceSelector
        type="character"
        value=""
        onChange={vi.fn()}
        players={[]}
        characters={mockCharacters}
        label="Choose character"
      />,
    );
    const combobox = screen.getByRole('combobox');
    fireEvent.mouseDown(combobox);
    const listbox = screen.getByRole('listbox');
    expect(within(listbox).getByText('Noble (Townsfolk)')).toBeInTheDocument();
    expect(within(listbox).getByText('Imp (Demon)')).toBeInTheDocument();
  });

  it('handles yesno choice type — shows toggle buttons', () => {
    render(
      <NightChoiceSelector
        type="yesno"
        value=""
        onChange={vi.fn()}
        players={[]}
        label="Did they nod?"
      />,
    );
    expect(screen.getByText('Did they nod?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Nod/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Shake/i })).toBeInTheDocument();
  });

  it('handles alignment choice type — shows Good/Evil toggle', () => {
    render(
      <NightChoiceSelector
        type="alignment"
        value=""
        onChange={vi.fn()}
        players={[]}
        label="Alignment"
      />,
    );
    expect(screen.getByText('Alignment')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Good' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Evil' })).toBeInTheDocument();
  });

  it('calls onChange when a player selection is made', () => {
    const onChange = vi.fn();
    render(
      <NightChoiceSelector
        type="player"
        value=""
        onChange={onChange}
        players={mockPlayers}
        label="Choose"
      />,
    );
    const combobox = screen.getByRole('combobox');
    fireEvent.mouseDown(combobox);
    const listbox = screen.getByRole('listbox');
    fireEvent.click(within(listbox).getByText('Alice (Seat 1)'));
    expect(onChange).toHaveBeenCalledWith('Alice');
  });

  it('calls onChange when a character selection is made', () => {
    const onChange = vi.fn();
    render(
      <NightChoiceSelector
        type="character"
        value=""
        onChange={onChange}
        players={[]}
        characters={mockCharacters}
        label="Choose"
      />,
    );
    const combobox = screen.getByRole('combobox');
    fireEvent.mouseDown(combobox);
    const listbox = screen.getByRole('listbox');
    fireEvent.click(within(listbox).getByText('Imp (Demon)'));
    expect(onChange).toHaveBeenCalledWith('Imp');
  });

  it('shows previous selection when provided', () => {
    render(
      <NightChoiceSelector
        type="player"
        value=""
        onChange={vi.fn()}
        players={mockPlayers}
        previousValue="Alice"
        label="Choose"
      />,
    );
    expect(screen.getByText('Last night: Alice')).toBeInTheDocument();
  });

  it('shows previous selection array joined', () => {
    render(
      <NightChoiceSelector
        type="player"
        value={[]}
        onChange={vi.fn()}
        players={mockPlayers}
        previousValue={['Alice', 'Bob']}
        multiple
        label="Choose"
      />,
    );
    expect(screen.getByText('Last night: Alice, Bob')).toBeInTheDocument();
  });

  it('does not show previous selection chip when no previousValue', () => {
    render(
      <NightChoiceSelector
        type="player"
        value=""
        onChange={vi.fn()}
        players={mockPlayers}
        label="Choose"
      />,
    );
    expect(screen.queryByText(/Last night/)).not.toBeInTheDocument();
  });

  it('uses default label "Choose" when no label is provided', () => {
    render(
      <NightChoiceSelector
        type="player"
        value=""
        onChange={vi.fn()}
        players={mockPlayers}
      />,
    );
    expect(screen.getByLabelText('Choose')).toBeInTheDocument();
  });
});
