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

interface RecentActivityCardsMobileProps {
  transactions: Transaction[];
  totalTransaction: number;
  walletAddress: string;
  hidden: boolean;
}

export function RecentActivityCardsMobile({
  transactions,
  totalTransaction,
  walletAddress,
  hidden,
}: RecentActivityCardsMobileProps) {
  return (
    <Card className="dark:border-primary/20 px-1 py-4">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {transactions.length > 0 ? (
          transactions.map((tx: Transaction, i: number) => (
            <div key={i} className="dark:bg-card rounded-lg border p-4 text-sm dark:border-white/10">
              <div className="mb-2 flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Sender</span>
                <AddressDisplay address={tx.from_address} href={ROUTES.WALLET(tx.from_address)} />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold text-emerald-500 dark:text-emerald-300">
                  {NumberUtil.formatWithCommasAndScale(tx.value)}
                </span>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-muted-foreground">Time</span>
                <span className="font-semibold">
                  {format(DateTimeUtil.toMilliseconds(tx.transaction_timestamp), DATE_TIME_FORMAT.DATE_TIME)}
                </span>
              </div>
              <div className="mt-1 flex justify-between pb-2">
                <span className="text-muted-foreground">Tx Hash</span>
                <TxnHashLink hash={tx.hash} isPending={false} className="flex-0" />
              </div>
            </div>
          ))
        ) : (
          <div className="py-6 text-center text-gray-500 dark:text-gray-400">No recent activity found.</div>
        )}
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
