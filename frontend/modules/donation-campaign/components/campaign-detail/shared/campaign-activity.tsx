'use client';

import { AddressDisplay } from '@/components/shared';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { APP_CONFIG } from '@/configs/app.config';
import { ROUTES } from '@/configs/routes.config';
import { DATE_TIME_FORMAT, PAGINATION } from '@/constant';
import { ESortOrder } from '@/enums';
import { cn } from '@/lib/utils';
import { useTopContributor } from '@/modules/donation-campaign/hooks/useTopContributor';
import { Transaction } from '@/modules/donation-campaign/type';
import { ITransactionListParams } from '@/modules/transaction';
import { TxnHashLink } from '@/modules/transaction/components/transaction-list/list/shared';
import { useTransactions } from '@/modules/transaction/hooks/useTransactions';
import { useHidden } from '@/providers';
import { DateTimeUtil, NumberUtil } from '@/utils';
import { format } from 'date-fns';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

const DEFAULT_VALUE_DATA_SEARCH: ITransactionListParams = {
  page: PAGINATION.DEFAULT_PAGE,
  limit: PAGINATION.RECENT_ACTIVITY_LIMITS,
  sort_by: 'transaction_timestamp',
  sort_order: ESortOrder.DESC,
} as const;
export function CampaignActivity({ campaignId, walletAddress }: { campaignId: string; walletAddress: string }) {
  const searchTBParams = { limit: 5 };
  const searchTransactionParams: ITransactionListParams = {
    ...DEFAULT_VALUE_DATA_SEARCH,
    filter_to_address: walletAddress,
  };
  const { data: topContributorsData } = useTopContributor({ params: searchTBParams, campaignId });

  const { data: transactionsResponse } = useTransactions(searchTransactionParams);

  const transactions = transactionsResponse?.data ?? [];
  const contributors = topContributorsData?.contributors ?? [];
  const totalTransaction = transactionsResponse?.meta.total_items ?? 0;
  const { hidden, setHidden } = useHidden();
  setHidden(transactions.length > 0);
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
          <Card className="dark:border-primary/20 overflow-x-auto p-4">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b text-left">
                    <th className="px-4 py-3">Sender</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Tx Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length > 0 ? (
                    transactions.map((tx: Transaction, i: number) => (
                      <tr key={i} className="hover:bg-muted/30 border-b">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                          <AddressDisplay address={tx.from_address} href={ROUTES.WALLET(tx.from_address)} />
                        </td>
                        <td className="px-4 py-3 font-semibold text-emerald-500 dark:text-emerald-300">
                          {NumberUtil.formatWithCommasAndScale(tx.value)}
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          {format(DateTimeUtil.toMilliseconds(tx.transaction_timestamp), DATE_TIME_FORMAT.DATE_TIME)}
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          <TxnHashLink hash={tx.hash} isPending={false} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-gray-500 dark:text-gray-400">
                        No recent activity found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
            <CardFooter>
              <div className="mt-4 flex w-full items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span className="order-1">{`Showing ${transactions.length} of total ${totalTransaction}`}</span>
                <Link
                  href={ROUTES.WALLET(walletAddress)}
                  className={cn(
                    'text-brand-primary hover:text-brand-primary/70 order-2 inline-flex items-center font-medium transition',
                    {
                      hidden: !hidden,
                    }
                  )}
                >
                  View full activity
                  <ChevronRight className="ml-1 text-sm" />
                </Link>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="top">
          <Card className="dark:border-primary/20 space-y-3 p-4">
            <CardHeader className="flex flex-col justify-between gap-2 sm:flex-row">
              <CardTitle>Top contributor</CardTitle>
              <span className="text-xs text-gray-500 dark:text-gray-400">Refreshes every 10 minutes</span>
            </CardHeader>
            <CardContent>
              {contributors.length > 0 ? (
                contributors.map((contrib, i) => (
                  <div
                    key={i}
                    className="dark:bg-card mb-1 flex flex-col items-start gap-2 rounded-2xl border border-gray-100 bg-white/70 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 dark:border-white/10"
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
