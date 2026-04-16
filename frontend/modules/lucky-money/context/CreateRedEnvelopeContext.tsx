'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { useForm, FormProvider, UseFormReturn } from 'react-hook-form';
import { CreateRedEnvelopeForm, CreateRedEnvelopeRequest, RedEnvelope } from '../type';
import { DEFAULT_FORM_VALUES, TIMEOUT_MS } from '../constants';
import { useUser } from '@/providers';
import { mmnClient } from '@/modules/auth';
import { useTransfer } from '@/modules/transfer/hooks/useTransfer';
import { toast } from 'sonner';
import { RedEnvelopeService } from '../api';
import { ETransactionStatus, ETransferType } from '@/modules/transaction';
import { useCreateRedEnvelope } from '../hooks/useCreateRedEnvelope';

interface CreateRedEnvelopeContextType {
  methods: UseFormReturn<CreateRedEnvelopeForm>;
  initiateCreation: (data: CreateRedEnvelopeForm) => void;
  confirmCreation: () => void;
  showConfirmModal: boolean;
  setShowConfirmModal: (show: boolean) => void;
  generatedEnvelope: RedEnvelope | null;
  totalAmount: number;
  isPending: boolean;
  isSuccess: boolean;
  resetForm: () => void;
  userBalance: number;
  onRedEnvelopeStatusUpdated: (redEnvelopeId: string) => void;
}

const CreateRedEnvelopeContext = createContext<CreateRedEnvelopeContextType | undefined>(undefined);

export function CreateRedEnvelopeProvider({ children }: { children: ReactNode }) {
  const { transfer } = useTransfer();
  const createRedEnvelopeMutation = useCreateRedEnvelope();
  const { user } = useUser();

  const methods = useForm<CreateRedEnvelopeForm>({
    defaultValues: DEFAULT_FORM_VALUES,
    mode: 'onChange',
  });

  const [generatedEnvelope, setGeneratedEnvelope] = useState<RedEnvelope | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [pendingEnvelopeId, setPendingEnvelopeId] = useState<string | null>(null);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const clearPendingTimeout = useCallback(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
  }, [timeoutId]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => clearPendingTimeout();
  }, [clearPendingTimeout]);

  const fetchUserBalance = useCallback(async () => {
    if (!user || !user.id) return;
    try {
      const account = await mmnClient.getAccountByUserId(user.id);
      const balance = Number(account.balance) / 1000000;
      setUserBalance(balance);
    } catch (error) {
      console.error('Failed to fetch balance', error);
      setUserBalance(0);
    }
  }, [user]);

  useEffect(() => {
    fetchUserBalance();
  }, [fetchUserBalance]);

  const createRequestFromData = useCallback(
    (data: CreateRedEnvelopeForm): CreateRedEnvelopeRequest => {
      const now = new Date();
      const endDate = new Date(now.getTime() + (data.expiryHours || 24) * 60 * 60 * 1000);
      return {
        name: data.name,
        total_amount: data.totalAmount,
        total_claims: data.participantCount,
        min_amount: data.amountMin || 0,
        max_amount: data.amountMax || 0,
        description: data.message,
        is_random_distribution: data.randomDistribution,
        start_date: now.toISOString(),
        end_date: endDate.toISOString(),
        owner_wallet: user?.walletAddress,
      };
    },
    [user?.walletAddress]
  );

  const initiateCreation = useCallback(async (data: CreateRedEnvelopeForm) => {
    setGeneratedEnvelope(null);
    setTotalAmount(data.totalAmount);
    setShowConfirmModal(true);
  }, []);

  const confirmCreation = useCallback(async () => {
    const data = methods.getValues();
    setShowConfirmModal(false);
    setIsProcessing(true);
    try {
      const requestPayload = createRequestFromData(data);
      const envelope = await createRedEnvelopeMutation.mutateAsync(requestPayload);

      const result = await transfer(
        {
          recipientAddress: envelope.red_envelope_wallet,
          amount: data.totalAmount.toString(),
          note: data.message,
          redEnvelopeId: envelope.id,
        },
        ETransferType.LuckyMoney
      );

      if (result.success) {
        toast.success('Transfer money successfully, waiting for confirmation...');
        if (!result.txHash) throw new Error('Transaction hash not found.');

        setPendingEnvelopeId(envelope.id);
        setGeneratedEnvelope(envelope);

        // Start a fallback timer in case the websocket event never arrives
        const newTimeoutId = setTimeout(() => {
          setIsProcessing(false);
          setPendingEnvelopeId(null);
          toast.error('Server is taking longer than expected. Please refresh or check your history.');
        }, TIMEOUT_MS);

        setTimeoutId(newTimeoutId);
      } else {
        toast.error('Transfer failed.');
        await RedEnvelopeService.updateRedEnvelopeStatus({ id: envelope.id, status: ETransactionStatus.Failed });
        setIsProcessing(false);
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      toast.error(errMsg);
      setGeneratedEnvelope(null);
      setIsProcessing(false);
    }
  }, [methods, transfer, createRedEnvelopeMutation, createRequestFromData]);

  const resetForm = useCallback(() => methods.reset(), [methods]);

  const onRedEnvelopeStatusUpdated = useCallback(
    (redEnvelopeId: string) => {
      // Check if this is the envelope we're waiting for
      if (pendingEnvelopeId === redEnvelopeId && isProcessing) {
        clearPendingTimeout();
        setIsProcessing(false);
        setIsSuccess(true);
        toast.success('Create Lucky Money successfully');
        fetchUserBalance();
        setPendingEnvelopeId(null);
      }
    },
    [pendingEnvelopeId, isProcessing, fetchUserBalance, clearPendingTimeout]
  );

  return (
    <CreateRedEnvelopeContext.Provider
      value={{
        methods,
        initiateCreation,
        confirmCreation,
        showConfirmModal,
        setShowConfirmModal,
        generatedEnvelope,
        totalAmount,
        isPending: isProcessing,
        isSuccess,
        resetForm,
        userBalance,
        onRedEnvelopeStatusUpdated,
      }}
    >
      <FormProvider {...methods}>{children}</FormProvider>
    </CreateRedEnvelopeContext.Provider>
  );
}

export function useCreateRedEnvelopeContext() {
  const context = useContext(CreateRedEnvelopeContext);
  if (!context) throw new Error('useCreateRedEnvelopeContext must be used within CreateRedEnvelopeProvider');
  return context;
}
