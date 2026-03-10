import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, within, userEvent, expect } from 'storybook/test';
import { ReminderTokenChip } from './ReminderTokenChip';
import type { PlayerToken } from '../../types';

/** Townsfolk-sourced custom token (blue). */
const townsfolkToken: PlayerToken = {
  id: 'tok-ft-1',
  type: 'custom',
  label: 'Is the Drunk',
  sourceCharacterId: 'fortuneteller',
};

/** Minion-sourced custom token (red). */
const minionToken: PlayerToken = {
  id: 'tok-min-1',
  type: 'custom',
  label: 'Poisoned',
  sourceCharacterId: 'scarletwoman',
};

/** Demon-sourced custom token (dark red). */
const demonToken: PlayerToken = {
  id: 'tok-demon-1',
  type: 'custom',
  label: 'Dead',
  sourceCharacterId: 'imp',
};

/** Built-in drunk token. */
const drunkToken: PlayerToken = {
  id: 'tok-drunk-1',
  type: 'drunk',
  label: 'Drunk',
};

/** Token without a sourceCharacterId (uses fallback colour). */
const noSourceToken: PlayerToken = {
  id: 'tok-nosource-1',
  type: 'custom',
  label: 'Custom Note',
  color: '#ff9800',
};

const meta = {
  title: 'Common/ReminderTokenChip',
  component: ReminderTokenChip,
  args: {
    token: townsfolkToken,
  },
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ReminderTokenChip>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default small chip — Townsfolk-sourced token with blue colouring. */
export const Default: Story = {
  args: {
    token: townsfolkToken,
    sourceName: 'Fortune Teller',
  },
};

/** Medium-sized chip — larger avatar and font. */
export const MediumSize: Story = {
  args: {
    token: townsfolkToken,
    size: 'medium',
    sourceName: 'Fortune Teller',
  },
};

/** Placed state — greyed-out chip with player placement info. */
export const PlacedState: Story = {
  args: {
    token: townsfolkToken,
    placed: true,
    placedInfo: 'on Alice (seat 1)',
    sourceName: 'Fortune Teller',
  },
};

/** Townsfolk-sourced token — blue chip colour. */
export const TownsfolkColour: Story = {
  args: {
    token: townsfolkToken,
    sourceName: 'Fortune Teller',
  },
};

/** Minion-sourced token — red chip colour. */
export const MinionColour: Story = {
  args: {
    token: minionToken,
    sourceName: 'Scarlet Woman',
  },
};

/** Demon-sourced token — dark red chip colour. */
export const DemonColour: Story = {
  args: {
    token: demonToken,
    sourceName: 'Imp',
  },
};

/** Built-in Drunk token — uses system drunk colour. */
export const DrunkBuiltIn: Story = {
  args: {
    token: drunkToken,
  },
};

/** Token without sourceCharacterId — uses fallback colour from token.color. */
export const WithoutSourceCharacter: Story = {
  args: {
    token: noSourceToken,
  },
};

/** Chip with a delete button via onRemove handler. */
export const WithRemoveButton: Story = {
  args: {
    token: townsfolkToken,
    sourceName: 'Fortune Teller',
    onRemove: fn(),
  },
};

/**
 * Interaction test: clicking the chip fires the onClick handler.
 * Verifies the chip is clickable and the handler is invoked.
 */
export const ClickInteraction: Story = {
  args: {
    token: townsfolkToken,
    sourceName: 'Fortune Teller',
    onClick: fn(),
  },
  play: async ({ args }) => {
    const body = within(document.body);
    const chip = await body.findByText('Is the Drunk');
    await expect(chip).toBeInTheDocument();
    await userEvent.click(chip);
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

/** Side-by-side comparison of all character type colours. */
export const AllTypeColours: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
      <ReminderTokenChip token={townsfolkToken} sourceName="Fortune Teller" />
      <ReminderTokenChip token={minionToken} sourceName="Scarlet Woman" />
      <ReminderTokenChip token={demonToken} sourceName="Imp" />
      <ReminderTokenChip token={drunkToken} />
      <ReminderTokenChip token={noSourceToken} />
    </div>
  ),
};
