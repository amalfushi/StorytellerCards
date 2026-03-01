import type { Meta, StoryObj } from '@storybook/react-vite';
import { PhaseBar } from './PhaseBar';
import { Phase } from '../../types';
import { withMockGameContext } from '../../stories/decorators';

const meta = {
  title: 'PhaseBar/PhaseBar',
  component: PhaseBar,
} satisfies Meta<typeof PhaseBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Day phase — main daytime activity. */
export const Day: Story = {
  decorators: [withMockGameContext({ game: { currentPhase: Phase.Day } as never })],
};

/** Night phase — nighttime actions in progress. */
export const Night: Story = {
  decorators: [withMockGameContext({ game: { currentPhase: Phase.Night } as never })],
};
