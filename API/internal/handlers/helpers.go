package handlers

import (
	"encoding/json"
	"log"
	"net/http"
)

// writeJSON marshals v and writes it as a JSON response with the given status.
func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		log.Printf("ERROR write json: %v", err)
	}
}
