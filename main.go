package main

import (
	"github.com/unixpickle/activebuilding/activebuilding"
	"github.com/unixpickle/essentials"
)

func main() {
	client := activebuilding.NewClient()
	essentials.Must(client.Login("", "", ""))
}
