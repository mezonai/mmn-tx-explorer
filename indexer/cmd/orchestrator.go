package cmd

import (
	"net/http"
	"time"

	"github.com/coreos/go-systemd/v22/daemon"
	config "github.com/mezonai/mmn-tx-explorer/indexer/configs"
	"github.com/mezonai/mmn-tx-explorer/indexer/internal/orchestrator"
	"github.com/mezonai/mmn-tx-explorer/indexer/internal/rpc"
	"github.com/mezonai/mmn-tx-explorer/indexer/internal/services"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
)

var (
	orchestratorCmd = &cobra.Command{
		Use:   "orchestrator",
		Short: "TBD",
		Long:  "TBD",
		Run: func(cmd *cobra.Command, args []string) {
			RunOrchestrator(cmd, args)
		},
	}
)

func RunOrchestrator(cmd *cobra.Command, args []string) {
	log.Info().Msg("Starting indexer")

	rpcClient, err := rpc.Initialize()
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to initialize RPC")
	}

	orchestratorService, err := orchestrator.NewOrchestrator(rpcClient)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to create orchestrator")
	}

	daemon.SdNotify(false, daemon.SdNotifyReady)
	startSystemdWatchdog()

	// Start Prometheus metrics server
	log.Info().Msg("Starting Metrics Server on port 2112")
	go func() {
		http.Handle("/metrics", promhttp.Handler())
		err := http.ListenAndServe(":2112", nil)
		if err != nil {
			log.Error().Err(err).Msg("Failed to start metrics server")
			return
		}
	}()

	if config.Cfg.Event.APIURL != "" {
		if err := services.InitEventService(config.Cfg.Event.APIURL, config.Cfg.Event.APIKey); err != nil {
			log.Error().Err(err).Msg("Failed to initialize Event Service")
		}
	}

	orchestratorService.Start()
}

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
