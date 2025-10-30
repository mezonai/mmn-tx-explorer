'use client';

import { EBreakpoint } from '@/enums';
import { useBreakpoint } from '@/hooks';
import { TransactionCardsMobile, TransactionsTable } from '@/modules/transaction/components';
import { ITransaction } from '@/modules/transaction/types';

interface TransactionCollectionProps {
  transactions?: ITransaction[];
  isLoading: boolean;
}

export const TransactionCollection = ({ transactions, isLoading }: TransactionCollectionProps) => {
  const isDesktop = useBreakpoint(EBreakpoint.LG);

  return (
    <>
      {isDesktop === undefined ? (
        <div>
          <div className="hidden lg:block">
            <TransactionsTable transactions={transactions} isLoading={isLoading} />
          </div>
          <div className="block lg:hidden">
            <TransactionCardsMobile transactions={transactions} isLoading={isLoading} />
          </div>
        </div>
      ) : isDesktop ? (
        <TransactionsTable transactions={transactions} isLoading={isLoading} />
      ) : (
        <TransactionCardsMobile transactions={transactions} isLoading={isLoading} />
      )}
    </>
  );
};
