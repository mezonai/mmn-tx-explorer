import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/config/routes';
import { ITransaction } from '@/modules/transaction';
import { TransactionCards } from '@/modules/transaction/components/list';

interface LatestTransactionsProps {
  transactions?: ITransaction[];
}

export const LatestTransactions = ({ transactions }: LatestTransactionsProps) => {
  return (
    <div className="col-span-1 space-y-4 xl:col-span-6">
      <div>
        <h2 className="text-xl font-semibold">Latest Transactions</h2>
      </div>
      <div className="space-y-4">{<TransactionCards transactions={transactions} />}</div>
      <div className="flex w-full justify-center">
        <Button variant="link" className="font-medium" asChild>
          <Link href={ROUTES.TRANSACTIONS}>View all transactions</Link>
        </Button>
      </div>
    </div>
  );
};
