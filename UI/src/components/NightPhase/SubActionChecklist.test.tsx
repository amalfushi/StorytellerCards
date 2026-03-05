import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SubActionChecklist } from '@/components/NightPhase/SubActionChecklist.tsx';
import { computeActionableIndices } from '@/components/NightPhase/subActionUtils.ts';
import type { NightSubAction } from '@/types/index.ts';

// ──────────────────────────────────────────────
// Mock data
// ──────────────────────────────────────────────

/** Pit-Hag pattern: 4 items — first non-conditional, second non-conditional,
 *  third conditional, fourth non-conditional.
 *  Actionable indices: 0 (first item) and 2 (conditional). */
const pitHagSubActions: NightSubAction[] = [
  { id: 'ph-1', description: 'The Pit-Hag chooses a player & a character.', isConditional: false },
  { id: 'ph-2', description: 'Choose a player', isConditional: false },
  {
    id: 'ph-3',
    description: 'If they chose a character that is not in play: Put the Pit-Hag to sleep.',
    isConditional: true,
  },
  {
    id: 'ph-4',
    description: 'Wake the target. Show the YOU ARE token & their new character token.',
    isConditional: false,
  },
];

/** Single sub-action (Poisoner pattern). */
const singleSubAction: NightSubAction[] = [
  { id: 'p-1', description: 'The Poisoner chooses a player.', isConditional: false },
];

// ──────────────────────────────────────────────
// computeActionableIndices unit tests
// ──────────────────────────────────────────────

describe('computeActionableIndices', () => {
  it('returns {0} for a single non-conditional item', () => {
    const result = computeActionableIndices(singleSubAction);
    expect(result).toEqual(new Set([0]));
  });

  it('returns {0} for multiple non-conditional items (only first is actionable)', () => {
    const items: NightSubAction[] = [
      { id: 'a', description: 'Step 1', isConditional: false },
      { id: 'b', description: 'Step 2', isConditional: false },
      { id: 'c', description: 'Step 3', isConditional: false },
    ];
    const result = computeActionableIndices(items);
    expect(result).toEqual(new Set([0]));
  });

  it('returns {0, 1} when second item is conditional', () => {
    const items: NightSubAction[] = [
      { id: 'a', description: 'Step 1', isConditional: false },
      { id: 'b', description: 'If something happens', isConditional: true },
    ];
    const result = computeActionableIndices(items);
    expect(result).toEqual(new Set([0, 1]));
  });

  it('returns {0, 2} for [normal, normal, conditional] pattern', () => {
    const items: NightSubAction[] = [
      { id: 'a', description: 'Step 1', isConditional: false },
      { id: 'b', description: 'Step 2', isConditional: false },
      { id: 'c', description: 'If condition', isConditional: true },
    ];
    const result = computeActionableIndices(items);
    expect(result).toEqual(new Set([0, 2]));
  });

  it('returns empty set for empty array', () => {
    const result = computeActionableIndices([]);
    expect(result).toEqual(new Set());
  });

  it('returns {0, 2} for pit-hag pattern (4 items)', () => {
    const result = computeActionableIndices(pitHagSubActions);
    expect(result).toEqual(new Set([0, 2]));
  });
});

// ──────────────────────────────────────────────
// SubActionChecklist rendering tests
// ──────────────────────────────────────────────

describe('SubActionChecklist', () => {
  it('renders checkboxes only for actionable items', () => {
    render(
      <SubActionChecklist
        subActions={pitHagSubActions}
        checkedStates={[false, false, false, false]}
        onToggle={vi.fn()}
      />,
    );
    // Only index 0 and 2 are actionable → 2 checkboxes
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2);
  });

  it('renders non-actionable items without checkboxes', () => {
    render(
      <SubActionChecklist
        subActions={pitHagSubActions}
        checkedStates={[false, false, false, false]}
        onToggle={vi.fn()}
      />,
    );
    // Index 1 and 3 are non-actionable — their text should be visible
    expect(screen.getByText('Choose a player')).toBeInTheDocument();
    expect(
      screen.getByText('Wake the target. Show the YOU ARE token & their new character token.'),
    ).toBeInTheDocument();
    // But only 2 checkboxes exist (not 4)
    expect(screen.getAllByRole('checkbox')).toHaveLength(2);
  });

  it('non-actionable items are indented', () => {
    const { container } = render(
      <SubActionChecklist
        subActions={pitHagSubActions}
        checkedStates={[false, false, false, false]}
        onToggle={vi.fn()}
      />,
    );
    const listItems = container.querySelectorAll('li');
    expect(listItems).toHaveLength(4);
    // MUI sx props aren't resolved by getComputedStyle in jsdom,
    // so verify structurally: non-actionable items (index 1, 3) lack checkboxes
    // while actionable items (index 0, 2) have checkboxes
    const item0Checkbox = listItems[0].querySelector('input[type="checkbox"]');
    const item1Checkbox = listItems[1].querySelector('input[type="checkbox"]');
    const item2Checkbox = listItems[2].querySelector('input[type="checkbox"]');
    const item3Checkbox = listItems[3].querySelector('input[type="checkbox"]');
    expect(item0Checkbox).not.toBeNull();
    expect(item1Checkbox).toBeNull(); // non-actionable, indented
    expect(item2Checkbox).not.toBeNull();
    expect(item3Checkbox).toBeNull(); // non-actionable, indented
  });

  it('calls onToggle with correct index when actionable item is clicked', () => {
    const onToggle = vi.fn();
    render(
      <SubActionChecklist
        subActions={pitHagSubActions}
        checkedStates={[false, false, false, false]}
        onToggle={onToggle}
      />,
    );
    // Click on the conditional item text (index 2 in original array)
    fireEvent.click(
      screen.getByText('If they chose a character that is not in play: Put the Pit-Hag to sleep.'),
    );
    expect(onToggle).toHaveBeenCalledWith(2);
  });

  it('does not call onToggle when non-actionable item is clicked', () => {
    const onToggle = vi.fn();
    render(
      <SubActionChecklist
        subActions={pitHagSubActions}
        checkedStates={[false, false, false, false]}
        onToggle={onToggle}
      />,
    );
    // Click on a non-actionable item (index 1)
    fireEvent.click(screen.getByText('Choose a player'));
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('shows checked state correctly for actionable items', () => {
    render(
      <SubActionChecklist
        subActions={pitHagSubActions}
        checkedStates={[true, false, false, false]}
        onToggle={vi.fn()}
      />,
    );
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
  });

  it('conditional items show If… prefix', () => {
    render(
      <SubActionChecklist
        subActions={pitHagSubActions}
        checkedStates={[false, false, false, false]}
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByText('If…')).toBeInTheDocument();
    expect(
      screen.getByLabelText(
        'Conditional: If they chose a character that is not in play: Put the Pit-Hag to sleep.',
      ),
    ).toBeInTheDocument();
  });

  it('handles empty sub-actions array', () => {
    const { container } = render(
      <SubActionChecklist subActions={[]} checkedStates={[]} onToggle={vi.fn()} />,
    );
    const list = container.querySelector('ul');
    expect(list).toBeInTheDocument();
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  });

  it('readOnly disables checkboxes', () => {
    render(
      <SubActionChecklist
        subActions={pitHagSubActions}
        checkedStates={[false, false, false, false]}
        onToggle={vi.fn()}
        readOnly
      />,
    );
    const checkboxes = screen.getAllByRole('checkbox');
    for (const cb of checkboxes) {
      expect(cb).toBeDisabled();
    }
  });

  it('readOnly prevents onToggle when actionable item is clicked', () => {
    const onToggle = vi.fn();
    render(
      <SubActionChecklist
        subActions={pitHagSubActions}
        checkedStates={[false, false, false, false]}
        onToggle={onToggle}
        readOnly
      />,
    );
    fireEvent.click(screen.getByText('The Pit-Hag chooses a player & a character.'));
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('single sub-action gets a checkbox', () => {
    render(
      <SubActionChecklist
        subActions={singleSubAction}
        checkedStates={[false]}
        onToggle={vi.fn()}
      />,
    );
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(1);
    expect(screen.getByText('The Poisoner chooses a player.')).toBeInTheDocument();
  });
});
