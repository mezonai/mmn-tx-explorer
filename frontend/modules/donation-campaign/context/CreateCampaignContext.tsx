'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ROUTES } from '@/configs/routes.config';
import { mmnClient } from '@/modules/auth/utils';
import { useCreateCampaign } from '../hooks';
import { useEditCampaign } from '../hooks';
import { CreateCampaignForm } from '../type';
import { useCreateAndPublishCampaign } from '../hooks/useCreateAndPublishCampaign';

const INITIAL_FORM: CreateCampaignForm = {
  name: '',
  shortDescription: '',
  bannerImageUrl: '',
  fundraisingGoal: null,
  endDate: '',
  owner: '',
  fullDescription: '',
  donationWallet: {
    address: '',
    privateKey: '',
  },
};

interface CreateCampaignValidation {
  isBasicsComplete: boolean;
  isGoalsComplete: boolean;
  isWalletComplete: boolean;
  isDescriptionComplete: boolean;
  isAllComplete: boolean;
}

interface CreateCampaignContextType {
  form: CreateCampaignForm;
  updateField: (field: keyof CreateCampaignForm, value: any) => void;
  setForm: (form: CreateCampaignForm) => void;
  isSaving: boolean;
  setIsSaving: (isSaving: boolean) => void;
  isWalletDownloaded: boolean;
  setIsWalletDownloaded: (isDownloaded: boolean) => void;
  validation: CreateCampaignValidation;
  handleSubmit: (action: 'draft' | 'publish') => void;
  generateWallet: () => Promise<boolean>;
}

function validateForm(form: CreateCampaignForm, isWalletDownloaded: boolean): CreateCampaignValidation {
  const trimmedName = String(form.name ?? '').trim();
  const isNameValid = trimmedName.length > 0 && !/^\d+$/.test(trimmedName);

  const isBasicsComplete = !!(isNameValid && form.shortDescription);
  const isGoalsComplete = true;
  const isWalletComplete = !!(form.donationWallet.address && form.donationWallet.privateKey && isWalletDownloaded);
  const isDescriptionComplete = true;

  return {
    isBasicsComplete,
    isGoalsComplete,
    isWalletComplete,
    isDescriptionComplete,
    isAllComplete: isBasicsComplete && isGoalsComplete && isWalletComplete && isDescriptionComplete,
  };
}

const CreateCampaignContext = createContext<CreateCampaignContextType | undefined>(undefined);

interface CreateCampaignProviderProps {
  id?: string;
  children: ReactNode;
}

export function CreateCampaignProvider({ id, children }: CreateCampaignProviderProps) {
  const createMutation = useCreateCampaign();
  const editMutation = useEditCampaign();
  const createAndPublishMutation = useCreateAndPublishCampaign();
  const router = useRouter();
  const [form, setForm] = useState<CreateCampaignForm>(INITIAL_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [isWalletDownloaded, setIsWalletDownloaded] = useState(false);

  const validation = useMemo(() => validateForm(form, isWalletDownloaded), [form, isWalletDownloaded]);

  const updateField = useCallback((field: keyof CreateCampaignForm, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const generateWallet = useCallback(async () => {
    try {
      setIsSaving(true);
      const wallet = mmnClient.generateEphemeralKeyPair();
      updateField('donationWallet', {
        address: wallet.publicKey,
        privateKey: wallet.privateKey,
      });
      toast.success('Wallet generated successfully');
      return true;
    } catch {
      toast.error('Failed to generate wallet');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [updateField]);

  const handleSubmit = useCallback(
    async (action: 'draft' | 'publish') => {
      const trimmedName = String(form.name ?? '').trim();
      if (trimmedName !== '' && /^\d+$/.test(trimmedName)) {
        toast.error("Campaign name can't be only numbers");
        return;
      }

      try {
        setIsSaving(true);

        const campaignData = {
          name: form.name,
          description: form.shortDescription,
          goal: Number(form.fundraisingGoal || 0),
          url: form.bannerImageUrl,
          donation_wallet: form.donationWallet.address,
          owner: form.owner.trim(),
          end_date: form.endDate,
        };

        if (action === 'draft') {
          if (!validation.isAllComplete) {
            toast.error('Please complete all required fields');
            return;
          }
          const res = await createMutation.mutateAsync(campaignData as any);
          toast.success('Draft saved');
          router.push(ROUTES.CAMPAIGN(res.id));
        } else {
          if (id) {
            const res = await editMutation.mutateAsync({ id, data: campaignData });
            toast.success('Campaign edited successfully');
            router.push(ROUTES.CAMPAIGN(res.slug));
          } else {
            if (!validation.isAllComplete) {
              toast.error('Please complete all required fields');
              return;
            }
            const res = await createAndPublishMutation.mutateAsync(campaignData);
            toast.success('Campaign published successfully');
            router.push(ROUTES.CAMPAIGN(res.slug));
          }
        }
      } catch {
        toast.error(`Failed to ${action === 'draft' ? 'save draft' : 'submit campaign'}`);
      } finally {
        setIsSaving(false);
      }
    },
    [form, createMutation, createAndPublishMutation, editMutation, validation.isAllComplete, router, id]
  );

  const contextValue: CreateCampaignContextType = {
    form,
    updateField,
    setForm,
    isSaving,
    setIsSaving,
    isWalletDownloaded,
    setIsWalletDownloaded,
    validation,
    handleSubmit,
    generateWallet,
  };

  return <CreateCampaignContext.Provider value={contextValue}>{children}</CreateCampaignContext.Provider>;
}

export function useCreateCampaignContext() {
  const context = useContext(CreateCampaignContext);
  if (context === undefined) {
    throw new Error('useCreateCampaignContext must be used within a CreateCampaignProvider');
  }
  return context;
}
