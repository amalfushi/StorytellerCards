import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { NightChoiceSelector } from '@/components/NightPhase/NightChoiceSelector.tsx';
import type { CharacterDef } from '@/types/index.ts';
import { Alignment, CharacterType } from '@/types/index.ts';
import type { NightOrderPlayer } from '@/utils/nightOrderFilter.ts';

// ──────────────────────────────────────────────
// Mock data
// ──────────────────────────────────────────────

const mockPlayers = [
  {
    playerId: 'alice',
    playerName: 'Alice',
    seat: 1,
    characterId: 'noble',
    alive: true,
    actualAlignment: Alignment.Good,
  },
  {
    playerId: 'bob',
    playerName: 'Bob',
    seat: 2,
    characterId: 'imp',
    alive: true,
    actualAlignment: Alignment.Evil,
  },
  {
    playerId: 'charlie',
    playerName: 'Charlie',
    seat: 3,
    characterId: 'saint',
    alive: false,
    actualAlignment: Alignment.Good,
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
  {
    id: 'saint',
    name: 'Saint',
    type: CharacterType.Outsider,
    defaultAlignment: Alignment.Good,
    abilityShort: 'If you die by execution, your team loses.',
    firstNight: null,
    otherNights: null,
    reminders: [],
  },
  {
    id: 'stormcatcher',
    name: 'Stormcatcher',
    type: CharacterType.Loric,
    defaultAlignment: Alignment.Unknown,
    abilityShort: 'Setup power.',
    firstNight: null,
    otherNights: null,
    reminders: [],
  },
  {
    id: 'angel',
    name: 'Angel',
    type: CharacterType.Fabled,
    defaultAlignment: Alignment.Unknown,
    abilityShort: 'Setup power.',
    firstNight: null,
    otherNights: null,
    reminders: [],
  },
];

const mockCharacterLookup = (id: string): CharacterDef | undefined =>
  mockCharacters.find((c) => c.id === id);

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe('NightChoiceSelector', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <NightChoiceSelector type="player" value="" onChange={vi.fn()} players={mockPlayers} />,
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

  // Phase 1: Player dropdown shows character context
  it('shows player names with character context in dropdown', () => {
    render(
      <NightChoiceSelector
        type="player"
        value=""
        onChange={vi.fn()}
        players={mockPlayers}
        characterLookup={mockCharacterLookup}
        label="Choose"
      />,
    );
    const combobox = screen.getByRole('combobox');
    fireEvent.mouseDown(combobox);
    const listbox = screen.getByRole('listbox');
    expect(within(listbox).getByText('Alice (Noble)')).toBeInTheDocument();
    expect(within(listbox).getByText('Bob (Imp)')).toBeInTheDocument();
  });

  it('falls back to seat number when no character lookup provided', () => {
    render(
      <NightChoiceSelector
        type="player"
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
  });

  it('handles player with no character assigned', () => {
    const unassignedPlayer: NightOrderPlayer = {
      ...mockPlayers[0],
      characterId: '',
      seat: 4,
      playerName: 'Dana',
    };
    render(
      <NightChoiceSelector
        type="player"
        value=""
        onChange={vi.fn()}
        players={[...mockPlayers, unassignedPlayer]}
        characterLookup={mockCharacterLookup}
        label="Choose"
      />,
    );
    const combobox = screen.getByRole('combobox');
    fireEvent.mouseDown(combobox);
    const listbox = screen.getByRole('listbox');
    expect(within(listbox).getByText('Dana (Seat 4)')).toBeInTheDocument();
  });

  it('handles livingPlayer type — shows only alive players', () => {
    render(
      <NightChoiceSelector
        type="livingPlayer"
        value=""
        onChange={vi.fn()}
        players={mockPlayers}
        characterLookup={mockCharacterLookup}
        label="Choose"
      />,
    );
    const combobox = screen.getByRole('combobox');
    fireEvent.mouseDown(combobox);
    const listbox = screen.getByRole('listbox');
    expect(within(listbox).getByText('Alice (Noble)')).toBeInTheDocument();
    expect(within(listbox).getByText('Bob (Imp)')).toBeInTheDocument();
    expect(within(listbox).queryByText(/Charlie/)).not.toBeInTheDocument();
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
    expect(within(listbox).queryByText(/Alice/)).not.toBeInTheDocument();
    expect(within(listbox).getByText('Charlie (Seat 3)')).toBeInTheDocument();
  });

  // Phase 1: Character dropdown shows player context
  it('shows character names with player context in dropdown', () => {
    render(
      <NightChoiceSelector
        type="character"
        value=""
        onChange={vi.fn()}
        players={mockPlayers}
        characters={mockCharacters}
        characterLookup={mockCharacterLookup}
        label="Choose character"
      />,
    );
    const combobox = screen.getByRole('combobox');
    fireEvent.mouseDown(combobox);
    const listbox = screen.getByRole('listbox');
    expect(within(listbox).getByText('Noble (Alice)')).toBeInTheDocument();
    expect(within(listbox).getByText('Imp (Bob)')).toBeInTheDocument();
  });

  it('filters setup powers out of character choices', () => {
    render(
      <NightChoiceSelector
        type="character"
        value=""
        onChange={vi.fn()}
        players={mockPlayers}
        characters={mockCharacters}
        label="Choose"
      />,
    );
    const combobox = screen.getByRole('combobox');
    fireEvent.mouseDown(combobox);
    const listbox = screen.getByRole('listbox');
    expect(within(listbox).queryByText(/Stormcatcher/)).not.toBeInTheDocument();
    expect(within(listbox).queryByText(/Angel/)).not.toBeInTheDocument();
  });

  it('falls back to type when character has no player', () => {
    const unownedChar: CharacterDef = {
      id: 'scarletwoman',
      name: 'Scarlet Woman',
      type: CharacterType.Minion,
      defaultAlignment: Alignment.Evil,
      abilityShort: 'Test',
      firstNight: null,
      otherNights: null,
      reminders: [],
    };
    render(
      <NightChoiceSelector
        type="character"
        value=""
        onChange={vi.fn()}
        players={mockPlayers}
        characters={[...mockCharacters, unownedChar]}
        characterLookup={mockCharacterLookup}
        label="Choose"
      />,
    );
    const combobox = screen.getByRole('combobox');
    fireEvent.mouseDown(combobox);
    const listbox = screen.getByRole('listbox');
    expect(within(listbox).getByText('Scarlet Woman (Minion)')).toBeInTheDocument();
  });

  it('can show unassigned character options without type context', () => {
    render(
      <NightChoiceSelector
        type="character"
        value=""
        onChange={vi.fn()}
        players={mockPlayers}
        characters={mockCharacters.filter((character) => ['noble', 'saint'].includes(character.id))}
        label="Choose character"
        showUnassignedCharacterType={false}
      />,
    );
    const combobox = screen.getByRole('combobox');
    fireEvent.mouseDown(combobox);
    const listbox = screen.getByRole('listbox');
    expect(within(listbox).getByText('Noble (Alice)')).toBeInTheDocument();
    expect(within(listbox).getByText('Saint (Charlie)')).toBeInTheDocument();
    expect(within(listbox).queryByText('Saint (Outsider)')).not.toBeInTheDocument();
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
        players={mockPlayers}
        characters={mockCharacters}
        label="Choose"
      />,
    );
    const combobox = screen.getByRole('combobox');
    fireEvent.mouseDown(combobox);
    const listbox = screen.getByRole('listbox');
    // Bob plays Imp, so it shows "Imp (Bob)" with player context
    fireEvent.click(within(listbox).getByText('Imp (Bob)'));
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
    render(<NightChoiceSelector type="player" value="" onChange={vi.fn()} players={mockPlayers} />);
    expect(screen.getByLabelText('Choose')).toBeInTheDocument();
  });

  it('renders character icon avatars in player dropdown when characterLookup is provided', () => {
    render(
      <NightChoiceSelector
        type="player"
        value=""
        onChange={vi.fn()}
        players={mockPlayers}
        characterLookup={mockCharacterLookup}
        label="Choose"
      />,
    );
    const combobox = screen.getByRole('combobox');
    fireEvent.mouseDown(combobox);
    // Should have avatar images for characters
    const avatars = screen.getAllByRole('img');
    expect(avatars.length).toBeGreaterThanOrEqual(1);
  });
});
