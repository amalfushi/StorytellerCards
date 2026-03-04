import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingState } from '@/components/common/LoadingState.tsx';

describe('LoadingState', () => {
  it('renders without crashing', () => {
    render(<LoadingState />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows a loading indicator (CircularProgress)', () => {
    render(<LoadingState />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('has default aria-label "Loading" when no message provided', () => {
    render(<LoadingState />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading');
  });

  it('displays custom message when provided', () => {
    render(<LoadingState message="Importing script…" />);
    expect(screen.getByText('Importing script…')).toBeInTheDocument();
  });

  it('uses custom message as aria-label', () => {
    render(<LoadingState message="Loading game data" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading game data');
  });

  it('does not render message text when no message provided', () => {
    const { container } = render(<LoadingState />);
    // Only the CircularProgress should be inside, no Typography for message
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs).toHaveLength(0);
  });
});
