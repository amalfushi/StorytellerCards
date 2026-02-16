type Character<T = CharacterType> = {
  Name: string;
  Type: T;
  Alignments: Alignments;
  NightTime: NightTime;
  Tokens: Token[];
  Icon: Icon;
  Alive: 'Alive' | 'Dead';
  Votes: Votes;
  Power: Power;
};

enum Votes {
  Infinite = 1,
  GhostVote = 0,
  NoVotes = -1,
}

enum CharacterType {
  Townsfolk,
  Outsider,
  Minion,
  Demon,
  Traveller,
  Fabled,
  Loric,
}

/// <summary>
// Character alignment.  'Unknown' for travelers
/// </summary>
enum Alignment {
  Good,
  Evil,
  Unknown,
}

type Alignments = {
  VisibleToPlayer: Alignment;
  Current: Alignment;
  Starting: Alignment;
};

type NightTime = {
  FirstNight: NightHelp;
  OtherNights: NightHelp;
};

type NightHelp = {
  When: When;
  // -1 means does not act
  Order: number;
  HelpText: string;
  Conflicts: Conflict[];
  Reminder: string;
};

enum When {
  Dusk,
  Dawn,
}

type Conflict = {
  Character: Character['Name'];
  ConflictText: string;
  // first character conflicts with second character
  ConflictTuple?: Character['Name'][];
};

type Token = {
  Icon: Icon;
  Target: Seat;
  Action: TokenAction;
  Text: string;
};

type TokenAction = (token: Token, player: Player) => void;

type Icon = {
  Ssmall: string;
  Medium: string;
  Large: string;
};

type Seat =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 14
  | 16
  | 17
  | 18
  | 19
  | 20;

type Player = {
  Character: Character;
  Seat: Seat;
  Name: string;
};

type Script = {
  Name: string;
  Townsfolk: Character<CharacterType.Townsfolk>[];
  Outsiders: Character<CharacterType.Outsider>[];
  Minions: Character<CharacterType.Minion>[];
  Demons: Character<CharacterType.Demon>[];
  Travellers?: Character<CharacterType.Traveller>[];
  Fabled?: Character<CharacterType.Fabled>[];
  Loric?: Character<CharacterType.Loric>[];
  Conflicts?: Conflict[];
};

type _Game = {
  Date: Date;
  Players: Player[];
  Script: Script;
};

type Power = {
  // Simplest description of the power
  ShortText: string;
  // copy pasta from the offical rules top section
  DetailedText?: string;
  // direct link to the offical rules.
  Link?: string;
};
