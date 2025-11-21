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
