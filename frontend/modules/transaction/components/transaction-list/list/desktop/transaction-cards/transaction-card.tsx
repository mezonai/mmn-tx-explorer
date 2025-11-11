import { Skeleton } from '@/components/ui/skeleton';
import { CopyButton } from '@/components/ui/copy-button';
import { ETransactionOrientation, ETransactionStatus, ITransaction } from '@/modules/transaction';
import { DateTimeUtil, NumberUtil } from '@/utils';
import {
  FromToAddresses,
  FromToAddressesSkeleton,
  MoreInfoButton,
  MoreInfoButtonSkeleton,
  TxnHashLink,
  TxnHashLinkSkeleton,
  TypeBadges,
  TypeBadgesSkeleton,
} from '../../shared';
import { APP_CONFIG } from '@/configs/app.config';

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
    <div className="bg-gray-100 dark:bg-gray-800/40 p-4 rounded-lg space-y-2">
      {transaction ? (
        <>
          <div className="flex justify-between items-center">
            <TypeBadges type={transaction.transaction_type} status={transaction.status} />
            <div className="flex items-center space-x-2">
              <span className={`${getStatusColor(transaction.status)} text-xs flex items-center gap-1`}>
                {getStatusIcon(transaction.status)} {getStatusText(transaction.status)}
              </span>
              <CopyButton textToCopy={transaction.hash} />
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm font-mono truncate">
            Hash: {transaction.hash.slice(0, 11)}...{transaction.hash.slice(-6)}
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            From: {transaction.from_address.slice(0, 6)}...{transaction.from_address.slice(-4)} → To: {transaction.to_address.slice(0, 6)}...{transaction.to_address.slice(-4)}
          </p>
          <div className="flex justify-between items-center">
            <p className="text-gray-900 dark:text-white font-mono">
              {NumberUtil.formatWithCommasAndScale(transaction.value)} {APP_CONFIG.CHAIN_SYMBOL}
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-sm">{DateTimeUtil.formatRelativeTimeSec(transaction.transaction_timestamp)}</p>
          </div>
        </>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <TypeBadgesSkeleton />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="flex justify-between items-center">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        </>
      )}
    </div>
  );
};
