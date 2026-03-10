import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { CharacterAssignmentDialog } from './CharacterAssignmentDialog';
import { mockCharacters, mockPlayers } from '../../stories/mockData';
import type { PlayerSeat, CharacterDef } from '../../types';

/** Boozling script characters used as the assignable pool. */
const boozlingIds = [
  'noble',
  'fortuneteller',
  'philosopher',
  'slayer',
  'cannibal',
  'drunk',
  'mutant',
  'damsel',
  'baron',
  'cerenovus',
  'scarletwoman',
  'marionette',
  'imp',
];

const scriptCharacters: CharacterDef[] = boozlingIds
  .map((id) => mockCharacters.find((c) => c.id === id))
  .filter((c): c is CharacterDef => c !== undefined);

/** 7 non-traveller players for a standard game. */
const sevenPlayers: PlayerSeat[] = mockPlayers.filter((p) => !p.isTraveller).slice(0, 7);

/** Players with some already assigned (partial state). */
const partiallyAssigned: PlayerSeat[] = sevenPlayers.map((p, i) =>
  i < 3 ? p : { ...p, characterId: '' },
);

/** Empty players — no characters assigned yet. */
const emptyPlayers: PlayerSeat[] = sevenPlayers.map((p) => ({
  ...p,
  characterId: '',
}));

const noop = () => {};

const meta = {
  title: 'CharacterAssignment/CharacterAssignmentDialog',
  component: CharacterAssignmentDialog,
  args: {
    open: true,
    onClose: noop,
    onConfirm: fn(),
    players: sevenPlayers,
    scriptCharacters,
  },
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof CharacterAssignmentDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default state — all players already have characters from mock data.
 * Shows the character pool with no unassigned chips (all placed).
 */
export const AllAssigned: Story = {};

/**
 * Empty slate — no characters assigned yet.
 * Full character pool shown as tappable chips at the top.
 */
export const NoAssignments: Story = {
  args: {
    players: emptyPlayers,
  },
};

/**
 * Partially assigned — first 3 players have characters, rest are empty.
 * Demonstrates the mixed pool state with some chips consumed.
 */
export const PartiallyAssigned: Story = {
  args: {
    players: partiallyAssigned,
  },
};

/**
 * With inPlayCharacterIds — limits available pool to selected in-play characters.
 * Simulates the flow from CharacterSelection → CharacterAssignment.
 */
export const WithInPlayFilter: Story = {
  args: {
    players: emptyPlayers,
    inPlayCharacterIds: ['noble', 'fortuneteller', 'drunk', 'baron', 'cerenovus', 'imp', 'slayer'],
  },
};

/**
 * With Marionette on script — demonstrates seating constraint warnings
 * highlighting valid adjacent-to-Demon seats.
 */
export const WithMarionette: Story = {
  args: {
    players: emptyPlayers,
    inPlayCharacterIds: [
      'noble',
      'fortuneteller',
      'drunk',
      'marionette',
      'cerenovus',
      'imp',
      'slayer',
    ],
  },
};

/** Closed dialog — verifies it renders nothing when not open. */
export const Closed: Story = {
  args: {
    open: false,
  },
};
