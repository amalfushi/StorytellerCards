import type { Meta, StoryObj } from '@storybook/react-vite';
import { StructuralCard } from './StructuralCard';
import {
  duskFirstNightEntry,
  dawnFirstNightEntry,
  minionInfoEntry,
  demonInfoEntry,
} from '../../stories/mockData';

const noop = () => {};

const meta = {
  title: 'NightPhase/StructuralCard',
  component: StructuralCard,
  args: {
    onToggleSubAction: noop,
    readOnly: false,
  },
  argTypes: {
    readOnly: { control: 'boolean' },
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
} satisfies Meta<typeof StructuralCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Dusk structural card — signals the start of the night phase. */
export const Dusk: Story = {
  args: {
    entry: duskFirstNightEntry,
    checkedStates: [false],
  },
};

/** Dawn structural card — signals the end of the night phase. */
export const Dawn: Story = {
  args: {
    entry: dawnFirstNightEntry,
    checkedStates: [false, false],
  },
};

/** Minion Info structural card with multi-step sub-actions. */
export const MinionInfo: Story = {
  args: {
    entry: minionInfoEntry,
    checkedStates: [false, false, false, false],
  },
};

/** Demon Info structural card with multi-step sub-actions. */
export const DemonInfo: Story = {
  args: {
    entry: demonInfoEntry,
    checkedStates: [false, false, false, false],
  },
};

/** Minion Info in read-only mode — for reviewing night history. */
export const ReadOnly: Story = {
  args: {
    entry: minionInfoEntry,
    checkedStates: [true, true, false, false],
    readOnly: true,
  },
};
