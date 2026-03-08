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
    render(<ScriptReferenceTab scriptCharacterIds={['noble', 'imp', 'fortuneteller']} />);
    expect(screen.getByText('Noble')).toBeInTheDocument();
    expect(screen.getByText('Imp')).toBeInTheDocument();
    expect(screen.getByText('Fortune Teller')).toBeInTheDocument();
  });

  it('groups characters by type with section headers', () => {
    render(<ScriptReferenceTab scriptCharacterIds={['noble', 'drunk', 'baron', 'imp']} />);
    // Should have type section headers
    expect(screen.getByText(/Townsfolk/)).toBeInTheDocument();
    expect(screen.getByText(/Outsiders/)).toBeInTheDocument();
    expect(screen.getByText(/Minions/)).toBeInTheDocument();
    expect(screen.getByText(/Demons/)).toBeInTheDocument();
  });

  it('shows section counts in headers', () => {
    render(<ScriptReferenceTab scriptCharacterIds={['noble', 'fortuneteller', 'imp']} />);
    // Townsfolk section shows count
    expect(screen.getByText(/Townsfolk \(2\)/)).toBeInTheDocument();
    expect(screen.getByText(/Demons \(1\)/)).toBeInTheDocument();
  });

  it('does not show empty type sections', () => {
    render(<ScriptReferenceTab scriptCharacterIds={['noble', 'imp']} />);
    // Should NOT have Outsiders section if no outsiders present
    expect(screen.queryByText(/Outsiders/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Minions/)).not.toBeInTheDocument();
  });

  it('renders character cards for each character', () => {
    render(<ScriptReferenceTab scriptCharacterIds={['noble', 'imp', 'drunk']} />);
    const cards = screen.getAllByTestId('character-card');
    expect(cards).toHaveLength(3);
  });

  it('handles unknown character IDs gracefully with fallback', () => {
    // Unknown characters get type='Unknown' which doesn't match any TYPE_SECTIONS,
    // so they are not rendered in any group. The component should still render
    // without crashing.
    const { container } = render(<ScriptReferenceTab scriptCharacterIds={['unknownchar']} />);
    expect(container).toBeTruthy();
    // Unknown characters are not shown (their type doesn't match any section)
    expect(screen.queryByTestId('character-card')).not.toBeInTheDocument();
  });

  it('renders Traveller section when Traveller characters are present', () => {
    render(<ScriptReferenceTab scriptCharacterIds={['noble', 'butcher']} />);
    expect(screen.getByText(/Travellers/)).toBeInTheDocument();
  });

  it('renders Fabled section when Fabled characters are present', () => {
    render(<ScriptReferenceTab scriptCharacterIds={['noble', 'angel']} />);
    expect(screen.getByText(/Fabled/)).toBeInTheDocument();
  });

  it('renders Loric section when Loric characters are present', () => {
    render(<ScriptReferenceTab scriptCharacterIds={['noble', 'bigwig']} />);
    expect(screen.getByText(/Loric/)).toBeInTheDocument();
  });

  // ── M5: Jinxes section tests ──

  it('shows jinxes section when script has active jinx pairs', () => {
    // alchemist + boffin have a jinx
    render(<ScriptReferenceTab scriptCharacterIds={['alchemist', 'boffin', 'chef']} />);
    expect(screen.getByTestId('jinxes-section')).toBeInTheDocument();
    expect(screen.getByText(/⚡ Jinxes/)).toBeInTheDocument();
  });

  it('hides jinxes section when no active jinx pairs exist', () => {
    render(<ScriptReferenceTab scriptCharacterIds={['chef', 'empath', 'washerwoman']} />);
    expect(screen.queryByTestId('jinxes-section')).not.toBeInTheDocument();
  });

  it('shows both character names and description in jinx entries', () => {
    render(<ScriptReferenceTab scriptCharacterIds={['alchemist', 'boffin']} />);
    // Names appear in both character card and jinx section
    expect(screen.getAllByText('Alchemist').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Boffin').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Boffin ability/)).toBeInTheDocument();
  });

  it('shows correct jinx count in header', () => {
    // alchemist has jinxes with boffin and spy
    render(<ScriptReferenceTab scriptCharacterIds={['alchemist', 'boffin', 'spy']} />);
    expect(screen.getByText(/⚡ Jinxes \(2\)/)).toBeInTheDocument();
  });

  it('renders sections in correct order: TF → OS → MN → DM → TR → FB → LO', () => {
    const { container } = render(
      <ScriptReferenceTab
        scriptCharacterIds={['noble', 'drunk', 'baron', 'imp', 'butcher', 'angel', 'bigwig']}
      />,
    );
    const headers = container.querySelectorAll('[class*="MuiTypography-subtitle2"]');
    const headerTexts = Array.from(headers).map((h) => h.textContent);
    const expectedOrder = [
      'Townsfolk',
      'Outsiders',
      'Minions',
      'Demons',
      'Travellers',
      'Fabled',
      'Loric',
    ];
    const filteredTexts = headerTexts.filter((t) => expectedOrder.some((e) => t?.includes(e)));
    expect(filteredTexts.length).toBeGreaterThanOrEqual(7);
    // Verify ordering
    for (let i = 0; i < expectedOrder.length - 1; i++) {
      const idxA = filteredTexts.findIndex((t) => t?.includes(expectedOrder[i]));
      const idxB = filteredTexts.findIndex((t) => t?.includes(expectedOrder[i + 1]));
      expect(idxA).toBeLessThan(idxB);
    }
  });
});
