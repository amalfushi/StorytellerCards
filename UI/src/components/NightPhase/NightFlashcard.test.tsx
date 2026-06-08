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
    expect(checkboxes.length).toBeGreaterThanOrEqual(1);
  });

  // Phase 4: Type chip is now upper-left
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

  // Phase 5: Notes section with subtle background
  it('shows notes field with placeholder', () => {
    render(<NightFlashcard {...defaultProps} />);
    expect(screen.getByPlaceholderText('Notes…')).toBeInTheDocument();
  });

  it('shows notes section with subtle background', () => {
    render(<NightFlashcard {...defaultProps} />);
    const notesSection = screen.getByTestId('notes-section');
    expect(notesSection).toBeInTheDocument();
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

  // Phase 5: Pre-populate notes with previous night
  it('pre-populates notes from previousNotes when notes is empty', () => {
    const onNotesChange = vi.fn();
    render(
      <NightFlashcard
        {...defaultProps}
        notes=""
        onNotesChange={onNotesChange}
        previousNotes="From last night"
      />,
    );
    expect(onNotesChange).toHaveBeenCalledWith('From last night');
  });

  it('does not pre-populate when notes already has content', () => {
    const onNotesChange = vi.fn();
    render(
      <NightFlashcard
        {...defaultProps}
        notes="Existing note"
        onNotesChange={onNotesChange}
        previousNotes="From last night"
      />,
    );
    expect(onNotesChange).not.toHaveBeenCalled();
  });

  it('shows custom placeholder when previousNotes is present', () => {
    render(<NightFlashcard {...defaultProps} previousNotes="From last night" />);
    // After pre-population, the placeholder becomes special
    expect(screen.getByPlaceholderText('Notes (pre-filled from last night)…')).toBeInTheDocument();
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
    const matches = screen.getAllByText('Choose 2 players');
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('renders abilityShort with bold styling (not italic)', () => {
    render(<NightFlashcard {...defaultProps} />);
    const abilityEl = screen.getByText(
      'Each night, choose 2 players: you learn if either is a Demon.',
    );
    expect(abilityEl).toBeInTheDocument();
    const style = window.getComputedStyle(abilityEl);
    expect(style.fontStyle).not.toBe('italic');
  });

  // Phase 2: Reminder token placement status
  it('shows placed reminder status when token is placed on a player', () => {
    const charWithReminders: CharacterDef = {
      ...mockCharacterDef,
      reminders: [
        { id: 'ft-red-herring', text: 'Red Herring', sourceCharacterId: 'fortuneteller' },
      ],
    };
    const playerWithReminder: PlayerSeat = {
      ...mockPlayerSeat,
      seat: 1,
      playerName: 'Alice',
      characterId: 'noble',
      tokens: [
        {
          id: 'ft-red-herring',
          type: 'custom',
          label: 'Red Herring',
          sourceCharacterId: 'fortuneteller',
        },
      ],
    };
    const charLookup = (id: string) =>
      id === 'noble'
        ? {
            id: 'noble',
            name: 'Noble',
            type: CharacterType.Townsfolk as const,
            defaultAlignment: Alignment.Good,
            abilityShort: '',
            firstNight: null,
            otherNights: null,
            reminders: [],
          }
        : undefined;

    render(
      <NightFlashcard
        {...defaultProps}
        characterDef={charWithReminders}
        players={[playerWithReminder]}
        characterLookup={charLookup}
      />,
    );
    expect(screen.getByTestId('placed-reminder-info')).toBeInTheDocument();
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
  });

  it('calls onReminderTokenClick when a reminder token is clicked', () => {
    const onTokenClick = vi.fn();
    const charWithReminders: CharacterDef = {
      ...mockCharacterDef,
      reminders: [
        { id: 'ft-red-herring', text: 'Red Herring', sourceCharacterId: 'fortuneteller' },
      ],
    };
    render(
      <NightFlashcard
        {...defaultProps}
        characterDef={charWithReminders}
        onReminderTokenClick={onTokenClick}
      />,
    );
    const chip = screen.getByText('Red Herring');
    fireEvent.click(chip);
    expect(onTokenClick).toHaveBeenCalledWith(
      {
        id: 'ft-red-herring',
        type: 'custom',
        label: 'Red Herring',
        sourceCharacterId: 'fortuneteller',
      },
      expect.any(Object),
    );
  });

  it('passes reminder picker scope through token clicks', () => {
    const onTokenClick = vi.fn();
    const charWithScopedReminder: CharacterDef = {
      ...mockCharacterDef,
      reminders: [
        {
          id: 'stormcatcher-stormcaught',
          text: 'Stormcaught',
          sourceCharacterId: 'stormcatcher',
          pickerScope: 'goodCharacters',
        },
      ],
    };
    render(
      <NightFlashcard
        {...defaultProps}
        characterDef={charWithScopedReminder}
        onReminderTokenClick={onTokenClick}
      />,
    );
    fireEvent.click(screen.getByText('Stormcaught'));
    expect(onTokenClick).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'stormcatcher-stormcaught',
        pickerScope: 'goodCharacters',
      }),
      expect.any(Object),
    );
  });

  it('reads placed reminder status from player tokens', () => {
    const nobleDef: CharacterDef = {
      ...mockCharacterDef,
      id: 'noble',
      name: 'Noble',
      reminders: [
        { id: 'noble-know-1', text: 'Know', sourceCharacterId: 'noble' },
        { id: 'noble-know-2', text: 'Know', sourceCharacterId: 'noble' },
        { id: 'noble-know-3', text: 'Know', sourceCharacterId: 'noble' },
      ],
    };
    const aliceWithNobleToken: PlayerSeat = {
      ...mockPlayerSeat,
      seat: 1,
      playerName: 'Alice',
      characterId: 'washerwoman',
      tokens: [{ id: 'noble-know-1', type: 'custom', label: 'Know', sourceCharacterId: 'noble' }],
    };
    render(
      <NightFlashcard
        {...defaultProps}
        characterDef={nobleDef}
        players={[aliceWithNobleToken]}
        characterLookup={(id) => (id === 'washerwoman' ? mockCharacterDef : undefined)}
      />,
    );
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
  });

  it('does not show setup power reminders on unrelated player night cards', () => {
    const stormcatcherDef: CharacterDef = {
      ...mockCharacterDef,
      id: 'stormcatcher',
      name: 'Storm Catcher',
      type: CharacterType.Loric,
      reminders: [
        {
          id: 'stormcatcher-stormcaught',
          text: 'Stormcaught',
          sourceCharacterId: 'stormcatcher',
          pickerScope: 'goodCharacters',
        },
      ],
    };
    render(<NightFlashcard {...defaultProps} activeSetupPowers={[stormcatcherDef]} />);
    expect(screen.queryByText('Stormcaught')).not.toBeInTheDocument();
  });

  it('deduplicates setup power reminders already shown on their own card', () => {
    const stormcatcherDef: CharacterDef = {
      ...mockCharacterDef,
      id: 'stormcatcher',
      name: 'Storm Catcher',
      type: CharacterType.Loric,
      reminders: [
        {
          id: 'stormcatcher-stormcaught',
          text: 'Stormcaught',
          sourceCharacterId: 'stormcatcher',
          pickerScope: 'goodCharacters',
        },
      ],
    };
    render(
      <NightFlashcard
        {...defaultProps}
        characterDef={stormcatcherDef}
        activeSetupPowers={[stormcatcherDef]}
      />,
    );
    expect(screen.getAllByText('Stormcaught')).toHaveLength(1);
  });

  // Phase 4: Affecting tokens displayed next to icon
  it('shows affecting tokens (from other characters) next to the icon', () => {
    const playerWithTokens: PlayerSeat = {
      ...mockPlayerSeat,
      tokens: [{ id: 'drunk-1', type: 'drunk', label: 'Drunk', sourceCharacterId: 'poisoner' }],
    };
    render(<NightFlashcard {...defaultProps} playerSeat={playerWithTokens} />);
    expect(screen.getByTestId('affecting-tokens')).toBeInTheDocument();
  });

  it('does not show affecting tokens when token is from same character', () => {
    const playerWithSelfToken: PlayerSeat = {
      ...mockPlayerSeat,
      tokens: [
        { id: 'ft-own', type: 'custom', label: 'Own Token', sourceCharacterId: 'fortuneteller' },
      ],
    };
    render(<NightFlashcard {...defaultProps} playerSeat={playerWithSelfToken} />);
    expect(screen.queryByTestId('affecting-tokens')).not.toBeInTheDocument();
  });

  // Phase 3: Signal detection
  it('shows signal controls for thumbs up/down sub-actions', () => {
    const signalEntry: NightOrderEntry = {
      ...mockEntry,
      subActions: [
        { id: 'sig-1', description: 'Give a Thumbs Up or Thumbs Down', isConditional: false },
      ],
    };
    render(
      <NightFlashcard
        {...defaultProps}
        entry={signalEntry}
        checkedStates={[false]}
        onSelectionChange={vi.fn()}
      />,
    );
    expect(screen.getByTestId('signal-controls')).toBeInTheDocument();
    expect(screen.getByText(/👍/)).toBeInTheDocument();
    expect(screen.getByText(/👎/)).toBeInTheDocument();
  });

  it('preserves selected players when recording a thumbs up/down signal', () => {
    const signalEntry: NightOrderEntry = {
      ...mockEntry,
      subActions: [
        { id: 'sig-1', description: 'Choose 2 players.', isConditional: false },
        { id: 'sig-2', description: 'Give a Thumbs Up or Thumbs Down', isConditional: false },
      ],
    };
    const charWithChoices: CharacterDef = {
      ...mockCharacterDef,
      firstNight: {
        ...mockCharacterDef.firstNight!,
        choices: [{ type: 'player', maxSelections: 2, label: 'Choose 2 players' }],
      },
    };
    const onSelectionChange = vi.fn();
    render(
      <NightFlashcard
        {...defaultProps}
        entry={signalEntry}
        characterDef={charWithChoices}
        checkedStates={[false, false]}
        players={[
          { ...mockPlayerSeat, playerName: 'Alice' },
          { ...mockPlayerSeat, seat: 4, playerName: 'Bob' },
        ]}
        selectionValue={['Alice', 'Bob']}
        onSelectionChange={onSelectionChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /yes/i }));

    expect(onSelectionChange).toHaveBeenCalledWith(['Alice', 'Bob', 'signal:thumbsUp']);
  });

  it('shows finger signal dropdown for finger signal sub-actions', () => {
    const signalEntry: NightOrderEntry = {
      ...mockEntry,
      subActions: [{ id: 'sig-1', description: 'Give a finger signal', isConditional: false }],
    };
    render(
      <NightFlashcard
        {...defaultProps}
        entry={signalEntry}
        checkedStates={[false]}
        onSelectionChange={vi.fn()}
      />,
    );
    expect(screen.getByTestId('signal-controls')).toBeInTheDocument();
    expect(screen.getByLabelText('Finger signal')).toBeInTheDocument();
  });

  // ── M5: Jinx reminder tests ──

  it('shows jinx reminder banner when activeJinxes is provided', () => {
    render(
      <NightFlashcard
        {...defaultProps}
        activeJinxes={[
          {
            character1Id: 'fortuneteller',
            character1Name: 'Fortune Teller',
            character2Id: 'spy',
            character2Name: 'Spy',
            description: 'The Spy may register as a Demon to the Fortune Teller.',
          },
        ]}
      />,
    );
    expect(screen.getByTestId('jinx-reminder')).toBeInTheDocument();
    expect(screen.getByText('Jinx: Spy')).toBeInTheDocument();
    expect(screen.getByText(/Spy may register/)).toBeInTheDocument();
    expect(screen.getByText('⚡')).toBeInTheDocument();
  });

  it('does not show jinx reminder when no active jinxes', () => {
    render(<NightFlashcard {...defaultProps} activeJinxes={[]} />);
    expect(screen.queryByTestId('jinx-reminder')).not.toBeInTheDocument();
  });

  it('shows multiple jinx reminders for characters with several jinxes', () => {
    render(
      <NightFlashcard
        {...defaultProps}
        activeJinxes={[
          {
            character1Id: 'fortuneteller',
            character1Name: 'Fortune Teller',
            character2Id: 'spy',
            character2Name: 'Spy',
            description: 'The Spy may register as a Demon to the Fortune Teller.',
          },
          {
            character1Id: 'fortuneteller',
            character1Name: 'Fortune Teller',
            character2Id: 'witch',
            character2Name: 'Witch',
            description: 'Something about witches.',
          },
        ]}
      />,
    );
    expect(screen.getByText('Jinx: Spy')).toBeInTheDocument();
    expect(screen.getByText('Jinx: Witch')).toBeInTheDocument();
  });
});
