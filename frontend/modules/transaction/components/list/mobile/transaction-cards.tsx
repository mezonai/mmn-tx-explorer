import { ITransaction } from '@/modules/transaction';
import { TransactionCard } from './transaction-card';
import { TransactionCardSkeleton } from './transaction-card-skeleton';

interface TransactionCardsProps {
  transactions?: ITransaction[];
}

export const TransactionCards = ({ transactions }: TransactionCardsProps) => {
  if (!transactions) {
    return Array.from({ length: 10 }).map((_, index) => <TransactionCardSkeleton key={index} />);
  }

  return transactions.map((transaction) => <TransactionCard key={transaction.hash} transaction={transaction} />);
};
