import { ETransactionStatus, getTransactionTypeLabel, ITransaction } from '@/modules/transaction';
import { TransactionTimeSkeleton, TxnHashLink, TxnHashLinkSkeleton } from '../../shared';
import { DateTimeUtil, NumberUtil } from '@/utils';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DATE_TIME_FORMAT } from '@/constant';
import { Chip } from '@/components/shared';
import { APP_CONFIG } from '@/configs/app.config';

interface WalletTransactionsCardProps {
  transaction?: ITransaction;
  index: number;
  walletAddress: string;
}

export const WalletTransactionsCard = ({ transaction, index, walletAddress }: WalletTransactionsCardProps) => {
  if (!transaction) {
    return (
      <div key={`skeleton-${index}`} className="border-secondary space-y-2 border-b pb-4">
        <div className="flex items-center justify-between">
          <div className="text-quaternary-500 text-xs">Hash</div>
          <div className="w-40">
            <TxnHashLinkSkeleton />
          </div>
        </div>
        <div className="text-quaternary-500 text-xs">Created At</div>
        <TransactionTimeSkeleton />
        <div className="text-quaternary-500 text-xs">Type</div>
        <div className="bg-muted h-5 w-24 rounded" />
        <div className="text-quaternary-500 text-xs">Amount</div>
        <div className="bg-muted h-5 w-24 rounded" />
      </div>
    );
  }

  const isSent = walletAddress === transaction.from_address;

  return (
    <div key={transaction.hash} className="border-secondary space-y-2 border-b pb-4">
      <div className="flex items-center justify-between">
        <div className="text-foreground text-xs">Hash</div>
        <div className="w-40">
          <TxnHashLink hash={transaction.hash} isPending={transaction.status === ETransactionStatus.Pending} />
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="text-foreground text-xs">Created At</div>
        <div className="text-sm">
          {format(DateTimeUtil.toMilliseconds(transaction.transaction_timestamp), DATE_TIME_FORMAT.DATE_TIME)}
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="text-foreground text-xs">Type</div>
        <Chip variant="warning" className="gap-1.5 rounded-md">
          <span>{getTransactionTypeLabel(transaction.transaction_extra_info_type)}</span>
        </Chip>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="text-foreground text-xs">Amount</div>
        <div className="flex items-center gap-2 text-sm">
          <span className={cn('font-bold', isSent ? 'text-error-primary-600' : 'text-utility-success-600')}>
            {isSent ? '-' : '+'} {NumberUtil.formatWithCommasAndScale(transaction.value)} {APP_CONFIG.CHAIN_SYMBOL}
          </span>
        </div>
      </div>
    </div>
  );
};
