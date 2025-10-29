import { APP_CONFIG } from '@/configs/app.config';
import { NumberUtil } from '@/utils';
import Link from 'next/link';
import { useMemo } from 'react';
import { ECampaignStatus, DonationCampaign } from '../../../type';
import { Chip } from '@/components/shared';
import { getCampaignStatusLabel, getCampaignStatusVariant } from '../../../utils';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/configs/routes.config';
import { formatDistanceToNow } from 'date-fns';

interface CampaignCardProps {
  campaign: DonationCampaign;
}

export const CampaignCard = ({ campaign }: CampaignCardProps) => {
  const { id, name, description, goal, end_date, status, updated_at, total_amount, total_contributors } = campaign;
  const daysLeft = useMemo(() => {
    if (status === ECampaignStatus.Draft) {
      return 'Draft';
    }
    if (status === ECampaignStatus.Closed) {
      return 'Goal achieved';
    }
    return `${formatDistanceToNow(new Date(end_date), { addSuffix: true })}`;
  }, [status, end_date]);

  const progress = useMemo(() => {
    if (status === ECampaignStatus.Draft) {
      return 'Not launched';
    }
    const rawPercentage = (Number(NumberUtil.scaleDown(total_amount)) / goal) * 100;
    const formattedPercentage = rawPercentage < 1 ? parseFloat(rawPercentage.toFixed(1)) : Math.floor(rawPercentage);
    return `${formattedPercentage} % funded`;
  }, [status, total_amount, goal]);

  const progressPercent = useMemo(() => {
    if (status === ECampaignStatus.Draft) return 0;
    if (goal <= 0) return 0;
    return Math.min(Math.max(Math.floor((NumberUtil.scaleDown(total_amount) / goal) * 100), 0), 100);
  }, [status, total_amount, goal]);

  const contributorsNumber = useMemo(() => {
    if (status === ECampaignStatus.Draft) {
      return 'Pending launch';
    }
    return `${total_contributors} contributors`;
  }, [status]);

  const lastTime = useMemo(() => {
    if (status === ECampaignStatus.Draft) {
      return '';
    }

    if (status === ECampaignStatus.Closed) {
      return `Ended ${formatDistanceToNow(new Date(updated_at), { addSuffix: true })}`;
    }
  }, [status, updated_at]);

  const buttonLabel = useMemo(() => {
    switch (status) {
      case ECampaignStatus.Draft:
        return 'Review and publish';
      case ECampaignStatus.Closed:
        return 'View Impact Report';
      default:
        return 'View details';
    }
  }, [status]);
  return (
    <article className="group hover:border-primary/60 dark:bg-card flex h-full flex-col rounded-3xl border border-gray-200 bg-white/90 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10">
      <div className="flex items-center justify-between gap-4">
        <Chip variant={getCampaignStatusVariant(status)}>{getCampaignStatusLabel(status)}</Chip>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{daysLeft}</span>
      </div>
      <h3 className="dark:group-hover:text-brand-primary group-hover:text-primary dark:group-hover:text-primary-light mt-4 text-lg font-semibold text-gray-900 transition dark:text-white">
        {name}
      </h3>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600 dark:text-gray-400">{description}</p>
      <div className="mt-auto flex flex-col gap-6 pt-6">
        <div>
          <div className="flex items-center justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
            <span>
              {NumberUtil.formatWithCommasAndScale(total_amount)} / {NumberUtil.formatWithCommas(goal)}{' '}
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
          <Link href={ROUTES.CAMPAIGN(id)}>{buttonLabel}</Link>
        </Button>
      </div>
    </article>
  );
};
