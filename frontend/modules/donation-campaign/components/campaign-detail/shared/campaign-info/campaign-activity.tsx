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
import { useHidden } from '../../provider';
import { useEffect, useMemo, useState } from 'react';
import { DonationCampaignService } from '@/modules/donation-campaign/api';
import { DEFAULT_DEBOUNCE_TIME, useBreakpoint } from '@/hooks';
import { RecentActivityTable } from '../../desktop/funding-activity';
import { RecentActivityCardsMobile } from '../../mobile/funding-activity';
import { WithdrawHistoryTable } from '../../desktop/funding-activity';
import { WithdrawHistoryCard } from '../../mobile/funding-activity';
import { DonationCampaign } from '@/modules/donation-campaign/type';

const DEFAULT_VALUE_DATA_SEARCH: ITransactionListParams = {
  page: PAGINATION.DEFAULT_PAGE,
  limit: PAGINATION.RECENT_ACTIVITY_LIMITS,
  sort_by: 'transaction_timestamp',
  sort_order: ESortOrder.DESC,
} as const;
export function CampaignActivity({ campaign, walletAddress }: { campaign: DonationCampaign; walletAddress: string }) {
  const isDesktop = useBreakpoint(EBreakpoint.LG);
  const searchTBParams = { limit: 5 };
  const searchReceivedParams: ITransactionListParams = {
    ...DEFAULT_VALUE_DATA_SEARCH,
    filter_to_address: walletAddress,
    start_time: new Date(campaign.created_at).toISOString().slice(0, 10),
    end_time: new Date().toISOString().slice(0, 10),
  };

  const searchSentParams: ITransactionListParams = {
    ...DEFAULT_VALUE_DATA_SEARCH,
    filter_from_address: walletAddress,
    start_time: new Date(campaign.created_at).toISOString().slice(0, 10),
    end_time: new Date().toISOString().slice(0, 10),
  };

  const {
    data: topContributorsData,
    refetch,
    isPending,
  } = useTopContributor({ params: searchTBParams, campaignId: campaign.id });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!campaign) return;
    try {
      setIsRefreshing(true);
      await DonationCampaignService.refreshCampaignRaised(campaign.id);
      await refetch();
    } catch (err) {
    } finally {
      setIsRefreshing(false);
    }
  };

  const {
    data: receivedTransactionsResponse,
    refetch: refetchReceivedTransactions,
    isPending: isPendingReceivedTransactions,
  } = useTransactions(searchReceivedParams);

  const {
    data: sentTransactionsResponse,
    refetch: refetchSentTransactions,
    isPending: isPendingSentTransactions,
  } = useTransactions(searchSentParams);

  const receivedTransactions = useMemo(() => receivedTransactionsResponse?.data ?? [], [receivedTransactionsResponse]);
  const sentTransactions = useMemo(() => sentTransactionsResponse?.data ?? [], [sentTransactionsResponse]);
  const contributors = topContributorsData?.contributors ?? [];
  const totalReceivedTransaction = receivedTransactionsResponse?.meta.total_items ?? 0;
  const totalSentTransaction = sentTransactionsResponse?.meta.total_items ?? 0;
  const { hidden, setHidden } = useHidden();
  useEffect(() => {
    setHidden(receivedTransactions.length > 0);
  }, [setHidden, receivedTransactions]);

  const recentActivityProps = {
    transactions: receivedTransactions,
    totalTransaction: totalReceivedTransaction,
    walletAddress,
    hidden,
    isLoading: isPendingReceivedTransactions,
    refetch: refetchReceivedTransactions,
  };

  const withdrawHistoryProps = {
    transactions: sentTransactions,
    totalTransaction: totalSentTransaction,
    walletAddress,
    hidden,
    isLoading: isPendingSentTransactions,
    refetch: refetchSentTransactions,
  };

  return (
    <>
      <div className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Fundraising activity</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Live events streaming directly from the {APP_CONFIG.CHAIN_SYMBOL} chain with full transparency.
        </p>
      </div>
      <Card className="dark:border-primary/20 p-2">
        <Tabs defaultValue="recent">
          <TabsList className="mb-3 w-full overflow-hidden rounded-2xl">
            <TabsTrigger value="recent" className="flex-1 rounded-xl text-xs sm:text-sm">
              <span className="hidden sm:inline">Recent Activity</span>
              <span className="sm:hidden">Recent</span>
            </TabsTrigger>
            <TabsTrigger value="top" className="flex-1 rounded-xl text-xs sm:text-sm">
              <span className="hidden sm:inline">Top Contributors</span>
              <span className="sm:hidden">Top</span>
            </TabsTrigger>
            <TabsTrigger value="withdraw" className="flex-1 rounded-xl text-xs sm:text-sm">
              <span className="hidden sm:inline">Withdraw History</span>
              <span className="sm:hidden">Withdraw</span>
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
                  <RefreshButton
                    onClick={handleRefresh}
                    isLoading={isPending || isRefreshing}
                    startDelay={DEFAULT_DEBOUNCE_TIME}
                  />
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
                            <AddressDisplay
                              address={contrib.sender_wallet}
                              href={ROUTES.WALLET(contrib.sender_wallet)}
                            />
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
            <TabsContent value="withdraw">
              {isDesktop === undefined ? (
                <>
                  <div className="hidden lg:block">
                    <WithdrawHistoryTable {...withdrawHistoryProps} />
                  </div>
                  <div className="block lg:hidden">
                    <WithdrawHistoryCard {...withdrawHistoryProps} />
                  </div>
                </>
              ) : isDesktop ? (
                <WithdrawHistoryTable {...withdrawHistoryProps} />
              ) : (
                <WithdrawHistoryCard {...withdrawHistoryProps} />
              )}
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </>
  );
}
