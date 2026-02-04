export interface CreateSwapHistoryRequest {
  send_wallet_address: string;
  receive_wallet_address: string;
  tx_hash: string;
  amount: number;
  type: string;
}

export interface CreateSwapHistoryResponse {
  message: string;
}

export interface RecentTransaction {
  TxHash: string;
  Amount: string;
  ToAddress: string;
  CreatedAt: string;
  Type: string;
}

export interface RecentTransactionsResponse {
  success: boolean;
  message: string;
  data: RecentTransaction[];
  meta: {
    page: number;
    limit: number;
    total_items: number;
    total_pages: number;
  };
}
