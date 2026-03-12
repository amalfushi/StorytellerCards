import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SyncStatusIndicator } from './SyncStatusIndicator.tsx';
import type { SyncStatus } from '@/types/index.ts';

describe('SyncStatusIndicator', () => {
  it('renders without errors', () => {
    render(<SyncStatusIndicator status="idle" />);
    expect(screen.getByLabelText('sync status: Synced')).toBeInTheDocument();
  });

  it.each([
    ['idle', 'Synced'],
    ['syncing', 'Syncing…'],
    ['error', 'Sync error'],
    ['offline', 'Offline'],
  ] as [SyncStatus, string][])(
    'shows correct aria-label for status "%s"',
    (status, expectedLabel) => {
      render(<SyncStatusIndicator status={status} />);
      expect(screen.getByLabelText(`sync status: ${expectedLabel}`)).toBeInTheDocument();
    },
  );

  it('renders refresh button when onRefresh is provided', () => {
    render(<SyncStatusIndicator status="idle" onRefresh={vi.fn()} />);
    expect(screen.getByLabelText('refresh sync')).toBeInTheDocument();
  });

  it('does not render refresh button when onRefresh is not provided', () => {
    render(<SyncStatusIndicator status="idle" />);
    expect(screen.queryByLabelText('refresh sync')).not.toBeInTheDocument();
  });

  it('calls onRefresh when refresh button is clicked', async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn();
    render(<SyncStatusIndicator status="idle" onRefresh={onRefresh} />);

    await user.click(screen.getByLabelText('refresh sync'));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('shows spinning indicator for syncing status', () => {
    render(<SyncStatusIndicator status="syncing" />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('does not show progressbar for idle status', () => {
    render(<SyncStatusIndicator status="idle" />);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});
