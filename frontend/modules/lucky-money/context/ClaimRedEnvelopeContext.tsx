'use client';

import { createContext, ReactNode, useContext } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@/providers';
import { ClaimEnvelopeRequest, RedEnvelopeClaim } from '../type';
import { UUID } from 'crypto';
import { useClaimAmount, useClaimRedEnvelope } from '../hooks/useClaimRedEnvelope';

type ClaimStatus = 'idle' | 'pending' | 'success' | 'error';

interface ClaimRedEnvelopeContextType {
  status: ClaimStatus;
  claimMutationData?: RedEnvelopeClaim | null;
  error: Error | null;
  handleClaim: () => void;
  handleClaimAmount: () => void;
  isLoading: boolean;
  isClaiming: boolean;
  isClaimSuccess: boolean;
  claimError: Error | null;
  isClaimError: boolean;
}

const ClaimRedEnvelopeContext = createContext<ClaimRedEnvelopeContextType | undefined>(undefined);

export function ClaimRedEnvelopeProvider({ children }: { children: ReactNode }) {
  const { redEnvelopeId } = useParams<{ redEnvelopeId: UUID }>();
  const { user } = useUser();

  const getAmountMutation = useClaimAmount();
  const claimEnvelopeMutation = useClaimRedEnvelope();

  const handleClaimAmount = () => {
    if (!user?.walletAddress || !redEnvelopeId) {
      console.error('Wallet or ID missing.');
      return;
    }
    getAmountMutation.mutate({ id: redEnvelopeId });
  };

  const handleClaim = async () => {
    const amountData = getAmountMutation.data;
    if (!amountData || !redEnvelopeId || !user?.walletAddress) {
      console.error('Data missing for claim.');
      return;
    }

    const requestData: ClaimEnvelopeRequest = {
      split_money_id: amountData.split_money_id,
    };

    try {
      await claimEnvelopeMutation.mutateAsync({ id: redEnvelopeId, data: requestData });
    } catch (error) {
      console.error('Claim failed:', error);
    }
  };

  const status: ClaimStatus = getAmountMutation.status;
  const error: Error | null = (getAmountMutation.error as Error) || null;

  const value = {
    status,
    claimMutationData: getAmountMutation.data ?? null,
    error,
    handleClaim,
    handleClaimAmount,
    isLoading: getAmountMutation.isPending,
    isClaiming: claimEnvelopeMutation.isPending,
    isClaimSuccess: claimEnvelopeMutation.isSuccess,
    claimError: (claimEnvelopeMutation.error as Error) || null,
    isClaimError: claimEnvelopeMutation.isError,
  };

  return <ClaimRedEnvelopeContext.Provider value={value}>{children}</ClaimRedEnvelopeContext.Provider>;
}

export function useClaimRedEnvelopeContext() {
  const context = useContext(ClaimRedEnvelopeContext);
  if (!context) {
    throw new Error('useClaimRedEnvelopeContext must be used within ClaimRedEnvelopeProvider');
  }
  return context;
}
