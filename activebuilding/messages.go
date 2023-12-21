package activebuilding

import (
	"errors"
	"fmt"
	"net/url"
	"strings"

	"github.com/gocolly/colly/v2"
	"golang.org/x/net/html"
)

const (
	inboxPath = "/portal/messages/inbox"
)

type MessageListing struct {
	// ID is typically numerical, like "12345678"
	ID string

	// Folder might be something like "inbox"
	Folder string

	// This is a human-readable timestamp.
	LastActivity string

	// Name of sender (typically plain text, not a real username)
	Username string

	// First line of message preview, typically shown in bold.
	Subject string

	// Beginning of body, typically with ellipses.
	Preview string
}

// MessageBody is the full contents of a message.
type MessageBody struct {
	BodyHTML string
	BodyText string
}

// Inbox fetches an overview of messages in the user's inbox.
//
// To get more details about a message, see Message().
func (c *Client) Inbox() ([]*MessageListing, error) {
	tableSelector := ".messages-container-section table"
	messages := []*MessageListing{}
	var parseError error
	c.collector.OnHTML(tableSelector, func(h *colly.HTMLElement) {
		h.ForEach("tr", func(i int, h *colly.HTMLElement) {
			if i == 0 {
				// Skip the header.
				return
			}
			relText := h.Attr("rel")
			rel := strings.Split(relText, ",")
			if len(rel) != 2 {
				parseError = fmt.Errorf("failed to list inbox: invalid 'rel' attribute: %#v", relText)
				return
			}
			id := rel[0]
			folder := rel[1]
			var username string
			h.ForEach("td.user-name", func(_ int, h *colly.HTMLElement) {
				username = strings.TrimSpace(h.Text)
			})
			var subject, preview string
			h.ForEach("td.view-message", func(_ int, h *colly.HTMLElement) {
				h.ForEach("h4", func(_ int, h *colly.HTMLElement) {
					subject = strings.TrimSpace(h.Text)
				})
				lines := strings.Split(strings.TrimSpace(h.Text), "\n")
				preview = strings.TrimSpace(lines[len(lines)-1])
			})
			var lastActivity string
			h.ForEach("td.last-activity", func(_ int, h *colly.HTMLElement) {
				// This is something like "October 30, 2023<br/>3:49 PM"
				child := h.DOM.Nodes[0].FirstChild
				for child != nil {
					if child.Type == html.TextNode {
						lastActivity += child.Data
						lastActivity += " "
					}
					child = child.NextSibling
				}
				lastActivity = strings.TrimSpace(lastActivity)
			})
			messages = append(messages, &MessageListing{
				ID:           id,
				Folder:       folder,
				LastActivity: lastActivity,
				Username:     username,
				Subject:      subject,
				Preview:      preview,
			})
		})
	})
	defer c.collector.OnHTMLDetach(tableSelector)

	err := c.visitWithLoginCheck(inboxPath)
	if err != nil {
		return nil, fmt.Errorf("failed to list inbox: %w", err)
	}
	if parseError != nil {
		return nil, parseError
	}
	return messages, nil
}

// Message fetches the body of a message.
func (c *Client) Message(id, folder string) (*MessageBody, error) {
	textSelector := ".message-text"
	var result *MessageBody
	c.collector.OnHTML(textSelector, func(h *colly.HTMLElement) {
		if result != nil {
			return
		}
		var buf strings.Builder
		for _, node := range h.DOM.Nodes {
			child := node.FirstChild
			for child != nil {
				html.Render(&buf, child)
				child = child.NextSibling
			}
		}
		result = &MessageBody{
			BodyText: h.Text,
			BodyHTML: buf.String(),
		}
	})
	defer c.collector.OnHTMLDetach(textSelector)

	path := fmt.Sprintf(
		"/portal/messages/view/messageId/%s/folder/%s",
		url.PathEscape(id),
		url.PathEscape(folder),
	)
	err := c.visitWithLoginCheck(path)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch message: %w", err)
	}
	if result == nil {
		return nil, errors.New("failed to fetch message: no text contents were found")
	}
	return result, nil
}
