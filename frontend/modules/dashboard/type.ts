export interface IDashboardStats {
  total_blocks: number;
  total_transactions: number;
  total_pending_transactions: number;
  average_block_time: number;
  total_wallets: number;
  transactions_24h: number;
  pending_transactions_30m: number;
  total_give_coffee?: number;
  total_p2p_offer_available?: number;
  total_offers?: number;
}