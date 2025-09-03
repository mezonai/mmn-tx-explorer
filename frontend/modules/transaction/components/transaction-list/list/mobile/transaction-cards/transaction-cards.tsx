import { PAGINATION } from '@/constant';
import { ITransaction } from '@/modules/transaction';
import { TransactionCard } from './transaction-card';

interface TransactionCardsProps {
  transactions?: ITransaction[];
  skeletonLength?: number;
}

export const TransactionCardsMobile = ({
  transactions,
  skeletonLength = PAGINATION.DEFAULT_LIMIT,
}: TransactionCardsProps) => {
  return (
    <div className="space-y-4">
      {transactions
        ? transactions.map((transaction) => <TransactionCard key={transaction.hash} transaction={transaction} />)
        : Array.from({ length: skeletonLength }).map((_, index) => <TransactionCard key={index} />)}
    </div>
  );
};
