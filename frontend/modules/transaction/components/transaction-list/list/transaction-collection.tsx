import { EBreakpoint } from '@/enums';
import { useBreakpoint } from '@/hooks';
import { ITransaction } from '@/modules/transaction/types';
import { TransactionCards, TransactionsTable } from '.';

interface TransactionCollectionProps {
  transactions?: ITransaction[];
  skeletonLimit?: number;
}

export const TransactionCollection = ({ transactions, skeletonLimit = 5 }: TransactionCollectionProps) => {
  const isDesktop = useBreakpoint(EBreakpoint.LG);

  return (
    <>
      {isDesktop === undefined ? (
        <div>
          <div className="hidden lg:block">
            <TransactionsTable transactions={transactions} skeletonLength={skeletonLimit} />
          </div>
          <div className="block lg:hidden">
            <TransactionCards transactions={transactions} skeletonLength={skeletonLimit} />
          </div>
        </div>
      ) : isDesktop ? (
        <TransactionsTable transactions={transactions} skeletonLength={skeletonLimit} />
      ) : (
        <TransactionCards transactions={transactions} skeletonLength={skeletonLimit} />
      )}
    </>
  );
};
