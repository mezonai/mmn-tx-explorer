package dong_handlers

import (
	"sync"

	"github.com/gin-gonic/gin"
	config "github.com/mezonai/mmn-tx-explorer/indexer/configs"
	"github.com/mezonai/mmn-tx-explorer/indexer/internal/storage"
	"github.com/rs/zerolog/log"
)

var (
	dongMainStorage storage.IMainStorage
	dongStorageOnce sync.Once
	dongStorageErr  error
)


func getDongStorage() (storage.IMainStorage, error) {
	dongStorageOnce.Do(func() {
		var err error

		cfg := &config.Cfg.Storage.Dong
		if config.Cfg.Storage.Dong.Postgres != nil {
			cfg = &config.Cfg.Storage.Dong
		}
		dongMainStorage, err = storage.NewConnector[storage.IMainStorage](cfg)
		if err != nil {
			dongStorageErr = err
			log.Error().Err(err).Msg("Error creating storage connector for dong service")
		}
	})
	return dongMainStorage, dongStorageErr
}


func sendJSONResponse(c *gin.Context, status int, response interface{}) {
	c.JSON(status, response)
}
