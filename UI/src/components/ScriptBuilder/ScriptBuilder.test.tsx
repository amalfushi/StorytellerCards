import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CharacterType, Alignment } from '@/types/index.ts';
import type { CharacterDef } from '@/types/index.ts';

// ──────────────────────────────────────────────
// Mock useCharacterLookup with a small character set
// (8 characters instead of 100+) to keep tests fast
// under v8 coverage instrumentation.
// ──────────────────────────────────────────────

const mockCharacters: CharacterDef[] = [
  {
    id: 'washerwoman',
    name: 'Washerwoman',
    type: CharacterType.Townsfolk,
    defaultAlignment: Alignment.Good,
    abilityShort: 'You start knowing...',
    firstNight: { order: 37, helpText: 'test', subActions: [] },
    otherNights: null,
    icon: { placeholder: '#1976d2' },
    reminders: [],
  },
  {
    id: 'empath',
    name: 'Empath',
    type: CharacterType.Townsfolk,
    defaultAlignment: Alignment.Good,
    abilityShort: 'Each night...',
    firstNight: { order: 38, helpText: 'test', subActions: [] },
    otherNights: null,
    icon: { placeholder: '#1976d2' },
    reminders: [],
  },
  {
    id: 'drunk',
    name: 'Drunk',
    type: CharacterType.Outsider,
    defaultAlignment: Alignment.Good,
    abilityShort: 'You think you are...',
    firstNight: null,
    otherNights: null,
    icon: { placeholder: '#42a5f5' },
    reminders: [],
  },
  {
    id: 'butler',
    name: 'Butler',
    type: CharacterType.Outsider,
    defaultAlignment: Alignment.Good,
    abilityShort: 'Each night choose a player...',
    firstNight: { order: 40, helpText: 'test', subActions: [] },
    otherNights: null,
    icon: { placeholder: '#42a5f5' },
    reminders: [],
  },
  {
    id: 'poisoner',
    name: 'Poisoner',
    type: CharacterType.Minion,
    defaultAlignment: Alignment.Evil,
    abilityShort: 'Each night choose a player...',
    firstNight: { order: 17, helpText: 'test', subActions: [] },
    otherNights: null,
    icon: { placeholder: '#d32f2f' },
    reminders: [],
  },
  {
    id: 'baron',
    name: 'Baron',
    type: CharacterType.Minion,
    defaultAlignment: Alignment.Evil,
    abilityShort: 'There are extra Outsiders...',
    firstNight: null,
    otherNights: null,
    icon: { placeholder: '#d32f2f' },
    reminders: [],
  },
  {
    id: 'imp',
    name: 'Imp',
    type: CharacterType.Demon,
    defaultAlignment: Alignment.Evil,
    abilityShort: 'Each night* choose a player...',
    firstNight: null,
    otherNights: { order: 24, helpText: 'test', subActions: [] },
    icon: { placeholder: '#b71c1c' },
    reminders: [],
  },
  {
    id: 'zombuul',
    name: 'Zombuul',
    type: CharacterType.Demon,
    defaultAlignment: Alignment.Evil,
    abilityShort: 'Each night* if no one died...',
    firstNight: null,
    otherNights: { order: 25, helpText: 'test', subActions: [] },
    icon: { placeholder: '#b71c1c' },
    reminders: [],
  },
  {
    id: 'butcher',
    name: 'Butcher',
    type: CharacterType.Traveller,
    defaultAlignment: Alignment.Unknown,
    abilityShort: 'Each day, after the 1st execution, you may nominate again.',
    firstNight: null,
    otherNights: null,
    icon: { placeholder: '#1976d2' },
    reminders: [],
  },
  {
    id: 'angel',
    name: 'Angel',
    type: CharacterType.Fabled,
    defaultAlignment: Alignment.Good,
    abilityShort:
      'Something bad might happen to whoever is most responsible for the death of a new player.',
    firstNight: null,
    otherNights: null,
    icon: { placeholder: '#ff9800' },
    reminders: [],
  },
  {
    id: 'bigwig',
    name: 'Big Wig',
    type: CharacterType.Loric,
    defaultAlignment: Alignment.Good,
    abilityShort: 'Each nominee chooses a player.',
    firstNight: null,
    otherNights: null,
    icon: { placeholder: '#558b2f' },
    reminders: [],
  },
];

vi.mock('@/hooks/useCharacterLookup.ts', () => ({
  useCharacterLookup: () => ({
    allCharacters: mockCharacters,
    getCharacter: (id: string) => mockCharacters.find((c) => c.id === id),
    getCharactersByIds: (ids: string[]) =>
      ids.map((id) => mockCharacters.find((c) => c.id === id)).filter(Boolean),
  }),
  humanizeCharacterId: (id: string) => id.charAt(0).toUpperCase() + id.slice(1),
  getFallbackCharacter: (id: string) => ({
    id,
    name: id,
    type: 'Unknown',
    defaultAlignment: 'Unknown',
    abilityShort: '<TODO>',
    firstNight: null,
    otherNights: null,
    icon: { placeholder: '#9e9e9e' },
    reminders: [],
  }),
}));

import { ScriptBuilder } from '@/components/ScriptBuilder/ScriptBuilder.tsx';

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe('ScriptBuilder', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing when open', () => {
    const { container } = render(<ScriptBuilder {...defaultProps} />);
    expect(container).toBeTruthy();
  });

  it('is not visible when closed', () => {
    render(<ScriptBuilder {...defaultProps} open={false} />);
    // Dialog should not display its title
    expect(screen.queryByText('Create Script')).not.toBeInTheDocument();
  });

  it('shows dialog title', () => {
    render(<ScriptBuilder {...defaultProps} />);
    expect(screen.getByText('Create Script')).toBeInTheDocument();
  });

  it('has script name input field', () => {
    render(<ScriptBuilder {...defaultProps} />);
    expect(screen.getByLabelText(/Script Name/i)).toBeInTheDocument();
  });

  it('has author input field', () => {
    render(<ScriptBuilder {...defaultProps} />);
    expect(screen.getByLabelText(/Author/i)).toBeInTheDocument();
  });

  it('has Browse Characters and Selection tabs', () => {
    render(<ScriptBuilder {...defaultProps} />);
    expect(screen.getByRole('tab', { name: /Browse Characters/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Selection/i })).toBeInTheDocument();
  });

  it('shows character list for browsing', () => {
    render(<ScriptBuilder {...defaultProps} />);
    // Composition chips contain "Townsfolk: 0/…" and type headers also say "Townsfolk".
    // Use getAllByText to avoid duplicate-match errors.
    const matches = screen.getAllByText(/Townsfolk/);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('shows composition count chips', () => {
    render(<ScriptBuilder {...defaultProps} />);
    // Shows composition chips with type: count/total format
    expect(screen.getByText(/Townsfolk: 0\//)).toBeInTheDocument();
    expect(screen.getByText(/Outsider: 0\//)).toBeInTheDocument();
    expect(screen.getByText(/Minion: 0\//)).toBeInTheDocument();
    expect(screen.getByText(/Demon: 0\//)).toBeInTheDocument();
    expect(screen.getByText(/Total: 0/)).toBeInTheDocument();
  });

  it('shows search field for filtering characters', () => {
    render(<ScriptBuilder {...defaultProps} />);
    expect(screen.getByLabelText(/Search characters/i)).toBeInTheDocument();
  });

  it('can toggle character selection via checkbox', () => {
    render(<ScriptBuilder {...defaultProps} />);
    // Find first checkbox and click it
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);
    fireEvent.click(checkboxes[0]);
    // Total should now be 1
    expect(screen.getByText(/Total: 1/)).toBeInTheDocument();
  });

  it('has cancel button that calls onClose', () => {
    const onClose = vi.fn();
    render(<ScriptBuilder {...defaultProps} onClose={onClose} />);
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('has save button that is disabled when no name or characters', () => {
    render(<ScriptBuilder {...defaultProps} />);
    const saveButton = screen.getByRole('button', { name: /Save Script/i });
    expect(saveButton).toBeDisabled();
  });

  it('save button remains disabled when only name is filled', () => {
    render(<ScriptBuilder {...defaultProps} />);
    const nameInput = screen.getByLabelText(/Script Name/i);
    fireEvent.change(nameInput, { target: { value: 'My Script' } });
    const saveButton = screen.getByRole('button', { name: /Save Script/i });
    expect(saveButton).toBeDisabled();
  });

  it('save button remains disabled when only characters are selected', () => {
    render(<ScriptBuilder {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    const saveButton = screen.getByRole('button', { name: /Save Script/i });
    expect(saveButton).toBeDisabled();
  });

  it('save button is enabled when name is filled and characters are selected', () => {
    render(<ScriptBuilder {...defaultProps} />);
    const nameInput = screen.getByLabelText(/Script Name/i);
    fireEvent.change(nameInput, { target: { value: 'My Script' } });
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    const saveButton = screen.getByRole('button', { name: /Save Script/i });
    expect(saveButton).not.toBeDisabled();
  });

  it('calls onSave and onClose when save button is clicked', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<ScriptBuilder {...defaultProps} onSave={onSave} onClose={onClose} />);

    const nameInput = screen.getByLabelText(/Script Name/i);
    fireEvent.change(nameInput, { target: { value: 'My Script' } });
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    const saveButton = screen.getByRole('button', { name: /Save Script/i });
    fireEvent.click(saveButton);

    expect(onSave).toHaveBeenCalledTimes(1);
    const savedScript = onSave.mock.calls[0][0];
    expect(savedScript.name).toBe('My Script');
    expect(savedScript.characterIds.length).toBe(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('switching to Selection tab shows empty state when no characters selected', () => {
    render(<ScriptBuilder {...defaultProps} />);
    const selectionTab = screen.getByRole('tab', { name: /Selection/i });
    fireEvent.click(selectionTab);
    expect(screen.getByText(/No characters selected yet/)).toBeInTheDocument();
  });

  it('switching to Selection tab shows selected characters', () => {
    render(<ScriptBuilder {...defaultProps} />);
    // Select a character first
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    // Switch to Selection tab
    const selectionTab = screen.getByRole('tab', { name: /Selection/i });
    fireEvent.click(selectionTab);

    // Should show at least one checkbox (the selected character)
    const selectedCheckboxes = screen.getAllByRole('checkbox');
    expect(selectedCheckboxes.length).toBeGreaterThan(0);
    expect(selectedCheckboxes[0]).toBeChecked();
  });

  it('can remove a character from selection', () => {
    render(<ScriptBuilder {...defaultProps} />);
    // Select a character
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    expect(screen.getByText(/Total: 1/)).toBeInTheDocument();

    // Uncheck it
    fireEvent.click(checkboxes[0]);
    expect(screen.getByText(/Total: 0/)).toBeInTheDocument();
  });

  it('filters characters by search text', () => {
    render(<ScriptBuilder {...defaultProps} />);
    const searchInput = screen.getByLabelText(/Search characters/i);
    fireEvent.change(searchInput, { target: { value: 'imp' } });
    // Should show Imp but not other characters like Washerwoman
    expect(screen.getByText('Imp')).toBeInTheDocument();
    expect(screen.queryByText('Washerwoman')).not.toBeInTheDocument();
  });

  it('defaults author to Custom when not provided', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<ScriptBuilder {...defaultProps} onSave={onSave} onClose={onClose} />);
    // Fill name and select a character
    fireEvent.change(screen.getByLabelText(/Script Name/i), { target: { value: 'Test Script' } });
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    // Save without filling author
    fireEvent.click(screen.getByRole('button', { name: /Save Script/i }));
    expect(onSave).toHaveBeenCalledTimes(1);
    const savedScript = onSave.mock.calls[0][0];
    expect(savedScript.author).toBe('Custom');
  });

  it('can remove a character from the Selection tab', () => {
    render(<ScriptBuilder {...defaultProps} />);
    // Select a character on Browse tab
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    expect(screen.getByText(/Total: 1/)).toBeInTheDocument();
    // Switch to Selection tab
    fireEvent.click(screen.getByRole('tab', { name: /Selection/i }));
    // Uncheck the character on Selection tab
    const selectionCheckboxes = screen.getAllByRole('checkbox');
    fireEvent.click(selectionCheckboxes[0]);
    // Should show empty state
    expect(screen.getByText(/No characters selected yet/)).toBeInTheDocument();
  });

  it('shows Traveller section with characters', () => {
    render(<ScriptBuilder {...defaultProps} />);
    // Both composition chip and section header contain "Traveller"
    const matches = screen.getAllByText(/Traveller/);
    expect(matches.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Butcher')).toBeInTheDocument();
  });

  it('shows Fabled section with characters', () => {
    render(<ScriptBuilder {...defaultProps} />);
    const matches = screen.getAllByText(/Fabled/);
    expect(matches.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Angel')).toBeInTheDocument();
  });

  it('shows Loric section with characters', () => {
    render(<ScriptBuilder {...defaultProps} />);
    const matches = screen.getAllByText(/Loric/);
    expect(matches.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Big Wig')).toBeInTheDocument();
  });

  it('includes selected Traveller/Fabled/Loric in saved script', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<ScriptBuilder {...defaultProps} onSave={onSave} onClose={onClose} />);
    // Fill name
    fireEvent.change(screen.getByLabelText(/Script Name/i), { target: { value: 'Test' } });
    // Select all characters (11 total in mock)
    const checkboxes = screen.getAllByRole('checkbox');
    for (const cb of checkboxes) {
      fireEvent.click(cb);
    }
    fireEvent.click(screen.getByRole('button', { name: /Save Script/i }));
    const savedScript = onSave.mock.calls[0][0];
    // Should include all 11 characters including Traveller/Fabled/Loric
    expect(savedScript.characterIds).toContain('butcher');
    expect(savedScript.characterIds).toContain('angel');
    expect(savedScript.characterIds).toContain('bigwig');
  });
});
