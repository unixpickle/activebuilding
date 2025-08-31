package activebuilding

import (
	"errors"
	"net/http"
	"net/url"
	"strings"

	"github.com/gocolly/colly/v2"
)

func (c *Client) Login(loginURL, email, password string) error {
	// Make the redirect URL correct, as opposed to
	// redirecting to a page we had tried to go to.
	c.SetState(nil)

	co := c.collector()

	formInputs := map[string]string{}
	var lastURL *url.URL
	co.SetRedirectHandler(func(r *http.Request, via []*http.Request) error {
		lastURL = r.URL
		return nil
	})
	defer co.SetRedirectHandler(nil)

	co.OnHTML("input", func(h *colly.HTMLElement) {
		formInputs[h.Attr("name")] = h.Attr("value")
	})
	err := co.Post(loginURL, map[string]string{
		"username": email,
	})
	co.OnHTMLDetach("input")
	if err != nil {
		return err
	}
	// Bad username => https://*.activebuilding.com/portal/no-access
	comps := strings.Split(lastURL.Path, "/")
	if comps[len(comps)-1] == "no-access" {
		return errors.New("login username was not recognized")
	}
	formInputs["Password"] = password
	co.Post(lastURL.String(), formInputs)

	// If we stayed on the login page, then the password was wrong.
	// Good password => https://*.activebuilding.com/portal/resident-dashboard
	comps1 := strings.Split(lastURL.Path, "/")
	if comps1[len(comps1)-1] == comps[len(comps)-1] {
		return errors.New("login password was incorrect")
	}

	c.baseURL = lastURL

	return nil
}
