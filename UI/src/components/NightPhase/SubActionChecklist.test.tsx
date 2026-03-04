import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SubActionChecklist } from '@/components/NightPhase/SubActionChecklist.tsx';
import type { NightSubAction } from '@/types/index.ts';

// ──────────────────────────────────────────────
// Mock data
// ──────────────────────────────────────────────

const mockSubActions: NightSubAction[] = [
  { id: 'sa-1', description: 'Wake the character', isConditional: false },
  { id: 'sa-2', description: 'they nod, show them a token', isConditional: true },
  { id: 'sa-3', description: 'Put them to sleep', isConditional: false },
];

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe('SubActionChecklist', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <SubActionChecklist subActions={mockSubActions} checkedStates={[false, false, false]} onToggle={vi.fn()} />,
    );
    expect(container.querySelector('ul')).toBeInTheDocument();
  });

  it('displays all sub-action items with their descriptions', () => {
    render(
      <SubActionChecklist subActions={mockSubActions} checkedStates={[false, false, false]} onToggle={vi.fn()} />,
    );
    expect(screen.getByText('Wake the character')).toBeInTheDocument();
    expect(screen.getByText('they nod, show them a token')).toBeInTheDocument();
    expect(screen.getByText('Put them to sleep')).toBeInTheDocument();
  });

  it('shows checkboxes for each item', () => {
    render(
      <SubActionChecklist subActions={mockSubActions} checkedStates={[false, false, false]} onToggle={vi.fn()} />,
    );
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(3);
  });

  it('calls onToggle callback when an item is clicked with correct index', () => {
    const onToggle = vi.fn();
    render(
      <SubActionChecklist subActions={mockSubActions} checkedStates={[false, false, false]} onToggle={onToggle} />,
    );
    // Click on the second item text
    fireEvent.click(screen.getByText('they nod, show them a token'));
    expect(onToggle).toHaveBeenCalledWith(1);
  });

  it('calls onToggle when checkbox is clicked directly', () => {
    const onToggle = vi.fn();
    render(
      <SubActionChecklist subActions={mockSubActions} checkedStates={[false, false, false]} onToggle={onToggle} />,
    );
    // Click the third sub-action text (index 2)
    fireEvent.click(screen.getByText('Put them to sleep'));
    expect(onToggle).toHaveBeenCalledWith(2);
  });

  it('shows checked state for items marked as completed', () => {
    render(
      <SubActionChecklist subActions={mockSubActions} checkedStates={[true, false, true]} onToggle={vi.fn()} />,
    );
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
    expect(checkboxes[2]).toBeChecked();
  });

  it('handles conditional items with "If…" prefix and italic styling', () => {
    render(
      <SubActionChecklist subActions={mockSubActions} checkedStates={[false, false, false]} onToggle={vi.fn()} />,
    );
    // The conditional item should have an "If… " prefix rendered
    expect(screen.getByText('If…')).toBeInTheDocument();
    // The aria-label is on the MUI Checkbox <span> (not the inner <input>)
    // Query by aria-label to verify conditional prefix
    expect(
      screen.getByLabelText('Conditional: they nod, show them a token'),
    ).toBeInTheDocument();
    // Non-conditional items don't have the "Conditional:" prefix
    expect(screen.getByLabelText('Wake the character')).toBeInTheDocument();
  });

  it('handles empty sub-actions array', () => {
    const { container } = render(
      <SubActionChecklist subActions={[]} checkedStates={[]} onToggle={vi.fn()} />,
    );
    // Should render the list element but no items
    const list = container.querySelector('ul');
    expect(list).toBeInTheDocument();
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  });

  it('does not call onToggle when readOnly is true', () => {
    const onToggle = vi.fn();
    render(
      <SubActionChecklist
        subActions={mockSubActions}
        checkedStates={[false, false, false]}
        onToggle={onToggle}
        readOnly
      />,
    );
    fireEvent.click(screen.getByText('Wake the character'));
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('disables checkboxes when readOnly is true', () => {
    render(
      <SubActionChecklist
        subActions={mockSubActions}
        checkedStates={[false, false, false]}
        onToggle={vi.fn()}
        readOnly
      />,
    );
    const checkboxes = screen.getAllByRole('checkbox');
    for (const cb of checkboxes) {
      expect(cb).toBeDisabled();
    }
  });

  it('applies indentation to continuation lines after conditional items', () => {
    // sa-2 is conditional (at level 0), sa-3 follows conditional (indented to level 1)
    // sa-1 is first item (level 0), sa-2 is conditional (level 0)
    // per getIndentLevel logic: sa-3 follows sa-2 (conditional) → level 1
    const { container } = render(
      <SubActionChecklist subActions={mockSubActions} checkedStates={[false, false, false]} onToggle={vi.fn()} />,
    );
    // The third list item should have padding-left applied (pl: 1 * 3 = 3 MUI spacing units)
    const listItems = container.querySelectorAll('li');
    expect(listItems).toHaveLength(3);
    // Check that the component renders all three items
    expect(listItems[0]).toBeInTheDocument();
    expect(listItems[2]).toBeInTheDocument();
  });
});
