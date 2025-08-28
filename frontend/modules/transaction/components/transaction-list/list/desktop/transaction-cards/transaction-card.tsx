import { ITransaction } from '@/modules/transaction';
import { DateTimeUtil, NumberUtil } from '@/utils';
import { FromToAddresses, MoreInfoButton, TxnHashLink, TypeBadges } from '../../shared';

interface TransactionCardProps {
  transaction: ITransaction;
}

export const TransactionCard = ({ transaction }: TransactionCardProps) => {
  return (
    <div className="border-secondary grid grid-cols-[1fr_12fr_6fr_4fr] border-b">
      <div className="flex items-center justify-center">
        <MoreInfoButton transaction={transaction} />
      </div>

      <div className="space-y-2 px-4 py-3">
        <TypeBadges type={transaction.transaction_type} status={transaction.status} />
        <div className="flex items-center gap-2">
          <TxnHashLink hash={transaction.hash} />
          <span className="text-quaternary-500 text-sm font-normal whitespace-nowrap">
            {DateTimeUtil.formatRelativeTimeSec(transaction.block_timestamp)}
          </span>
        </div>
      </div>

      <div className="flex items-center px-4 py-3">
        <FromToAddresses
          fromAddress={transaction.from_address}
          toAddress={transaction.to_address}
          orientation="vertical"
        />
      </div>

      <div className="flex items-center px-4 py-3">
        <span className="text-tertiary-600 text-sm font-normal whitespace-nowrap">
          {NumberUtil.formatWithCommas(transaction.value)}
        </span>
      </div>
    </div>
  );
};
