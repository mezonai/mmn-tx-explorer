export interface TransferInput {
  recipientAddress: string;
  amount: string;
  note?: string;
  offerId?: string;
  redEnvelopeId?: string;
}

export interface TransferByPrivateKeyInput extends TransferInput {
  privateKey: string;
}

export interface TransferResult {
  success: boolean;
  txHash?: string;
  error?: string;
}
