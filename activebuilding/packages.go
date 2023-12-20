package activebuilding

import (
	"fmt"
	"net/http"
	"net/url"
	"strings"

	"github.com/gocolly/colly/v2"
)

const (
	packagesPath = "/portal/packages"
)

// A Package is a package that was either historically delivered, or is still
// waiting to be picked up.
//
// If ReleasedBy is nil, then the package has not yet been picked up.
type Package struct {
	Arrival     string
	Type        string
	Description string
	AcceptedBy  string
	ReleasedBy  *string
}

// Packages lists the tenant's recent mail.
func (c *Client) Packages() ([]*Package, error) {
	tableSelector := "div.pending table, div.history table"
	packages := []*Package{}
	c.collector.OnHTML(tableSelector, func(h *colly.HTMLElement) {
		items := tableToItems(h)
		for _, item := range items {
			arrivalStr, _ := item["Arrival"]
			itemType, _ := item["Type"]
			description, _ := item["Description"]
			acceptedBy, _ := item["Accepted By"]
			var releasedByPtr *string
			if releasedBy, ok := item["Released By"]; ok {
				releasedByPtr = new(string)
				*releasedByPtr = releasedBy
			}
			packages = append(packages, &Package{
				Arrival:     arrivalStr,
				Type:        itemType,
				Description: description,
				AcceptedBy:  acceptedBy,
				ReleasedBy:  releasedByPtr,
			})
		}
	})
	var redirected *url.URL
	c.collector.SetRedirectHandler(func(req *http.Request, via []*http.Request) error {
		redirected = req.URL
		return nil
	})
	defer c.collector.OnHTMLDetach(tableSelector)
	defer c.collector.SetRedirectHandler(nil)

	destURL := *c.baseURL
	destURL.Path = packagesPath
	err := c.collector.Visit(destURL.String())
	if err != nil {
		return nil, fmt.Errorf("failed to find packages: %w", err)
	}
	if redirected != nil {
		return nil, fmt.Errorf("failed to find packages: %w (redirected to %s)", ErrNotLoggedIn, redirected)
	}
	return packages, nil
}

func tableToItems(table *colly.HTMLElement) []map[string]string {
	var fields []string
	table.ForEach("thead th", func(_ int, h *colly.HTMLElement) {
		fields = append(fields, strings.TrimSpace(h.Text))
	})
	var records []map[string]string
	table.ForEach("tbody tr", func(_ int, h *colly.HTMLElement) {
		var values []string
		h.ForEach("td", func(_ int, h *colly.HTMLElement) {
			var hasLink bool
			h.ForEach("a", func(_ int, _ *colly.HTMLElement) {
				hasLink = true
			})
			if hasLink {
				// "View Tracking Info" link shouldn't be included.
				values = append(values, "")
			} else {
				values = append(values, strings.TrimSpace(h.Text))
			}
		})
		record := map[string]string{}
		for i, v := range values {
			if i < len(fields) {
				record[fields[i]] = v
			}
		}
		records = append(records, record)
	})
	return records
}
