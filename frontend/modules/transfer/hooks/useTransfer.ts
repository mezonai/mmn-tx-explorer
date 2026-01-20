import { TransferInput, TransferResult } from '../types';
import { useState, useCallback } from 'react';
import { mmnClient } from '@/modules/auth/utils';
import { useUser, useKeypair, useZkProof } from '@/providers';

export const useTransfer = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TransferResult | null>(null);

  const { user } = useUser();
  const { keypair } = useKeypair();
  const { zkProof } = useZkProof();

  const transfer = useCallback(
    async (input: TransferInput, transaction_type: string) => {
      setLoading(true);
      try {
        const userId = user?.id || '';
        const userName = user?.username || '';
        const publicKey = keypair?.publicKey;
        const privateKey = keypair?.privateKey;

        if (!userId) throw new Error('Missing user info. Please log in again.');
        if (!publicKey || !privateKey) throw new Error('Missing cryptographic keys. Please log in again.');
        if (!zkProof?.proof || !zkProof?.public_input)
          throw new Error('Missing zero-knowledge proof. Please log in again.');

        const nonceResponse = await mmnClient.getCurrentNonce(userId);
        const currentNonce = Number(nonceResponse.nonce) || 0;

        const TransferResponse = await mmnClient.sendTransactionByAddress({
          sender: user?.walletAddress || '',
          recipient: input.recipientAddress,
          amount: mmnClient.scaleAmountToDecimals(input.amount),
          nonce: currentNonce + 1,
          textData: input.note || '',
          publicKey: publicKey,
          privateKey: privateKey,
          zkProof: zkProof.proof,
          zkPub: zkProof.public_input,
          extraInfo: {
            UserSenderId: userId,
            UserSenderUsername: userName,
            type: transaction_type,
            ...(input.offerId && { offer_id: input.offerId }),
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
    [user, keypair, zkProof]
  );

  return {
    transfer,
    loading,
    result,
    user,
  };
};
