import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TokenManager, TokenBadges } from '@/components/TownSquare/TokenManager.tsx';
import type { PlayerSeat, PlayerToken, CharacterDef } from '@/types/index.ts';
import { CharacterType, Alignment } from '@/types/index.ts';

// ──────────────────────────────────────────────
// Mock generateId so we get predictable IDs
// ──────────────────────────────────────────────

vi.mock('@/utils/idGenerator.ts', () => ({
  generateId: vi.fn(() => 'mock-id-123'),
}));

// ──────────────────────────────────────────────
// Mock data
// ──────────────────────────────────────────────

const playerNoTokens: PlayerSeat = {
  seat: 1,
  playerName: 'Alice',
  characterId: 'noble',
  alive: true,
  ghostVoteUsed: false,
  visibleAlignment: Alignment.Unknown,
  actualAlignment: Alignment.Good,
  startingAlignment: Alignment.Good,
  activeReminders: [],
  isTraveller: false,
  tokens: [],
};

const drunkToken: PlayerToken = {
  id: 'tok-drunk-1',
  type: 'drunk',
  label: 'Drunk',
  color: '#1976d2',
};

const poisonedToken: PlayerToken = {
  id: 'tok-poisoned-1',
  type: 'poisoned',
  label: 'Poisoned',
  color: '#7b1fa2',
};

const customToken: PlayerToken = {
  id: 'tok-custom-1',
  type: 'custom',
  label: 'Is the Drunk',
  color: '#ff9800',
};

const playerWithTokens: PlayerSeat = {
  ...playerNoTokens,
  tokens: [drunkToken, poisonedToken, customToken],
};

const nobleCharacterWithReminders: CharacterDef = {
  id: 'noble',
  name: 'Noble',
  type: CharacterType.Townsfolk,
  defaultAlignment: Alignment.Good,
  abilityShort: 'On your 1st night, you learn 3 players.',
  firstNight: null,
  otherNights: null,
  reminders: [
    { id: 'noble-r1', text: 'Seen' },
    { id: 'noble-r2', text: 'No ability' },
  ],
};

const nobleCharacterNoReminders: CharacterDef = {
  id: 'noble',
  name: 'Noble',
  type: CharacterType.Townsfolk,
  defaultAlignment: Alignment.Good,
  abilityShort: 'On your 1st night, you learn 3 players.',
  firstNight: null,
  otherNights: null,
  reminders: [],
};

// ──────────────────────────────────────────────
// Tests — TokenManager (Dialog)
// ──────────────────────────────────────────────

describe('TokenManager', () => {
  const defaultProps = {
    open: true,
    player: playerNoTokens,
    onClose: vi.fn(),
    onAddToken: vi.fn(),
    onRemoveToken: vi.fn(),
  };

  it('renders nothing when player is null', () => {
    const { container } = render(
      <TokenManager {...defaultProps} player={null} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when not open', () => {
    render(<TokenManager {...defaultProps} open={false} />);
    expect(screen.queryByText(/Tokens/)).not.toBeInTheDocument();
  });

  it('shows dialog when open with valid player', () => {
    render(<TokenManager {...defaultProps} />);
    expect(screen.getByText(/Tokens — Alice/)).toBeInTheDocument();
    expect(screen.getByText(/Seat 1/)).toBeInTheDocument();
  });

  it('has Drunk toggle button', () => {
    render(<TokenManager {...defaultProps} />);
    // The toggle button has an emoji prefix: 🍺 Drunk
    expect(screen.getByRole('button', { name: /🍺\s*Drunk/i })).toBeInTheDocument();
  });

  it('has Poisoned toggle button', () => {
    render(<TokenManager {...defaultProps} />);
    // The toggle button has an emoji prefix: ☠️ Poisoned
    expect(screen.getByRole('button', { name: /☠️\s*Poisoned/i })).toBeInTheDocument();
  });

  it('clicking Drunk button calls onAddToken', () => {
    const onAddToken = vi.fn();
    render(<TokenManager {...defaultProps} onAddToken={onAddToken} />);
    fireEvent.click(screen.getByRole('button', { name: /🍺\s*Drunk/i }));
    expect(onAddToken).toHaveBeenCalledWith(1, expect.objectContaining({
      type: 'drunk',
      label: 'Drunk',
    }));
  });

  it('clicking Poisoned button calls onAddToken', () => {
    const onAddToken = vi.fn();
    render(<TokenManager {...defaultProps} onAddToken={onAddToken} />);
    fireEvent.click(screen.getByRole('button', { name: /☠️\s*Poisoned/i }));
    expect(onAddToken).toHaveBeenCalledWith(1, expect.objectContaining({
      type: 'poisoned',
      label: 'Poisoned',
    }));
  });

  it('clicking Drunk on player that already has Drunk removes it', () => {
    const onRemoveToken = vi.fn();
    render(
      <TokenManager
        {...defaultProps}
        player={playerWithTokens}
        onRemoveToken={onRemoveToken}
      />,
    );
    // Use the emoji-prefixed button text to disambiguate from the Chip
    fireEvent.click(screen.getByRole('button', { name: /🍺\s*Drunk/i }));
    expect(onRemoveToken).toHaveBeenCalledWith(1, 'tok-drunk-1');
  });

  it('shows existing tokens as chips', () => {
    render(<TokenManager {...defaultProps} player={playerWithTokens} />);
    expect(screen.getByText('Active Tokens')).toBeInTheDocument();
    // Check chip labels exist (Drunk appears both as chip and button, use getAllByText)
    expect(screen.getAllByText(/^Drunk$/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Poisoned')).toBeInTheDocument();
    expect(screen.getByText('Is the Drunk')).toBeInTheDocument();
  });

  it('has custom token input', () => {
    render(<TokenManager {...defaultProps} />);
    expect(screen.getByLabelText(/Custom token/i)).toBeInTheDocument();
  });

  it('has Add button for custom tokens', () => {
    render(<TokenManager {...defaultProps} />);
    expect(screen.getByRole('button', { name: /^Add$/i })).toBeInTheDocument();
  });

  it('Add button is disabled when custom input is empty', () => {
    render(<TokenManager {...defaultProps} />);
    const addButton = screen.getByRole('button', { name: /^Add$/i });
    expect(addButton).toBeDisabled();
  });

  it('clicking Add calls onAddToken with custom token', () => {
    const onAddToken = vi.fn();
    render(<TokenManager {...defaultProps} onAddToken={onAddToken} />);
    fireEvent.change(screen.getByLabelText(/Custom token/i), {
      target: { value: 'My Custom' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Add$/i }));
    expect(onAddToken).toHaveBeenCalledWith(1, expect.objectContaining({
      type: 'custom',
      label: 'My Custom',
    }));
  });

  it('shows character-specific reminder tokens when characterDef has reminders', () => {
    render(
      <TokenManager
        {...defaultProps}
        characterDef={nobleCharacterWithReminders}
      />,
    );
    expect(screen.getByText('Noble Reminders')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Seen' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'No ability' })).toBeInTheDocument();
  });

  it('does not show character reminders section when no reminders', () => {
    render(
      <TokenManager
        {...defaultProps}
        characterDef={nobleCharacterNoReminders}
      />,
    );
    expect(screen.queryByText('Noble Reminders')).not.toBeInTheDocument();
  });

  it('clicking reminder button calls onAddToken', () => {
    const onAddToken = vi.fn();
    render(
      <TokenManager
        {...defaultProps}
        onAddToken={onAddToken}
        characterDef={nobleCharacterWithReminders}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Seen' }));
    expect(onAddToken).toHaveBeenCalledWith(1, expect.objectContaining({
      type: 'custom',
      label: 'Seen',
    }));
  });

  it('has Close button', () => {
    render(<TokenManager {...defaultProps} />);
    expect(screen.getByRole('button', { name: /Close/i })).toBeInTheDocument();
  });

  it('calls onClose when Close button is clicked', () => {
    const onClose = vi.fn();
    render(<TokenManager {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /Close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

// ──────────────────────────────────────────────
// Tests — TokenBadges
// ──────────────────────────────────────────────

describe('TokenBadges', () => {
  it('renders nothing when tokens array is empty', () => {
    const { container } = render(
      <TokenBadges tokens={[]} tileX={100} tileY={100} centerX={200} centerY={200} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders badges for provided tokens', () => {
    render(
      <TokenBadges
        tokens={[drunkToken, customToken]}
        tileX={100}
        tileY={100}
        centerX={200}
        centerY={200}
      />,
    );
    expect(screen.getByTitle('Drunk')).toBeInTheDocument();
    // "Is the Drunk" → abbreviated to "Is t…"
    expect(screen.getByTitle('Is the Drunk')).toBeInTheDocument();
  });

  it('abbreviates long token labels', () => {
    const longToken: PlayerToken = {
      id: 'tok-long',
      type: 'custom',
      label: 'Very Long Label',
      color: '#ff0000',
    };
    render(
      <TokenBadges
        tokens={[longToken]}
        tileX={100}
        tileY={100}
        centerX={200}
        centerY={200}
      />,
    );
    // "Very Long Label" → abbreviated to "Very…"
    expect(screen.getByText('Very…')).toBeInTheDocument();
  });

  it('shows full label for short tokens', () => {
    const shortToken: PlayerToken = {
      id: 'tok-short',
      type: 'custom',
      label: 'Mad',
      color: '#ff0000',
    };
    render(
      <TokenBadges
        tokens={[shortToken]}
        tileX={100}
        tileY={100}
        centerX={200}
        centerY={200}
      />,
    );
    expect(screen.getByText('Mad')).toBeInTheDocument();
  });
});
