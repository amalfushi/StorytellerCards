import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CharacterAssignmentDialog } from '@/components/CharacterAssignment/CharacterAssignmentDialog.tsx';
import type { PlayerSeat, CharacterDef } from '@/types/index.ts';
import { Alignment, CharacterType } from '@/types/index.ts';

// ──────────────────────────────────────────────
// Mock data
// ──────────────────────────────────────────────

const mockScriptCharacters: CharacterDef[] = [
  {
    id: 'noble',
    name: 'Noble',
    type: CharacterType.Townsfolk,
    defaultAlignment: Alignment.Good,
    abilityShort: 'On your 1st night, you learn 3 players.',
    firstNight: null,
    otherNights: null,
    reminders: [],
  },
  {
    id: 'fortuneteller',
    name: 'Fortune Teller',
    type: CharacterType.Townsfolk,
    defaultAlignment: Alignment.Good,
    abilityShort: 'Each night, choose 2 players.',
    firstNight: null,
    otherNights: null,
    reminders: [],
  },
  {
    id: 'slayer',
    name: 'Slayer',
    type: CharacterType.Townsfolk,
    defaultAlignment: Alignment.Good,
    abilityShort: 'Once per game, choose a player: if they are the Demon, they die.',
    firstNight: null,
    otherNights: null,
    reminders: [],
  },
  {
    id: 'drunk',
    name: 'Drunk',
    type: CharacterType.Outsider,
    defaultAlignment: Alignment.Good,
    abilityShort: 'You think you are a Townsfolk, but you are not.',
    firstNight: null,
    otherNights: null,
    reminders: [],
  },
  {
    id: 'poisoner',
    name: 'Poisoner',
    type: CharacterType.Minion,
    defaultAlignment: Alignment.Evil,
    abilityShort: 'Each night, choose a player: they are poisoned.',
    firstNight: null,
    otherNights: null,
    reminders: [],
  },
  {
    id: 'imp',
    name: 'Imp',
    type: CharacterType.Demon,
    defaultAlignment: Alignment.Evil,
    abilityShort: 'Each night*, choose a player: they die.',
    firstNight: null,
    otherNights: null,
    reminders: [],
  },
];

function makePlayers(count: number): PlayerSeat[] {
  return Array.from({ length: count }, (_, i) => ({
    seat: i + 1,
    playerName: `Player ${i + 1}`,
    characterId: '',
    alive: true,
    ghostVoteUsed: false,
    visibleAlignment: Alignment.Unknown,
    actualAlignment: Alignment.Unknown,
    startingAlignment: Alignment.Unknown,
    activeReminders: [],
    isTraveller: false,
    tokens: [],
  }));
}

const fivePlayers = makePlayers(5);

const playersWithTraveller: PlayerSeat[] = [
  ...fivePlayers,
  {
    seat: 6,
    playerName: 'TravJack',
    characterId: 'spiritofivory',
    alive: true,
    ghostVoteUsed: false,
    visibleAlignment: Alignment.Good,
    actualAlignment: Alignment.Good,
    startingAlignment: Alignment.Good,
    activeReminders: [],
    isTraveller: true,
    tokens: [],
  },
];

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe('CharacterAssignmentDialog', () => {
  const onClose = vi.fn();
  const onConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing visible when not open', () => {
    const { container } = render(
      <CharacterAssignmentDialog
        open={false}
        onClose={onClose}
        players={fivePlayers}
        scriptCharacters={mockScriptCharacters}
        onConfirm={onConfirm}
      />,
    );
    // MUI Dialog renders to a portal but with display:none attributes when closed
    expect(screen.queryByText('Assign Characters')).not.toBeInTheDocument();
    expect(container).toBeTruthy();
  });

  it('shows dialog title when open', () => {
    render(
      <CharacterAssignmentDialog
        open={true}
        onClose={onClose}
        players={fivePlayers}
        scriptCharacters={mockScriptCharacters}
        onConfirm={onConfirm}
      />,
    );
    expect(screen.getByText('Assign Characters')).toBeInTheDocument();
  });

  it('shows distribution section with player count', () => {
    render(
      <CharacterAssignmentDialog
        open={true}
        onClose={onClose}
        players={fivePlayers}
        scriptCharacters={mockScriptCharacters}
        onConfirm={onConfirm}
      />,
    );
    expect(screen.getByText('Distribution (5 players)')).toBeInTheDocument();
  });

  it('shows distribution text fields for each type', () => {
    render(
      <CharacterAssignmentDialog
        open={true}
        onClose={onClose}
        players={fivePlayers}
        scriptCharacters={mockScriptCharacters}
        onConfirm={onConfirm}
      />,
    );
    // Distribution text fields have labels
    expect(screen.getByLabelText('Townsfolk')).toBeInTheDocument();
    expect(screen.getByLabelText('Outsider')).toBeInTheDocument();
    expect(screen.getByLabelText('Minion')).toBeInTheDocument();
    expect(screen.getByLabelText('Demon')).toBeInTheDocument();
  });

  it('has a Randomize button', () => {
    render(
      <CharacterAssignmentDialog
        open={true}
        onClose={onClose}
        players={fivePlayers}
        scriptCharacters={mockScriptCharacters}
        onConfirm={onConfirm}
      />,
    );
    expect(screen.getByRole('button', { name: /randomize/i })).toBeInTheDocument();
  });

  it('shows available characters summary chips', () => {
    render(
      <CharacterAssignmentDialog
        open={true}
        onClose={onClose}
        players={fivePlayers}
        scriptCharacters={mockScriptCharacters}
        onConfirm={onConfirm}
      />,
    );
    expect(screen.getByText('Available Characters')).toBeInTheDocument();
    expect(screen.getByText('Townsfolk: 3')).toBeInTheDocument();
    expect(screen.getByText('Outsider: 1')).toBeInTheDocument();
    expect(screen.getByText('Minion: 1')).toBeInTheDocument();
    expect(screen.getByText('Demon: 1')).toBeInTheDocument();
  });

  it('shows player assignment rows for non-traveller players', () => {
    render(
      <CharacterAssignmentDialog
        open={true}
        onClose={onClose}
        players={playersWithTraveller}
        scriptCharacters={mockScriptCharacters}
        onConfirm={onConfirm}
      />,
    );
    expect(screen.getByText('Player Assignments')).toBeInTheDocument();
    // 5 non-traveller players should be listed
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByText(`Player ${i}`)).toBeInTheDocument();
    }
    // Traveller should NOT appear in assignment rows
    expect(screen.queryByText('TravJack')).not.toBeInTheDocument();
  });

  it('shows character select dropdowns for each non-traveller player', () => {
    render(
      <CharacterAssignmentDialog
        open={true}
        onClose={onClose}
        players={fivePlayers}
        scriptCharacters={mockScriptCharacters}
        onConfirm={onConfirm}
      />,
    );
    // Each player should have a Character select dropdown (labeled "Character")
    const characterLabels = screen.getAllByLabelText('Character');
    expect(characterLabels.length).toBe(5);
  });

  it('calls onClose when Cancel is clicked', () => {
    render(
      <CharacterAssignmentDialog
        open={true}
        onClose={onClose}
        players={fivePlayers}
        scriptCharacters={mockScriptCharacters}
        onConfirm={onConfirm}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when close icon button is clicked', () => {
    render(
      <CharacterAssignmentDialog
        open={true}
        onClose={onClose}
        players={fivePlayers}
        scriptCharacters={mockScriptCharacters}
        onConfirm={onConfirm}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'close' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onConfirm and onClose when Confirm is clicked', () => {
    render(
      <CharacterAssignmentDialog
        open={true}
        onClose={onClose}
        players={fivePlayers}
        scriptCharacters={mockScriptCharacters}
        onConfirm={onConfirm}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows distribution mismatch warning when totals do not match player count', () => {
    render(
      <CharacterAssignmentDialog
        open={true}
        onClose={onClose}
        players={fivePlayers}
        scriptCharacters={mockScriptCharacters}
        onConfirm={onConfirm}
      />,
    );
    // For 5 players the default distribution is 3+0+1+1=5, so no warning
    expect(screen.queryByText(/Distribution total/)).not.toBeInTheDocument();

    // Change townsfolk to 0 to cause mismatch
    const townsfolkInput = screen.getByLabelText('Townsfolk');
    fireEvent.change(townsfolkInput, { target: { value: '0' } });

    // Now the total is 0+0+1+1=2 vs 5 players — warning should appear
    expect(screen.getByText(/Distribution total \(2\) ≠ player count \(5\)/)).toBeInTheDocument();
  });

  it('handles empty script characters gracefully', () => {
    render(
      <CharacterAssignmentDialog
        open={true}
        onClose={onClose}
        players={fivePlayers}
        scriptCharacters={[]}
        onConfirm={onConfirm}
      />,
    );
    // Should show 0 counts in chips
    expect(screen.getByText('Townsfolk: 0')).toBeInTheDocument();
    expect(screen.getByText('Outsider: 0')).toBeInTheDocument();
    expect(screen.getByText('Minion: 0')).toBeInTheDocument();
    expect(screen.getByText('Demon: 0')).toBeInTheDocument();
  });

  it('shows error when randomize fails due to insufficient characters', () => {
    // Only 1 townsfolk but distribution requires 3 for 5 players
    const minimalChars: CharacterDef[] = [
      {
        id: 'noble',
        name: 'Noble',
        type: CharacterType.Townsfolk,
        defaultAlignment: Alignment.Good,
        abilityShort: 'Test',
        firstNight: null,
        otherNights: null,
        reminders: [],
      },
      {
        id: 'imp',
        name: 'Imp',
        type: CharacterType.Demon,
        defaultAlignment: Alignment.Evil,
        abilityShort: 'Test',
        firstNight: null,
        otherNights: null,
        reminders: [],
      },
    ];

    render(
      <CharacterAssignmentDialog
        open={true}
        onClose={onClose}
        players={fivePlayers}
        scriptCharacters={minimalChars}
        onConfirm={onConfirm}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /randomize/i }));
    // Should display the error from randomlyAssignCharacters
    expect(screen.getByText(/not enough townsfolk/i)).toBeInTheDocument();
  });

  it('excludes traveller count from distribution calculation', () => {
    render(
      <CharacterAssignmentDialog
        open={true}
        onClose={onClose}
        players={playersWithTraveller}
        scriptCharacters={mockScriptCharacters}
        onConfirm={onConfirm}
      />,
    );
    // 5 non-travellers, the traveller is excluded
    expect(screen.getByText('Distribution (5 players)')).toBeInTheDocument();
  });

  it('has Confirm and Cancel action buttons', () => {
    render(
      <CharacterAssignmentDialog
        open={true}
        onClose={onClose}
        players={fivePlayers}
        scriptCharacters={mockScriptCharacters}
        onConfirm={onConfirm}
      />,
    );
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });
});
