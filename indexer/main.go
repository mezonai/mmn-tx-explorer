package main

import "github.com/mezonai/mmn-tx-explorer/indexer/cmd"
// @title           Indexer API
// @version         1.0
// @description     API for indexing blockchain data.
// @termsOfService  http://swagger.io/terms/

// @contact.name   API Support
// @contact.email  support@example.com

// @license.name  Apache 2.0
// @license.url   http://www.apache.org/licenses/LICENSE-2.0.html

// @host      localhost:8080
// @schemes http https

func main() {
	cmd.Execute()
}
