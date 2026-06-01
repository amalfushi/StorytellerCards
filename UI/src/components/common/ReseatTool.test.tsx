import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReseatTool } from '@/components/common/ReseatTool.tsx';

const players = [
  { seat: 1, playerName: 'Alice' },
  { seat: 2, playerName: 'Bob' },
  { seat: 3, playerName: 'Charlie' },
];

describe('ReseatTool', () => {
  it('renders the two-step dialog', () => {
    render(<ReseatTool open players={players} onClose={vi.fn()} onConfirmSwap={vi.fn()} />);
    expect(screen.getByText('Reseat players')).toBeInTheDocument();
    expect(screen.getByText(/Tap first player/)).toBeInTheDocument();
  });

  it('selects two players and shows a live preview', () => {
    render(<ReseatTool open players={players} onClose={vi.fn()} onConfirmSwap={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Seat 1 Alice/i }));
    fireEvent.click(screen.getByRole('button', { name: /Seat 3 Charlie/i }));
    expect(screen.getByTestId('reseat-preview')).toHaveTextContent(
      'Alice (seat 1) ⇄ Charlie (seat 3)',
    );
  });

  it('confirms the swap via callback', () => {
    const onConfirmSwap = vi.fn();
    const onClose = vi.fn();
    render(<ReseatTool open players={players} onClose={onClose} onConfirmSwap={onConfirmSwap} />);
    fireEvent.click(screen.getByRole('button', { name: /Seat 1 Alice/i }));
    fireEvent.click(screen.getByRole('button', { name: /Seat 2 Bob/i }));
    fireEvent.click(screen.getByRole('button', { name: /Confirm swap/i }));
    expect(onConfirmSwap).toHaveBeenCalledWith(1, 2);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('starts with a pre-targeted first player', () => {
    render(
      <ReseatTool
        open
        players={players}
        initialSeat={2}
        onClose={vi.fn()}
        onConfirmSwap={vi.fn()}
      />,
    );
    expect(screen.getByText(/Bob selected/)).toBeInTheDocument();
    expect(screen.getByText(/Tap second player/)).toBeInTheDocument();
  });

  it('cancels without changes', () => {
    const onClose = vi.fn();
    const onConfirmSwap = vi.fn();
    render(<ReseatTool open players={players} onClose={onClose} onConfirmSwap={onConfirmSwap} />);
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirmSwap).not.toHaveBeenCalled();
  });
});
