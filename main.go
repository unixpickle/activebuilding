package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"os"

	"github.com/unixpickle/activebuilding/activebuilding"
	"github.com/unixpickle/essentials"
)

func main() {
	var statePath string
	flag.StringVar(&statePath, "state-path", "state.json", "client state")
	flag.Parse()

	loginURL := os.Getenv("LOGIN_URL")
	username := os.Getenv("USERNAME")
	password := os.Getenv("PASSWORD")
	if loginURL == "" || username == "" || password == "" {
		essentials.Die("Must pass env vars: LOGIN_URL, USERNAME, and PASSWORD")
	}
	client := activebuilding.NewClient()

	if _, err := os.Stat(statePath); err == nil {
		log.Printf("loading from state: %s...", statePath)
		state, err := LoadState(statePath)
		essentials.Must(err)
		essentials.Must(client.SetState(state))
	} else {
		log.Printf("no state found; logging in...")
		essentials.Must(client.Login(loginURL, username, password))
		essentials.Must(SaveState(statePath, client.State()))
	}

	posts, err := client.WallPage(1)
	essentials.Must(err)
	for _, post := range posts {
		fmt.Printf("%#v\n", post)
	}

	// log.Printf("listing packages...")
	// packages, err := client.Packages()
	// essentials.Must(err)
	// for _, p := range packages {
	// 	fmt.Printf("%#v\n", p)
	// }

	// log.Printf("listing messages...")
	// messages, err := client.Inbox()
	// essentials.Must(err)
	// for _, m := range messages {
	// 	fmt.Printf("%#v\n", m)
	// }

	// log.Printf("fetching first message...")
	// message, err := client.Message(messages[0].ID, messages[0].Folder)
	// essentials.Must(err)
	// fmt.Printf("%#v\n", message)
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
