export interface TransferInput {
  recipientAddress: string;
  amount: string;
  note?: string;
}

export interface TransferResult {
  success: boolean;
  txHash?: string;
  error?: string;
}
