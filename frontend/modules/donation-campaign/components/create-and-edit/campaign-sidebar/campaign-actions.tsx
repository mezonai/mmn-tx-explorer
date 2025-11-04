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

interface CampaignActionsProps {
  type?: 'create' | 'edit';
}

const CampaignActions = ({ type = 'create' }: CampaignActionsProps) => {
  const { handleSubmit, isSaving, validation } = useCreateCampaignContext();
  const params = useParams<{ campaignId: string }>();
  const campaignId = params?.campaignId ? String(params.campaignId) : '';
  const { data: campaign, isFetching } = useCampaign(campaignId);

  const activateMutation = useActiveCampaign();
  const closeMutation = useCloseCampaign();

  const isMutating = activateMutation.isPending || closeMutation.isPending;

  const canPublish = campaign && campaign.status !== ECampaignStatus.Active;
  const canClose = campaign && campaign.status === ECampaignStatus.Active;

  const router = useRouter();

  const handlePublish = async () => {
    if (!campaignId) return;
    try {
      await activateMutation.mutateAsync(campaignId);
      toast.success('Campaign published');
      router.push(ROUTES.CAMPAIGN(campaignId));
    } catch {
      toast.error('Failed to publish campaign');
    }
  };

  const handleClose = async () => {
    if (!campaignId) return;
    try {
      await closeMutation.mutateAsync(campaignId);
      toast.success('Campaign closed');
      router.push(ROUTES.CAMPAIGN(campaignId));
    } catch {
      toast.error('Failed to close campaign');
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
            disabled={isSaving}
            className={cn(
              'bg-background text-foreground hover:bg-background hover:border-brand-primary/40 hover:text-brand-primary border border-1 font-semibold'
            )}
          >
            {isSaving ? 'Saving...' : 'Save draft'}
          </Button>

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
            <Button
              type="button"
              onClick={handlePublish}
              disabled={isMutating || isFetching}
              className={cn(
                'bg-brand-primary hover:bg-brand-primary/90 shadow-brand-primary/30 font-semibold text-white shadow-lg'
              )}
            >
              {isMutating ? 'Publishing…' : 'Publish campaign'}
            </Button>
          )}

          {canClose && (
            <Button
              type="button"
              onClick={handleClose}
              disabled={isMutating || isFetching}
              className={cn(
                'bg-background hover:bg-background border-1 border-rose-200/30 font-semibold text-red-600 hover:border-rose-400/40 hover:text-red-700 dark:text-red-300 dark:hover:text-red-400'
              )}
            >
              {isMutating ? 'Closing…' : 'Close campaign'}
            </Button>
          )}

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
      )}
    </Card>
  );
};

export { CampaignActions };
