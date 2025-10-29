'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ROUTES } from '@/configs/routes.config';
import { mmnClient } from '@/modules/auth/utils';
import { useCreateCampaign } from '../hooks';
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
  validation: CreateCampaignValidation;
  saveDraft: () => Promise<void>;
  deleteDraft: () => void;
  handleSubmit: (action: 'draft' | 'publish') => void;
  generateWallet: () => Promise<void>;
}

function validateForm(form: CreateCampaignForm) {
  const isBasicsComplete = !!(form.name && form.shortDescription);
  const isGoalsComplete = !!(form.fundraisingGoal && form.endDate);
  const isWalletComplete = !!(form.donationWallet.address && form.donationWallet.privateKey);
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
  const createAndPublishMutation = useCreateAndPublishCampaign();
  const router = useRouter();
  const [form, setForm] = useState<CreateCampaignForm>(INITIAL_FORM);
  const [isSaving, setIsSaving] = useState(false);

  const validation = useMemo(() => validateForm(form), [form]);

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
    } catch (error) {
      console.error('Error generating wallet:', error);
      toast.error('Failed to generate wallet');
    } finally {
      setIsSaving(false);
    }
  }, [updateField]);

  const handleSubmit = useCallback(
    async (action: 'draft' | 'publish') => {
      if (action === 'draft') {
        saveDraft();
      } else {
        if (!validation.isAllComplete) {
          toast.error('Please complete all required fields before publishing');
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
            owner: form.owner,
            end_date: form.endDate,
          };
          console.log('🚀 ~ CreateCampaignProvider ~ campaignData:', campaignData);

          if (id) {
            // Edit
          } else {
            const res = await createAndPublishMutation.mutateAsync(campaignData);
            toast.success('Campaign published successfully');
            router.push(ROUTES.CAMPAIGN(res.id)); // Navigate to donation list page
          }
        } catch (error) {
          console.error('Error publishing campaign:', error);
          toast.error('Failed to publish campaign');
        } finally {
          setIsSaving(false);
        }
      }
    },
    [form, saveDraft, createMutation, validation.isAllComplete, router]
  );

  const contextValue: CreateCampaignContextType = {
    form,
    updateField,
    setForm,
    isSaving,
    setIsSaving,
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
