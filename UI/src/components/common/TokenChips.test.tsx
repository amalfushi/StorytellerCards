import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TokenChips } from '@/components/common/TokenChips.tsx';
import type { PlayerToken } from '@/types/index.ts';

// ──────────────────────────────────────────────
// Mock token data
// ──────────────────────────────────────────────

const drunkToken: PlayerToken = {
  id: 'token-drunk-1',
  type: 'drunk',
  label: 'Drunk',
};

const poisonedToken: PlayerToken = {
  id: 'token-poisoned-1',
  type: 'poisoned',
  label: 'Poisoned',
};

const customToken: PlayerToken = {
  id: 'token-custom-1',
  type: 'custom',
  label: 'Protected',
  color: '#ff5722',
};

const customTokenNoColor: PlayerToken = {
  id: 'token-custom-2',
  type: 'custom',
  label: 'Cursed',
};

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe('TokenChips', () => {
  it('renders nothing when tokens array is empty', () => {
    const { container } = render(<TokenChips tokens={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders a chip for each token', () => {
    render(<TokenChips tokens={[drunkToken, poisonedToken, customToken]} />);
    expect(screen.getByText('Drunk')).toBeInTheDocument();
    expect(screen.getByText('Poisoned')).toBeInTheDocument();
    expect(screen.getByText('Protected')).toBeInTheDocument();
  });

  it('shows correct label for drunk token', () => {
    render(<TokenChips tokens={[drunkToken]} />);
    expect(screen.getByText('Drunk')).toBeInTheDocument();
  });

  it('shows correct label for poisoned token', () => {
    render(<TokenChips tokens={[poisonedToken]} />);
    expect(screen.getByText('Poisoned')).toBeInTheDocument();
  });

  it('shows correct label for custom tokens', () => {
    render(<TokenChips tokens={[customToken]} />);
    expect(screen.getByText('Protected')).toBeInTheDocument();
  });

  it('displays purple background for drunk token', () => {
    render(<TokenChips tokens={[drunkToken]} />);
    const chip = screen.getByText('Drunk').closest('.MuiChip-root');
    expect(chip).toHaveStyle({ backgroundColor: '#7b1fa2' });
  });

  it('displays green background for poisoned token', () => {
    render(<TokenChips tokens={[poisonedToken]} />);
    const chip = screen.getByText('Poisoned').closest('.MuiChip-root');
    expect(chip).toHaveStyle({ backgroundColor: '#388e3c' });
  });

  it('displays custom color when provided on custom token', () => {
    render(<TokenChips tokens={[customToken]} />);
    const chip = screen.getByText('Protected').closest('.MuiChip-root');
    expect(chip).toHaveStyle({ backgroundColor: '#ff5722' });
  });

  it('displays grey fallback for custom token without color', () => {
    render(<TokenChips tokens={[customTokenNoColor]} />);
    const chip = screen.getByText('Cursed').closest('.MuiChip-root');
    expect(chip).toHaveStyle({ backgroundColor: '#757575' });
  });

  it('renders with small size by default', () => {
    render(<TokenChips tokens={[drunkToken]} />);
    const chip = screen.getByText('Drunk').closest('.MuiChip-root');
    expect(chip).toHaveClass('MuiChip-sizeSmall');
  });

  it('renders with medium size when specified', () => {
    render(<TokenChips tokens={[drunkToken]} size="medium" />);
    const chip = screen.getByText('Drunk').closest('.MuiChip-root');
    expect(chip).toHaveClass('MuiChip-sizeMedium');
  });

  it('renders all chips with white text color', () => {
    render(<TokenChips tokens={[drunkToken, poisonedToken, customToken]} />);
    const chips = [
      screen.getByText('Drunk').closest('.MuiChip-root'),
      screen.getByText('Poisoned').closest('.MuiChip-root'),
      screen.getByText('Protected').closest('.MuiChip-root'),
    ];
    for (const chip of chips) {
      expect(chip).toHaveStyle({ color: '#fff' });
    }
  });
});
