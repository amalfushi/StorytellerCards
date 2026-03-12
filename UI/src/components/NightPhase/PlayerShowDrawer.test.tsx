import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlayerShowDrawer } from '@/components/NightPhase/PlayerShowDrawer.tsx';
import type { CharacterDef } from '@/types/index.ts';

const makeChar = (overrides: Partial<CharacterDef> = {}): CharacterDef => ({
  id: 'washerwoman',
  name: 'Washerwoman',
  type: 'Townsfolk',
  defaultAlignment: 'Good',
  abilityShort: 'Test ability',
  firstNight: null,
  otherNights: null,
  reminders: [],
  ...overrides,
});

const bluffCharacters: CharacterDef[] = [
  makeChar({ id: 'washerwoman', name: 'Washerwoman', type: 'Townsfolk' }),
  makeChar({ id: 'empath', name: 'Empath', type: 'Townsfolk' }),
  makeChar({ id: 'butler', name: 'Butler', type: 'Outsider' }),
];

const defaultProps = {
  open: true,
  onClose: vi.fn(),
};

describe('PlayerShowDrawer', () => {
  it('renders the drawer with Show Player header', () => {
    render(<PlayerShowDrawer {...defaultProps} />);
    expect(screen.getByText('Show Player')).toBeInTheDocument();
  });

  it('shows custom message section', () => {
    render(<PlayerShowDrawer {...defaultProps} />);
    expect(screen.getByText('Custom Message')).toBeInTheDocument();
    expect(screen.getByTestId('custom-message-input')).toBeInTheDocument();
  });

  it('shows bluffs button when bluffCharacters are provided', () => {
    render(
      <PlayerShowDrawer
        {...defaultProps}
        bluffCharacters={bluffCharacters}
        bluffLabel="Demon Bluffs"
      />,
    );
    expect(screen.getByTestId('show-bluffs-btn')).toBeInTheDocument();
    expect(screen.getByText('Show Demon Bluffs')).toBeInTheDocument();
  });

  it('does not show bluffs button when no bluffCharacters', () => {
    render(<PlayerShowDrawer {...defaultProps} />);
    expect(screen.queryByTestId('show-bluffs-btn')).not.toBeInTheDocument();
  });

  it('uses custom bluff label', () => {
    render(
      <PlayerShowDrawer
        {...defaultProps}
        bluffCharacters={bluffCharacters}
        bluffLabel="Lunatic Bluffs"
      />,
    );
    expect(screen.getByText('Show Lunatic Bluffs')).toBeInTheDocument();
  });

  it('shows the custom message show button disabled when input is empty', () => {
    render(<PlayerShowDrawer {...defaultProps} />);
    expect(screen.getByTestId('show-custom-message-btn')).toBeDisabled();
  });

  it('enables show button when custom message is typed', () => {
    render(<PlayerShowDrawer {...defaultProps} />);
    const input = screen.getByTestId('custom-message-input').querySelector('textarea')!;
    fireEvent.change(input, { target: { value: 'Hello player' } });
    expect(screen.getByTestId('show-custom-message-btn')).not.toBeDisabled();
  });

  it('shows clear button when message has content', () => {
    render(<PlayerShowDrawer {...defaultProps} customMessage="Existing message" />);
    expect(screen.getByTestId('clear-custom-message-btn')).toBeInTheDocument();
  });

  it('does not show clear button when message is empty', () => {
    render(<PlayerShowDrawer {...defaultProps} />);
    expect(screen.queryByTestId('clear-custom-message-btn')).not.toBeInTheDocument();
  });

  it('calls onClearCustomMessage when clear is clicked', () => {
    const onClear = vi.fn();
    render(
      <PlayerShowDrawer
        {...defaultProps}
        customMessage="Some message"
        onClearCustomMessage={onClear}
      />,
    );
    fireEvent.click(screen.getByTestId('clear-custom-message-btn'));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('pre-fills custom message from prop', () => {
    render(<PlayerShowDrawer {...defaultProps} customMessage="Pre-filled message" />);
    const input = screen.getByTestId('custom-message-input').querySelector('textarea')!;
    expect(input).toHaveValue('Pre-filled message');
  });

  it('calls onClose when close icon is clicked', () => {
    const onClose = vi.fn();
    render(<PlayerShowDrawer open={true} onClose={onClose} />);
    // The drawer has a small CloseIcon button in the header
    const closeButtons = screen.getAllByRole('button');
    // The last icon button with CloseIcon is the header close
    const headerClose = closeButtons.find((btn) => btn.querySelector('[data-testid="CloseIcon"]'));
    expect(headerClose).toBeDefined();
    fireEvent.click(headerClose!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not render when open is false', () => {
    render(<PlayerShowDrawer open={false} onClose={vi.fn()} />);
    expect(screen.queryByText('Show Player')).not.toBeInTheDocument();
  });

  it('opens fullscreen show screen when Show Bluffs is clicked', () => {
    render(
      <PlayerShowDrawer
        {...defaultProps}
        bluffCharacters={bluffCharacters}
        bluffLabel="Demon Bluffs"
      />,
    );
    fireEvent.click(screen.getByTestId('show-bluffs-btn'));
    expect(screen.getByText('Your bluffs are:')).toBeInTheDocument();
  });
});
