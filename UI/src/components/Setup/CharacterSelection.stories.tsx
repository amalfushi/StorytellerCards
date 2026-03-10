import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { CharacterSelection } from './CharacterSelection';
import { mockCharacters } from '../../stories/mockData';
import type { CharacterDef } from '../../types';

/** Boozling script — a realistic 25-character script with all types. */
const boozlingScriptIds = [
  'noble',
  'pixie',
  'highpriestess',
  'balloonist',
  'fortuneteller',
  'oracle',
  'savant',
  'philosopher',
  'huntsman',
  'fisherman',
  'slayer',
  'sage',
  'cannibal',
  'drunk',
  'mutant',
  'damsel',
  'klutz',
  'golem',
  'baron',
  'cerenovus',
  'scarletwoman',
  'marionette',
  'nodashii',
  'fanggu',
  'imp',
];

const boozlingCharacters: CharacterDef[] = boozlingScriptIds
  .map((id) => mockCharacters.find((c) => c.id === id))
  .filter((c): c is CharacterDef => c !== undefined);

/** Minimal script — only the 4 core types for a small game. */
const smallScriptCharacters: CharacterDef[] = ['noble', 'drunk', 'baron', 'imp']
  .map((id) => mockCharacters.find((c) => c.id === id))
  .filter((c): c is CharacterDef => c !== undefined);

/** Script with Village Idiot (duplicate-allowed). */
const duplicateScript: CharacterDef[] = [
  ...boozlingScriptIds.slice(0, 13),
  'villageidiot',
  ...boozlingScriptIds.slice(13),
]
  .map((id) => mockCharacters.find((c) => c.id === id))
  .filter((c): c is CharacterDef => c !== undefined);

/** Script containing Xaan (variable modifier). */
const xaanScript: CharacterDef[] = [
  'noble',
  'fortuneteller',
  'slayer',
  'drunk',
  'baron',
  'cerenovus',
  'imp',
  'xaan',
]
  .map((id) => mockCharacters.find((c) => c.id === id))
  .filter((c): c is CharacterDef => c !== undefined);

const noop = () => {};

const meta = {
  title: 'Setup/CharacterSelection',
  component: CharacterSelection,
  args: {
    open: true,
    onClose: noop,
    onConfirm: fn(),
    playerCount: 10,
    scriptCharacters: boozlingCharacters,
  },
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof CharacterSelection>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Full Boozling script for 10 players.
 * Shows type groups (Townsfolk, Outsider, Minion, Demon), modifier chips,
 * and distribution targets based on player count.
 */
export const FullScript: Story = {};

/** Small game (5 players) — minimal character pool shows tight distribution targets. */
export const SmallGame: Story = {
  args: {
    playerCount: 5,
    scriptCharacters: smallScriptCharacters,
  },
};

/** Large game (15 players) — expanded distribution targets, many characters. */
export const LargeGame: Story = {
  args: {
    playerCount: 15,
    scriptCharacters: boozlingCharacters,
  },
};

/** With some characters pre-selected via initialSelected. */
export const WithPreselection: Story = {
  args: {
    initialSelected: ['noble', 'fortuneteller', 'imp', 'baron', 'drunk'],
  },
};

/**
 * Script with Village Idiot — demonstrates the duplicate stepper control
 * that appears when a duplicate-allowed character is selected.
 */
export const WithDuplicateCharacter: Story = {
  args: {
    scriptCharacters: duplicateScript,
    initialSelected: ['villageidiot'],
  },
};

/** Game 2 variant — shows "Game 2: Select Characters" in the dialog title. */
export const GameNumberTitle: Story = {
  args: {
    gameNumber: 2,
  },
};

/** Script containing Xaan — shows the Xaan X input field. */
export const WithXaanInput: Story = {
  args: {
    scriptCharacters: xaanScript,
    playerCount: 7,
  },
};

/** Closed dialog — verifies it renders nothing when not open. */
export const Closed: Story = {
  args: {
    open: false,
  },
};
