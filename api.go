package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"sync"

	"github.com/unixpickle/activebuilding/activebuilding"
)

type APIServer struct {
	Client    *activebuilding.Client
	StatePath string

	// Login parameters.
	LoginURL string
	Email    string
	Password string

	usageLock sync.Mutex
}

func (a *APIServer) LoadState() error {
	a.usageLock.Lock()
	defer a.usageLock.Unlock()

	if _, err := os.Stat(a.StatePath); os.IsNotExist(err) {
		return nil
	}

	f, err := os.Open(a.StatePath)
	if err != nil {
		return err
	}
	defer f.Close()

	var state *activebuilding.ClientState
	if err := json.NewDecoder(f).Decode(&state); err != nil {
		return err
	}
	return a.Client.SetState(state)
}

func (a *APIServer) saveState() error {
	f, err := os.Create(a.StatePath)
	if err != nil {
		return err
	}
	defer f.Close()
	return json.NewEncoder(f).Encode(a.Client.State())
}

func (a *APIServer) Inbox(w http.ResponseWriter, r *http.Request) {
	handleAPICall(a, w, a.Client.Inbox)
}

func (a *APIServer) Message(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	handleAPICall(a, w, func() (*activebuilding.MessageBody, error) {
		return a.Client.Message(id, "inbox")
	})
}

func (a *APIServer) Packages(w http.ResponseWriter, r *http.Request) {
	handleAPICall(a, w, a.Client.Packages)
}

func (a *APIServer) Wall(w http.ResponseWriter, r *http.Request) {
	handleAPICall(a, w, func() ([]*activebuilding.WallPost, error) {
		return a.Client.WallPage(1)
	})
}

func handleAPICall[T any](a *APIServer, w http.ResponseWriter, f func() (T, error)) {
	result, err := retryWithLogin(a, f)
	w.Header().Set("content-type", "application/json")
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
	} else {
		json.NewEncoder(w).Encode(map[string]T{"data": result})
	}
}

func retryWithLogin[T any](a *APIServer, f func() (T, error)) (T, error) {
	a.usageLock.Lock()
	defer a.usageLock.Unlock()
	var zero T
	result, err := f()
	if err == nil {
		return result, nil
	} else if !errors.Is(err, activebuilding.ErrNotLoggedIn) {
		return zero, err
	}
	log.Printf("logging in due to error: %s", err)
	if err := a.Client.Login(a.LoginURL, a.Email, a.Password); err != nil {
		return zero, err
	}
	if err := a.saveState(); err != nil {
		return zero, fmt.Errorf("failed to save state after logging in: %w", err)
	}
	return f()
}
