import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, userEvent, expect, fn } from 'storybook/test';
import { SyncStatusIndicator } from './SyncStatusIndicator';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

const meta = {
  title: 'Common/SyncStatusIndicator',
  component: SyncStatusIndicator,
  decorators: [
    (Story) => (
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Storyteller Cards
          </Typography>
          <Story />
        </Toolbar>
      </AppBar>
    ),
  ],
} satisfies Meta<typeof SyncStatusIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Idle — all data is synced. Shows a green checkmark. */
export const Idle: Story = {
  args: { status: 'idle', onRefresh: fn() },
};

/** Syncing — a push or pull is in progress. Shows a spinning indicator. */
export const Syncing: Story = {
  args: { status: 'syncing', onRefresh: fn() },
};

/** Error — push failed after retries. Shows an amber warning icon. */
export const Error: Story = {
  args: { status: 'error', onRefresh: fn() },
};

/** Offline — API unreachable. Shows a grey cloud-off icon. */
export const Offline: Story = {
  args: { status: 'offline', onRefresh: fn() },
};

/** Without a refresh button — when onRefresh is not provided. */
export const NoRefreshButton: Story = {
  args: { status: 'idle' },
};

/** Clicking the refresh button triggers the onRefresh callback. */
export const RefreshClick: Story = {
  args: { status: 'idle', onRefresh: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const refreshButton = canvas.getByRole('button', { name: /refresh sync/i });
    await expect(refreshButton).toBeInTheDocument();
    await userEvent.click(refreshButton);
    await expect(args.onRefresh).toHaveBeenCalledTimes(1);
  },
};
