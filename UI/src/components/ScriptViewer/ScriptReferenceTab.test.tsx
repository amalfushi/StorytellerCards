import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScriptReferenceTab } from '@/components/ScriptViewer/ScriptReferenceTab.tsx';

// ──────────────────────────────────────────────
// Mock CharacterCard so we don't test its internals
// ──────────────────────────────────────────────

vi.mock('@/components/ScriptViewer/CharacterCard.tsx', () => ({
  CharacterCard: ({ character }: { character: { name: string } }) => (
    <div data-testid="character-card">{character.name}</div>
  ),
}));

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe('ScriptReferenceTab', () => {
  it('renders without crashing', () => {
    const { container } = render(<ScriptReferenceTab scriptCharacterIds={[]} />);
    expect(container).toBeTruthy();
  });

  it('shows empty message when no characters', () => {
    render(<ScriptReferenceTab scriptCharacterIds={[]} />);
    expect(screen.getByText('No characters on this script.')).toBeInTheDocument();
  });

  it('shows list of characters from the script', () => {
    render(
      <ScriptReferenceTab scriptCharacterIds={['noble', 'imp', 'fortuneteller']} />,
    );
    expect(screen.getByText('Noble')).toBeInTheDocument();
    expect(screen.getByText('Imp')).toBeInTheDocument();
    expect(screen.getByText('Fortune Teller')).toBeInTheDocument();
  });

  it('groups characters by type with section headers', () => {
    render(
      <ScriptReferenceTab
        scriptCharacterIds={['noble', 'drunk', 'baron', 'imp']}
      />,
    );
    // Should have type section headers
    expect(screen.getByText(/Townsfolk/)).toBeInTheDocument();
    expect(screen.getByText(/Outsiders/)).toBeInTheDocument();
    expect(screen.getByText(/Minions/)).toBeInTheDocument();
    expect(screen.getByText(/Demons/)).toBeInTheDocument();
  });

  it('shows section counts in headers', () => {
    render(
      <ScriptReferenceTab
        scriptCharacterIds={['noble', 'fortuneteller', 'imp']}
      />,
    );
    // Townsfolk section shows count
    expect(screen.getByText(/Townsfolk \(2\)/)).toBeInTheDocument();
    expect(screen.getByText(/Demons \(1\)/)).toBeInTheDocument();
  });

  it('does not show empty type sections', () => {
    render(
      <ScriptReferenceTab scriptCharacterIds={['noble', 'imp']} />,
    );
    // Should NOT have Outsiders section if no outsiders present
    expect(screen.queryByText(/Outsiders/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Minions/)).not.toBeInTheDocument();
  });

  it('renders character cards for each character', () => {
    render(
      <ScriptReferenceTab
        scriptCharacterIds={['noble', 'imp', 'drunk']}
      />,
    );
    const cards = screen.getAllByTestId('character-card');
    expect(cards).toHaveLength(3);
  });

  it('handles unknown character IDs gracefully with fallback', () => {
    // Unknown characters get type='Unknown' which doesn't match any TYPE_SECTIONS,
    // so they are not rendered in any group. The component should still render
    // without crashing.
    const { container } = render(
      <ScriptReferenceTab scriptCharacterIds={['unknownchar']} />,
    );
    expect(container).toBeTruthy();
    // Unknown characters are not shown (their type doesn't match any section)
    expect(screen.queryByTestId('character-card')).not.toBeInTheDocument();
  });
});
