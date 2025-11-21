import React, { useState } from 'react';
import { User, HandHeart} from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import { truncateWalletAddress, formatClaimDate } from '@/modules/lucky-money/utils';
import { CopyButton } from '@/components/ui/copy-button';
import { useClaimedEnvelopes } from '@/modules/lucky-money/hooks/useRedEnvelopes';


const ClaimedBadge = () => (
  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-600/20 text-[rgb(246_199_68)]">
    🎁 Claimed
  </span>
);

export const ClaimedEnvelopes = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10); 

  const handleChangePage = (newPage: number) => {
    setPage(newPage);
  };

  const handleChangeLimit = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1); 
  };

  const { envelopes, meta, isLoading } = useClaimedEnvelopes({
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
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading claimed envelopes...</p>
            </div>
          </div>
        </section>
      );
    }

    if (envelopes.length === 0) {
      return (
        <div className="flex justify-center items-center h-48 text-muted-foreground dark:text-gray-400">
          No claimed envelopes found.
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {envelopes.map((env) => (
          <div key={env.id} className="bg-card dark:bg-slate-800 border border-border dark:border-transparent 
                       p-3 md:p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 hover:bg-muted/50 dark:hover:bg-slate-700/50 transition-colors">
            <div className="flex items-center space-x-2 md:space-x-4 flex-1 min-w-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 md:space-x-4 flex-wrap">
                  <User className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground dark:text-gray-400 flex-shrink-0" />
                  <span className="text-sm md:text-base text-foreground dark:text-white">From</span>
                  <h3 className="text-sm md:text-lg font-medium text-purple-600 dark:text-purple-400 font-mono break-all">
                      {truncateWalletAddress(env.from_wallet)}
                  </h3>
                  <CopyButton textToCopy={env.from_wallet} />
                </div>
                <p className="text-xs md:text-sm text-muted-foreground dark:text-gray-400 mt-1 break-words">
                  Received {env.amount.toLocaleString('en-US')} đồng · {formatClaimDate(env.claimed_at)}
                </p>
              </div>
            </div>
            <div className="flex-shrink-0">
              <ClaimedBadge />
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <section>
      <div className="flex items-center space-x-3 mb-5">
        <HandHeart className="w-6 h-6 text-violet-800 dark:text-violet-800" />
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Claimed Envelopes</h2>
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
        className="mt-6"
      />
    </section>
  );
};