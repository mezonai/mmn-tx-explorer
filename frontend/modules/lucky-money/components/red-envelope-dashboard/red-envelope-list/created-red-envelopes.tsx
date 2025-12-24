import React from 'react';
import { SendIcon } from 'lucide-react';

import { StatusBadge } from './statusBadge';
import { useCreatedRedEnvelops } from '@/modules/lucky-money/hooks/useRedEnvelopes';
import { usePaginationQueryParam } from '@/hooks';
import { Pagination } from '@/components/ui/pagination';
import Link from 'next/link';
import { ROUTES } from '@/configs/routes.config';

export const CreatedEnvelopes = () => {
  const { page, limit, handleChangePage, handleChangeLimit } = usePaginationQueryParam();

  const { envelopes, meta, isLoading } = useCreatedRedEnvelops({
    page,
    limit,
  });

  const renderContent = () => {
    if (isLoading) {
      return (
        <section className="">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="border-brand-primary/30 border-t-brand-primary mx-auto h-12 w-12 animate-spin rounded-full border-4"></div>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading created envelopes...</p>
            </div>
          </div>
        </section>
      );
    }

    if (envelopes.length === 0) {
      return (
        <div className="text-muted-foreground flex h-48 items-center justify-center dark:text-gray-400">
          No created envelopes found.
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {envelopes.map((env) => (
          <Link
            key={env.id}
            href={ROUTES.LUCKY_MONEY_DETAIL(env.id)}
            className="flex w-full cursor-pointer flex-col items-start justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:bg-gray-50 sm:flex-row sm:items-center sm:gap-4 md:p-4 dark:border-transparent dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            <div className="flex min-w-0 flex-1 flex-wrap items-start gap-1.5 sm:items-center sm:gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-4">
                  <h3 className="truncate text-base font-medium text-gray-900 md:text-lg dark:text-white">
                    {env.name}
                  </h3>
                </div>
                <p className="text-xs break-words text-gray-600 md:text-sm dark:text-gray-400">
                  {env.total_amount.toLocaleString('en-US')} đồng · {env.total_claims} recipients · {env.claimed_count}{' '}
                  claimed
                </p>
              </div>
            </div>
            <div className="flex-shrink-0">
              <StatusBadge status={env.status} />
            </div>
          </Link>
        ))}
      </div>
    );
  };

  return (
    <section>
      <div className="mb-3 flex items-center space-x-2 sm:mb-4 sm:space-x-3 md:mb-5">
        <SendIcon className="h-4 w-4 text-violet-800 sm:h-5 sm:w-5 md:h-6 md:w-6 dark:text-violet-800" />
        <h2 className="text-lg font-semibold text-gray-900 sm:text-xl md:text-2xl dark:text-white">
          Created Envelopes
        </h2>
      </div>

      {renderContent()}
      <Pagination
        page={page}
        limit={limit}
        totalPages={meta?.total_pages || 1}
        totalItems={meta?.total_items || 0}
        isLoading={isLoading}
        onChangeLimit={handleChangeLimit}
        onChangePage={handleChangePage}
        className="mt-3 sm:mt-4 md:mt-6"
      />
    </section>
  );
};
