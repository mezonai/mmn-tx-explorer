'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ROUTES } from '@/configs/routes.config';
import { UpdateCampaignForm } from '../type';
import { useUpdateCampaign } from '../hooks/useUpdateCampaign';

const INITIAL_FORM: UpdateCampaignForm = {
  name: '',
  shortDescription: '',
  bannerImageUrl: '',
  fundraisingGoal: null,
  endDate: '',
  owner: '',
};

interface UpdateCampaignContextType {
  form: UpdateCampaignForm;
  updateField: (field: keyof UpdateCampaignForm, value: any) => void;
  setForm: (form: UpdateCampaignForm) => void;
  isSaving: boolean;
  setIsSaving: (isSaving: boolean) => void;
  saveChanges: (campaignId: string) => Promise<void>;
}

export const UpdateCampaignContext = createContext<UpdateCampaignContextType | undefined>(undefined);

export const UpdateCampaignProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [form, setForm] = useState<UpdateCampaignForm>(INITIAL_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const updateMutation = useUpdateCampaign();

  const updateField = useCallback((field: keyof UpdateCampaignForm, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const saveChanges = useCallback(
    async (campaignId: string) => {
      try {
        setIsSaving(true);
        // Build a partial payload with only meaningful fields to avoid 400s
        const payload: Record<string, any> = {};
        if (form.name && form.name.trim()) payload.name = form.name.trim();
        if (form.shortDescription && form.shortDescription.trim()) payload.description = form.shortDescription.trim();
        if (form.fundraisingGoal !== null && form.fundraisingGoal !== undefined)
          payload.goal = Number(form.fundraisingGoal);
        if (form.bannerImageUrl && form.bannerImageUrl.trim()) payload.url = form.bannerImageUrl.trim();
        if (form.endDate && form.endDate.trim()) payload.end_date = form.endDate.trim();
        if (form.owner && form.owner.trim()) payload.owner = form.owner.trim();

        await updateMutation.mutateAsync({ id: campaignId, data: payload });
        toast.success('Campaign updated successfully.');
        router.push(ROUTES.CAMPAIGN(campaignId));
      } catch (error: any) {
        const message = error?.response?.data?.message || error?.message || 'Failed to update campaign';
        console.error('Failed to update campaign:', error);
        toast.error(message);
      } finally {
        setIsSaving(false);
      }
    },
    [form, router, updateMutation]
  );
  const contextValue = useMemo(
    () => ({
      form,
      updateField,
      setForm,
      isSaving,
      setIsSaving,
      saveChanges,
    }),
    [form, isSaving, updateField, saveChanges]
  );
  return <UpdateCampaignContext.Provider value={contextValue}>{children}</UpdateCampaignContext.Provider>;
};

export const useUpdateCampaignContext = (): UpdateCampaignContextType => {
  const context = useContext(UpdateCampaignContext);
  if (!context) {
    throw new Error('useUpdateCampaignContext must be used within an UpdateCampaignProvider');
  }
  return context;
};

export const useUpdateCampaignContextOptional = () => {
  return useContext(UpdateCampaignContext);
};
