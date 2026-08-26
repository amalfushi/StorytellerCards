package auth

import (
	"crypto/subtle"
	"net/http"
)

// Basic protects all application routes except the health probe when a password is configured.
func Basic(username, password string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		if password == "" {
			return next
		}

		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.URL.Path == "/health" {
				next.ServeHTTP(w, r)
				return
			}

			providedUsername, providedPassword, ok := r.BasicAuth()
			usernameMatches := subtle.ConstantTimeCompare([]byte(providedUsername), []byte(username)) == 1
			passwordMatches := subtle.ConstantTimeCompare([]byte(providedPassword), []byte(password)) == 1
			if !ok || !usernameMatches || !passwordMatches {
				w.Header().Set("WWW-Authenticate", `Basic realm="Storyteller Cards", charset="UTF-8"`)
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
