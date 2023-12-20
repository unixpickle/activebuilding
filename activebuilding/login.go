package activebuilding

import (
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"

	"github.com/gocolly/colly/v2"
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
	return &Client{
		collector: colly.NewCollector(),
	}
}

func (c *Client) Login(loginURL, email, password string) error {
	formInputs := map[string]string{}
	var lastURL *url.URL
	c.collector.SetRedirectHandler(func(r *http.Request, via []*http.Request) error {
		lastURL = r.URL
		return nil
	})
	defer c.collector.SetRedirectHandler(nil)

	c.collector.OnHTML("input", func(h *colly.HTMLElement) {
		formInputs[h.Attr("name")] = h.Attr("value")
	})
	err := c.collector.Post(loginURL, map[string]string{
		"username": email,
	})
	c.collector.OnHTMLDetach("input")
	if err != nil {
		return err
	}
	// Bad username => https://*.activebuilding.com/portal/no-access
	comps := strings.Split(lastURL.Path, "/")
	if comps[len(comps)-1] == "no-access" {
		return errors.New("login username was not recognized")
	}
	formInputs["Password"] = password
	c.collector.Post(lastURL.String(), formInputs)

	// If we stayed on the login page, then the password was wrong.
	// Good password => https://*.activebuilding.com/portal/resident-dashboard
	comps1 := strings.Split(lastURL.Path, "/")
	if comps1[len(comps)-1] == comps[len(comps)-1] {
		return errors.New("login password was incorrect")
	}

	c.baseURL = lastURL

	return nil
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

type ClientState struct {
	BaseURL string
	Cookies []*http.Cookie
}
