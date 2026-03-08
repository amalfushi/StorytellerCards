import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { PhaseBar } from '@/components/PhaseBar/PhaseBar.tsx';

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe('PhaseBar', () => {
  const defaultProps = {
    activeView: 'Day' as const,
    nightInProgress: false,
    onDayClick: vi.fn(),
    onNightClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<PhaseBar {...defaultProps} />);
    expect(container).toBeTruthy();
  });

  it('shows Day and Night phase options', () => {
    render(<PhaseBar {...defaultProps} />);
    expect(screen.getByText('Day')).toBeInTheDocument();
    expect(screen.getByText('Night')).toBeInTheDocument();
  });

  it('has navigation role', () => {
    render(<PhaseBar {...defaultProps} />);
    expect(screen.getByRole('navigation', { name: 'Game phase selector' })).toBeInTheDocument();
  });

  it('calls onNightClick when clicking Night chip', async () => {
    const onNightClick = vi.fn();
    render(<PhaseBar {...defaultProps} onNightClick={onNightClick} />);
    await userEvent.click(screen.getByText('Night'));
    expect(onNightClick).toHaveBeenCalledTimes(1);
  });

  it('calls onDayClick when clicking Day chip', async () => {
    const onDayClick = vi.fn();
    render(<PhaseBar {...defaultProps} activeView="Night" onDayClick={onDayClick} />);
    await userEvent.click(screen.getByText('Day'));
    expect(onDayClick).toHaveBeenCalledTimes(1);
  });

  it('visually highlights the Day chip when activeView is Day', () => {
    render(<PhaseBar {...defaultProps} activeView="Day" />);
    const dayChip = screen.getByText('Day').closest('.MuiChip-root');
    // Day chip should have bold font weight (700) when active
    expect(dayChip).toHaveStyle({ fontWeight: 700 });
  });

  it('visually highlights the Night chip when activeView is Night', () => {
    render(<PhaseBar {...defaultProps} activeView="Night" />);
    const nightChip = screen.getByText('Night').closest('.MuiChip-root');
    expect(nightChip).toHaveStyle({ fontWeight: 700 });
  });

  it('shows night-in-progress dot when nightInProgress is true and viewing Day', () => {
    render(<PhaseBar {...defaultProps} nightInProgress={true} activeView="Day" />);
    expect(screen.getByTestId('night-in-progress-dot')).toBeInTheDocument();
  });

  it('does not show night-in-progress dot when viewing Night', () => {
    render(<PhaseBar {...defaultProps} nightInProgress={true} activeView="Night" />);
    expect(screen.queryByTestId('night-in-progress-dot')).not.toBeInTheDocument();
  });

  it('does not show night-in-progress dot when no night in progress', () => {
    render(<PhaseBar {...defaultProps} nightInProgress={false} activeView="Day" />);
    expect(screen.queryByTestId('night-in-progress-dot')).not.toBeInTheDocument();
  });
});
