import { MiddleTruncate } from '@re-dev/react-truncate';
import { format } from 'date-fns';
import Link from 'next/link';

import { Transaction } from '@/assets/icons';
import { DATE_TIME_FORMAT } from '@/constant';
import { ITransaction } from '@/modules/transaction';

interface TransactionSearchResultItemProps {
  transaction: ITransaction;
}

export const TransactionSearchResultItem = ({ transaction }: TransactionSearchResultItemProps) => {
  return (
    <Link
      href={`/transactions/${transaction.hash}`}
      className="focus:bg-muted hover:bg-muted active:bg-muted flex flex-col items-start justify-between gap-1 rounded px-1 py-3 lg:flex-row lg:items-center lg:gap-2"
    >
      <div className="flex w-full flex-1 items-center justify-start gap-2 lg:w-auto">
        <Transaction className="size-5" />
        <span className="text-foreground w-full flex-1 text-sm font-bold lg:w-auto">
          <MiddleTruncate end={4}>{transaction.hash}</MiddleTruncate>
        </span>
      </div>
      <div className="flex flex-col items-start gap-1 lg:flex-row lg:items-center lg:gap-2">
        <span className="line-clamp-1 text-sm font-medium">
          {format(transaction.block_timestamp * 1000, DATE_TIME_FORMAT.HUMAN_READABLE_WITH_OFFSET)}
        </span>
      </div>
    </Link>
  );
};
