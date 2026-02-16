import type { Meta, StoryObj } from '@storybook/react-vite';
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
