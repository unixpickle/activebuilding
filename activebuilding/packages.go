package activebuilding

import (
	"errors"
	"fmt"
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
	Arrival     string  `json:"arrival"`
	Type        string  `json:"type"`
	Description string  `json:"description"`
	AcceptedBy  string  `json:"accepted_by"`
	ReleasedBy  *string `json:"released_by"`
}

// Packages lists the tenant's recent mail.
func (c *Client) Packages() ([]*Package, error) {
	tableSelector := "div.pending table, div.history table"
	packages := []*Package{}
	var foundTables int
	c.collector.OnHTML(tableSelector, func(h *colly.HTMLElement) {
		foundTables += 1
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
	defer c.collector.OnHTMLDetach(tableSelector)

	err := c.visitWithLoginCheck(packagesPath)
	if err != nil {
		return nil, fmt.Errorf("failed to find packages: %w", err)
	}

	if foundTables == 0 {
		return nil, errors.New("did not find any package tables")
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
