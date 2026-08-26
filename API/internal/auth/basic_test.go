package auth

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestBasicDisabledWithoutPassword(t *testing.T) {
	handler := Basic("storyteller", "")(okHandler())
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/", nil))

	if response.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusOK)
	}
}

func TestBasicRejectsMissingOrIncorrectCredentials(t *testing.T) {
	handler := Basic("storyteller", "secret")(okHandler())

	for _, test := range []struct {
		name     string
		username string
		password string
	}{
		{name: "missing"},
		{name: "wrong username", username: "other", password: "secret"},
		{name: "wrong password", username: "storyteller", password: "wrong"},
	} {
		t.Run(test.name, func(t *testing.T) {
			request := httptest.NewRequest(http.MethodGet, "/", nil)
			if test.username != "" || test.password != "" {
				request.SetBasicAuth(test.username, test.password)
			}
			response := httptest.NewRecorder()

			handler.ServeHTTP(response, request)

			if response.Code != http.StatusUnauthorized {
				t.Fatalf("status = %d, want %d", response.Code, http.StatusUnauthorized)
			}
			if response.Header().Get("WWW-Authenticate") == "" {
				t.Fatal("WWW-Authenticate header is missing")
			}
		})
	}
}

func TestBasicAcceptsConfiguredCredentials(t *testing.T) {
	handler := Basic("storyteller", "secret")(okHandler())
	request := httptest.NewRequest(http.MethodGet, "/", nil)
	request.SetBasicAuth("storyteller", "secret")
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusOK)
	}
}

func TestBasicAllowsHealthProbeWithoutCredentials(t *testing.T) {
	handler := Basic("storyteller", "secret")(okHandler())
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/health", nil))

	if response.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusOK)
	}
}

func okHandler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
}
