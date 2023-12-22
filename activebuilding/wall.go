package activebuilding

import (
	"bytes"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"

	"github.com/PuerkitoBio/goquery"
	"github.com/gocolly/colly/v2"
	"golang.org/x/net/html"
)

const (
	wallPath = "/portal/wall/get-posts"
)

type WallPost struct {
	PosterName      string
	MarketplaceName string
	ContentsText    string
	ContentsHTML    string
}

func (c *Client) WallPage(page int) ([]*WallPost, error) {
	var responseErr error
	var responseDoc *goquery.Document
	c.collector.OnResponse(func(r *colly.Response) {
		var responseObj struct {
			Status string `json:"status"`
			Data   struct {
				Posts struct {
					Answer string `json:"answer"`
					HTML   string `json:"html"`
				} `json:"posts"`
			} `json:"data"`
		}
		if responseErr = json.Unmarshal(r.Body, &responseObj); responseErr != nil {
			return
		}
		htmlReader := bytes.NewReader([]byte(responseObj.Data.Posts.HTML))
		responseDoc, responseErr = goquery.NewDocumentFromReader(htmlReader)
		if responseErr != nil {
			return
		}
	})
	err := c.withLoginCheck(func() error {
		return c.collector.Post(c.urlForPath(wallPath), map[string]string{
			"group":  "1",
			"page":   strconv.Itoa(page),
			"filter": "all",
			"sort":   "inserted",
		})
	})
	if err != nil {
		return nil, fmt.Errorf("error fetching wall posts: %w", err)
	}
	if responseErr != nil {
		return nil, fmt.Errorf("error parsing wall post response: %w", err)
	}
	var posts []*WallPost
	responseDoc.Find(".post-content-holder").Each(func(_ int, postObj *goquery.Selection) {
		var post WallPost
		postObj.Find(".post-author-name").Each(func(_ int, nameObj *goquery.Selection) {
			post.PosterName = nameObj.Text()
		})
		var htmlBuf strings.Builder
		postObj.Find(".post-main-content").Each(func(_ int, contentObj *goquery.Selection) {
			for _, parentNode := range contentObj.Nodes {
				node := parentNode.FirstChild
				for node != nil {
					if node.Type == html.ElementNode && node.Data == "div" {
						// Skip marketplace info.
						node = node.NextSibling
						continue
					} else {
						html.Render(&htmlBuf, node)
						post.ContentsText += goquery.NewDocumentFromNode(node).Text() + "\n"
					}
					node = node.NextSibling
				}
			}
			post.MarketplaceName = contentObj.Find(".marketplace-item-name").Text()
		})
		post.ContentsHTML = htmlBuf.String()
		post.ContentsText = strings.TrimSpace(post.ContentsText)
		posts = append(posts, &post)
	})
	return posts, nil
}
