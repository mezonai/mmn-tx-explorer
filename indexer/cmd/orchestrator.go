package cmd

import (
	"net/http"

	"github.com/mezonai/mmn-tx-explorer/indexer/internal/orchestrator"
	"github.com/mezonai/mmn-tx-explorer/indexer/internal/rpc"
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

	orchestratorService.Start()
}
