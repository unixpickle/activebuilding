package activebuilding

import (
	"strings"
	"testing"

	"golang.org/x/net/html"
)

func TestSanitize(t *testing.T) {
	inputDoc := `<p><script>alert('hi')</script> hello world <br/><span class="foo  header" id="bar"></span></p>`
	parsed, err := html.Parse(strings.NewReader(inputDoc))
	if err != nil {
		t.Fatal(err)
	}
	var out strings.Builder
	err = SanitizeHTML(&out, parsed)
	if err != nil {
		t.Fatal(err)
	}
	expected := `<p> hello world <br/><span class="sanitized-foo sanitized-header" id="sanitized-bar"></span></p>`
	actual := out.String()
	if actual != expected {
		t.Fatalf("expected %#v but got %#v", expected, actual)
	}
}
