import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NightFlashcard } from '@/components/NightPhase/NightFlashcard.tsx';
import type { NightOrderEntry, PlayerSeat, CharacterDef } from '@/types/index.ts';
import { Alignment, CharacterType } from '@/types/index.ts';

// ──────────────────────────────────────────────
// Mock data
// ──────────────────────────────────────────────

const mockSubActions = [
  { id: 'ft-1', description: 'Wake the Fortune Teller', isConditional: false },
  { id: 'ft-2', description: 'they point to two players', isConditional: true },
  { id: 'ft-3', description: 'Give thumbs up or down', isConditional: false },
];

const mockEntry: NightOrderEntry = {
  order: 5,
  type: 'character',
  id: 'fortuneteller',
  name: 'Fortune Teller',
  helpText: 'The Fortune Teller chooses 2 players and learns if one is the Demon.',
  subActions: mockSubActions,
};

const mockCharacterDef: CharacterDef = {
  id: 'fortuneteller',
  name: 'Fortune Teller',
  type: CharacterType.Townsfolk,
  defaultAlignment: Alignment.Good,
  abilityShort: 'Each night, choose 2 players: you learn if either is a Demon.',
  firstNight: {
    order: 5,
    helpText: 'The Fortune Teller chooses 2 players and learns if one is the Demon.',
    subActions: mockSubActions,
  },
  otherNights: {
    order: 5,
    helpText: 'The Fortune Teller chooses 2 players and learns if one is the Demon.',
    subActions: mockSubActions,
  },
  reminders: [],
};

const mockPlayerSeat: PlayerSeat = {
  seat: 3,
  playerName: 'Charlie',
  characterId: 'fortuneteller',
  alive: true,
  ghostVoteUsed: false,
  visibleAlignment: Alignment.Unknown,
  actualAlignment: Alignment.Good,
  startingAlignment: Alignment.Good,
  activeReminders: [],
  isTraveller: false,
  tokens: [],
};

const deadPlayerSeat: PlayerSeat = {
  ...mockPlayerSeat,
  alive: false,
};

const defaultProps = {
  entry: mockEntry,
  playerSeat: mockPlayerSeat,
  characterDef: mockCharacterDef,
  checkedStates: [false, false, false],
  notes: '',
  onToggleSubAction: vi.fn(),
  onNotesChange: vi.fn(),
  isDead: false,
};

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe('NightFlashcard', () => {
  it('renders without crashing with valid props', () => {
    const { container } = render(<NightFlashcard {...defaultProps} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('displays character name', () => {
    render(<NightFlashcard {...defaultProps} />);
    expect(screen.getByText('Fortune Teller')).toBeInTheDocument();
  });

  it('displays player name and seat number', () => {
    render(<NightFlashcard {...defaultProps} />);
    expect(screen.getByText('Charlie (Seat 3)')).toBeInTheDocument();
  });

  it('shows ability short text', () => {
    render(<NightFlashcard {...defaultProps} />);
    expect(
      screen.getByText('Each night, choose 2 players: you learn if either is a Demon.'),
    ).toBeInTheDocument();
  });

  it('shows sub-action checklist', () => {
    render(<NightFlashcard {...defaultProps} />);
    expect(screen.getByText('Wake the Fortune Teller')).toBeInTheDocument();
    expect(screen.getByText('they point to two players')).toBeInTheDocument();
    expect(screen.getByText('Give thumbs up or down')).toBeInTheDocument();
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThanOrEqual(3);
  });

  it('shows type chip with character type name', () => {
    render(<NightFlashcard {...defaultProps} />);
    expect(screen.getByText('Townsfolk')).toBeInTheDocument();
  });

  it('shows "Unassigned" when no playerSeat is provided', () => {
    render(<NightFlashcard {...defaultProps} playerSeat={undefined} />);
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
  });

  it('shows ghost badge when player is dead', () => {
    render(<NightFlashcard {...defaultProps} isDead playerSeat={deadPlayerSeat} />);
    expect(screen.getByText('👻')).toBeInTheDocument();
  });

  it('does not show ghost badge when player is alive', () => {
    render(<NightFlashcard {...defaultProps} />);
    expect(screen.queryByText('👻')).not.toBeInTheDocument();
  });

  it('shows notes field with placeholder', () => {
    render(<NightFlashcard {...defaultProps} />);
    expect(screen.getByPlaceholderText('Notes…')).toBeInTheDocument();
  });

  it('shows existing notes text', () => {
    render(<NightFlashcard {...defaultProps} notes="Chose Alice and Bob — No." />);
    expect(screen.getByDisplayValue('Chose Alice and Bob — No.')).toBeInTheDocument();
  });

  it('calls onNotesChange when notes are edited', () => {
    const onNotesChange = vi.fn();
    render(<NightFlashcard {...defaultProps} onNotesChange={onNotesChange} />);
    const notesInput = screen.getByPlaceholderText('Notes…');
    fireEvent.change(notesInput, { target: { value: 'New note' } });
    expect(onNotesChange).toHaveBeenCalledWith('New note');
  });

  it('calls onToggleSubAction when a sub-action checkbox is toggled', () => {
    const onToggle = vi.fn();
    render(<NightFlashcard {...defaultProps} onToggleSubAction={onToggle} />);
    fireEvent.click(screen.getByText('Wake the Fortune Teller'));
    expect(onToggle).toHaveBeenCalledWith(0);
  });

  it('shows notes emoji icon', () => {
    render(<NightFlashcard {...defaultProps} />);
    expect(screen.getByText('📝')).toBeInTheDocument();
  });

  it('shows character icon image', () => {
    render(<NightFlashcard {...defaultProps} />);
    // The icon is now rendered as an <img> with alt text
    const img = screen.getByAltText('Fortune Teller');
    expect(img).toBeInTheDocument();
    expect(img.tagName).toBe('IMG');
  });

  it('shows "Unknown" type chip when no characterDef is provided', () => {
    render(<NightFlashcard {...defaultProps} characterDef={undefined} />);
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  it('disables notes field when readOnly is true', () => {
    render(<NightFlashcard {...defaultProps} readOnly />);
    const notesInput = screen.getByPlaceholderText('Notes…');
    expect(notesInput).toBeDisabled();
  });

  it('renders night choice selector when onSelectionChange is provided and character has choices', () => {
    const charWithChoices: CharacterDef = {
      ...mockCharacterDef,
      firstNight: {
        ...mockCharacterDef.firstNight!,
        choices: [{ type: 'player', maxSelections: 2, label: 'Choose 2 players' }],
      },
    };
    render(
      <NightFlashcard
        {...defaultProps}
        characterDef={charWithChoices}
        onSelectionChange={vi.fn()}
        players={[mockPlayerSeat]}
      />,
    );
    // The choice selector label renders in both <label> and notch <span>
    const matches = screen.getAllByText('Choose 2 players');
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });
});
