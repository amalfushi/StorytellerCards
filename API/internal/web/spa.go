package web

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

// NewSPAHandler serves static files and falls back to index.html for client-side routes.
func NewSPAHandler(distDir string) (http.Handler, error) {
	indexPath := filepath.Join(distDir, "index.html")
	if _, err := os.Stat(indexPath); err != nil {
		return nil, fmt.Errorf("find SPA index: %w", err)
	}

	fileServer := http.FileServer(http.Dir(distDir))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cleanPath := filepath.Clean("/" + r.URL.Path)
		relativePath := strings.TrimPrefix(cleanPath, string(filepath.Separator))
		requestedPath := filepath.Join(distDir, relativePath)

		if info, err := os.Stat(requestedPath); err == nil && !info.IsDir() {
			fileServer.ServeHTTP(w, r)
			return
		}

		http.ServeFile(w, r, indexPath)
	}), nil
}
