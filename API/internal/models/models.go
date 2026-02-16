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
	ID               string         `json:"id"`
	Name             string         `json:"name"`
	Type             CharacterType  `json:"type"`
	DefaultAlignment Alignment      `json:"defaultAlignment"`
	AbilityShort     string         `json:"abilityShort"`
	AbilityDetailed  string         `json:"abilityDetailed,omitempty"`
	WikiLink         string         `json:"wikiLink,omitempty"`
	FirstNight       *NightAction   `json:"firstNight"`
	OtherNights      *NightAction   `json:"otherNights"`
	Icon             *CharacterIcon `json:"icon,omitempty"`
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
// Player / Seat
// ──────────────────────────────────────────────

type PlayerSeat struct {
	Seat              int       `json:"seat"`
	PlayerName        string    `json:"playerName"`
	CharacterID       string    `json:"characterId"`
	Alive             bool      `json:"alive"`
	GhostVoteUsed     bool      `json:"ghostVoteUsed"`
	VisibleAlignment  Alignment `json:"visibleAlignment"`
	ActualAlignment   Alignment `json:"actualAlignment"`
	StartingAlignment Alignment `json:"startingAlignment"`
	ActiveReminders   []string  `json:"activeReminders"`
	IsTraveller       bool      `json:"isTraveller"`
}

// ──────────────────────────────────────────────
// Night History
// ──────────────────────────────────────────────

type NightHistoryEntry struct {
	DayNumber       int                 `json:"dayNumber"`
	IsFirstNight    bool                `json:"isFirstNight"`
	CompletedAt     string              `json:"completedAt"`
	SubActionStates map[string][]bool   `json:"subActionStates"`
	Notes           map[string]string   `json:"notes"`
}

// ──────────────────────────────────────────────
// Game
// ──────────────────────────────────────────────

type Game struct {
	ID           string              `json:"id"`
	SessionID    string              `json:"sessionId"`
	ScriptID     string              `json:"scriptId"`
	CurrentDay   int                 `json:"currentDay"`
	CurrentPhase Phase               `json:"currentPhase"`
	IsFirstNight bool                `json:"isFirstNight"`
	Players      []PlayerSeat        `json:"players"`
	NightHistory []NightHistoryEntry `json:"nightHistory"`
}

// ──────────────────────────────────────────────
// Session
// ──────────────────────────────────────────────

type PlayerTemplate struct {
	Seat       int    `json:"seat"`
	PlayerName string `json:"playerName"`
}

type Session struct {
	ID             string           `json:"id"`
	Name           string           `json:"name"`
	CreatedAt      string           `json:"createdAt"`
	DefaultScriptID string          `json:"defaultScriptId"`
	DefaultPlayers []PlayerTemplate `json:"defaultPlayers"`
	GameIDs        []string         `json:"gameIds"`
}
