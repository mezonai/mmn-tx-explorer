'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ROUTES } from '@/configs/routes.config';
import { EditCampaignForm } from '../type';
import { useEditCampaign } from '../hooks/useEditCampaign';

const INITIAL_FORM: EditCampaignForm = {
  name: '',
  shortDescription: '',
  bannerImageUrl: '',
  fundraisingGoal: null,
  endDate: '',
  owner: '',
};

interface EditCampaignContextType {
  form: EditCampaignForm;
  editField: (field: keyof EditCampaignForm, value: any) => void;
  setForm: (form: EditCampaignForm) => void;
  isSaving: boolean;
  setIsSaving: (isSaving: boolean) => void;
  saveChanges: (campaignId: string) => Promise<void>;
}

export const EditCampaignContext = createContext<EditCampaignContextType | undefined>(undefined);

export const EditCampaignProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [form, setForm] = useState<EditCampaignForm>(INITIAL_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const editMutation = useEditCampaign();

  const editField = useCallback((field: keyof EditCampaignForm, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const saveChanges = useCallback(
    async (campaignId: string) => {
      try {
        setIsSaving(true);
        const campaignData = {
          name: form.name,
          description: form.shortDescription,
          goal: Number(form.fundraisingGoal || 0),
          url: form.bannerImageUrl,
          end_date: form.endDate,
          owner: form.owner,
        };
        await editMutation.mutateAsync({ id: campaignId, data: campaignData });
        toast.success('Campaign edited successfully.');
        router.push(ROUTES.CAMPAIGN(campaignId));
      } catch (error: any) {
        console.error('Failed to edit campaign:', error);
        toast.error('Failed to edit campaign');
      } finally {
        setIsSaving(false);
      }
    },
    [form, router, editMutation]
  );

  const contextValue = useMemo(
    () => ({
      form,
      editField,
      setForm,
      isSaving,
      setIsSaving,
      saveChanges,
    }),
    [form, isSaving, editField, saveChanges]
  );

  return <EditCampaignContext.Provider value={contextValue}>{children}</EditCampaignContext.Provider>;
};

export const useEditCampaignContext = (): EditCampaignContextType => {
  const context = useContext(EditCampaignContext);
  if (!context) {
    throw new Error('useEditCampaignContext must be used within an EditCampaignProvider');
  }
  return context;
};
