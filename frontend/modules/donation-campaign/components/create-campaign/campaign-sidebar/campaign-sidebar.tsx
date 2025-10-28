'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCreateCampaignContext } from '../../../context/CreateCampaignContext';
import { CampaignPreviewCard } from './campaign-preview';
import { PrePublishChecklist } from './pre-publish-checklist';
import { CampaignPreview, ECampaignStatus } from '../../../type';
import { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';

export function CampaignSidebar() {
  const { form, validation, handleSubmit } = useCreateCampaignContext();
  console.log('-', formatDistanceToNow(new Date(form.endDate || 0)));

  // Calculate preview data
  const preview: CampaignPreview = {
    name: form.name,
    shortDescription: form.shortDescription,
    currentFunding: 0,
    targetFunding: form.fundraisingGoal || 0,
    percentage: 0,
    contributors: 0,
    daysRemaining: `${form.endDate ? formatDistanceToNow(new Date(form.endDate)) : `0 day`} remaining`,
    status: ECampaignStatus.Draft,
  };

  // Checklist items based on validation
  const checklistItems = useMemo(
    () => [
      {
        id: 1,
        text: 'Complete the name, short description, and banner visual.',
        completed: validation.isBasicsComplete,
      },
      {
        id: 2,
        text: 'Define fundraising goal, end date, and campaign stakeholders.',
        completed: validation.isGoalsComplete,
      },
      {
        id: 3,
        text: 'Generate the wallet and store the private key securely offline.',
        completed: validation.isWalletComplete,
      },
      {
        id: 4,
        text: 'Proof the About content, contact info, and external links.',
        completed: validation.isDescriptionComplete,
      },
    ],
    [validation]
  );

  return (
    <aside className="space-y-6">
      <CampaignPreviewCard preview={preview} />

      <PrePublishChecklist items={checklistItems} />

      <Card className="border-border bg-card dark:bg-primary/10 gap-4">
        <CardHeader>
          <CardTitle className="text-sm">Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {/* <Button type="button" variant="outline" onClick={() => handleSubmit('draft')} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save draft'}
          </Button> */}

          <Button
            type="button"
            onClick={() => handleSubmit('publish')}
            disabled={!validation.isAllComplete}
            className={cn(
              'shadow-lg',
              validation.isAllComplete
                ? 'bg-brand-primary hover:bg-brand-primary/90 shadow-brand-primary/30 text-white'
                : 'cursor-not-allowed opacity-50'
            )}
          >
            Publish campaign
          </Button>

          {/* <DeleteConfirmDialog
            trigger={
              <Button
                disabled={!isSaved}
                type="button"
                variant="outline"
                className="border-rose-200 text-rose-600 hover:border-rose-400 hover:text-rose-500 dark:border-rose-500/20 dark:text-rose-300"
              >
                Delete draft
              </Button>
            }
            onConfirm={handleDeleteDraft}
            title="Delete draft?"
            description="Are you sure you want to delete this draft? This action cannot be undone."
            confirmText="Delete"
            cancelText="Cancel"
          /> */}
        </CardContent>
      </Card>
    </aside>
  );
}
