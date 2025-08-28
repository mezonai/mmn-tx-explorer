import { APP_CONFIG } from '@/configs/app.config';
import { PAGINATION } from '@/constant';
import { cn } from '@/lib/utils';
import { ITransaction } from '@/modules/transaction';
import { TransactionCard } from './transaction-card';
import { TransactionCardSkeleton } from './transaction-card-skeleton';

interface TransactionCardsDesktopProps {
  transactions?: ITransaction[];
  skeletonLength?: number;
}

export const TransactionCardsDesktop = ({
  transactions,
  skeletonLength = PAGINATION.DEFAULT_LIMIT,
}: TransactionCardsDesktopProps) => {
  return (
    <div>
      <div
        className={cn(
          'bg-active border-secondary grid grid-cols-[1fr_12fr_6fr_4fr] border-b',
          'text-quaternary-500 text-xs font-semibold whitespace-nowrap [&>div]:flex [&>div]:items-center [&>div]:px-4 [&>div]:py-3'
        )}
      >
        <div></div>
        <div>
          <span>TXN Hash</span>
        </div>
        <div>
          <span>From/to</span>
        </div>
        <div>
          <span>Value {APP_CONFIG.CHAIN_SYMBOL}</span>
        </div>
      </div>

      {transactions
        ? transactions.map((transaction) => <TransactionCard key={transaction.hash} transaction={transaction} />)
        : Array.from({ length: skeletonLength }).map((_, index) => <TransactionCardSkeleton key={index} />)}
    </div>
  );
};
