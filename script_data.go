package main

import (
	"crypto/subtle"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"sync"
)

// ScriptData stores a KV map that data producer scripts can update with a
// protected endpoint.
type ScriptData struct {
	lock     sync.RWMutex
	data     map[string]string
	savePath string
	secret   string
}

func NewScriptData(savePath, secret string) (*ScriptData, error) {
	f, err := os.Open(savePath)
	var mapping map[string]string
	if err == nil {
		defer f.Close()
		if err := json.NewDecoder(f).Decode(&mapping); err != nil {
			return nil, fmt.Errorf("failed to decode script data at %s: %w", savePath, err)
		}
	} else if !os.IsNotExist(err) {
		return nil, err
	} else {
		mapping = map[string]string{}
	}
	return &ScriptData{
		data:     mapping,
		savePath: savePath,
		secret:   secret,
	}, nil
}

func (s *ScriptData) SetData(secret, key, value string) error {
	if subtle.ConstantTimeCompare([]byte(s.secret), []byte(secret)) == 0 {
		return errors.New("incorrect secret was supplied")
	}
	s.lock.Lock()
	defer s.lock.Unlock()
	s.data[key] = value
	f, err := os.Create(s.savePath)
	if err != nil {
		return fmt.Errorf("failed to open script data file: %w", err)
	}
	if err := json.NewEncoder(f).Encode(s.data); err != nil {
		f.Close()
		return fmt.Errorf("failed to write script data to %s: %w", s.savePath, err)
	}
	if err := f.Close(); err != nil {
		return fmt.Errorf("failed to write script data on close to %s: %w", s.savePath, err)
	}
	return nil
}

func (s *ScriptData) GetData(key string) string {
	s.lock.RLock()
	defer s.lock.RUnlock()
	return s.data[key]
}
