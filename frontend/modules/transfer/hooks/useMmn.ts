import { mmnClient, zkClient } from '../utils';
import { useState } from 'react';
import { MmnOption, TransferResult, TransferInput } from '../types';

export const useMmn = ({ token, userId }: MmnOption) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TransferResult | null>(null);

  const execute = async (input: TransferInput) => {
    try {
      setLoading(true);

      const jwt = token || '';
      const keypair = mmnClient.generateEphemeralKeyPair();
      const senderAddress = mmnClient.getAddressFromUserId(userId);

      // const senderAccount = mmnClient.getAccountByUserId(userId);
      // const senderBalance = (await senderAccount).balance;

      // // Defensive check: ensure sender has enough balance for the requested amount
      // if (!mmnClient.validateAmount(senderBalance, input.amount)) {
      //   const errResult: TransferResult = { success: false, error: 'Insufficient balance' };
      //   setResult(errResult);
      //   return errResult;
      // }

      const zkProof = await zkClient.getZkProofs({
        userId: userId,
        ephemeralPublicKey: keypair.publicKey,
        jwt,
        address: senderAddress,
      });

      const nonceResponse = await mmnClient.getCurrentNonce(userId);
      const currentNonce = Number(nonceResponse.nonce) || 0;

      const TransferResponse = await mmnClient.sendTransactionByAddress({
        sender: senderAddress,
        recipient: input.recipientAddress,
        amount: mmnClient.scaleAmountToDecimals(input.amount),
        nonce: currentNonce + 1,
        textData: input.note || '',
        publicKey: keypair.publicKey,
        privateKey: keypair.privateKey,
        zkProof: zkProof.proof,
        zkPub: zkProof.public_input,
      });

      const txResult: TransferResult = TransferResponse.ok
        ? { success: true, txHash: TransferResponse.tx_hash }
        : { success: false, error: TransferResponse.error || 'Transaction failed' };

      setResult(txResult);
      return txResult;
    } catch (error: any) {
      const errResult = { success: false, error: error.message || 'An error occurred' };
      console.error('Error during transfer:', errResult.error);
      setResult(errResult);
      return errResult;
    } finally {
      setLoading(false);
    }
  };
  return { execute, loading, result };
};
