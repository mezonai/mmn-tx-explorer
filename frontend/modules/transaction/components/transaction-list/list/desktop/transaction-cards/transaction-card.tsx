import { Skeleton } from '@/components/ui/skeleton';
import { ETransactionStatus, ITransaction } from '@/modules/transaction';
import { DateTimeUtil, NumberUtil } from '@/utils';
import { APP_CONFIG } from '@/configs/app.config';
import { TypeBadges, TypeBadgesSkeleton } from '../../shared';
import { TxnHashLinkDashboard } from '../../shared/txn-hash-link';
import { WalletAddressDisplay } from '@/modules/wallet/components/wallet-list/list/shared';
import { CheckCircle, XCircle } from '@/assets/icons';

interface TransactionCardProps {
  transaction?: ITransaction;
}

export const TransactionCard = ({ transaction }: TransactionCardProps) => {
  const getStatusIcon = (status?: ETransactionStatus) => {
    if (status === ETransactionStatus.Confirmed || status === ETransactionStatus.Passed) {
      return <CheckCircle />;
    }
    if (status === ETransactionStatus.Failed) {
      return <XCircle />;
    }
    return null;
  };

  const getStatusColor = (status?: ETransactionStatus) => {
    if (status === ETransactionStatus.Confirmed || status === ETransactionStatus.Passed) return 'text-green-400';
    if (status === ETransactionStatus.Failed) return 'text-red-400';
    return 'text-gray-400';
  };

  const getStatusText = (status?: ETransactionStatus) => {
    if (status === ETransactionStatus.Confirmed || status === ETransactionStatus.Passed) return 'Success';
    if (status === ETransactionStatus.Failed) return 'Failed';
    if (status === ETransactionStatus.Pending) return 'Pending';
    return '';
  };

  return (
    <div className="space-y-2 rounded-lg p-4 dark:bg-gray-800/40 dark:shadow-sm">
      {transaction ? (
        <>
          <div className="flex items-center justify-between">
            <TypeBadges type={transaction.transaction_extra_info_type} />
            <span className={`${getStatusColor(transaction.status)} flex items-center gap-1 text-xs`}>
              {getStatusIcon(transaction.status)} {getStatusText(transaction.status)}
            </span>
          </div>

          <div className="flex w-full items-center gap-2">
            <span className="text-sm whitespace-nowrap text-gray-600 dark:text-gray-400">Hash:</span>
            <div className="flex min-w-0 items-center gap-1">
              {transaction?.hash && (
                <TxnHashLinkDashboard
                  hash={transaction.hash}
                  isPending={transaction.status === ETransactionStatus.Pending}
                />
              )}
            </div>
          </div>

          <div className="flex w-full flex-col sm:flex-row sm:items-center sm:space-x-6">
            <div className="flex min-w-0 items-center gap-2">
              <span className="text-sm whitespace-nowrap text-gray-600 dark:text-gray-400">From:</span>
              <WalletAddressDisplay address={transaction.from_address} className="w-24" />
            </div>
            <span className="hidden text-gray-400 sm:inline">→</span>
            <span className="text-gray-400 sm:hidden">↓</span>
            <div className="flex min-w-0 items-center gap-2">
              <span className="text-sm whitespace-nowrap text-gray-600 dark:text-gray-400">To:</span>
              <WalletAddressDisplay address={transaction.to_address} className="w-24" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="font-mono text-gray-900 dark:text-white">
              {NumberUtil.formatWithCommasAndScale(transaction.value)} {APP_CONFIG.CHAIN_SYMBOL}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {DateTimeUtil.formatRelativeTimeSec(transaction.transaction_timestamp)}
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <TypeBadgesSkeleton />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        </>
      )}
    </div>
  );
};
