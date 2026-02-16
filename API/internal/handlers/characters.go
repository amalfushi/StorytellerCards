package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"

	"storyteller-cards-api/internal/models"
)

// Characters serves character definition data. GET /api/characters
type Characters struct {
	dataPath string
}

// NewCharacters creates a Characters handler.
// dataPath points to the bundled characters JSON file (e.g. "../UI/src/data/characters.json").
func NewCharacters(dataPath string) *Characters {
	return &Characters{dataPath: dataPath}
}

// List returns all characters, or a filtered subset via ?ids=id1,id2,...
func (h *Characters) List(w http.ResponseWriter, r *http.Request) {
	data, err := os.ReadFile(h.dataPath)
	if err != nil {
		log.Printf("ERROR read characters file: %v", err)
		http.Error(w, "characters data not available", http.StatusInternalServerError)
		return
	}

	// Parse the full character list
	var all []models.CharacterDef
	if err := json.Unmarshal(data, &all); err != nil {
		log.Printf("ERROR parse characters json: %v", err)
		http.Error(w, "bad characters data", http.StatusInternalServerError)
		return
	}

	// If ?ids= is provided, filter to matching IDs
	idsParam := r.URL.Query().Get("ids")
	if idsParam != "" {
		wanted := make(map[string]bool)
		for _, id := range strings.Split(idsParam, ",") {
			id = strings.TrimSpace(id)
			if id != "" {
				wanted[id] = true
			}
		}
		var filtered []models.CharacterDef
		for _, c := range all {
			if wanted[c.ID] {
				filtered = append(filtered, c)
			}
		}
		writeJSON(w, http.StatusOK, filtered)
		return
	}

	writeJSON(w, http.StatusOK, all)
}
