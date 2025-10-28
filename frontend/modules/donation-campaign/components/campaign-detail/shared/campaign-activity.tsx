'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { APP_CONFIG } from '@/configs/app.config';
import { DATE_TIME_FORMAT, PAGINATION } from '@/constant';
import { ESortOrder } from '@/enums';
import { usePaginationQueryParam } from '@/hooks';
import { DonationCampaignService } from '@/modules/donation-campaign/api';
import { useTopContributor } from '@/modules/donation-campaign/hooks/useTopContributor';
import { truncateWalletAddress } from '@/modules/donation-campaign/utils';
import { ITransactionListParams } from '@/modules/transaction';
import { useTransactions } from '@/modules/transaction/hooks/useTransactions';
import { DateTimeUtil, NumberUtil } from '@/utils';
import { format } from 'date-fns';
import Link from 'next/link';
interface Transaction {
  chain_id: string;
  hash: string;
  nonce: number;
  block_hash: string;
  block_number: number;
  from_address: string;
  to_address: string;
  value: string;
  transaction_type: number;
  status: number;
  transaction_timestamp: number;
}
const DEFAULT_VALUE_DATA_SEARCH: ITransactionListParams = {
  page: PAGINATION.DEFAULT_PAGE,
  limit: PAGINATION.DEFAULT_LIMIT,
  sort_by: 'transaction_timestamp',
  sort_order: ESortOrder.DESC,
} as const;
export function CampaignActivity({ campaignId, walletAddress }: { campaignId: string; walletAddress: string }) {
  const { data: topContributorsData } = useTopContributor(campaignId);

  const { page, limit } = usePaginationQueryParam();
  const searchParams: ITransactionListParams = {
    ...DEFAULT_VALUE_DATA_SEARCH,
    page,
    limit,
    filter_to_address: walletAddress,
  };

  const { data: transactionsResponse } = useTransactions(searchParams);
  return (
    <Card className="p-2">
      <Tabs defaultValue="recent">
        <TabsList className="w-full">
          <TabsTrigger
            value="recent"
            className="data-[state=active]:text-primary hover:text-primary dark:bg-dark dark:text-primary-light"
          >
            Recent Activity
          </TabsTrigger>
          <TabsTrigger
            value="top"
            className="data-[state=active]:text-primary hover:text-primary dark:bg-dark dark:text-primary-light"
          >
            Top Contributors
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recent">
          <Card className="overflow-x-auto p-4">
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
                  {(transactionsResponse?.data ?? []).map((tx: Transaction, i: number) => (
                    <tr key={i} className="hover:bg-muted/30 border-b">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {truncateWalletAddress(tx.from_address)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-emerald-500 dark:text-emerald-300">
                        {NumberUtil.formatWithCommasAndScale(tx.value)}
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        {format(DateTimeUtil.toMilliseconds(tx.transaction_timestamp), DATE_TIME_FORMAT.DATE_TIME)}
                      </td>
                      <td className="text-primary dark:text-primary px-4 py-3 font-semibold">
                        {truncateWalletAddress(tx.hash)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
            <CardFooter>
              <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <Link
                  href={`/wallets/${walletAddress}?tab=received-transactions`}
                  className="text-primary hover:text-primary-light inline-flex items-center gap-1 font-medium transition"
                >
                  View full activity
                </Link>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="top">
          <Card className="space-y-3 p-4">
            <CardHeader className="flex justify-between gap-2">
              <CardTitle>Top contributor</CardTitle>{' '}
              <span className="text-xs text-gray-500 dark:text-gray-400">Refreshes every 10 minutes</span>
            </CardHeader>
            <CardContent>
              {topContributorsData?.contributors?.map((contrib, i) => (
                <div
                  key={i}
                  className="dark:bg-dark-light/70 flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white/70 p-4 dark:border-white/10"
                >
                  <div className="flex items-center gap-4">
                    <span className="bg-primary inline-flex h-9 w-9 items-center justify-center rounded-2xl text-sm font-semibold text-white">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-mono text-sm font-semibold dark:text-white">
                        {truncateWalletAddress(contrib.sender_wallet)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-500 dark:text-emerald-300">
                      {NumberUtil.formatWithCommasAndScale(contrib.total_donate)} {APP_CONFIG.CHAIN_SYMBOL}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {contrib.percentage.toFixed(1)}% of total
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
