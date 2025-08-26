import { DEFAULT_PAGINATION } from '@/constant';
import { ITransaction } from '@/modules/transaction';
import { TransactionCard } from './transaction-card';
import { TransactionCardSkeleton } from './transaction-card-skeleton';

interface TransactionCardsProps {
  transactions?: ITransaction[];
  skeletonLength?: number;
}

export const TransactionCards = ({
  transactions,
  skeletonLength = DEFAULT_PAGINATION.LIMIT,
}: TransactionCardsProps) => {
  return (
    <div className="space-y-4">
      {transactions
        ? transactions.map((transaction) => <TransactionCard key={transaction.hash} transaction={transaction} />)
        : Array.from({ length: skeletonLength }).map((_, index) => <TransactionCardSkeleton key={index} />)}
    </div>
  );
};
