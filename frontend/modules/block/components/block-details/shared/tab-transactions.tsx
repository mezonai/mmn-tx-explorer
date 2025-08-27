import { ITransaction } from '@/modules/transaction';
import { TransactionsTable } from '@/modules/transaction/components/transaction-list/list';

interface TabTransactionsProps {
  transactions?: ITransaction[];
}

export const TabTransactions = ({ transactions }: TabTransactionsProps) => {
  return (
    <div>
      <TransactionsTable transactions={transactions} />
    </div>
  );
};
