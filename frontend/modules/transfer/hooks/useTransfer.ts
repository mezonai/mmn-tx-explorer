import { TransferInput, TransferResult } from '../types';
import { useEffect, useState } from 'react';
import { mmnClient } from '@/modules/auth/utils';
import { ETransferType } from 'mmn-client-js';
import { STORAGE_KEYS } from '@/constant';
import type { UserInfoResponse } from '@/modules/auth/type';

export const useTransfer = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TransferResult | null>(null);
  const [storage, setStorage] = useState<{
    user?: UserInfoResponse | null;
    keyPair?: { publicKey: string; privateKey: string } | null;
    zkProof?: unknown;
  }>({});

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const safeParseJSON = <T>(key: string, raw: string | null): T | null => {
      if (!raw || raw === 'undefined' || raw === 'null' || raw.trim() === '') {
        return null;
      }
      try {
        const parsed = JSON.parse(raw) as T;
        return parsed;
      } catch (e) {

        localStorage.removeItem(key);
        return null;
      }
    };

    try {
      const userRaw = localStorage.getItem(STORAGE_KEYS.USER_INFO);
      const keyPairRaw = localStorage.getItem(STORAGE_KEYS.KEY_PAIR);
      const zkProofRaw = localStorage.getItem(STORAGE_KEYS.ZK_PROOF);

      const user = safeParseJSON<UserInfoResponse>(STORAGE_KEYS.USER_INFO, userRaw);
      const keyPair = safeParseJSON<{ publicKey: string; privateKey: string }>(STORAGE_KEYS.KEY_PAIR, keyPairRaw);
      const zkProof = safeParseJSON<{ proof: string; public_input: string }>(STORAGE_KEYS.ZK_PROOF, zkProofRaw);

      setStorage({ user, keyPair, zkProof });
    } catch (e) {
      console.error('[useTransfer] Failed to read from localStorage:');
    }
  }, []);

  const transfer = async (input: TransferInput) => {
    setLoading(true);
    try {
      const user = storage.user;
      const userId = user?.user_id || user?.sub || user?.mezon_id || (user as any)?.id || '';
      const userName = user?.username || user?.display_name || '';

      if (!userId) {
        const errResult: TransferResult = { success: false, error: 'Missing user info. Please log in again.' };
        setResult(errResult);
        return errResult;
      }

      if (!storage.keyPair?.publicKey || !storage.keyPair?.privateKey) {
        const errResult: TransferResult = { success: false, error: 'Missing cryptographic keys. Please log in again.' };
        setResult(errResult);
        return errResult;
      }

      const zkProofData = storage.zkProof as { proof: string; public_input: string } | null;
      if (!zkProofData?.proof || !zkProofData?.public_input) {
        const errResult: TransferResult = {
          success: false,
          error: 'Missing zero-knowledge proof. Please log in again.',
        };
        setResult(errResult);
        return errResult;
      }

      const senderAddress = mmnClient.getAddressFromUserId(userId);
      const nonceResponse = await mmnClient.getCurrentNonce(userId);
      const currentNonce = Number(nonceResponse.nonce) || 0;

      const TransferResponse = await mmnClient.sendTransactionByAddress({
        sender: senderAddress,
        recipient: input.recipientAddress,
        amount: mmnClient.scaleAmountToDecimals(input.amount),
        nonce: currentNonce + 1,
        textData: input.note || '',
        publicKey: storage.keyPair.publicKey,
        privateKey: storage.keyPair.privateKey,
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
    storage,
  };
};
