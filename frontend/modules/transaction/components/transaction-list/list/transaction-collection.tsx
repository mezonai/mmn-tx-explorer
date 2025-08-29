'use client';

import { EBreakpoint } from '@/enums';
import { useBreakpoint } from '@/hooks';
import { ITransaction } from '@/modules/transaction/types';
import { TransactionsTable } from './desktop';
import { TransactionCardsMobile } from './mobile';

interface TransactionCollectionProps {
  transactions?: ITransaction[];
  skeletonLength: number;
}

export const TransactionCollection = ({ transactions, skeletonLength }: TransactionCollectionProps) => {
  const isDesktop = useBreakpoint(EBreakpoint.LG);

  return (
    <>
      {isDesktop === undefined ? (
        <div>
          <div className="hidden lg:block">
            <TransactionsTable transactions={transactions} skeletonLength={skeletonLength} />
          </div>
          <div className="block lg:hidden">
            <TransactionCardsMobile transactions={transactions} skeletonLength={skeletonLength} />
          </div>
        </div>
      ) : isDesktop ? (
        <TransactionsTable transactions={transactions} skeletonLength={skeletonLength} />
      ) : (
        <TransactionCardsMobile transactions={transactions} skeletonLength={skeletonLength} />
      )}
    </>
  );
};
