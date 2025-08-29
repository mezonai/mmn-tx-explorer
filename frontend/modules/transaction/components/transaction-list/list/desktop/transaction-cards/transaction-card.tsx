import { Skeleton } from '@/components/ui/skeleton';
import { ITransaction } from '@/modules/transaction';
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

interface TransactionCardProps {
  transaction?: ITransaction;
}

export const TransactionCard = ({ transaction }: TransactionCardProps) => {
  return (
    <div className="border-secondary grid grid-cols-[1fr_12fr_6fr_4fr] border-b">
      <div className="flex items-center justify-center">
        {transaction ? <MoreInfoButton transaction={transaction} /> : <MoreInfoButtonSkeleton />}
      </div>

      <div className="space-y-2 px-4 py-3">
        {transaction ? (
          <TypeBadges type={transaction.transaction_type} status={transaction.status} />
        ) : (
          <TypeBadgesSkeleton />
        )}
        <div className="flex items-center gap-2">
          {transaction ? <TxnHashLink hash={transaction.hash} /> : <TxnHashLinkSkeleton />}
          {transaction ? (
            <span className="text-quaternary-500 text-sm font-normal whitespace-nowrap">
              {DateTimeUtil.formatRelativeTimeSec(transaction.block_timestamp)}
            </span>
          ) : (
            <Skeleton className="h-5 w-14" />
          )}
        </div>
      </div>

      <div className="flex items-center px-4 py-3">
        {transaction ? (
          <FromToAddresses
            fromAddress={transaction.from_address}
            toAddress={transaction.to_address}
            orientation="vertical"
          />
        ) : (
          <FromToAddressesSkeleton orientation="vertical" />
        )}
      </div>

      <div className="flex items-center px-4 py-3">
        {transaction ? (
          <span className="text-tertiary-600 text-sm font-normal whitespace-nowrap">
            {NumberUtil.formatWithCommas(transaction.value)}
          </span>
        ) : (
          <Skeleton className="h-5 w-14" />
        )}
      </div>
    </div>
  );
};
