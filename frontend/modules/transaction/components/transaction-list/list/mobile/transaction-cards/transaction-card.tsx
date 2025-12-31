import { Transaction } from '@/assets/icons';
import { ETransactionStatus, ITransaction } from '@/modules/transaction';
import {
  FromToAddresses,
  FromToAddressesSkeleton,
  TransactionValue,
  TransactionValueSkeleton,
  TxnHashLink,
  TxnHashLinkSkeleton,
  TypeBadges,
  TypeBadgesSkeleton,
} from '../../shared';
import { ETransactionOrientation } from '@/modules/transaction/enums';
import { Card, CardContent } from '@/components/ui/card';
import { TxStatusBadge, TxStatusSkeleton } from '@/modules/transaction/components/shared';

interface TransactionCardProps {
  transaction?: ITransaction;
}

export const TransactionCard = ({ transaction }: TransactionCardProps) => {
  return (
    <div className="flex w-full flex-col items-start">
      <Card className="bg-card dark:border-primary/15 mb-4 w-full p-0 shadow-sm dark:bg-gray-800/40">
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex items-center gap-2">
            <Transaction className="text-foreground-quaternary-400 size-6" />
            {transaction ? (
              <TxnHashLink hash={transaction.hash} isPending={transaction.status === ETransactionStatus.Pending} />
            ) : (
              <TxnHashLinkSkeleton />
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium">
            {transaction ? <TypeBadges type={transaction.transaction_extra_info_type} /> : <TypeBadgesSkeleton />}
            {transaction ? <TxStatusBadge status={transaction.status} /> : <TxStatusSkeleton className="h-5.5 w-24" />}
          </div>
          {transaction ? (
            <>
              <div className="block sm:hidden">
                <FromToAddresses
                  fromAddress={transaction.from_address}
                  toAddress={transaction.to_address}
                  orientation={ETransactionOrientation.Vertical}
                />
              </div>
              <div className="hidden sm:block">
                <FromToAddresses
                  fromAddress={transaction.from_address}
                  toAddress={transaction.to_address}
                  orientation={ETransactionOrientation.Horizontal}
                />
              </div>
            </>
          ) : (
            <FromToAddressesSkeleton />
          )}
          {transaction ? (
            <TransactionValue value={transaction.value} showLabel showSymbol />
          ) : (
            <TransactionValueSkeleton showLabel />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
