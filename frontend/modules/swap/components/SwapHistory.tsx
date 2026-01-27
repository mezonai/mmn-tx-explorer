'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { ArrowRightLeft, Loader2 } from 'lucide-react';
import { useRecentTransactions } from '../hooks/useRecentTransactions';
import { formatDistanceToNow } from 'date-fns';
import { BSC_SCAN_URL } from '@/constant/contracts';
import { useState } from 'react';
import { PAGINATION, SWAP_HISTORY_LIMITS } from '@/constant';
import { TokenSymbol } from '@/constant/token.constant';

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
        maximumFractionDigits: 8,
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
      <CardHeader className="px-4 py-4 md:px-6">
        <CardTitle className="text-base md:text-lg">Recent Swaps</CardTitle>
      </CardHeader>
      <CardContent className="px-4 md:px-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
          </div>
        ) : error || !data?.success || !data?.data || data.data.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">No swap history yet</div>
        ) : (
          <>
            <div className="space-y-3">
              {data.data.map((item) => (
                <a
                  key={item.TxHash}
                  href={`${BSC_SCAN_URL}/tx/${item.TxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-card hover:bg-muted/50 flex cursor-pointer flex-col gap-3 rounded-lg border p-4 transition-colors md:flex-row md:items-center md:justify-between md:gap-4 md:p-5"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <ArrowRightLeft className="text-muted-foreground h-4 w-4 flex-shrink-0 md:h-5 md:w-5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-foreground text-sm font-medium md:text-base">
                        {item.Type === 'TRANSFER_BSC' ? (
                          <>
                            {TokenSymbol.WMezon} → {TokenSymbol.Mezon}
                          </>
                        ) : (
                          <>
                            {TokenSymbol.Mezon} → {TokenSymbol.WMezon}
                          </>
                        )}
                      </p>
                      <p className="text-muted-foreground truncate font-mono text-xs md:text-sm">
                        {formatTxHash(item.TxHash)} • {formatTimeAgo(item.CreatedAt)}
                      </p>
                    </div>
                  </div>
                  <p className="text-brand-primary self-end font-mono text-base font-semibold whitespace-nowrap md:self-auto md:text-lg">
                    +{formatAmount(item.Amount)} {TokenSymbol.WMezon}
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
