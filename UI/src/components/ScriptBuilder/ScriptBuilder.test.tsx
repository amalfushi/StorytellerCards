import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

  // SKIP: Times out (>5000ms) in coverage mode when full suite runs.
  // Rendering 43+ MUI character rows is too slow under v8 instrumentation.
  // See docs/milestones/8 - scriptbuilder-perf/milestone8.md for investigation plan.
  it.skip('can toggle character selection via checkbox', () => {
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
});
