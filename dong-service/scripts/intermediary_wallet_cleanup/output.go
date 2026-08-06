package main

import "fmt"

func printSummary(stats *CleanupStats, dryRun bool, force bool) {
	fmt.Println("==========================================================")
	fmt.Println("   INTERMEDIARY WALLET CLEANUP - SUMMARY")
	fmt.Println("==========================================================")
	fmt.Printf("Total wallets scanned:     %d\n", stats.TotalWallets)
	fmt.Printf("Valid wallets:             %d\n", stats.ValidWallets)
	fmt.Printf("Corrupted wallets:         %d\n", stats.CorruptedWallets)
	fmt.Println()

	if stats.CorruptedWallets == 0 {
		fmt.Println("All wallets are valid. No cleanup needed.")
		fmt.Println("==========================================================")
		return
	}

	switch {
	case dryRun:
		fmt.Println("Mode: DRY-RUN (no changes made)")
		fmt.Println("Records that WOULD be affected:")
		if stats.DeletedRedEnvelopes > 0 {
			fmt.Printf("   - red_envelope:            %d\n", stats.DeletedRedEnvelopes)
			fmt.Printf("   - red_envelope_claim:      %d\n", stats.DeletedClaims)
			fmt.Printf("   - red_envelope_split_money: %d\n", stats.DeletedSplitMoney)
		}
		if stats.DeletedOffers > 0 {
			fmt.Printf("   - offers:                  %d\n", stats.DeletedOffers)
			fmt.Printf("   - orders:                  %d\n", stats.DeletedOrders)
		}

	case force:
		fmt.Println("Mode: FORCE DELETE")
		fmt.Println("Records deleted:")
		fmt.Printf("   - intermediary_wallet:     %d\n", stats.DeletedWallets)
		if stats.DeletedRedEnvelopes > 0 {
			fmt.Printf("   - red_envelope:            %d\n", stats.DeletedRedEnvelopes)
			fmt.Printf("   - red_envelope_claim:      %d\n", stats.DeletedClaims)
			fmt.Printf("   - red_envelope_split_money: %d\n", stats.DeletedSplitMoney)
		}
		if stats.DeletedOffers > 0 {
			fmt.Printf("   - offers:                  %d\n", stats.DeletedOffers)
			fmt.Printf("   - orders:                  %d\n", stats.DeletedOrders)
		}

	default:
		fmt.Println("Mode: SMART DELETE")
		fmt.Println("Actions taken:")
		if stats.DeletedWallets > 0 {
			fmt.Printf("   - intermediary_wallet deleted(READY):  %d\n", stats.DeletedWallets)
		}
		if stats.SoftDeletedWallets > 0 {
			fmt.Printf("   - intermediary_wallet disabled(IN-USE): %d\n", stats.SoftDeletedWallets)
		}
		if stats.SoftDeletedRedEnv > 0 {
			fmt.Printf("   - red_envelope marked FAILED:   %d\n", stats.SoftDeletedRedEnv)
		}
		if stats.SoftDeletedOffers > 0 {
			fmt.Printf("   - offers marked CANCELED:       %d\n", stats.SoftDeletedOffers)
		}
	}
	fmt.Println("==========================================================")

	if dryRun && stats.CorruptedWallets > 0 {
		fmt.Println("To actually delete, run:")
		fmt.Println("   go run scripts/cleanup/main.go                # Smart delete")
		fmt.Println("   go run scripts/cleanup/main.go --force        # Force cascade delete")
	}
}
