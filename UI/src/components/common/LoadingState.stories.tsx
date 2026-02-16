import type { Meta, StoryObj } from '@storybook/react-vite';
import { LoadingState } from './LoadingState';
import Box from '@mui/material/Box';

const meta = {
  title: 'Common/LoadingState',
  component: LoadingState,
  decorators: [
    (Story) => (
      <Box sx={{ height: 300 }}>
        <Story />
      </Box>
    ),
  ],
} satisfies Meta<typeof LoadingState>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default spinner with no message. */
export const Default: Story = {
  args: {},
};

/** Spinner with an explanatory message. */
export const WithMessage: Story = {
  args: {
    message: 'Loading game data…',
  },
};
