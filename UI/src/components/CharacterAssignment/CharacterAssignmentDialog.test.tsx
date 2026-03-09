import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CharacterAssignmentDialog } from '@/components/CharacterAssignment/CharacterAssignmentDialog.tsx';
import type { PlayerSeat, CharacterDef } from '@/types/index.ts';
import { Alignment, CharacterType } from '@/types/index.ts';

// ──────────────────────────────────────────────
// Mock data
// ──────────────────────────────────────────────

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
  makeChar({
    id: 'imp',
    name: 'Imp',
    type: CharacterType.Demon,
    defaultAlignment: Alignment.Evil,
  }),
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
    // Both distribution and available characters sections show type counts
    expect(screen.getAllByText('Townsfolk: 3').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Outsider: 1').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Minion: 1').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Demon: 1').length).toBeGreaterThanOrEqual(1);
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

  it('shows error when randomize fails due to insufficient characters', () => {
    const minimalChars: CharacterDef[] = [
      makeChar({ id: 'noble', name: 'Noble' }),
      makeChar({
        id: 'imp',
        name: 'Imp',
        type: CharacterType.Demon,
        defaultAlignment: Alignment.Evil,
      }),
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
    // Should show 0 counts in available characters chips (may also appear in distribution)
    expect(screen.getAllByText('Townsfolk: 0').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Outsider: 0').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Minion: 0').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Demon: 0').length).toBeGreaterThanOrEqual(1);
  });

  // ──────────────────────────────────────────
  // M27: Character pool chips
  // ──────────────────────────────────────────

  describe('character pool', () => {
    it('shows unassigned characters as chips when inPlayCharacterIds provided', () => {
      render(
        <CharacterAssignmentDialog
          open={true}
          onClose={onClose}
          players={fivePlayers}
          scriptCharacters={mockScriptCharacters}
          onConfirm={onConfirm}
          inPlayCharacterIds={['noble', 'fortuneteller', 'slayer', 'poisoner', 'imp']}
        />,
      );
      expect(screen.getByTestId('character-pool')).toBeInTheDocument();
      expect(screen.getByTestId('pool-chip-noble')).toBeInTheDocument();
      expect(screen.getByTestId('pool-chip-imp')).toBeInTheDocument();
    });

    it('shows "Unassigned Characters" heading', () => {
      render(
        <CharacterAssignmentDialog
          open={true}
          onClose={onClose}
          players={fivePlayers}
          scriptCharacters={mockScriptCharacters}
          onConfirm={onConfirm}
          inPlayCharacterIds={['noble', 'imp']}
        />,
      );
      expect(screen.getByText('Unassigned Characters')).toBeInTheDocument();
    });
  });

  // ──────────────────────────────────────────
  // M27: Tap-to-assign
  // ──────────────────────────────────────────

  describe('tap-to-assign', () => {
    it('shows assignment hint when a chip is tapped', () => {
      render(
        <CharacterAssignmentDialog
          open={true}
          onClose={onClose}
          players={fivePlayers}
          scriptCharacters={mockScriptCharacters}
          onConfirm={onConfirm}
          inPlayCharacterIds={['noble', 'imp']}
        />,
      );
      fireEvent.click(screen.getByTestId('pool-chip-noble'));
      expect(screen.getByText(/Tap a seat below to assign/)).toBeInTheDocument();
    });
  });

  // ──────────────────────────────────────────
  // M27: Identity concealment prompts
  // ──────────────────────────────────────────

  describe('identity concealment', () => {
    it('shows concealment prompt when Drunk is assigned without apparent character', () => {
      const playersWithDrunk = fivePlayers.map((p, i) =>
        i === 0 ? { ...p, characterId: 'drunk' } : p,
      );
      render(
        <CharacterAssignmentDialog
          open={true}
          onClose={onClose}
          players={playersWithDrunk}
          scriptCharacters={mockScriptCharacters}
          onConfirm={onConfirm}
        />,
      );
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
      const playersWithMarionette = fivePlayers.map((p, i) =>
        i === 0 ? { ...p, characterId: 'marionette' } : p,
      );
      render(
        <CharacterAssignmentDialog
          open={true}
          onClose={onClose}
          players={playersWithMarionette}
          scriptCharacters={charsWithMarionette}
          onConfirm={onConfirm}
        />,
      );
      expect(screen.getByTestId('concealment-prompt-marionette')).toBeInTheDocument();
      expect(screen.getByText(/good character the Marionette believes/)).toBeInTheDocument();
    });

    it('does not show concealment prompt when apparent character is set', () => {
      const playersWithDrunkAndApparent = fivePlayers.map((p, i) =>
        i === 0 ? { ...p, characterId: 'drunk', apparentCharacterId: 'noble' } : p,
      );
      render(
        <CharacterAssignmentDialog
          open={true}
          onClose={onClose}
          players={playersWithDrunkAndApparent}
          scriptCharacters={mockScriptCharacters}
          onConfirm={onConfirm}
        />,
      );
      expect(screen.queryByTestId('concealment-prompt-drunk')).not.toBeInTheDocument();
    });
  });
});
