import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { ReminderTokenChips } from './ReminderTokenChips';
import type { PlayerToken } from '../../types';

/** Single Drunk token. */
const singleToken: PlayerToken[] = [{ id: 'tok-drunk-1', type: 'drunk', label: 'Drunk' }];

/** Mix of built-in and custom tokens. */
const multipleTokens: PlayerToken[] = [
  { id: 'tok-drunk-1', type: 'drunk', label: 'Drunk' },
  { id: 'tok-poisoned-1', type: 'poisoned', label: 'Poisoned' },
  {
    id: 'tok-custom-1',
    type: 'custom',
    label: 'Is the Drunk',
    sourceCharacterId: 'fortuneteller',
  },
  {
    id: 'tok-custom-2',
    type: 'custom',
    label: 'Mad',
    sourceCharacterId: 'cerenovus',
  },
];

/** Character name resolver for avatar tooltips. */
const nameResolver = (id: string): string | undefined => {
  const names: Record<string, string> = {
    fortuneteller: 'Fortune Teller',
    cerenovus: 'Cerenovus',
  };
  return names[id];
};

const meta = {
  title: 'Common/ReminderTokenChips',
  component: ReminderTokenChips,
  args: {
    tokens: multipleTokens,
  },
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ReminderTokenChips>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Single token — renders one chip. */
export const SingleToken: Story = {
  args: {
    tokens: singleToken,
  },
};

/** Multiple tokens — wrapping row of chips. */
export const MultipleTokens: Story = {
  args: {
    tokens: multipleTokens,
    getSourceName: nameResolver,
  },
};

/** Medium-sized chips — larger avatars and text. */
export const MediumSize: Story = {
  args: {
    tokens: multipleTokens,
    size: 'medium',
    getSourceName: nameResolver,
  },
};

/** With remove buttons — each chip has a delete icon. */
export const WithRemoveHandlers: Story = {
  args: {
    tokens: multipleTokens,
    onRemove: fn(),
    getSourceName: nameResolver,
  },
};

/** Empty token list — renders nothing (null). */
export const EmptyTokens: Story = {
  args: {
    tokens: [],
  },
};
