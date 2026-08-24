import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Alignment, Phase, type Game, type Player } from '@/types/index.ts';
import { mockCharacters } from '@/stories/mockData.ts';
import { TownSquareEditMode } from './TownSquareEditMode.tsx';

const players: Player[] = [
  { id: 'p1', name: 'Alice' },
  { id: 'p2', name: 'Bob' },
  { id: 'p3', name: 'Carol' },
  { id: 'p4', name: 'David' },
  { id: 'p5', name: 'Eve' },
];

const game: Game = {
  id: 'game-option-3',
  sessionId: 'session-option-3',
  scriptId: 'boozling',
  currentDay: 1,
  currentPhase: Phase.Day,
  isFirstNight: true,
  slots: [
    { kind: 'seat', id: 's1', playerId: 'p1' },
    { kind: 'seat', id: 's2', playerId: 'p2' },
    { kind: 'spacer', id: 'gap' },
    { kind: 'seat', id: 's3', playerId: 'p3' },
    { kind: 'storyteller', id: 'st' },
    { kind: 'seat', id: 's4', playerId: null },
  ],
  participants: [
    { playerId: 'p1', isTraveller: false },
    { playerId: 'p2', isTraveller: false },
    { playerId: 'p3', isTraveller: false },
    { playerId: 'p4', isTraveller: false },
  ],
  playerState: Object.fromEntries(
    ['p1', 'p2', 'p3', 'p4'].map((playerId, index) => [
      playerId,
      {
        characterId: ['washerwoman', 'imp', 'poisoner', ''][index],
        alive: true,
        ghostVoteUsed: false,
        visibleAlignment: Alignment.Unknown,
        actualAlignment: Alignment.Unknown,
        startingAlignment: Alignment.Unknown,
        activeReminders: [],
        tokens: [],
      },
    ]),
  ),
  playerCountOverride: null,
  seatingConfirmed: false,
  inPlayCharacterIds: ['washerwoman', 'imp', 'poisoner', 'empath'],
  nightHistory: [],
};

const meta = {
  title: 'TownSquare/TownSquareEditMode',
  component: TownSquareEditMode,
  args: {
    game,
    sessionPlayers: players,
    scriptCharacters: mockCharacters,
    propagationDefault: { toTemplate: false, toOtherGames: false },
    onCancel: fn(),
    onSave: fn(),
    onOpenCharacterSelection: fn(),
    onOpenCharacterAssignment: fn(),
  },
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'mobile1' },
  },
} satisfies Meta<typeof TownSquareEditMode>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Mobile-first editor with one parked participant and all slot types visible. */
export const MobileDraft: Story = {};

/** Tapping a roster chip opens the focused participation and assignment sheet. */
export const OpenPlayerSheet: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTestId('edit-player-p4'));
    const body = within(canvasElement.ownerDocument.body);
    await expect(await body.findByTestId('focused-player-sheet')).toHaveTextContent('David');
  },
};
