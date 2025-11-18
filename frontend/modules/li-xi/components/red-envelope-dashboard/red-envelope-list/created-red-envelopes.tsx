import React from 'react';
import { SendIcon} from 'lucide-react';

import { StatusBadge } from './statusBadge';
import { useCreatedRedEnvelops } from '@/modules/li-xi/hooks/useRedEnvelopes';
import { useUser } from '@/providers';
import { usePaginationQueryParam } from '@/hooks';
import { Pagination } from '@/components/ui/pagination';
import Link from 'next/link';
import { ROUTES } from '@/configs/routes.config';

export const CreatedEnvelopes = () => {
  const { user } = useUser();
  const { page, limit, handleChangePage, handleChangeLimit} = usePaginationQueryParam();

  const { envelopes, meta, isLoading } = useCreatedRedEnvelops({
    page,
    limit,
    wallet_address: user?.walletAddress || '',
  }); 
  console.log("envelopes : ", envelopes);

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
        <div className="flex justify-center items-center h-48 text-muted-foreground dark:text-gray-400">
          No created envelopes found.
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {envelopes.map((env) => (
          <Link 
            key={env.id} 
            href={ROUTES.LI_XI_DETAIL(env.id)}
            className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-transparent p-3 md:p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer w-full"
          >
            <div className="flex flex-wrap items-start sm:items-center gap-1.5 sm:gap-4 flex-1 min-w-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-4" >
                  <h3 className="text-base md:text-lg font-medium text-gray-900 dark:text-white truncate">{env.name}</h3>
                </div>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 break-words">
                  {env.total_amount.toLocaleString('en-US')} đồng · {env.total_claims} recipients · {env.claimed_count} claimed
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
      <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4 md:mb-5">
        <SendIcon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-violet-800 dark:text-violet-800" />
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 dark:text-white">Created Envelopes</h2>
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