import { TEXT_CONSTANT } from '@/constant';
import { NumberUtil } from '@/utils';
import Link from 'next/link';
import { useMemo } from 'react';
import { CampaignStatus, DonationCampaign } from '../../../type';
import { Chip } from '@/components/shared';
import { getCampaignStatusVariant } from '../../../utils';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/configs/routes.config';
import { formatDistanceToNow } from 'date-fns';

interface CampaignCardProps {
  campaign: DonationCampaign;
}

export const CampaignCard = ({ campaign }: CampaignCardProps) => {
  const { id, name, description, goal, url, wallet, end_date, creator, status, created_at, updated_at } = campaign;
  const currentAmount = 620; // Placeholder for current amount raised
  const contributors = 100; // Placeholder for number of contributors

  const capitalizedStatus = useMemo(() => {
    if (status === CampaignStatus.Active) return 'Active';
    if (status === CampaignStatus.Draft) return 'Draft';
    if (status === CampaignStatus.Closed) return 'Closed';
    return 'Unknown';
  }, [status]);

  const daysLeft = useMemo(() => {
    if (status === CampaignStatus.Draft) {
      return 'Draft';
    }
    if (status === CampaignStatus.Closed) {
      return 'Goal achieved';
    }
    return `${end_date ? Math.ceil((new Date(end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0} days left`;
  }, [status, end_date]);

  const progress = useMemo(() => {
    if (status === CampaignStatus.Draft) {
      return 'Not launched';
    }
    return `${Math.min(Math.floor((currentAmount / goal) * 100), 100)} % funded`;
  }, [status, currentAmount]);

  const contributorsNumber = useMemo(() => {
    if (status === CampaignStatus.Draft) {
      return 'Pending launch';
    }
    return `${contributors} contributors`;
  }, [status]);

  const lastTime = useMemo(() => {
    if (status === CampaignStatus.Draft) {
      return '';
    }

    if (status === CampaignStatus.Closed) {
      return `Ended ${formatDistanceToNow(new Date(updated_at), { addSuffix: true })}`;
    }
    return `Last gift ${formatDistanceToNow(new Date(updated_at), { addSuffix: true })}`;
  }, [status, updated_at]);

  return (
    <article className="group hover:border-primary/60 dark:bg-dark-light/80 flex flex-col rounded-3xl border border-gray-200 bg-white/90 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10">
      <div className="flex items-center justify-between gap-4">
        <Chip variant={getCampaignStatusVariant(status)}>{capitalizedStatus}</Chip>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{daysLeft}</span>
      </div>
      <h3 className="group-hover:text-primary dark:group-hover:text-primary-light mt-4 text-lg font-semibold text-gray-900 transition dark:text-white">
        {name}
      </h3>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600 dark:text-gray-400">{description}</p>
      <div className="mt-6">
        <div className="flex items-center justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
          <span>
            {NumberUtil.formatWithCommas(currentAmount ?? 0)} / {NumberUtil.formatWithCommas(goal ?? 0)}{' '}
            {TEXT_CONSTANT.CURRENCY}
          </span>
          <span>{progress}</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-gray-100 dark:bg-white/5">
          <div className="from-primary to-primary-light h-full w-[62%] rounded-full bg-gradient-to-r"></div>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{contributorsNumber}</span>
        <span>{lastTime}</span>
      </div>

      <Button
        className="bg-primary/10 text-primary hover:bg-primary dark:bg-primary/15 dark:text-primary-light dark:hover:bg-primary-light mt-6 inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition hover:text-white dark:hover:text-white"
        asChild
      >
        <Link href={ROUTES.CAMPAIGN(id)}>
          {status === CampaignStatus.Draft
            ? 'Review and publish'
            : status === CampaignStatus.Active
              ? 'View details'
              : status === CampaignStatus.Closed
                ? 'View Impact Report'
                : 'View details'}
        </Link>
      </Button>
    </article>
  );
};
