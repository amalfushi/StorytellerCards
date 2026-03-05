import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, userEvent, expect, fn } from 'storybook/test';
import { SubActionChecklist } from './SubActionChecklist';
import { pitHag, imp, fortuneTeller } from '../../stories/mockData';
import Box from '@mui/material/Box';
import type { NightSubAction } from '../../types';

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

/**
 * Pit-Hag other-night sub-actions: demonstrates the new checkbox hierarchy.
 * - Index 0: "The Pit-Hag chooses a player & a character." → checkbox (first item)
 * - Index 1: "If they chose a character…" → checkbox (conditional)
 * - Index 2: "Wake the target." → no checkbox (detail, indented)
 * - Index 3: "Show the YOU ARE token…" → no checkbox (detail, indented)
 */
export const WithConditionalHierarchy: Story = {
  args: {
    subActions: pitHag.otherNights!.subActions,
    checkedStates: [false, false, false, false],
  },
};

/** Single sub-action (Poisoner pattern) — always gets a checkbox. */
export const SingleAction: Story = {
  args: {
    subActions: [
      { id: 'p-1', description: 'The Poisoner chooses a player.', isConditional: false },
    ] as NightSubAction[],
    checkedStates: [false],
  },
};

/**
 * Imp other-night sub-actions with conditional hierarchy.
 * First item + conditional items get checkboxes; detail items are indented.
 */
export const Unchecked: Story = {
  args: {
    subActions: imp.otherNights!.subActions,
    checkedStates: imp.otherNights!.subActions.map(() => false),
  },
};

/** Imp sub-actions with first two actionable items checked. */
export const PartiallyChecked: Story = {
  args: {
    subActions: imp.otherNights!.subActions,
    checkedStates: imp.otherNights!.subActions.map((_, i) => i === 0),
  },
};

/** Fortune Teller sub-actions — all checked. */
export const AllChecked: Story = {
  args: {
    subActions: fortuneTeller.firstNight!.subActions,
    checkedStates: fortuneTeller.firstNight!.subActions.map(() => true),
  },
};

/** Same as PartiallyChecked but with readOnly=true — checkboxes are disabled. */
export const ReadOnly: Story = {
  args: {
    subActions: pitHag.otherNights!.subActions,
    checkedStates: [true, false, false, false],
    readOnly: true,
  },
};

// ────────────────────────────────────────────────────────
// Interaction test
// ────────────────────────────────────────────────────────

/** Clicking an actionable checkbox item calls onToggle with the correct index. */
export const ToggleInteraction: Story = {
  args: {
    subActions: pitHag.otherNights!.subActions,
    checkedStates: [false, false, false, false],
    onToggle: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const checkboxes = canvas.getAllByRole('checkbox');
    // Only 2 checkboxes should exist (index 0 and conditional index 1)
    await expect(checkboxes).toHaveLength(2);
    // Click the first checkbox
    await userEvent.click(checkboxes[0]);
    await expect(args.onToggle).toHaveBeenCalledWith(0);
  },
};
