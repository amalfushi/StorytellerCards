import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CharacterCard } from '@/components/ScriptViewer/CharacterCard.tsx';
import type { CharacterDef } from '@/types/index.ts';
import { CharacterType, Alignment } from '@/types/index.ts';

// ──────────────────────────────────────────────
// Mock CharacterDetailModal
// ──────────────────────────────────────────────

vi.mock('@/components/common/CharacterDetailModal.tsx', () => ({
  CharacterDetailModal: ({
    open,
    onClose,
    character,
  }: {
    open: boolean;
    onClose: () => void;
    character: CharacterDef | null;
  }) =>
    open ? (
      <div data-testid="character-detail-modal">
        <span>{character?.name}</span>
        <button onClick={onClose}>Close Modal</button>
      </div>
    ) : null,
}));

// ──────────────────────────────────────────────
// Mock data
// ──────────────────────────────────────────────

const fullCharacter: CharacterDef = {
  id: 'fortuneteller',
  name: 'Fortune Teller',
  type: CharacterType.Townsfolk,
  defaultAlignment: Alignment.Good,
  abilityShort: 'Each night, choose 2 players: you learn if either is a Demon.',
  abilityDetailed:
    'Each night, choose 2 players: you learn if either is a Demon. There is a good player that registers as a Demon to you.',
  wikiLink: 'https://wiki.bloodontheclocktower.com/Fortune_Teller',
  firstNight: {
    order: 16,
    helpText: 'The Fortune Teller points to two players. First night only.',
    subActions: [{ id: 'ft-fn-1', description: 'Points to two', isConditional: false }],
  },
  otherNights: {
    order: 13,
    helpText: 'The Fortune Teller points to two players. Other nights.',
    subActions: [{ id: 'ft-on-1', description: 'Points to two', isConditional: false }],
  },
  reminders: [
    { id: 'ft-r1', text: 'Red herring' },
    { id: 'ft-r2', text: 'Chosen' },
  ],
};

const minimalCharacter: CharacterDef = {
  id: 'slayer',
  name: 'Slayer',
  type: CharacterType.Townsfolk,
  defaultAlignment: Alignment.Good,
  abilityShort: 'Once per game, during the day, publicly choose a player: if they are the Demon, they die.',
  firstNight: null,
  otherNights: null,
  reminders: [],
};

const demonCharacter: CharacterDef = {
  id: 'imp',
  name: 'Imp',
  type: CharacterType.Demon,
  defaultAlignment: Alignment.Evil,
  abilityShort: 'Each night*, choose a player: they die.',
  firstNight: null,
  otherNights: {
    order: 24,
    helpText: 'The Imp points to a player.',
    subActions: [{ id: 'imp-on-1', description: 'The Imp points', isConditional: false }],
  },
  reminders: [],
};

// ──────────────────────────────────────────────
// Helper: click the accordion expand button
// ──────────────────────────────────────────────

function expandAccordion() {
  // MUI Accordion uses a button with aria-expanded inside an h3
  const button = screen.getByRole('button', { name: /Fortune Teller/i });
  fireEvent.click(button);
}

function expandAccordionFor(name: RegExp) {
  const button = screen.getByRole('button', { name });
  fireEvent.click(button);
}

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe('CharacterCard', () => {
  it('renders without crashing', () => {
    const { container } = render(<CharacterCard character={fullCharacter} />);
    expect(container).toBeTruthy();
  });

  it('shows character name', () => {
    render(<CharacterCard character={fullCharacter} />);
    expect(screen.getByText('Fortune Teller')).toBeInTheDocument();
  });

  it('shows ability short text', () => {
    render(<CharacterCard character={fullCharacter} />);
    // abilityShort and abilityDetailed both contain a similar prefix.
    // Use getAllByText and verify at least one match is present.
    const matches = screen.getAllByText(
      /Each night, choose 2 players: you learn if either is a Demon/,
    );
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('shows character icon with first letter', () => {
    render(<CharacterCard character={fullCharacter} />);
    // The coloured circle shows the first letter of the character name
    expect(screen.getByText('F')).toBeInTheDocument();
  });

  it('handles characters with minimal data', () => {
    const { container } = render(<CharacterCard character={minimalCharacter} />);
    expect(container).toBeTruthy();
    expect(screen.getByText('Slayer')).toBeInTheDocument();
    expect(screen.getByText('S')).toBeInTheDocument();
  });

  it('shows detailed rules when expanded', () => {
    render(<CharacterCard character={fullCharacter} />);
    expandAccordion();

    expect(screen.getByText('Detailed Rules')).toBeInTheDocument();
    expect(
      screen.getByText(/There is a good player that registers as a Demon to you/),
    ).toBeInTheDocument();
  });

  it('shows first night help text when expanded', () => {
    render(<CharacterCard character={fullCharacter} />);
    expandAccordion();

    expect(screen.getByText('First Night')).toBeInTheDocument();
    // Different helpText values for first vs other nights avoid duplicate text
    expect(
      screen.getByText(/First night only/),
    ).toBeInTheDocument();
  });

  it('shows other nights help text when expanded', () => {
    render(<CharacterCard character={fullCharacter} />);
    expandAccordion();

    expect(screen.getByText('Other Nights')).toBeInTheDocument();
    expect(
      screen.getByText(/Other nights\./),
    ).toBeInTheDocument();
  });

  it('shows wiki link when expanded', () => {
    render(<CharacterCard character={fullCharacter} />);
    expandAccordion();

    const wikiLink = screen.getByText('Wiki →');
    expect(wikiLink).toBeInTheDocument();
    expect(wikiLink.closest('a')).toHaveAttribute(
      'href',
      'https://wiki.bloodontheclocktower.com/Fortune_Teller',
    );
  });

  it('shows reminder tokens when expanded', () => {
    render(<CharacterCard character={fullCharacter} />);
    expandAccordion();

    expect(screen.getByText('Reminder Tokens')).toBeInTheDocument();
    expect(screen.getByText('Red herring, Chosen')).toBeInTheDocument();
  });

  it('does not show wiki link for character without wikiLink', () => {
    render(<CharacterCard character={minimalCharacter} />);
    expandAccordionFor(/Slayer/);

    expect(screen.queryByText('Wiki →')).not.toBeInTheDocument();
  });

  it('does not show reminder tokens section for character with empty reminders', () => {
    render(<CharacterCard character={minimalCharacter} />);
    expandAccordionFor(/Slayer/);

    expect(screen.queryByText('Reminder Tokens')).not.toBeInTheDocument();
  });

  it('click on icon opens character detail modal', () => {
    render(<CharacterCard character={fullCharacter} />);
    // Click the coloured circle (first letter "F")
    const icon = screen.getByText('F');
    fireEvent.click(icon);

    expect(screen.getByTestId('character-detail-modal')).toBeInTheDocument();
  });

  it('shows different first letter for demon character', () => {
    render(<CharacterCard character={demonCharacter} />);
    expect(screen.getByText('I')).toBeInTheDocument();
  });
});
