package cmd

import (
	"time"

	"github.com/coreos/go-systemd/v22/daemon"
	"github.com/rs/zerolog/log"
)

func startSystemdWatchdog() {
	interval, err := daemon.SdWatchdogEnabled(false)
	if err != nil || interval == 0 {
		return
	}

	log.Info().
		Dur("interval", interval).
		Msg("Systemd watchdog enabled")

	go func() {
		ticker := time.NewTicker(interval / 2)
		defer ticker.Stop()

		for range ticker.C {
			daemon.SdNotify(false, daemon.SdNotifyWatchdog)
		}
	}()
}
