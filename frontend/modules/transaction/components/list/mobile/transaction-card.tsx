import { Transaction } from '@/assets/icons';
import { ITransaction, formatRelativeTime } from '@/modules/transaction';
import { FromToAddresses, MoreInfoButton, TxnHashLink, TypeBadges } from '../shared';

interface TransactionCardProps {
  transaction: ITransaction;
}

export const TransactionCard = ({ transaction }: TransactionCardProps) => {
  return (
    <div className="flex flex-col items-start gap-2 border-b pb-4 xl:flex-row xl:items-center xl:gap-4">
      <div className="hidden xl:block">
        <MoreInfoButton />
      </div>

      <div className="w-full flex-1 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium">
          <TypeBadges />
          <div className="block xl:hidden">
            <MoreInfoButton />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Transaction className="text-muted-foreground size-6" />
          <TxnHashLink hash={transaction.hash} />
          <p className="text-muted-foreground text-sm whitespace-nowrap">
            {formatRelativeTime(new Date(transaction.block_timestamp * 1000).toISOString())}
          </p>
        </div>
      </div>

      <FromToAddresses fromAddress={transaction.from_address} toAddress={transaction.to_address} />

      <div className="flex w-full justify-between gap-2 text-sm font-medium xl:w-auto xl:justify-center">
        <div className="flex w-full justify-between gap-2">
          <span>Value</span>
          <span className="font-medium">{transaction.value} ETH</span>
        </div>
      </div>
    </div>
  );
};
