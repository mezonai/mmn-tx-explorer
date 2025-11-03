'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode, useMemo } from 'react';
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
  saveDraft: () => Promise<void>;
  deleteDraft: () => void;
  handleSubmit: (action: 'draft' | 'publish') => void;
  generateWallet: () => Promise<boolean>;
}

function validateForm(form: CreateCampaignForm, isWalletDownloaded: boolean): CreateCampaignValidation {
  const isBasicsComplete = !!(form.name && form.shortDescription);
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

  const saveDraft = useCallback(async () => {}, []);

  const deleteDraft = useCallback(() => {}, []);

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
    } catch (error) {
      console.error('Error generating wallet:', error);
      toast.error('Failed to generate wallet');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [updateField]);

  const handleSubmit = useCallback(
    async (action: 'draft' | 'publish') => {
      if (action === 'draft') {
        saveDraft();
      } else {
        try {
          setIsSaving(true);

          const campaignData = {
            name: form.name,
            description: form.shortDescription,
            goal: Number(form.fundraisingGoal || 0),
            url: form.bannerImageUrl,
            donation_wallet: form.donationWallet.address,
            owner: form.owner,
            end_date: form.endDate,
          };

          if (id) {
            await editMutation.mutateAsync({ id, data: campaignData });
            toast.success('Campaign updated successfully');
            router.push(ROUTES.CAMPAIGN(id));
          } else {
            if (!validation.isAllComplete) {
              toast.error('Please complete all required fields before publishing');
              return;
            }
            const res = await createAndPublishMutation.mutateAsync(campaignData);
            toast.success('Campaign published successfully');
            router.push(ROUTES.CAMPAIGN(res.id));
          }
        } catch (error) {
          console.error('Error submitting campaign:', error);
          toast.error('Failed to submit campaign');
        } finally {
          setIsSaving(false);
        }
      }
    },
    [form, saveDraft, createMutation, createAndPublishMutation, validation.isAllComplete, router, id, editMutation]
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
    saveDraft,
    deleteDraft,
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
