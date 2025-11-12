import { APP_CONFIG } from '@/configs/app.config';
import { DateTimeUtil, NumberUtil } from '@/utils';
import Link from 'next/link';
import { useMemo } from 'react';
import { ECampaignStatus, DonationCampaign } from '../../../type';
import { Chip } from '@/components/shared';
import { getCampaignStatusLabel, getCampaignStatusVariant } from '../../../utils';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/configs/routes.config';
import { BadgeCheck } from 'lucide-react';

interface CampaignCardProps {
  campaign: DonationCampaign;
}

export const CampaignCard = ({ campaign }: CampaignCardProps) => {
  const { slug, name, description, goal, end_date, status, updated_at, total_amount, total_contributors } = campaign;
  const daysLeft = useMemo(() => {
    if (status === ECampaignStatus.Draft) {
      return 'Draft';
    }
    if (!!goal && NumberUtil.scaleDown(total_amount) >= goal) {
      return 'Goal Achieved';
    }
    if (status === ECampaignStatus.Closed || !end_date) {
      return '';
    }
    return `${DateTimeUtil.safeFormatDistanceToNow(new Date(end_date))}`;
  }, [status, end_date, total_amount, goal]);

  const progress = useMemo(() => {
    if (status === ECampaignStatus.Draft) {
      return 'Not launched';
    }
    if (!goal) {
      return '';
    }
    const rawPercentage = (Number(NumberUtil.scaleDown(total_amount)) / goal) * 100;
    const formattedPercentage = parseFloat(rawPercentage.toFixed(2));
    return `${formattedPercentage} % funded`;
  }, [status, total_amount, goal]);

  const progressPercent = useMemo(() => {
    if (goal <= 0) return !total_amount ? 0 : 100;
    return Math.min(Math.max(Math.floor((NumberUtil.scaleDown(total_amount) / goal) * 100), 0), 100);
  }, [total_amount, goal]);

  const contributorsNumber = useMemo(() => {
    if (status === ECampaignStatus.Draft) {
      return 'Pending launch';
    }
    return `${total_contributors} contributor(s)`;
  }, [status, total_contributors]);

  const lastTime = useMemo(() => {
    if (status === ECampaignStatus.Draft) {
      return '';
    }

    if (status === ECampaignStatus.Closed) {
      return `Ended ${DateTimeUtil.safeFormatDistanceToNow(new Date(updated_at))}`;
    }
  }, [status, updated_at]);

  const buttonLabel = useMemo(() => {
    switch (status) {
      case ECampaignStatus.Draft:
        return 'Review and publish';
      default:
        return 'View details';
    }
  }, [status]);
  return (
    <article className="group hover:border-primary/60 dark:bg-card flex h-full min-w-0 flex-col rounded-3xl border border-gray-200 bg-white/90 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Chip variant={getCampaignStatusVariant(status)}>{getCampaignStatusLabel(status)}</Chip>
          {campaign.verified && (
            <Chip variant="brand">
              <span>Verified</span>
              <BadgeCheck size={18} className="ml-2 fill-emerald-400" color="white" />
            </Chip>
          )}
        </div>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{daysLeft}</span>
      </div>
      <h3 className="dark:group-hover:text-brand-primary group-hover:text-primary dark:group-hover:text-primary-light mt-4 text-lg font-semibold text-gray-900 transition dark:text-white">
        <Link href={ROUTES.CAMPAIGN(slug)}>{name}</Link>
      </h3>
      <p className="mt-2 line-clamp-3 w-full text-sm leading-6 break-words text-gray-600 dark:text-gray-400">
        {description}
      </p>
      <div className="mt-auto flex flex-col gap-6 pt-6">
        <div>
          <div className="flex items-center justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
            <span>
              {NumberUtil.formatWithCommasAndScale(total_amount)}
              {!!goal ? `/ ${NumberUtil.formatWithCommas(goal)} ` : ' '}
              {APP_CONFIG.CHAIN_SYMBOL}
            </span>
            <span>{progress}</span>
          </div>
          <div
            className="mt-2 h-2 rounded-full bg-gray-100 dark:bg-white/5"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPercent}
          >
            <div
              className="dark:from-brand-primary dark:to-brand-primary/20 from-primary to-primary-light h-full rounded-full bg-gradient-to-r transition-[width] duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{contributorsNumber}</span>
          <span>{lastTime}</span>
        </div>

        <Button
          className="bg-primary/10 text-brand-primary dark:hover:bg-brand-primary dark:bg-brand-primary/10 dark:border-brand-primary dark:text-primary-light inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition hover:text-white dark:border dark:hover:text-white"
          asChild
        >
          <Link href={ROUTES.CAMPAIGN(slug)}>{buttonLabel}</Link>
        </Button>
      </div>
    </article>
  );
};
