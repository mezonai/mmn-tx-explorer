import { ITransaction } from '@/modules/transaction';
import { TransactionCard } from './transaction-card';
import { TransactionCardSkeleton } from './transaction-card-skeleton';

interface TransactionCardsProps {
  transactions?: ITransaction[];
}

export const TransactionCards = ({ transactions }: TransactionCardsProps) => {
  return (
    <div className="space-y-4">
      {transactions
        ? transactions.map((transaction) => <TransactionCard key={transaction.hash} transaction={transaction} />)
        : Array.from({ length: 20 }).map((_, index) => <TransactionCardSkeleton key={index} />)}
    </div>
  );
};
