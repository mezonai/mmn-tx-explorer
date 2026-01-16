import { TransferByPrivateKeyInput, TransferResult } from '../types';
import { useState, useCallback } from 'react';
import { mmnClient } from '@/modules/auth/utils';
import { useZkProof } from '@/providers/AppProvider';

export const useTransferByPrivateKey = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TransferResult | null>(null);
  const { zkProof } = useZkProof();

  const transfer = useCallback(
    async (input: TransferByPrivateKeyInput, transaction_type: string, senderAddress: string) => {
      setLoading(true);
      try {
        if (!input.privateKey) throw new Error('Missing private key.');
        if (!input.recipientAddress) throw new Error('Missing recipient address.');

        const nonceResponse = await mmnClient.getCurrentNonceByAddress(senderAddress);
        const scaledAmount = mmnClient.scaleAmountToDecimals(input.amount);

        const TransferResponse = await mmnClient.sendTransactionByPrivateKey({
          sender: senderAddress,
          recipient: input.recipientAddress,
          amount: scaledAmount,
          nonce: nonceResponse.nonce + 1,
          textData: input.note || '',
          privateKey: input.privateKey,
          extraInfo: {
            type: transaction_type,
          },
        });

        const txResult: TransferResult = TransferResponse.ok
          ? { success: true, txHash: TransferResponse.tx_hash }
          : { success: false, error: TransferResponse.error || 'Transaction failed' };
        setResult(txResult);
        return txResult;
      } catch (error: any) {
        const errResult: TransferResult = { success: false, error: error?.message || 'An error occurred' };
        console.error('Error during transfer:', errResult.error);
        setResult(errResult);
        return errResult;
      } finally {
        setLoading(false);
      }
    },
    [zkProof]
  );

  return {
    transfer,
    loading,
    result,
  };
};
