import { Transaction } from '@/assets/icons';
import { ETransactionStatus, ITransaction } from '@/modules/transaction';
import {
  FromToAddresses,
  FromToAddressesSkeleton,
  MoreInfoButton,
  MoreInfoButtonSkeleton,
  TransactionTime,
  TransactionTimeSkeleton,
  TransactionValue,
  TransactionValueSkeleton,
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
    <div className="border-secondary flex flex-col items-start gap-2 border-b pb-4">
      <div className="w-full flex-1 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium">
          {transaction ? (
            <TypeBadges type={transaction.transaction_type} status={transaction.status} />
          ) : (
            <TypeBadgesSkeleton />
          )}
          {transaction ? <MoreInfoButton transaction={transaction} /> : <MoreInfoButtonSkeleton />}
        </div>
        <div className="flex items-center gap-2">
          <Transaction className="text-foreground-quaternary-400 size-6" />
          {transaction ? (
            <TxnHashLink hash={transaction.hash} isPending={transaction.status === ETransactionStatus.Pending} />
          ) : (
            <TxnHashLinkSkeleton />
          )}
          {transaction ? (
            <TransactionTime
              transactionTimestamp={transaction.transaction_timestamp}
              className="font-normal whitespace-nowrap"
            />
          ) : (
            <TransactionTimeSkeleton className="font-normal whitespace-nowrap" />
          )}
        </div>
      </div>

      {transaction ? (
        <FromToAddresses fromAddress={transaction.from_address} toAddress={transaction.to_address} />
      ) : (
        <FromToAddressesSkeleton />
      )}

      {transaction ? (
        <TransactionValue value={transaction.value} showLabel showSymbol />
      ) : (
        <TransactionValueSkeleton showLabel />
      )}
    </div>
  );
};
