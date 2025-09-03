import { Truncate } from '@re-dev/react-truncate';
import { format } from 'date-fns';
import { Clock4 } from 'lucide-react';
import Link from 'next/link';

import { ItemAttribute } from '@/components/shared';
import { TxStatusBadge } from '@/modules/transaction/components/shared/tx-status-badge';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { DATE_TIME_FORMAT } from '@/constant';
import { ITransaction } from '@/modules/transaction/types';
import { DateTimeUtil, NumberUtil } from '@/utils';

interface TabDetailsProps {
  transaction?: ITransaction;
}

export const TabDetails = ({ transaction }: TabDetailsProps) => {
  return (
    <div className="space-y-4">
      <ItemAttribute
        label="Transaction Hash"
        description="The hash of the transaction"
        data={transaction}
        render={(transaction) => (
          <div className="flex items-center gap-2">
            <div className="flex-grow md:flex-grow-0">
              <Truncate className="md:hidden">{transaction.hash}</Truncate>
              <span className="hidden md:block">{transaction.hash}</span>
            </div>
            <CopyButton textToCopy={transaction.hash} className="text-muted-foreground size-fit flex-shrink-0" />
          </div>
        )}
        skeleton={<Skeleton className="h-5 w-full md:w-150" />}
      />
      <ItemAttribute
        label="Status"
        description="The status of the transaction"
        data={transaction}
        render={(transaction) => <TxStatusBadge status={transaction.status} />}
        skeleton={<Skeleton className="h-5 w-20" />}
      />
      <ItemAttribute
        label="Block"
        description="The block of the transaction"
        data={transaction}
        render={(transaction) => (
          <Button variant="link" className="size-fit p-0 text-sm font-semibold">
            <Link href={`/blocks/${transaction.block_number}`}>{transaction.block_number}</Link>
          </Button>
        )}
        skeleton={<Skeleton className="h-5 w-15" />}
      />
      <ItemAttribute
        label="Timestamp"
        description="The timestamp of the transaction"
        data={transaction}
        render={(transaction) => (
          <div className="text-muted-foreground flex items-center space-x-2">
            <Clock4 className="size-4" />
            <div>
              <span>{DateTimeUtil.formatRelativeTimeSec(transaction.block_timestamp)}</span>
              <span> | </span>
              <span>
                {format(
                  DateTimeUtil.toMilliseconds(transaction.block_timestamp),
                  DATE_TIME_FORMAT.HUMAN_READABLE_WITH_OFFSET
                )}
              </span>
            </div>
          </div>
        )}
        skeleton={<Skeleton className="h-5 w-1/2" />}
      />
      <Separator />
      <ItemAttribute
        label="From"
        description="The address of the sender"
        data={transaction}
        render={(transaction) => (
          <div className="flex items-center gap-2">
            <div className="flex-grow md:flex-grow-0">
              <Truncate className="md:hidden">{transaction.from_address}</Truncate>
              <span className="hidden md:block">{transaction.from_address}</span>
            </div>
            <CopyButton
              textToCopy={transaction.from_address}
              className="text-muted-foreground size-fit flex-shrink-0"
            />
          </div>
        )}
        skeleton={<Skeleton className="h-5 w-full md:w-150" />}
      />
      <ItemAttribute
        label="To"
        description="The address of the recipient"
        data={transaction}
        render={(transaction) => (
          <div className="flex items-center gap-2">
            <div className="flex-grow md:flex-grow-0">
              <Truncate className="md:hidden">{transaction.to_address}</Truncate>
              <span className="hidden md:block">{transaction.to_address}</span>
            </div>
            <CopyButton textToCopy={transaction.to_address} className="text-muted-foreground size-fit flex-shrink-0" />
          </div>
        )}
        skeleton={<Skeleton className="h-5 w-full md:w-150" />}
      />
      <ItemAttribute
        label="Value"
        description="The value of the transaction"
        data={transaction}
        render={(transaction) => (
          <div className="flex items-center">
            <span>{NumberUtil.formatWithCommas(transaction.value)}</span>
          </div>
        )}
        skeleton={<Skeleton className="h-5 w-20" />}
      />
    </div>
  );
};
