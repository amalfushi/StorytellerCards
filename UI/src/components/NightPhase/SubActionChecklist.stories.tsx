import type { Meta, StoryObj } from '@storybook/react-vite';
import { SubActionChecklist } from './SubActionChecklist';
import { fortuneTeller, philosopher } from '../../stories/mockData';
import Box from '@mui/material/Box';

const noop = () => {};

const meta = {
  title: 'NightPhase/SubActionChecklist',
  component: SubActionChecklist,
  decorators: [
    (Story) => (
      <Box sx={{ bgcolor: 'rgba(30, 30, 50, 0.95)', p: 2, maxWidth: 400 }}>
        <Story />
      </Box>
    ),
  ],
  args: {
    onToggle: noop,
  },
  argTypes: {
    readOnly: { control: 'boolean' },
  },
} satisfies Meta<typeof SubActionChecklist>;

export default meta;
type Story = StoryObj<typeof meta>;

/** No sub-actions to display. */
export const Empty: Story = {
  args: {
    subActions: [],
    checkedStates: [],
  },
};

/** Four sub-actions from the Fortune Teller, all unchecked. */
export const Unchecked: Story = {
  args: {
    subActions: [...fortuneTeller.firstNight!.subActions, ...fortuneTeller.otherNights!.subActions],
    checkedStates: [false, false, false, false],
  },
};

/** Four sub-actions, first two checked. */
export const PartiallyChecked: Story = {
  args: {
    subActions: [...fortuneTeller.firstNight!.subActions, ...fortuneTeller.otherNights!.subActions],
    checkedStates: [true, true, false, false],
  },
};

/** All four sub-actions checked. */
export const AllChecked: Story = {
  args: {
    subActions: [...fortuneTeller.firstNight!.subActions, ...fortuneTeller.otherNights!.subActions],
    checkedStates: [true, true, true, true],
  },
};

/** Mix of regular and conditional (isConditional=true) sub-actions from the Philosopher. */
export const WithConditionals: Story = {
  args: {
    subActions: philosopher.firstNight!.subActions,
    checkedStates: [true, false],
  },
};

/** Same as PartiallyChecked but with readOnly=true — checkboxes are disabled. */
export const ReadOnly: Story = {
  args: {
    subActions: [...fortuneTeller.firstNight!.subActions, ...fortuneTeller.otherNights!.subActions],
    checkedStates: [true, true, false, false],
    readOnly: true,
  },
};
