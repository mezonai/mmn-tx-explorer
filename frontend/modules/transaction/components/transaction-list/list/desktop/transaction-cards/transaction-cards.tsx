import { PAGINATION } from '@/constant';
import { cn } from '@/lib/utils';
import { ITransaction } from '@/modules/transaction';
import { TransactionCard } from './transaction-card';

interface TransactionCardsDesktopProps {
  transactions?: ITransaction[];
  skeletonLength?: number;
  isLoading: boolean;
}

export const TransactionCardsDesktop = ({
  transactions,
  skeletonLength = PAGINATION.DEFAULT_LIMIT,
}: TransactionCardsDesktopProps) => {
  return (
    <div className="space-y-3">
      {transactions
        ? transactions.map((transaction) => <TransactionCard key={transaction.hash} transaction={transaction} />)
        : Array.from({ length: skeletonLength }).map((_, index) => <TransactionCard key={index} />)}
    </div>
  );
};
