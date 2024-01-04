package activebuilding

import (
	"strings"

	"golang.org/x/net/html"
)

var SafeHTMLElements = map[string]bool{
	"br":   true,
	"p":    true,
	"span": true,
	"div":  true,
	"a":    true,
	"img":  true,
	"ul":   true,
	"li":   true,
	"h1":   true,
	"h2":   true,
	"h3":   true,
	"h4":   true,
}

const (
	ClassPrefix = "sanitized-"
	IDPrefix    = "sanitized-"
)

// SanitizeHTML formats the HTML node as a string, possibly deleting
// unsafe element types and adding prefixes to IDs and class names.
func SanitizeHTML(out *strings.Builder, node *html.Node) error {
	node, err := copyNode(node)
	if node == nil {
		return nil
	}
	if err != nil {
		return err
	}
	if !sanitizeNode(node) {
		return nil
	}
	return html.Render(out, node)
}

func sanitizeNode(node *html.Node) bool {
	if node.Type != html.ElementNode {
		return node.Type == html.TextNode || node.Type == html.DocumentNode
	} else if !SafeHTMLElements[node.Data] {
		return false
	}
	for i, attr := range node.Attr {
		if strings.ToLower(attr.Key) == "class" {
			values := strings.Fields(attr.Val)
			for i, x := range values {
				values[i] = ClassPrefix + x
			}
			attr.Val = strings.Join(values, " ")
			node.Attr[i] = attr
		} else if strings.ToLower(attr.Key) == "id" {
			attr.Val = IDPrefix + attr.Val
			node.Attr[i] = attr
		}
	}
	child := node.FirstChild
	for child != nil {
		next := child.NextSibling
		if !sanitizeNode(child) {
			node.RemoveChild(child)
		}
		child = next
	}
	return true
}

func copyNode(node *html.Node) (*html.Node, error) {
	var buf strings.Builder
	html.Render(&buf, node)
	res, err := html.Parse(strings.NewReader(buf.String()))
	if err != nil {
		return nil, err
	}
	return res.FirstChild.LastChild.FirstChild, nil
}
