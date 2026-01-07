'use client';

import { RefreshButton } from '@/components/shared';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ROUTES } from '@/configs/routes.config';
import { DATE_TIME_FORMAT } from '@/constant';
import { DEFAULT_DEBOUNCE_TIME } from '@/hooks';
import { cn } from '@/lib/utils';
import { Transaction } from '@/modules/donation-campaign/type';
import { TxnHashLink } from '@/modules/transaction/components/transaction-list/list/shared';
import { DateTimeUtil, NumberUtil } from '@/utils';
import { format } from 'date-fns';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface WithdrawHistoryCardProps {
  transactions: Transaction[];
  totalTransaction: number;
  walletAddress: string;
  hidden: boolean;
  isLoading?: boolean;
  refetch: () => void;
}

export function WithdrawHistoryCard({
  transactions,
  totalTransaction,
  walletAddress,
  hidden,
  isLoading = false,
  refetch,
}: WithdrawHistoryCardProps) {
  return (
    <Card className="dark:border-primary/20 gap-6 px-0 py-4">
      <CardHeader className="m-0 flex items-center justify-between gap-2 px-6">
        <CardTitle className="text-foreground">Withdraw History</CardTitle>
        <RefreshButton onClick={refetch} isLoading={isLoading} startDelay={DEFAULT_DEBOUNCE_TIME} />
      </CardHeader>
      <CardContent className="flex flex-col">
        {transactions.length > 0 ? (
          transactions.map((tx: Transaction, i: number) => (
            <div key={i} className="dark:bg-card text-sm dark:border-white/10">
              <div className="mt-1 flex justify-between">
                <span className="text-muted-foreground">Time</span>
                <span className="font-semibold">
                  {format(DateTimeUtil.toMilliseconds(tx.transaction_timestamp), DATE_TIME_FORMAT.DATE_TIME)}
                </span>
              </div>

              <div className="mt-1 flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="text-error-primary-600 font-semibold">
                  {NumberUtil.formatWithCommasAndScale(tx.value)}
                </span>
              </div>

              <div className="mt-1 mb-2 flex justify-between">
                <span className="text-muted-foreground pr-1">Tx Hash</span>
                <TxnHashLink hash={tx.hash} isPending={false} />
              </div>

              <div className="mt-1 flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Purpose</span>
                <span className="ml-2 overflow-hidden text-ellipsis whitespace-nowrap">{tx.text_data}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="py-6 text-center text-gray-500 dark:text-gray-400">No withdraw found.</div>
        )}
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span className="order-1">{`Showing ${transactions.length} of total ${totalTransaction}`}</span>
          <Link
            href={ROUTES.WALLET(walletAddress, 'type=sent')}
            className={cn(
              'text-brand-primary hover:text-brand-primary/70 order-2 inline-flex items-center font-medium transition',
              {
                hidden: !hidden,
              }
            )}
          >
            View full withdrawals
            <ChevronRight className="ml-1 text-sm" />
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
