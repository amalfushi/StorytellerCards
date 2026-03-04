import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, userEvent, expect } from 'storybook/test';
import { ShowCharactersToggle } from './ShowCharactersToggle';
import { withMockGameContext } from '../../stories/decorators';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

const meta = {
  title: 'Common/ShowCharactersToggle',
  component: ShowCharactersToggle,
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
} satisfies Meta<typeof ShowCharactersToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Day mode — showCharacters is false, eye icon is dim / closed. */
export const DayMode: Story = {
  decorators: [withMockGameContext({ showCharacters: false })],
};

/** Night mode — showCharacters is true, eye icon is glowing gold. */
export const NightMode: Story = {
  decorators: [withMockGameContext({ showCharacters: true })],
};

// ────────────────────────────────────────────────────────
// Interaction test (P2-3)
// ────────────────────────────────────────────────────────

/** Clicking the toggle switches from day → night mode (shows character info). */
export const ToggleClick: Story = {
  decorators: [withMockGameContext({ showCharacters: false })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Initially in day mode — the button says "Show character info"
    const toggleButton = canvas.getByRole('button', { name: /show character info/i });
    await expect(toggleButton).toBeInTheDocument();
    await userEvent.click(toggleButton);
    // After click, label changes to "Hide character info"
    const hiddenButton = canvas.getByRole('button', { name: /hide character info/i });
    await expect(hiddenButton).toBeInTheDocument();
  },
};
