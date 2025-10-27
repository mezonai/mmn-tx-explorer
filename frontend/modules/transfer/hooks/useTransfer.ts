import { TransferInput, TransferResult } from '../types';
import { useState } from 'react';
import { mmnClient } from '@/modules/auth/utils';
import { ETransferType } from 'mmn-client-js';
import { useUser, useKeypair, useZkProof } from '@/providers';

export const useTransfer = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TransferResult | null>(null);

  const { user } = useUser();
  const { keypair } = useKeypair();
  const { zkProof } = useZkProof();

  const transfer = async (input: TransferInput) => {
    setLoading(true);
    try {
      const userId = user?.id || (user as any)?.id || '';
      const userName = user?.username || '';

      if (!userId) {
        const errResult: TransferResult = { success: false, error: 'Missing user info. Please log in again.' };
        setResult(errResult);
        return errResult;
      }

      if (!keypair?.publicKey || !keypair?.privateKey) {
        const errResult: TransferResult = { success: false, error: 'Missing cryptographic keys. Please log in again.' };
        setResult(errResult);
        return errResult;
      }

      const zkProofData = zkProof as { proof: string; public_input: string } | null;
      if (!zkProofData?.proof || !zkProofData?.public_input) {
        const errResult: TransferResult = {
          success: false,
          error: 'Missing zero-knowledge proof. Please log in again.',
        };
        setResult(errResult);
        return errResult;
      }

      const nonceResponse = await mmnClient.getCurrentNonce(userId);
      const currentNonce = Number(nonceResponse.nonce) || 0;

      const TransferResponse = await mmnClient.sendTransactionByAddress({
        sender: user?.walletAddress || '',
        recipient: input.recipientAddress,
        amount: mmnClient.scaleAmountToDecimals(input.amount),
        nonce: currentNonce + 1,
        textData: input.note || '',
        publicKey: keypair?.publicKey || '',
        privateKey: keypair?.privateKey || '',
        zkProof: zkProofData.proof,
        zkPub: zkProofData.public_input,
        extraInfo: {
          UserSenderId: userId,
          UserSenderUsername: userName,
          UserReceiverId: input.recipientAddress,
          type: ETransferType.GiveCoffee,
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
  };

  return {
    transfer,
    loading,
    result,
    user,
  };
};
