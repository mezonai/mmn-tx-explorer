'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Chip } from '@/components/shared/chip';
import { getCampaignStatusLabel, getCampaignStatusVariant } from '../../../utils';
import { CampaignPreview } from '@/modules/donation-campaign/type';
import { APP_CONFIG } from '@/configs/app.config';
import { NumberUtil } from '@/utils';
import { DescriptionDisplay } from '@/components/shared';

interface CampaignPreviewProps {
  preview: CampaignPreview;
}

export const CampaignPreviewCard = ({ preview }: CampaignPreviewProps) => {
  return (
    <div className="border-brand-primary/30 bg-brand-primary/10 text-brand-primary dark:border-brand-primary/40 dark:bg-brand-primary/15 dark:text-brand-primary-light rounded-3xl border p-6 shadow-sm">
      <h3 className="text-brand-primary text-sm font-semibold tracking-widest uppercase">Preview card</h3>

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

          <DescriptionDisplay
            description={
              preview.shortDescription ||
              'Short description helps donors grasp the impact and call to action in seconds.'
            }
            lineShow={3}
            className="mt-2 text-xs break-all text-gray-600 dark:text-gray-400"
          />

          <div className="mt-5">
            <div className="flex items-center justify-between text-[11px] font-medium text-gray-500 dark:text-gray-400">
              <span>
                {preview.targetFunding === 0 ? (
                  <>
                    {NumberUtil.formatWithCommas(preview.currentFunding)} {APP_CONFIG.CHAIN_SYMBOL}
                  </>
                ) : (
                  <>
                    {NumberUtil.formatWithCommas(preview.currentFunding)} /{' '}
                    {NumberUtil.formatWithCommas(preview.targetFunding)} {APP_CONFIG.CHAIN_SYMBOL}
                  </>
                )}
              </span>
              <span>{preview.percentage}% funded</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-gray-100 dark:bg-white/5">
              <div
                className="from-brand-primary to-brand-primary-light h-full overflow-hidden rounded-full bg-gradient-to-r transition-[width] duration-500 ease-out"
                style={{ width: `${NumberUtil.formatWithCommas(Math.min(Number(preview.percentage), 100))}%` }}
              />
            </div>
          </div>

          <div className="mt-4 text-[11px] text-gray-500 dark:text-gray-400">
            <span>
              {preview.contributors} contributor(s) · {preview.daysRemaining}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
