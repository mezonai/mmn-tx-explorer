'use client';

import { format } from 'date-fns';

import { DATE_TIME_FORMAT } from '@/constant';
import { cn } from '@/lib/utils';
import { ETransactionStatus, ITransaction } from '@/modules/transaction';
import { DateTimeUtil, NumberUtil } from '@/utils';
import {
  MoreInfoButton,
  MoreInfoButtonSkeleton,
  TxnHashLink,
  TxnHashLinkSkeleton,
  TransactionTimeSkeleton,
} from '../../shared';
import { NoData } from '@/components/shared/no-data';

interface WalletTransactionsTableProps {
  walletAddress: string;
  isLoading: boolean;
  transactions: ITransaction[];
  skeletonLength: number;
  isEmptyTransactions: boolean | undefined;
}

export const MobileWalletTransactionsTable = ({
  walletAddress,
  transactions = [],
  skeletonLength = 0,
  isLoading,
  isEmptyTransactions = false,
}: WalletTransactionsTableProps) => {
  const renderRow = (transaction?: ITransaction, index?: number) => {
    if (!transaction) {
      return (
        <div key={`skeleton-${index}`} className="border-secondary space-y-2 border-b pb-4">
          <div className="flex items-center justify-between">
            <TxnHashLinkSkeleton />
            <MoreInfoButtonSkeleton />
          </div>
          <div className="text-quaternary-500 text-xs">Created At</div>
          <TransactionTimeSkeleton />
          <div className="text-quaternary-500 text-xs">Amount</div>
          <div className="bg-muted h-5 w-24 rounded" />
        </div>
      );
    }

    const isSent = walletAddress === transaction.from_address;

    return (
      <div key={transaction.hash} className="border-secondary space-y-2 border-b pb-4">
        <div className="flex items-center justify-between">
          <TxnHashLink hash={transaction.hash} isPending={transaction.status === ETransactionStatus.Pending} />
          <MoreInfoButton transaction={transaction} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="text-quaternary-500 text-xs">Created At</div>
          <div className="text-sm">
            {format(DateTimeUtil.toMilliseconds(transaction.transaction_timestamp), DATE_TIME_FORMAT.DATE_TIME)}
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="text-quaternary-500 text-xs">Amount</div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-quaternary-500">{isSent ? 'Sent' : 'Received'}</span>
            <span className={cn('font-bold', isSent ? 'text-error-primary-600' : 'text-utility-success-600')}>
              {isSent ? '-' : '+'} {NumberUtil.formatWithCommas(transaction.value)}
            </span>
          </div>
        </div>
      </div>
    );
  };
  if (isLoading) {
    return (
      <div className="space-y-4">{Array.from({ length: skeletonLength }).map((_, i) => renderRow(undefined, i))}</div>
    );
  }
  if (isEmptyTransactions) {
    return <NoData />;
  }
  return <div className="space-y-4">{transactions.map((t) => renderRow(t))}</div>;
};
