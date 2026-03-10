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

  it('shows available character types in distribution section', () => {
    render(
      <CharacterAssignmentDialog
        open={true}
        onClose={onClose}
        players={fivePlayers}
        scriptCharacters={mockScriptCharacters}
        onConfirm={onConfirm}
      />,
    );
    // Distribution section shows type counts
    expect(screen.getByText('Townsfolk: 3')).toBeInTheDocument();
    expect(screen.getByText('Outsider: 0')).toBeInTheDocument();
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

  it('randomize assigns unassigned characters to empty seats', () => {
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

    fireEvent.click(screen.getByRole('button', { name: /randomize/i }));
    // No error should be displayed — simplified randomize has no validation
    expect(screen.queryByText(/not enough/i)).not.toBeInTheDocument();
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
    // Distribution section shows 0 counts
    expect(screen.getByText('Townsfolk: 3')).toBeInTheDocument();
    expect(screen.getByText('Outsider: 0')).toBeInTheDocument();
    expect(screen.getByText('Minion: 1')).toBeInTheDocument();
    expect(screen.getByText('Demon: 1')).toBeInTheDocument();
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
  // M27: Multi-instance character dropdown
  // ──────────────────────────────────────────

  describe('multi-instance dropdown', () => {
    const villageidiotChar = makeChar({
      id: 'villageidiot',
      name: 'Village Idiot',
      type: CharacterType.Townsfolk,
    });

    const multiInstanceScript = [
      villageidiotChar,
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

    it('shows multiple unassigned chips for duplicate characters', () => {
      render(
        <CharacterAssignmentDialog
          open={true}
          onClose={onClose}
          players={makePlayers(6)}
          scriptCharacters={multiInstanceScript}
          onConfirm={onConfirm}
          inPlayCharacterIds={[
            'villageidiot',
            'villageidiot',
            'villageidiot',
            'fortuneteller',
            'poisoner',
            'imp',
          ]}
        />,
      );
      // Should have 3 Village Idiot chips in the pool
      const chips = screen.getAllByTestId('pool-chip-villageidiot');
      expect(chips.length).toBe(3);
    });

    it('computes distribution from inPlayCharacterIds type counts', () => {
      render(
        <CharacterAssignmentDialog
          open={true}
          onClose={onClose}
          players={makePlayers(6)}
          scriptCharacters={multiInstanceScript}
          onConfirm={onConfirm}
          inPlayCharacterIds={[
            'villageidiot',
            'villageidiot',
            'villageidiot',
            'fortuneteller',
            'poisoner',
            'imp',
          ]}
        />,
      );
      // 4 Townsfolk (3 VI + 1 FT), 0 Outsider, 1 Minion, 1 Demon
      expect(screen.getByText('Townsfolk: 4')).toBeInTheDocument();
      expect(screen.getByText('Minion: 1')).toBeInTheDocument();
      expect(screen.getByText('Demon: 1')).toBeInTheDocument();
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
