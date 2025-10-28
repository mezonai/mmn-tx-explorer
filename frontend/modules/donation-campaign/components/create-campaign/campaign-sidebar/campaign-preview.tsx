'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Chip } from '@/components/shared/chip';
import { getCampaignStatusLabel, getCampaignStatusVariant } from '../../../utils';
import { CampaignPreview } from '@/modules/donation-campaign/type';

interface CampaignPreviewProps {
  preview: CampaignPreview;
}

export const CampaignPreviewCard = ({ preview }: CampaignPreviewProps) => {
  return (
    <div className="border-primary/30 bg-primary/10 text-primary dark:border-primary/40 dark:bg-primary/15 dark:text-primary-light rounded-3xl border p-6 shadow-sm">
      <h3 className="text-sm font-semibold tracking-widest uppercase">Preview card</h3>

      <Card className="border-primary/30 dark:border-primary/30 bg-background/80 mt-4 py-5">
        <CardContent className="px-5">
          <Chip
            variant={getCampaignStatusVariant(preview.status)}
            size="sm"
            className="text-[11px] font-semibold tracking-wide uppercase"
          >
            {getCampaignStatusLabel(preview.status)}
          </Chip>

          <p className="mt-3 line-clamp-2 text-base font-semibold text-gray-900 dark:text-white">
            {preview.name || 'Campaign name goes here'}
          </p>

          <p className="mt-2 line-clamp-3 text-xs text-gray-600 dark:text-gray-400">
            {preview.shortDescription ||
              'Short description helps donors grasp the impact and call to action in seconds.'}
          </p>

          <div className="mt-5">
            <div className="flex items-center justify-between text-[11px] font-medium text-gray-500 dark:text-gray-400">
              <span>
                {preview.currentFunding} / {preview.targetFunding || 0} MMN
              </span>
              <span>{preview.percentage}% funded</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-gray-100 dark:bg-white/5">
              <div
                className="from-primary to-primary-light h-full rounded-full bg-gradient-to-r"
                style={{ width: `${Math.min(preview.percentage, 100)}%` }}
              />
            </div>
          </div>

          <div className="mt-4 text-[11px] text-gray-500 dark:text-gray-400">
            <span>
              {preview.contributors} contributors · {preview.daysRemaining}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
