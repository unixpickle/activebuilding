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
	PosterName      string `json:"posterName"`
	RelativeTime    string `json:"relativeTime"`
	MarketplaceName string `json:"marketplaceName"`
	ContentsText    string `json:"contentsText"`
	ContentsHTML    string `json:"contentsHTML"`
	AttachmentsHTML string `json:"attachmentsHTML"`
}

func (c *Client) WallPage(page int) ([]*WallPost, error) {
	co := c.collector()

	var responseErr error
	var responseDoc *goquery.Document
	co.OnResponse(func(r *colly.Response) {
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
	err := c.withLoginCheck(co, func() error {
		return co.Post(c.urlForPath(wallPath), map[string]string{
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
		return nil, fmt.Errorf("error parsing wall post response: %w", responseErr)
	}
	var posts []*WallPost
	responseDoc.Find(".post-holder").Each(func(_ int, postObj *goquery.Selection) {
		var post WallPost
		postObj.Find(".post-holder-author").Each(func(_ int, nameObj *goquery.Selection) {
			post.PosterName = strings.TrimSpace(nameObj.Text())
		})
		var htmlBuf strings.Builder
		postObj.Find(".post-holder-time").Each(func(_ int, contentObj *goquery.Selection) {
			post.RelativeTime = contentObj.Text()
		})
		postObj.Find(".post-holder-body").Each(
			func(_ int, contentObj *goquery.Selection) {
				for _, parentNode := range contentObj.Nodes {
					node := parentNode.FirstChild
					for node != nil {
						if node.Type == html.ElementNode && node.Data == "div" {
							// Skip marketplace info.
							node = node.NextSibling
							continue
						} else {
							SanitizeHTML(&htmlBuf, node)
							post.ContentsText += goquery.NewDocumentFromNode(node).Text() + "\n"
						}
						node = node.NextSibling
					}
				}
				post.MarketplaceName = contentObj.Find(".marketplace-item-name").Text()
			},
		)
		post.ContentsHTML = htmlBuf.String()
		post.ContentsText = strings.TrimSpace(post.ContentsText)

		var attachmentsBuf strings.Builder
		postObj.Find(".post-holder-attachment").Each(
			func(_ int, contentObj *goquery.Selection) {
				for _, node := range contentObj.Nodes {
					SanitizeHTML(&attachmentsBuf, node)
				}
			},
		)
		post.AttachmentsHTML = attachmentsBuf.String()

		posts = append(posts, &post)
	})
	return posts, nil
}
