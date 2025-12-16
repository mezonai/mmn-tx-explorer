package services
import (
	"github.com/dutchcoders/go-clamd"
	"dong-service/logger"
)

var ClamAV *clamd.Clamd

func InitClamAVService(virusScanURL string) error {
    ClamAV = clamd.NewClamd(virusScanURL)
	if err := ClamAV.Ping(); err != nil {
		return err
	}
	logger.Info().Str("virus_scan_url", virusScanURL).Msg("Connected to ClamAV server successfully")
    return nil
}	
