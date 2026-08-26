package web

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestNewSPAHandlerRequiresIndex(t *testing.T) {
	_, err := NewSPAHandler(t.TempDir())
	if err == nil {
		t.Fatal("expected missing index error")
	}
}

func TestSPAHandlerServesExistingAsset(t *testing.T) {
	distDir := makeDist(t)
	assetDir := filepath.Join(distDir, "assets")
	if err := os.MkdirAll(assetDir, 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(assetDir, "app.js"), []byte("asset"), 0644); err != nil {
		t.Fatal(err)
	}
	handler, err := NewSPAHandler(distDir)
	if err != nil {
		t.Fatal(err)
	}
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/assets/app.js", nil))

	if response.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusOK)
	}
	if body := strings.TrimSpace(response.Body.String()); body != "asset" {
		t.Fatalf("body = %q, want asset", body)
	}
}

func TestSPAHandlerFallsBackToIndexForClientRoute(t *testing.T) {
	handler, err := NewSPAHandler(makeDist(t))
	if err != nil {
		t.Fatal(err)
	}
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/session/example", nil))

	if response.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusOK)
	}
	if body := strings.TrimSpace(response.Body.String()); body != "<html>app</html>" {
		t.Fatalf("body = %q, want index content", body)
	}
}

func makeDist(t *testing.T) string {
	t.Helper()
	distDir := t.TempDir()
	if err := os.WriteFile(
		filepath.Join(distDir, "index.html"),
		[]byte("<html>app</html>"),
		0644,
	); err != nil {
		t.Fatal(err)
	}
	return distDir
}
