'use client';

import { createContext, ReactNode, useCallback, useContext, useState } from "react";
import { CreateRedEnvelopeForm, CreateRedEnvelopeRequest, RedEnvelope, UpdateStatusRedEnvelopeRequest } from "../type";
import { DEFAULT_FORM_VALUES } from "../constants";
import { useUser } from "@/providers";
import { mmnClient } from "@/modules/auth";
import { useTransfer } from "@/modules/transfer/hooks/useTransfer";
import { toast } from "sonner";
import { RedEnvelopeService } from "../api";
import { ETransactionStatus, TransactionService } from "@/modules/transaction";
import { useCreateRedEnvelope } from "../hooks/useCreateRedEnvelope";
import { ROUTES } from "@/configs/routes.config";
import { useRouter } from "next/navigation";

interface CreateRedEnvelopeContextType {
  form: CreateRedEnvelopeForm;
  updateField: <K extends keyof CreateRedEnvelopeForm>(field: K, value: CreateRedEnvelopeForm[K]) => void;
  resetForm: () => void;
  toRequest: () => CreateRedEnvelopeRequest;
  initiateCreation: () => void; 
  confirmCreation: () => void;  
  showConfirmModal: boolean;  
  setShowConfirmModal: (show: boolean) => void;
  generatedEnvelope: RedEnvelope | null; 
  isPending: boolean; 
  isSuccess: boolean;
}
const CreateRedEnvelopeContext = createContext<CreateRedEnvelopeContextType | undefined>(undefined);

export function CreateRedEnvelopeProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { transfer } = useTransfer();
  const createRedEnvelopeMutation = useCreateRedEnvelope();
  const { user } = useUser();
  const [form, setForm] = useState<CreateRedEnvelopeForm>(DEFAULT_FORM_VALUES);
  const updateField = useCallback(<K extends keyof CreateRedEnvelopeForm>(field: K, value: CreateRedEnvelopeForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const [generatedEnvelope, setGeneratedEnvelope] = useState<RedEnvelope | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false)

  const resetForm = useCallback(() => {
    setForm(DEFAULT_FORM_VALUES);
  }, []);

  const toRequest = useCallback((): CreateRedEnvelopeRequest => {
    const now = new Date();
    const endDate = new Date(now.getTime() + (form.expiryHours || 0) * 60 * 60 * 1000);
    return {
      name: form.name,
      total_amount: form.totalAmount || 0,
      total_claims: form.participantCount || 0,
      min_amount: form.amountMin || 0,
      max_amount: form.amountMax || 0,
      description: form.message,
      is_random_distribution: form.randomDistribution,
      start_date: now.toISOString(),
      end_date: endDate.toISOString(),
      owner_wallet: user?.walletAddress,
    };
  }, [form, user?.walletAddress]); 

  const initiateCreation = useCallback(async () => {
    setIsSuccess(false)
    setGeneratedEnvelope(null);

    try {
      if (!user || !user.id) {
        toast.error("User not authenticated");
        return;
      }

      const account = await mmnClient.getAccountByUserId(user.id);
      if (Number(account.balance)/ 1000000 < form.totalAmount) {
        throw new Error("Balance Insufficient"); 
      };

      if (!form.totalAmount || form.totalAmount <= 0 || !Number.isInteger(form.totalAmount)) {
        throw new Error("Total amount must be greater than zero or integer");
      }

      if (!form.participantCount || form.participantCount <= 0 || !Number.isInteger(form.participantCount)) {
        throw new Error("Participant count must be greater than zero or integer");
      }

      if (!form.amountMin || form.amountMin <= 0 || !Number.isInteger(form.amountMin)) {
        throw new Error("Amount min must be greater than zero or integer");
      }

      if (!form.amountMax || form.amountMax <= 0 || !Number.isInteger(form.amountMax)) {
        throw new Error("Amount max must be greater than zero or integer");
      } 
      if (form.amountMin > form.amountMax) {
        throw new Error("Amount min cannot be greater than amount max.");
      } 
      if (form.totalAmount < form.amountMin * form.participantCount) {
        throw new Error("Total amount is insufficient for the minimum per participant.");
      } 
      setShowConfirmModal(true);

    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      toast.error(errMsg);
    } 
  }, [form, user, mmnClient]);

  const confirmCreation = useCallback(async () => {
    setShowConfirmModal(false); 
    setIsProcessing(true);
    let route = ROUTES.LUCKY_MONEY as string;
    try {
      const envelope = await createRedEnvelopeMutation.mutateAsync(toRequest());
      
      const result = await transfer(
        {
          recipientAddress: envelope.red_envelope_wallet,
          amount: form.totalAmount.toString(),
          note: form.message,
        },
        'lucky-money'
      );

      if (result.success) {
        toast.success('Transfer money successfully!');
        if (!result.txHash) {
          throw new Error("Transaction hash not found after transfer.");
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));
        const transactionDetail = await pollTransactionStatus(result.txHash);
        let finalStatus = ETransactionStatus.Failed;
        
        if (transactionDetail && transactionDetail.status === ETransactionStatus.Passed) {
          finalStatus = ETransactionStatus.Passed;
          toast.success('Create Lucky Money successfully');
          route = ROUTES.LUCKY_MONEY_DETAIL(envelope.id)
          setGeneratedEnvelope(envelope);
        } else {
          toast.error('Could not confirm transaction. Create Lucky Money fail.');
          setGeneratedEnvelope(null);
        }

        const req: UpdateStatusRedEnvelopeRequest = {
          id: envelope.id,
          status: finalStatus,
        };
        await RedEnvelopeService.updateRedEnvelopeStatus(req);

      } else {
        toast.error('Transfer step failed. Create Lucky Money fail.');
        const req: UpdateStatusRedEnvelopeRequest = {
          id: envelope.id,
          status: ETransactionStatus.Failed,
        };
        await RedEnvelopeService.updateRedEnvelopeStatus(req);
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      toast.error(errMsg);
      setGeneratedEnvelope(null);
    } finally {
      setIsProcessing(false);
    }
    
    router.push(route)
    setIsSuccess(true)
  }, [form, user?.id, transfer, createRedEnvelopeMutation, mmnClient, toRequest]);

  return (
    <CreateRedEnvelopeContext.Provider value={{ 
        form, 
        updateField, 
        resetForm, 
        toRequest, 
        initiateCreation, 
        confirmCreation,  
        showConfirmModal, 
        setShowConfirmModal,
        generatedEnvelope, 
        isPending: isProcessing, 
        isSuccess
      }}>
      {children}
    </CreateRedEnvelopeContext.Provider>
  );
}

export function useCreateRedEnvelopeContext() {
  const context = useContext(CreateRedEnvelopeContext)
  if (!context) {
    throw new Error('useCreateRedEnvelopeContext must be used within CreateRedEnvelopeProvider');
  }
  return context;
}

async function pollTransactionStatus(
  txHash: string,
  retries = 3,
  delays = [2000, 3000] 
): Promise<any | null> { 
  
  await new Promise((res) => setTimeout(res, 2000)); 

  for (let i = 0; i < retries; i++) {
    try {
      const transactionDetail = await TransactionService.getTransactionDetails(txHash);
      if (transactionDetail.status === ETransactionStatus.Passed) {
        return transactionDetail;
      }

      if (transactionDetail.status === ETransactionStatus.Failed) {
        return transactionDetail; 
      }

      if (i < retries - 1) {
        const delay = delays[i];
        await new Promise((res) => setTimeout(res, delay));
      }

    } catch (error) {
      console.error(`[pollTransactionStatus] API Error on attempt ${i + 1}/${retries}:`, error);
      if (i < retries - 1) {
        const delay = delays[i];
        await new Promise((res) => setTimeout(res, delay));
      }
    }
  }
  return null;
}