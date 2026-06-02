import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { PlayerShowDrawer } from './PlayerShowDrawer';

const meta = {
  title: 'NightPhase/PlayerShowDrawer',
  component: PlayerShowDrawer,
  parameters: {
    backgrounds: { default: 'dark' },
    layout: 'fullscreen',
  },
  args: {
    open: true,
    onClose: fn(),
    seat: 1,
    playerName: 'Alice',
    scriptId: 'carousel',
    messages: [
      {
        id: 'message-1',
        seat: 1,
        text: 'Quietly stand up and go to the basement',
        createdAt: '2026-06-01T00:00:00.000Z',
      },
      {
        id: 'message-2',
        seat: 1,
        text: 'Open your eyes and look at the storyteller',
        createdAt: '2026-06-01T00:01:00.000Z',
      },
    ],
    templates: [
      {
        id: 'template-1',
        text: 'Choose a player by pointing',
        scope: 'script',
        scriptId: 'carousel',
        usageCount: 3,
        lastUsedAt: '2026-06-01T00:02:00.000Z',
      },
    ],
    onAddMessage: fn(),
    onPinTemplate: fn(),
    onMarkMessageShown: fn(),
  },
} satisfies Meta<typeof PlayerShowDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Multi-slot drawer with pinned/recent template recall and a compose-box interaction. */
export const MultiSlotWorkflow: Story = {
  play: async ({ args }) => {
    const canvas = within(document.body);
    await expect(canvas.getByText('Quietly stand up and go to the basement')).toBeInTheDocument();
    const composeInput = canvas.getByTestId('show-message-compose').querySelector('textarea');
    if (!composeInput) {
      throw new Error('Compose textarea was not rendered');
    }
    await userEvent.type(composeInput, 'Tell the storyteller yes');
    await userEvent.click(canvas.getByTestId('add-show-message-btn'));
    await expect(args.onAddMessage).toHaveBeenCalled();
  },
};
