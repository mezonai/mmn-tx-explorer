'use client';

import { AddressDisplay } from '@/components/shared';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ROUTES } from '@/configs/routes.config';
import { DATE_TIME_FORMAT } from '@/constant';
import { cn } from '@/lib/utils';
import { Transaction } from '@/modules/donation-campaign/type';
import { TxnHashLink } from '@/modules/transaction/components/transaction-list/list/shared';
import { DateTimeUtil, NumberUtil } from '@/utils';
import { format } from 'date-fns';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

export interface RecentActivityTableProps {
  transactions: Transaction[];
  totalTransaction: number;
  walletAddress: string;
  hidden: boolean;
}

export function RecentActivityTable({
  transactions,
  totalTransaction,
  walletAddress,
  hidden,
}: RecentActivityTableProps) {
  return (
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
  );
}
