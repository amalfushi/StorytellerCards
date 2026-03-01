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
  irisPlayer,
  evilTownsfolkPlayer,
  goodDemonPlayer,
  imp,
  noble,
  fortuneTeller,
  drunk,
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

/** Traveller player — has split blue/red border (TravJack). */
export const TravellerPlayer: Story = {
  args: {
    player: travJackPlayer,
    showCharacters: true,
    character: undefined, // Angel is not in our mock characters
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
