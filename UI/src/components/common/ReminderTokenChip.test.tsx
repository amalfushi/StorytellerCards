import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReminderTokenChip } from '@/components/common/ReminderTokenChip.tsx';
import { resolveTokenColor } from '@/components/common/characterTypeColor.ts';
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

const customTokenWithSource: PlayerToken = {
  id: 'token-custom-3',
  type: 'custom',
  label: 'Is the Drunk',
  sourceCharacterId: 'noble',
};

// ──────────────────────────────────────────────
// Tests — resolveTokenColor
// ──────────────────────────────────────────────

describe('resolveTokenColor', () => {
  it('returns purple for drunk tokens', () => {
    expect(resolveTokenColor(drunkToken)).toBe('#7b1fa2');
  });

  it('returns green for poisoned tokens', () => {
    expect(resolveTokenColor(poisonedToken)).toBe('#388e3c');
  });

  it('returns custom color when set on custom token', () => {
    expect(resolveTokenColor(customToken)).toBe('#ff5722');
  });

  it('returns grey fallback for custom token without color', () => {
    expect(resolveTokenColor(customTokenNoColor)).toBe('#757575');
  });
});

// ──────────────────────────────────────────────
// Tests — ReminderTokenChip
// ──────────────────────────────────────────────

describe('ReminderTokenChip', () => {
  it('renders the token label', () => {
    render(<ReminderTokenChip token={drunkToken} />);
    expect(screen.getByText('Drunk')).toBeInTheDocument();
  });

  it('renders as a MUI Chip', () => {
    render(<ReminderTokenChip token={drunkToken} />);
    const chip = screen.getByText('Drunk').closest('.MuiChip-root');
    expect(chip).toBeInTheDocument();
  });

  it('applies correct colour for drunk token', () => {
    render(<ReminderTokenChip token={drunkToken} />);
    const chip = screen.getByText('Drunk').closest('.MuiChip-root');
    expect(chip).toHaveStyle({ backgroundColor: '#7b1fa2' });
  });

  it('applies correct colour for poisoned token', () => {
    render(<ReminderTokenChip token={poisonedToken} />);
    const chip = screen.getByText('Poisoned').closest('.MuiChip-root');
    expect(chip).toHaveStyle({ backgroundColor: '#388e3c' });
  });

  it('applies custom colour for custom token', () => {
    render(<ReminderTokenChip token={customToken} />);
    const chip = screen.getByText('Protected').closest('.MuiChip-root');
    expect(chip).toHaveStyle({ backgroundColor: '#ff5722' });
  });

  it('applies grey fallback for custom token without colour', () => {
    render(<ReminderTokenChip token={customTokenNoColor} />);
    const chip = screen.getByText('Cursed').closest('.MuiChip-root');
    expect(chip).toHaveStyle({ backgroundColor: '#757575' });
  });

  it('renders small size by default', () => {
    render(<ReminderTokenChip token={drunkToken} />);
    const chip = screen.getByText('Drunk').closest('.MuiChip-root');
    expect(chip).toHaveClass('MuiChip-sizeSmall');
  });

  it('renders medium size when specified', () => {
    render(<ReminderTokenChip token={drunkToken} size="medium" />);
    const chip = screen.getByText('Drunk').closest('.MuiChip-root');
    expect(chip).toHaveClass('MuiChip-sizeMedium');
  });

  it('renders white text colour', () => {
    render(<ReminderTokenChip token={drunkToken} />);
    const chip = screen.getByText('Drunk').closest('.MuiChip-root');
    expect(chip).toHaveStyle({ color: '#fff' });
  });

  it('renders delete button when onRemove is provided', () => {
    const handleRemove = vi.fn();
    render(<ReminderTokenChip token={drunkToken} onRemove={handleRemove} />);
    const deleteButton = screen.getByTestId('CancelIcon');
    fireEvent.click(deleteButton);
    expect(handleRemove).toHaveBeenCalledTimes(1);
  });

  it('does not render delete button when onRemove is not provided', () => {
    render(<ReminderTokenChip token={drunkToken} />);
    expect(screen.queryByTestId('CancelIcon')).not.toBeInTheDocument();
  });

  it('renders source character avatar using base icon path (no alignment suffix)', () => {
    render(<ReminderTokenChip token={customTokenWithSource} />);
    const avatar = screen.getByRole('img');
    // Reminder tokens always use the default/neutral icon (no _e or _g suffix)
    expect(avatar).toHaveAttribute('src', '/icons/characters/nobleIcon.webp');
  });

  it('does not render avatar when sourceCharacterId is absent', () => {
    render(<ReminderTokenChip token={customToken} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
