'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { ArrowRightLeft, Loader2 } from 'lucide-react';
import { useRecentTransactions } from '../hooks/useRecentTransactions';
import { formatDistanceToNow } from 'date-fns';
import { BSC_SCAN_URL } from '@/constant/contracts';
import { useState } from 'react';
import { PAGINATION, SWAP_HISTORY_LIMITS } from '@/constant';

export const SwapHistory = () => {
  const [page, setPage] = useState<number>(PAGINATION.DEFAULT_PAGE);
  const [limit, setLimit] = useState<number>(PAGINATION.SWAP_HISTORY_LIMITS);
  
  const { data, isLoading, error } = useRecentTransactions(page - 1, limit);

  const formatTxHash = (hash: string) => {
    if (hash.length <= 10) return hash;
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  const formatTimeAgo = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'Unknown time';
    }
  };

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return '0';
    if (num > 0 && num < 0.0001) {
      return num.toLocaleString('en-US', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 8 
      });
    }
    return num.toLocaleString('en-US', { maximumFractionDigits: 4 });
  };

  const handleChangePage = (newPage: number) => {
    setPage(newPage);
  };

  const handleChangeLimit = (newLimit: number) => {
    setLimit(newLimit);
    setPage(PAGINATION.DEFAULT_PAGE);
  };

  return (
    <Card className="mt-6">
      <CardHeader className="px-4 md:px-6 py-4">
        <CardTitle className="text-base md:text-lg">Recent Swaps</CardTitle>
      </CardHeader>
      <CardContent className="px-4 md:px-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error || !data?.success || !data?.data || data.data.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No swap history yet
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {data.data.map((item) => (
                <a
                  key={item.TxHash}
                  href={`${BSC_SCAN_URL}/tx/${item.TxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col gap-3 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer md:flex-row md:justify-between md:items-center md:gap-4 md:p-5"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <ArrowRightLeft className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-foreground text-sm md:text-base font-medium">
                        {item.Type === 'TRANSFER_BSC' ? 'WMezon → Mezon' : 'Mezon → WMezon'}
                      </p>
                      <p className="text-xs md:text-sm text-muted-foreground font-mono truncate">
                        {formatTxHash(item.TxHash)} • {formatTimeAgo(item.CreatedAt)}
                      </p>
                    </div>
                  </div>
                  <p className="font-mono text-base md:text-lg font-semibold text-brand-primary whitespace-nowrap self-end md:self-auto">
                    +{formatAmount(item.Amount)} WMezon
                  </p>
                </a>
              ))}
            </div>
            
            {data.meta && data.meta.total_pages > 1 && (
              <Pagination
                page={page}
                limit={limit}
                totalPages={data.meta.total_pages}
                totalItems={data.meta.total_items}
                isLoading={isLoading}
                onChangePage={handleChangePage}
                onChangeLimit={handleChangeLimit}
                limits={SWAP_HISTORY_LIMITS}
                className="mt-4"
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
