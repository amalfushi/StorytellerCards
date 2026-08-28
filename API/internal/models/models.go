package models

// ──────────────────────────────────────────────
// Enum-like string types
// ──────────────────────────────────────────────

type CharacterType string

const (
	Townsfolk CharacterType = "Townsfolk"
	Outsider  CharacterType = "Outsider"
	Minion    CharacterType = "Minion"
	Demon     CharacterType = "Demon"
	Traveller CharacterType = "Traveller"
	Fabled    CharacterType = "Fabled"
	Loric     CharacterType = "Loric"
)

type Alignment string

const (
	Good    Alignment = "Good"
	Evil    Alignment = "Evil"
	Unknown Alignment = "Unknown"
)

type Phase string

const (
	Dawn  Phase = "Dawn"
	Day   Phase = "Day"
	Dusk  Phase = "Dusk"
	Night Phase = "Night"
)

// ──────────────────────────────────────────────
// Character definitions (read-only reference data)
// ──────────────────────────────────────────────

type CharacterIcon struct {
	Small       string `json:"small,omitempty"`
	Medium      string `json:"medium,omitempty"`
	Large       string `json:"large,omitempty"`
	Placeholder string `json:"placeholder"`
}

type NightSubAction struct {
	ID            string `json:"id"`
	Description   string `json:"description"`
	IsConditional bool   `json:"isConditional"`
}

type NightAction struct {
	Order      int              `json:"order"`
	HelpText   string           `json:"helpText"`
	SubActions []NightSubAction `json:"subActions"`
}

type ReminderToken struct {
	ID   string `json:"id"`
	Text string `json:"text"`
	Icon string `json:"icon,omitempty"`
}

type CharacterDef struct {
	ID               string          `json:"id"`
	Name             string          `json:"name"`
	Type             CharacterType   `json:"type"`
	DefaultAlignment Alignment       `json:"defaultAlignment"`
	AbilityShort     string          `json:"abilityShort"`
	AbilityDetailed  string          `json:"abilityDetailed,omitempty"`
	WikiLink         string          `json:"wikiLink,omitempty"`
	FirstNight       *NightAction    `json:"firstNight"`
	OtherNights      *NightAction    `json:"otherNights"`
	Icon             *CharacterIcon  `json:"icon,omitempty"`
	Reminders        []ReminderToken `json:"reminders"`
}

// ──────────────────────────────────────────────
// Script
// ──────────────────────────────────────────────

type Script struct {
	ID           string   `json:"id"`
	Name         string   `json:"name"`
	Author       string   `json:"author"`
	CharacterIDs []string `json:"characterIds"`
}

// ──────────────────────────────────────────────
// Player (session-level identity)
// ──────────────────────────────────────────────

type PlayerToken struct {
	ID                string `json:"id"`
	Type              string `json:"type"`
	Label             string `json:"label"`
	SourceCharacterID string `json:"sourceCharacterId,omitempty"`
	Color             string `json:"color,omitempty"`
}

// Player is a session-level identity. Players are not tied to a seat or game.
type Player struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// ──────────────────────────────────────────────
// Slot (seat / spacer / storyteller marker)
// ──────────────────────────────────────────────

// SlotKind discriminates the Slot union: "seat" | "spacer" | "storyteller".
type SlotKind string

const (
	SlotSeat        SlotKind = "seat"
	SlotSpacer      SlotKind = "spacer"
	SlotStoryteller SlotKind = "storyteller"
)

// Slot models the TypeScript discriminated union. Only seat slots carry a PlayerID.
type Slot struct {
	Kind     SlotKind `json:"kind"`
	ID       string   `json:"id"`
	PlayerID string   `json:"playerId,omitempty"` // seat only; "" when unassigned
}

// SeatingTemplate is the session-level circle definition that games snapshot from.
type SeatingTemplate struct {
	Slots []Slot `json:"slots"`
}

// PropagationPreference is the sticky session default for "update template /
// update other games" toggles on seat-assignment actions.
type PropagationPreference struct {
	ToTemplate   bool `json:"toTemplate"`
	ToOtherGames bool `json:"toOtherGames"`
}

// ──────────────────────────────────────────────
// Game participation
// ──────────────────────────────────────────────

// Participant links a Player to a Game with traveller status. Decoupled from
// Slot so a player can be in the game without a seat (and vice-versa).
type Participant struct {
	PlayerID    string `json:"playerId"`
	IsTraveller bool   `json:"isTraveller"`
}

// AlignmentChange records a single visible/actual alignment transition.
type AlignmentChange struct {
	Day      int       `json:"day"`
	Phase    Phase     `json:"phase"`
	OldValue Alignment `json:"oldValue"`
	NewValue Alignment `json:"newValue"`
	Note     string    `json:"note,omitempty"`
}

// GainedAbility represents a lazily-applied character ability (Cannibal / Philo).
type GainedAbility struct {
	SourceCharacterID string `json:"sourceCharacterId"`
	GrantedDay        int    `json:"grantedDay"`
	Note              string `json:"note,omitempty"`
}

// PlayerGameState is per-player per-game state, keyed in Game.PlayerState by
// PlayerID. Splits "who plays" (Participant) from "what state are they in".
type PlayerGameState struct {
	Alive               bool              `json:"alive"`
	GhostVoteUsed       bool              `json:"ghostVoteUsed"`
	VisibleAlignment    Alignment         `json:"visibleAlignment"`
	ActualAlignment     Alignment         `json:"actualAlignment"`
	StartingAlignment   Alignment         `json:"startingAlignment"`
	ActiveReminders     []string          `json:"activeReminders"`
	Tokens              []PlayerToken     `json:"tokens,omitempty"`
	ApparentCharacterID string            `json:"apparentCharacterId,omitempty"`
	AlignmentHistory    []AlignmentChange `json:"alignmentHistory,omitempty"`
	GainedAbility       *GainedAbility    `json:"gainedAbility,omitempty"`
	CharacterID         string            `json:"characterId,omitempty"`
}

type CharacterDraftOffer struct {
	OfferedCharacterIds           []string          `json:"offeredCharacterIds"`
	MulliganCharacterID           *string           `json:"mulliganCharacterId"`
	RolledCharacterTypes          []string          `json:"rolledCharacterTypes"`
	LegalCandidateCount           int               `json:"legalCandidateCount"`
	ActualCharacterIdsByOfferedID map[string]string `json:"actualCharacterIdsByOfferedId,omitempty"`
}

type CharacterDraftEntry struct {
	PlayerID            string              `json:"playerId"`
	Offer               CharacterDraftOffer `json:"offer"`
	SelectedCharacterID string              `json:"selectedCharacterId,omitempty"`
	ActualCharacterID   string              `json:"actualCharacterId,omitempty"`
	ApparentCharacterID string              `json:"apparentCharacterId,omitempty"`
	Resolution          string              `json:"resolution,omitempty"`
}

type CharacterDraftCharacterRoll struct {
	PlayerID    string `json:"playerId"`
	CharacterID string `json:"characterId"`
}

type CharacterDraftState struct {
	Status                 string                        `json:"status"`
	SetupMode              string                        `json:"setupMode"`
	PresentationMode       string                        `json:"presentationMode"`
	PlayerOrder            []string                      `json:"playerOrder"`
	PlannedCharacterTypes  map[string][]string           `json:"plannedCharacterTypes,omitempty"`
	MarionetteRoll         *CharacterDraftCharacterRoll  `json:"marionetteRoll,omitempty"`
	OutsiderHiddenRoll     *CharacterDraftCharacterRoll  `json:"outsiderHiddenRoll,omitempty"`
	OutsiderCharacterRolls []CharacterDraftCharacterRoll `json:"outsiderCharacterRolls,omitempty"`
	LegionEliminated       bool                          `json:"legionEliminated,omitempty"`
	CurrentPlayerIndex     int                           `json:"currentPlayerIndex"`
	ActivePlayerID         string                        `json:"activePlayerId,omitempty"`
	VariableModifierValues map[string]int                `json:"variableModifierValues,omitempty"`
	CharacterCopyTargets   map[string]int                `json:"characterCopyTargets,omitempty"`
	Entries                []CharacterDraftEntry         `json:"entries"`
	BlockedReason          string                        `json:"blockedReason,omitempty"`
	Revision               int                           `json:"revision"`
}

// ──────────────────────────────────────────────
// Night History
// ──────────────────────────────────────────────

type NightHistoryEntry struct {
	DayNumber       int                      `json:"dayNumber"`
	IsFirstNight    bool                     `json:"isFirstNight"`
	CompletedAt     string                   `json:"completedAt"`
	SubActionStates map[string][]bool        `json:"subActionStates"`
	Notes           map[string]string        `json:"notes"`
	Selections      map[string]any           `json:"selections,omitempty"`
	TokenSnapshot   map[string][]PlayerToken `json:"tokenSnapshot,omitempty"`
}

// ──────────────────────────────────────────────
// Game
// ──────────────────────────────────────────────

type Game struct {
	ID                   string                     `json:"id"`
	SessionID            string                     `json:"sessionId"`
	ScriptID             string                     `json:"scriptId"`
	CurrentDay           int                        `json:"currentDay"`
	CurrentPhase         Phase                      `json:"currentPhase"`
	IsFirstNight         bool                       `json:"isFirstNight"`
	Slots                []Slot                     `json:"slots"`
	Participants         []Participant              `json:"participants"`
	PlayerState          map[string]PlayerGameState `json:"playerState"`
	PlayerCountOverride  *int                       `json:"playerCountOverride,omitempty"`
	SeatingConfirmed     bool                       `json:"seatingConfirmed"`
	NightHistory         []NightHistoryEntry        `json:"nightHistory"`
	ActiveFabled         []string                   `json:"activeFabled,omitempty"`
	ActiveLoric          []string                   `json:"activeLoric,omitempty"`
	InPlayCharacterIds   []string                   `json:"inPlayCharacterIds,omitempty"`
	CharacterDraft       *CharacterDraftState       `json:"characterDraft,omitempty"`
	DemonBluffs          []string                   `json:"demonBluffs,omitempty"`
	LunaticBluffs        []string                   `json:"lunaticBluffs,omitempty"`
	PlayerBluffs         map[string][]string        `json:"playerBluffs,omitempty"` // keyed by PlayerID
	CustomPlayerMessages map[string]string          `json:"customPlayerMessages,omitempty"`
	Version              int                        `json:"version"`
	UpdatedAt            string                     `json:"updatedAt,omitempty"`
}

// ──────────────────────────────────────────────
// Session
// ──────────────────────────────────────────────

type Session struct {
	ID                    string                `json:"id"`
	Name                  string                `json:"name"`
	CreatedAt             string                `json:"createdAt"`
	DefaultScriptID       string                `json:"defaultScriptId"`
	Players               []Player              `json:"players"`
	DefaultParticipantIDs []string              `json:"defaultParticipantIds"`
	Template              SeatingTemplate       `json:"template"`
	PropagationDefault    PropagationPreference `json:"propagationDefault"`
	GameIDs               []string              `json:"gameIds"`
	Version               int                   `json:"version"`
	UpdatedAt             string                `json:"updatedAt,omitempty"`
}

// ──────────────────────────────────────────────
// Sync
// ──────────────────────────────────────────────

// VersionInfo is the lightweight response for version-check endpoints.
type VersionInfo struct {
	Version   int    `json:"version"`
	UpdatedAt string `json:"updatedAt"`
}
