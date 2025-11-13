'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCreateCampaignContext } from '@/modules/donation-campaign/context/CreateCampaignContext';
import { useParams } from 'next/navigation';
import { useCampaign } from '@/modules/donation-campaign/hooks/useCampaign';
import { useActiveCampaign } from '@/modules/donation-campaign/hooks/useActivateCampaign';
import { useCloseCampaign } from '@/modules/donation-campaign/hooks/useCloseCampaign';
import { ECampaignStatus } from '@/modules/donation-campaign/type';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/configs/routes.config';
import { CampaignModeProps } from '../types';
import { ConfirmDialog } from './confirm-dialog';
import { useDeleteCampaign } from '@/modules/donation-campaign/hooks';

const CampaignActions = ({ type = 'create' }: CampaignModeProps) => {
  const { handleSubmit, isSaving, validation } = useCreateCampaignContext();
  const params = useParams<{ slug: string }>();
  const campaignSlug = params?.slug ? String(params.slug) : '';
  const { data: campaign, isFetching } = useCampaign(campaignSlug);

  const activateMutation = useActiveCampaign();
  const closeMutation = useCloseCampaign();
  const deleteMutation = useDeleteCampaign();

  const isMutating = activateMutation.isPending || closeMutation.isPending;

  const canPublish = campaign && campaign.status !== ECampaignStatus.Active;
  const canClose = campaign && campaign.status === ECampaignStatus.Active;
  const canDelete = campaign && campaign.status === ECampaignStatus.Draft;

  const router = useRouter();

  const handlePublish = async () => {
    if (!campaign) return;
    try {
      handleSubmit('publish');
      await activateMutation.mutateAsync({ id: campaign.id, slug: campaign.slug });
      toast.success('Campaign published');
      router.push(ROUTES.CAMPAIGN(campaign.slug));
    } catch {
      toast.error('Failed to publish campaign');
    }
  };

  const handleClose = async () => {
    if (!campaign) return;
    try {
      await closeMutation.mutateAsync({ id: campaign.id, slug: campaign.slug });
      toast.success('Campaign closed');
      router.push(ROUTES.CAMPAIGN(campaign.slug));
    } catch {
      toast.error('Failed to close campaign');
    }
  };

  const handleDelete = async () => {
    if (!campaign) return;
    try {
      await deleteMutation.mutateAsync(campaign.id);
      toast.success('Draft deleted');
      router.push(ROUTES.DONATION_CAMPAIGN);
    } catch (e) {
      toast.error('Failed to delete Draft');
    }
  };
  return (
    <Card className="border-border bg-card dark:bg-primary/10 gap-4">
      <CardHeader>
        <CardTitle className="text-sm">Actions</CardTitle>
      </CardHeader>

      {type === 'create' && (
        <CardContent className="flex flex-col gap-3">
          <Button
            type="button"
            onClick={() => handleSubmit('draft')}
            disabled={!validation.isAllComplete}
            className={cn(
              'bg-background text-foreground hover:bg-background hover:border-brand-primary/40 hover:text-brand-primary border border-1 font-semibold'
            )}
          >
            {isSaving ? 'Saving...' : 'Save draft'}
          </Button>

          <ConfirmDialog
            trigger={
              <Button
                type="button"
                disabled={isMutating || isFetching}
                className={cn(
                  'bg-brand-primary hover:bg-brand-primary/90 shadow-brand-primary/30 font-semibold text-white shadow-lg'
                )}
              >
                {isMutating ? 'Publishing…' : 'Publish campaign'}
              </Button>
            }
            onConfirm={() => handleSubmit('publish')}
            title="Publish Campaign?"
            description="Are you sure you want to publish this campaign? Once published, it will be visible to everyone."
            confirmText="Publish"
            cancelText="Cancel"
            variant="publish"
          />
        </CardContent>
      )}
      {type === 'edit' && (
        <CardContent className="flex flex-col gap-3">
          <Button
            type="button"
            onClick={() => handleSubmit('publish')}
            disabled={isSaving}
            className={cn(
              'bg-background text-foreground hover:bg-background hover:border-brand-primary/40 hover:text-brand-primary border border-1 font-semibold'
            )}
          >
            {isSaving ? 'Saving…' : 'Save changes'}
          </Button>

          {canPublish && (
            <ConfirmDialog
              trigger={
                <Button
                  type="button"
                  disabled={isMutating || isFetching}
                  className={cn(
                    'bg-brand-primary hover:bg-brand-primary/90 shadow-brand-primary/30 font-semibold text-white shadow-lg'
                  )}
                >
                  {isMutating ? 'Publishing…' : 'Publish campaign'}
                </Button>
              }
              onConfirm={handlePublish}
              title="Publish Campaign?"
              description="Are you sure you want to publish this campaign? Once published, it will be visible to everyone."
              confirmText="Publish"
              cancelText="Cancel"
              variant="publish"
            />
          )}

          {canDelete && (
            <ConfirmDialog
              trigger={
                <Button
                  disabled={!campaign || isFetching || deleteMutation.isPending}
                  type="button"
                  variant="outline"
                  className="border border-rose-600 bg-rose-600 text-white shadow-lg shadow-rose-600/20 hover:bg-rose-600/80 hover:text-white dark:bg-rose-800 dark:hover:bg-rose-800/80"
                >
                  Delete Draft
                </Button>
              }
              onConfirm={handleDelete}
              title="Delete Draft?"
              description="Are you sure you want to delete this draft? This action cannot be undone."
              confirmText="Delete"
              cancelText="Cancel"
              variant="delete"
            />
          )}

          {canClose && (
            <ConfirmDialog
              trigger={
                <Button
                  type="button"
                  disabled={isMutating || isFetching}
                  className={cn(
                    'bg-background hover:bg-background border-1 border-rose-200/30 font-semibold text-red-600 hover:border-rose-400/40 hover:text-red-700 dark:text-red-300 dark:hover:text-red-400'
                  )}
                >
                  {isMutating ? 'Closing…' : 'Close campaign'}
                </Button>
              }
              onConfirm={handleClose}
              title="Close Campaign?"
              description="Are you sure you want to close this campaign? This will stop accepting new donations."
              confirmText="Close"
              cancelText="Cancel"
              variant="close"
            />
          )}
        </CardContent>
      )}
    </Card>
  );
};

export { CampaignActions };
