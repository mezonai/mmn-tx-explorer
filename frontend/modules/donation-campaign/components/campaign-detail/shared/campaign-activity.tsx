'use client';

import { AddressDisplay, RefreshButton } from '@/components/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { APP_CONFIG } from '@/configs/app.config';
import { ROUTES } from '@/configs/routes.config';
import { PAGINATION } from '@/constant';
import { EBreakpoint, ESortOrder } from '@/enums';
import { useTopContributor } from '@/modules/donation-campaign/hooks/useTopContributor';
import { ITransactionListParams } from '@/modules/transaction';
import { useTransactions } from '@/modules/transaction/hooks/useTransactions';
import { NumberUtil } from '@/utils';
import { useHidden } from '../provider';
import { useEffect, useMemo } from 'react';
import { DEFAULT_DEBOUNCE_TIME, useBreakpoint } from '@/hooks';
import { RecentActivityTable } from '../desktop/recent-activity-table';
import { RecentActivityCardsMobile } from '../mobile/recent-activity-card';

const DEFAULT_VALUE_DATA_SEARCH: ITransactionListParams = {
  page: PAGINATION.DEFAULT_PAGE,
  limit: PAGINATION.RECENT_ACTIVITY_LIMITS,
  sort_by: 'transaction_timestamp',
  sort_order: ESortOrder.DESC,
} as const;
export function CampaignActivity({ campaignId, walletAddress }: { campaignId: string; walletAddress: string }) {
  const isDesktop = useBreakpoint(EBreakpoint.LG);
  const searchTBParams = { limit: 5 };
  const searchTransactionParams: ITransactionListParams = {
    ...DEFAULT_VALUE_DATA_SEARCH,
    filter_to_address: walletAddress,
  };
  const { data: topContributorsData, refetch, isPending } = useTopContributor({ params: searchTBParams, campaignId });

  const {
    data: transactionsResponse,
    refetch: refetchTransactions,
    isPending: isPendingTransactions,
  } = useTransactions(searchTransactionParams);

  const transactions = useMemo(() => transactionsResponse?.data ?? [], [transactionsResponse]);
  const contributors = topContributorsData?.contributors ?? [];
  const totalTransaction = transactionsResponse?.meta.total_items ?? 0;
  const { hidden, setHidden } = useHidden();
  useEffect(() => {
    setHidden(transactions.length > 0);
  }, [setHidden, transactions]);

  const recentActivityProps = {
    transactions,
    totalTransaction,
    walletAddress,
    hidden,
    isLoading: isPendingTransactions,
    refetch: refetchTransactions,
  };

  return (
    <Card className="dark:border-primary/20 p-2">
      <Tabs defaultValue="recent">
        <TabsList className="mb-3 w-full rounded-2xl">
          <TabsTrigger value="recent" className="rounded-xl text-xs">
            Recent Activity
          </TabsTrigger>
          <TabsTrigger value="top" className="rounded-xl text-xs">
            Top Contributors
          </TabsTrigger>
        </TabsList>
        <div className="overflow-x-hidden">
          <TabsContent value="recent">
            {isDesktop === undefined ? (
              <>
                <div className="hidden lg:block">
                  <RecentActivityTable {...recentActivityProps} />
                </div>
                <div className="block lg:hidden">
                  <RecentActivityCardsMobile {...recentActivityProps} />
                </div>
              </>
            ) : isDesktop ? (
              <RecentActivityTable {...recentActivityProps} />
            ) : (
              <RecentActivityCardsMobile {...recentActivityProps} />
            )}
          </TabsContent>
          <TabsContent value="top">
            <Card className="dark:border-primary/20 space-y-3 p-2 sm:p-6">
              <CardHeader className="m-0 flex items-center justify-between gap-2 p-4 pb-0 sm:px-3 sm:py-0">
                <div className="">
                  <CardTitle className="text-foreground">Top contributor</CardTitle>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Refreshes every 10 minutes</span>
                </div>
                <RefreshButton onClick={refetch} isLoading={isPending} startDelay={DEFAULT_DEBOUNCE_TIME} />
              </CardHeader>
              <CardContent className="p-0">
                {contributors.length > 0 ? (
                  contributors.map((contrib, i) => (
                    <div
                      key={i}
                      className="dark:bg-card mb-1 flex items-start gap-2 border-b border-gray-100 bg-white/70 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:rounded-2xl sm:border dark:border-white/10"
                    >
                      <div className="flex items-center gap-4">
                        <span className="bg-brand-primary inline-flex h-9 w-9 items-center justify-center rounded-2xl text-sm font-semibold text-white">
                          {i + 1}
                        </span>
                        <div>
                          <AddressDisplay address={contrib.sender_wallet} href={ROUTES.WALLET(contrib.sender_wallet)} />
                        </div>
                      </div>
                      <div className="w-full text-right sm:w-auto">
                        <p className="text-sm font-semibold text-emerald-500 dark:text-emerald-300">
                          {NumberUtil.formatWithCommasAndScale(contrib.total_donate)} {APP_CONFIG.CHAIN_SYMBOL}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {contrib.percentage.toFixed(1)}% of total
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-gray-500 dark:text-gray-400">No top contributors yet.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </Card>
  );
}
