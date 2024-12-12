package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"

	"github.com/unixpickle/activebuilding/activebuilding"
	"github.com/unixpickle/essentials"
)

func main() {
	var statePath string
	var scriptDataPath string
	var addr string
	var assetDir string
	flag.StringVar(&statePath, "state-path", "state.json", "client state")
	flag.StringVar(&scriptDataPath, "script-data-path", "script_data.json",
		"state from external scripts")
	flag.StringVar(&addr, "addr", ":8080", "address to listen on")
	flag.StringVar(&assetDir, "asset-dir", "./web", "address to listen on")
	flag.Parse()

	loginURL := os.Getenv("LOGIN_URL")
	username := os.Getenv("AB_USERNAME")
	if username == "" {
		username = os.Getenv("USERNAME")
	}
	password := os.Getenv("PASSWORD")
	scriptSecret := os.Getenv("SCRIPT_SECRET")
	if loginURL == "" || username == "" || password == "" || scriptSecret == "" {
		essentials.Die("Must pass env vars: LOGIN_URL, USERNAME, PASSWORD, and SCRIPT_SECRET")
	}
	client := activebuilding.NewClient()
	sd, err := NewScriptData(scriptDataPath, scriptSecret)
	essentials.Must(err)
	apiServer := &APIServer{
		Client:     client,
		ScriptData: sd,
		StatePath:  statePath,
		LoginURL:   loginURL,
		Email:      username,
		Password:   password,
	}
	if err := apiServer.LoadState(); err != nil {
		essentials.Die("failed to load state:", err)
	}
	http.HandleFunc("/api/inbox", apiServer.Inbox)
	http.HandleFunc("/api/message", apiServer.Message)
	http.HandleFunc("/api/packages", apiServer.Packages)
	http.HandleFunc("/api/wall", apiServer.Wall)
	http.HandleFunc("/api/kv", apiServer.KV)
	http.Handle("/", http.FileServer(http.Dir(assetDir)))
	log.Printf("attempting to listen on: %s", addr)
	http.ListenAndServe(addr, nil)
}

func LoadState(path string) (*activebuilding.ClientState, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	data, err := io.ReadAll(f)
	if err != nil {
		return nil, fmt.Errorf("error reading client state from %s: %w", path, err)
	}
	var state activebuilding.ClientState
	if err := json.Unmarshal(data, &state); err != nil {
		return nil, fmt.Errorf("error parsing client state from %s: %w", path, err)
	}
	return &state, nil
}

func SaveState(path string, state *activebuilding.ClientState) error {
	f, err := os.Create(path)
	if err != nil {
		return err
	}
	defer f.Close()
	if err := json.NewEncoder(f).Encode(state); err != nil {
		if err != nil {
			return fmt.Errorf("failed to save state to %s: %w", path, err)
		}
	}
	return nil
}
