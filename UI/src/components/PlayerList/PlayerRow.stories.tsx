import type { Meta, StoryObj } from '@storybook/react-vite';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import { PlayerRow } from './PlayerRow';
import {
  alicePlayer,
  bobPlayer,
  charliePlayer,
  evePlayer,
  travJackPlayer,
  evilTravellerPlayer,
  irisPlayer,
  evilTownsfolkPlayer,
  goodDemonPlayer,
  imp,
  noble,
  fortuneTeller,
  drunk,
  spiritOfIvory,
} from '../../stories/mockData';

const noop = () => {};

const meta = {
  title: 'PlayerList/PlayerRow',
  component: PlayerRow,
  decorators: [
    (Story) => (
      <Table size="small">
        <TableBody>
          <Story />
        </TableBody>
      </Table>
    ),
  ],
  args: {
    onToggleAlive: noop,
    onToggleGhostVote: noop,
    onRowClick: noop,
  },
  argTypes: {
    showCharacters: { control: 'boolean' },
  },
} satisfies Meta<typeof PlayerRow>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Day view — character info hidden, alive player (Alice). */
export const DayView: Story = {
  args: {
    player: alicePlayer,
    showCharacters: false,
    character: undefined,
  },
};

/** Night view — character info visible, alive player with character assigned (Bob / Imp). */
export const NightView: Story = {
  args: {
    player: bobPlayer,
    showCharacters: true,
    character: imp,
  },
};

/** Dead player — strikethrough and faded styling (Charlie / Fortune Teller). */
export const DeadPlayer: Story = {
  args: {
    player: charliePlayer,
    showCharacters: true,
    character: fortuneTeller,
  },
};

/** Dead player who has used their ghost vote (Eve / Drunk). */
export const GhostVoteUsed: Story = {
  args: {
    player: evePlayer,
    showCharacters: true,
    character: drunk,
  },
};

/** Traveller player (Good) — split blue/red border, Spirit of Ivory character data shown. */
export const TravellerPlayerGood: Story = {
  args: {
    player: travJackPlayer,
    showCharacters: true,
    character: spiritOfIvory,
  },
};

/** Traveller player (Evil-aligned) — split border + red alignment dot, demonstrates ST-assigned evil alignment. */
export const TravellerPlayerEvil: Story = {
  args: {
    player: evilTravellerPlayer,
    showCharacters: true,
    character: spiritOfIvory,
  },
};

/** Player without a character assigned in night view (Iris). */
export const NoCharacterAssigned: Story = {
  args: {
    player: irisPlayer,
    showCharacters: true,
    character: undefined,
  },
};

/**
 * Evil Townsfolk — alignment mismatch.
 * Blue Townsfolk pill with a thick red border indicating Evil actual alignment.
 */
export const EvilTownsfolk: Story = {
  args: {
    player: evilTownsfolkPlayer,
    showCharacters: true,
    character: noble,
  },
};

/**
 * Good Demon — alignment mismatch.
 * Dark-red Demon pill with a thick blue border indicating Good actual alignment.
 */
export const GoodDemon: Story = {
  args: {
    player: goodDemonPlayer,
    showCharacters: true,
    character: imp,
  },
};

// ────────────────────────────────────────────────────────
// Token stories (F3-17)
// ────────────────────────────────────────────────────────

/** Night view — player with a Drunk token showing purple chip. */
export const WithDrunkToken: Story = {
  args: {
    player: {
      ...alicePlayer,
      tokens: [{ id: 'tok-drunk-1', type: 'drunk', label: 'Drunk', color: '#1976d2' }],
    },
    showCharacters: true,
    character: noble,
  },
};

/** Night view — player with Poisoned + 2 custom tokens. */
export const WithMultipleTokens: Story = {
  args: {
    player: {
      ...bobPlayer,
      tokens: [
        { id: 'tok-poisoned-1', type: 'poisoned', label: 'Poisoned', color: '#7b1fa2' },
        { id: 'tok-custom-1', type: 'custom', label: 'Is the Drunk', color: '#ff9800' },
        { id: 'tok-custom-2', type: 'custom', label: 'Mad', color: '#e91e63' },
      ],
    },
    showCharacters: true,
    character: imp,
  },
};

/** Day view — tokens are hidden (secret info). */
export const DayViewWithTokens: Story = {
  args: {
    player: {
      ...alicePlayer,
      tokens: [{ id: 'tok-drunk-1', type: 'drunk', label: 'Drunk', color: '#1976d2' }],
    },
    showCharacters: false,
    character: undefined,
  },
};

// ────────────────────────────────────────────────────────
// Responsive viewport variant (P2-2)
// ────────────────────────────────────────────────────────

/** Tablet viewport — night view row at iPad size. */
export const TabletViewport: Story = {
  ...NightView,
  parameters: {
    viewport: { defaultViewport: 'tablet' },
  },
};
