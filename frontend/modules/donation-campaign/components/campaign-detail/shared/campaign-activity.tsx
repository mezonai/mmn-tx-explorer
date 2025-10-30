'use client';

import { AddressDisplay } from '@/components/shared';
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
import { useBreakpoint } from '@/hooks';
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
  const { data: topContributorsData } = useTopContributor({ params: searchTBParams, campaignId });

  const { data: transactionsResponse } = useTransactions(searchTransactionParams);

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
  };
  return (
    <Card className="dark:border-primary/20 p-2">
      <Tabs defaultValue="recent">
        <TabsList className="dark:bg-background/90 w-full rounded-3xl">
          <TabsTrigger
            value="recent"
            className="data-[state=active]:text-brand-primary hover:text-brand-primary dark:data-[state=active]:text-brand-primary dark:hover:text-brand-primary dark:data-[state=active]:bg-background rounded-2xl"
          >
            Recent Activity
          </TabsTrigger>
          <TabsTrigger
            value="top"
            className="data-[state=active]:text-brand-primary hover:text-brand-primary dark:data-[state=active]:text-brand-primary dark:hover:text-brand-primary dark:data-[state=active]:bg-background rounded-2xl"
          >
            Top Contributors
          </TabsTrigger>
        </TabsList>
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
          <Card className="dark:border-primary/20 space-y-3 p-4">
            <CardHeader className="hidden flex-col justify-between gap-2 sm:flex-row md:block">
              <CardTitle>Top contributor</CardTitle>
              <span className="text-xs text-gray-500 dark:text-gray-400">Refreshes every 10 minutes</span>
            </CardHeader>
            <CardContent className="p-0">
              {contributors.length > 0 ? (
                contributors.map((contrib, i) => (
                  <div
                    key={i}
                    className="dark:bg-card mb-1 flex flex-col items-start gap-2 border-b border-gray-100 bg-white/70 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:rounded-2xl sm:border dark:border-white/10"
                  >
                    <div className="flex items-center gap-4">
                      <span className="bg-brand-primary inline-flex h-9 w-9 items-center justify-center rounded-2xl text-sm font-semibold text-white">
                        {i + 1}
                      </span>
                      <div>
                        <AddressDisplay address={contrib.sender_wallet} href={ROUTES.WALLET(contrib.sender_wallet)} />
                      </div>
                    </div>
                    <div className="w-full text-left sm:w-auto sm:text-right">
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
      </Tabs>
    </Card>
  );
}
