package activebuilding

import (
	"errors"
	"fmt"
	"net/http"
	"net/url"

	"github.com/gocolly/colly/v2"
	"github.com/gocolly/colly/v2/storage"
)

var (
	ErrNotLoggedIn = errors.New("not logged in")
)

// A Client accesses an activebuilding portal.
//
// Methods are generally not safe to call concurrently.
type Client struct {
	collector *colly.Collector
	baseURL   *url.URL
}

func NewClient() *Client {
	c := colly.NewCollector()
	c.SetStorage(&dummyStorage{})
	return &Client{
		collector: c,
	}
}

// MustLogin returns true if the client definitely doesn't have credentials to
// make API calls.
//
// If this returns true, then other methods may panic() if called.
func (c *Client) MustLogin() bool {
	return c.baseURL == nil
}

// State gathers the client's state to be loaded by SetState().
func (c *Client) State() *ClientState {
	if c.baseURL == nil {
		return nil
	}
	return &ClientState{
		BaseURL: c.baseURL.String(),
		Cookies: c.collector.Cookies(c.baseURL.String()),
	}
}

func (c *Client) SetState(state *ClientState) error {
	c.collector.Init()
	c.collector.SetStorage(&dummyStorage{})
	if state == nil {
		return nil
	}
	c.collector.SetCookies(state.BaseURL, state.Cookies)
	var err error
	c.baseURL, err = url.Parse(state.BaseURL)
	if err != nil {
		return fmt.Errorf("failed to load state: %w", err)
	}
	return nil
}

func (c *Client) visitWithLoginCheck(path string) error {
	var redirected *url.URL
	c.collector.SetRedirectHandler(func(req *http.Request, via []*http.Request) error {
		redirected = req.URL
		return nil
	})
	defer c.collector.SetRedirectHandler(nil)

	err := c.collector.Visit(c.urlForPath(path))
	if err != nil {
		return err
	}
	if redirected != nil {
		return fmt.Errorf("%w (redirected to %s)", ErrNotLoggedIn, redirected)
	}
	return nil
}

func (c *Client) withLoginCheck(f func() error) error {
	var redirected *url.URL
	c.collector.SetRedirectHandler(func(req *http.Request, via []*http.Request) error {
		redirected = req.URL
		return nil
	})
	defer c.collector.SetRedirectHandler(nil)

	if err := f(); err != nil {
		return err
	}
	if redirected != nil {
		return fmt.Errorf("%w (redirected to %s)", ErrNotLoggedIn, redirected)
	}
	return nil
}

func (c *Client) urlForPath(path string) string {
	u := *c.baseURL
	u.Path = path
	return u.String()
}

type ClientState struct {
	BaseURL string
	Cookies []*http.Cookie
}

type dummyStorage struct {
	storage.InMemoryStorage
}

func (d *dummyStorage) Visited(requestID uint64) error {
	// Do not cache every URL we visit.
	return nil
}
