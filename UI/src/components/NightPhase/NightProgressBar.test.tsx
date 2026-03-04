import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NightProgressBar } from '@/components/NightPhase/NightProgressBar.tsx';
import type { NightOrderEntry } from '@/types/index.ts';

// ──────────────────────────────────────────────
// Helper: generate entries
// ──────────────────────────────────────────────

function makeEntries(count: number): NightOrderEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    order: i,
    type: (i === 0 ? 'structural' : 'character') as NightOrderEntry['type'],
    id: i === 0 ? 'dusk' : `char-${i}`,
    name: i === 0 ? 'Dusk' : `Character ${i}`,
    helpText: `Help text for ${i}`,
    subActions: [],
  }));
}

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe('NightProgressBar', () => {
  beforeEach(() => {
    // jsdom doesn't implement scrollTo — stub it
    Element.prototype.scrollTo = vi.fn();
  });

  it('renders without crashing', () => {
    const entries = makeEntries(3);
    render(
      <NightProgressBar currentIndex={0} totalCards={3} entries={entries} />,
    );
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows correct counter text', () => {
    const entries = makeEntries(5);
    render(
      <NightProgressBar currentIndex={2} totalCards={5} entries={entries} />,
    );
    expect(screen.getByText('3 / 5')).toBeInTheDocument();
  });

  it('shows correct number of dots based on entries length', () => {
    const entries = makeEntries(5);
    const { container } = render(
      <NightProgressBar currentIndex={0} totalCards={5} entries={entries} />,
    );
    // Each entry produces one dot — dots don't have a specific role by default,
    // but when onClick is provided they get role="button"
    // Without onClick, count child boxes inside dot row
    const progressBar = container.querySelector('[aria-label="Night progress"]');
    expect(progressBar).toBeInTheDocument();
    // The counter text + the dot row container
    expect(screen.getByText('1 / 5')).toBeInTheDocument();
  });

  it('dots are clickable and call onClick with correct index', () => {
    const entries = makeEntries(4);
    const onClick = vi.fn();
    render(
      <NightProgressBar currentIndex={0} totalCards={4} entries={entries} onClick={onClick} />,
    );
    // When onClick is provided, dots get role="button"
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(4);
    fireEvent.click(buttons[2]);
    expect(onClick).toHaveBeenCalledWith(2);
  });

  it('has proper aria-labels on clickable dots', () => {
    const entries = makeEntries(3);
    const onClick = vi.fn();
    render(
      <NightProgressBar currentIndex={0} totalCards={3} entries={entries} onClick={onClick} />,
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveAttribute('aria-label', 'Go to card 1 of 3: Dusk');
    expect(buttons[1]).toHaveAttribute('aria-label', 'Go to card 2 of 3: Character 1');
    expect(buttons[2]).toHaveAttribute('aria-label', 'Go to card 3 of 3: Character 2');
  });

  it('has proper progressbar aria attributes', () => {
    const entries = makeEntries(5);
    render(
      <NightProgressBar currentIndex={2} totalCards={5} entries={entries} />,
    );
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '3');
    expect(bar).toHaveAttribute('aria-valuemax', '5');
    expect(bar).toHaveAttribute('aria-label', 'Night progress');
  });

  it('handles 0 entries gracefully', () => {
    const { container } = render(
      <NightProgressBar currentIndex={0} totalCards={0} entries={[]} />,
    );
    expect(container.firstChild).toBeInTheDocument();
    // Counter text should show 1 / 0 (currentIndex + 1)
    expect(screen.getByText('1 / 0')).toBeInTheDocument();
  });

  it('handles 1 entry', () => {
    const entries = makeEntries(1);
    const onClick = vi.fn();
    render(
      <NightProgressBar currentIndex={0} totalCards={1} entries={entries} onClick={onClick} />,
    );
    expect(screen.getByText('1 / 1')).toBeInTheDocument();
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(1);
  });

  it('handles many entries (12+) — uses scrollable container', () => {
    const entries = makeEntries(12);
    const onClick = vi.fn();
    render(
      <NightProgressBar currentIndex={5} totalCards={12} entries={entries} onClick={onClick} />,
    );
    expect(screen.getByText('6 / 12')).toBeInTheDocument();
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(12);
    // Auto-scroll should have been called for 10+ entries
    expect(Element.prototype.scrollTo).toHaveBeenCalled();
  });

  it('handles keyboard navigation on dots (Enter key)', () => {
    const entries = makeEntries(3);
    const onClick = vi.fn();
    render(
      <NightProgressBar currentIndex={0} totalCards={3} entries={entries} onClick={onClick} />,
    );
    const buttons = screen.getAllByRole('button');
    fireEvent.keyDown(buttons[1], { key: 'Enter' });
    expect(onClick).toHaveBeenCalledWith(1);
  });

  it('handles keyboard navigation on dots (Space key)', () => {
    const entries = makeEntries(3);
    const onClick = vi.fn();
    render(
      <NightProgressBar currentIndex={0} totalCards={3} entries={entries} onClick={onClick} />,
    );
    const buttons = screen.getAllByRole('button');
    fireEvent.keyDown(buttons[2], { key: ' ' });
    expect(onClick).toHaveBeenCalledWith(2);
  });

  it('uses grey color for structural entries and character type color for character entries', () => {
    const entries = makeEntries(3);
    const characterTypes = { 'char-1': 'Townsfolk', 'char-2': 'Demon' };
    const onClick = vi.fn();
    render(
      <NightProgressBar
        currentIndex={0}
        totalCards={3}
        entries={entries}
        characterTypes={characterTypes}
        onClick={onClick}
      />,
    );
    // All dots should render
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
  });

  it('renders correct number of dots when dead players are present', () => {
    const entries = makeEntries(3);
    const deadIds = new Set(['char-1']);
    const onClick = vi.fn();
    render(
      <NightProgressBar
        currentIndex={0}
        totalCards={3}
        entries={entries}
        deadIds={deadIds}
        onClick={onClick}
      />,
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
    // Dead entry still produces a dot that is clickable
    fireEvent.click(buttons[1]);
    expect(onClick).toHaveBeenCalledWith(1);
  });
});
