import { Skeleton } from '@/components/ui/skeleton';
import { ETransactionStatus, ITransaction } from '@/modules/transaction';
import { DateTimeUtil, NumberUtil } from '@/utils';
import { APP_CONFIG } from '@/configs/app.config';
import { TxnHashLink, TypeBadges, TypeBadgesSkeleton } from '../../shared';
import { WalletAddressDisplay } from '@/modules/wallet/components/wallet-list/list/shared';

interface TransactionCardProps {
  transaction?: ITransaction;
}

export const TransactionCard = ({ transaction }: TransactionCardProps) => {
  const getStatusIcon = (status?: ETransactionStatus) => {
    if (status === ETransactionStatus.Confirmed || status === ETransactionStatus.Passed) {
      return <i className="fa-solid fa-circle-check"></i>;
    }
    if (status === ETransactionStatus.Failed) {
      return <i className="fa-solid fa-circle-xmark"></i>;
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
    <div className="space-y-2 rounded-lg bg-gray-100 p-4 dark:bg-gray-800/40">
      {transaction ? (
        <>
          <div className="flex items-center justify-between">
            <TypeBadges type={transaction.transaction_type} />
            <div className="flex items-center space-x-2">
              <span className={`${getStatusColor(transaction.status)} flex items-center gap-1 text-xs`}>
                {getStatusIcon(transaction.status)} {getStatusText(transaction.status)}
              </span>
            </div>
          </div>
          <div className="flex w-40">
            <p className="flex font-mono text-sm text-gray-600 dark:text-gray-400">Hash:</p>
            <TxnHashLink hash={transaction.hash} isPending={false} className="w-40" />
          </div>
          <div className="flex w-full">
            <div className="flex items-center">
              <span className="w-12 shrink-0 text-sm text-gray-600 dark:text-gray-400">From: </span>
              <WalletAddressDisplay address={transaction.from_address} className="w-24" />
            </div>
            <div className="ml-5 flex items-center">
              <span className="w-12 shrink-0 text-sm text-gray-600 dark:text-gray-400">→ To: </span>
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
