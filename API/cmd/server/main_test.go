package main

import (
	"os"
	"path/filepath"
	"testing"
)

func TestResolveDataDir(t *testing.T) {
	root := t.TempDir()
	originalWorkingDir, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		if err := os.Chdir(originalWorkingDir); err != nil {
			t.Fatal(err)
		}
	})

	if err := os.MkdirAll(filepath.Join(root, "API", "cmd", "server"), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(filepath.Join(root, "API", "data"), 0755); err != nil {
		t.Fatal(err)
	}

	t.Run("repository root", func(t *testing.T) {
		t.Setenv("STORYTELLER_DATA_DIR", "")
		t.Setenv("DATA_DIR", "")
		if err := os.Chdir(root); err != nil {
			t.Fatal(err)
		}
		if got := filepath.Clean(resolveDataDir()); got != filepath.Join("API", "data") {
			t.Fatalf("resolveDataDir() = %q, want %q", got, filepath.Join("API", "data"))
		}
	})

	t.Run("server package directory", func(t *testing.T) {
		t.Setenv("STORYTELLER_DATA_DIR", "")
		t.Setenv("DATA_DIR", "")
		if err := os.Chdir(filepath.Join(root, "API", "cmd", "server")); err != nil {
			t.Fatal(err)
		}
		if got := filepath.Clean(resolveDataDir()); got != filepath.Join("..", "..", "data") {
			t.Fatalf("resolveDataDir() = %q, want %q", got, filepath.Join("..", "..", "data"))
		}
	})

	t.Run("environment override", func(t *testing.T) {
		t.Setenv("STORYTELLER_DATA_DIR", filepath.Join(root, "custom-data"))
		t.Setenv("DATA_DIR", filepath.Join(root, "legacy-data"))
		if got := resolveDataDir(); got != filepath.Join(root, "custom-data") {
			t.Fatalf("resolveDataDir() = %q, want environment override", got)
		}
	})

	t.Run("legacy environment override", func(t *testing.T) {
		t.Setenv("STORYTELLER_DATA_DIR", "")
		t.Setenv("DATA_DIR", filepath.Join(root, "legacy-data"))
		if got := resolveDataDir(); got != filepath.Join(root, "legacy-data") {
			t.Fatalf("resolveDataDir() = %q, want legacy environment override", got)
		}
	})
}
