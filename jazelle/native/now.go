package main

import "fmt"
import "time"

func main() {
	fmt.Println(time.Now().UnixNano() / 1e6)
}
