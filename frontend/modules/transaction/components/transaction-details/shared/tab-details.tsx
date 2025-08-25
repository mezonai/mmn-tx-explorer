import { MiddleTruncate } from '@re-dev/react-truncate';
import { format } from 'date-fns';
import { Clock4 } from 'lucide-react';
import Link from 'next/link';

import { CheckCircle } from '@/assets/icons';
import { ItemAttribute } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import { Separator } from '@/components/ui/separator';
import { ADDRESS_END_VISIBLE_CHARS, DATE_TIME_FORMAT } from '@/constant';
import { ITransaction } from '@/modules/transaction/types';
import { DateTimeUtil } from '@/utils';

interface TabDetailsProps {
  transaction?: ITransaction;
}

export const TabDetails = ({ transaction }: TabDetailsProps) => {
  return transaction ? (
    <div className="space-y-4">
      <ItemAttribute
        label="Transaction Hash"
        description="The hash of the transaction"
        render={
          <div className="flex items-center gap-2">
            <div className="w-[500px]">
              <MiddleTruncate end={ADDRESS_END_VISIBLE_CHARS}>{transaction.hash}</MiddleTruncate>
            </div>
            <CopyButton textToCopy={transaction.hash} className="text-muted-foreground size-fit flex-shrink-0" />
          </div>
        }
      />
      <ItemAttribute
        label="Status"
        description="The status of the transaction"
        render={
          <Badge variant="outline" className="gap-1">
            <CheckCircle className="size-4 text-green-600" strokeWidth={1.5} />
            <span className="text-xs font-medium">Success</span>
          </Badge>
        }
      />
      <ItemAttribute
        label="Block"
        description="The block of the transaction"
        render={
          <Button variant="link" className="size-fit p-0 text-sm font-semibold">
            <Link href={`/blocks/${transaction.block_number}`}>{transaction.block_number}</Link>
          </Button>
        }
      />
      <ItemAttribute
        label="Timestamp"
        description="The timestamp of the transaction"
        render={
          <div className="text-muted-foreground flex items-center space-x-2">
            <Clock4 className="size-4" />
            <div>
              <span>{DateTimeUtil.formatRelativeTime(transaction.block_timestamp * 1000)}</span>
              <span> | </span>
              <span>{format(transaction.block_timestamp * 1000, DATE_TIME_FORMAT.HUMAN_READABLE_WITH_OFFSET)}</span>
            </div>
          </div>
        }
      />
      <Separator />
      <ItemAttribute
        label="From"
        description="The address of the sender"
        render={
          <div className="flex items-center gap-2">
            <span className="w-[335px]">
              <MiddleTruncate end={ADDRESS_END_VISIBLE_CHARS}>{transaction.from_address}</MiddleTruncate>
            </span>
            <CopyButton
              textToCopy={transaction.from_address}
              className="text-muted-foreground size-fit flex-shrink-0"
            />
          </div>
        }
      />
      <ItemAttribute
        label="To"
        description="The address of the recipient"
        render={
          <div className="flex items-center gap-2">
            <span className="w-[335px]">
              <MiddleTruncate end={ADDRESS_END_VISIBLE_CHARS}>{transaction.to_address}</MiddleTruncate>
            </span>
            <CopyButton textToCopy={transaction.to_address} className="text-muted-foreground size-fit flex-shrink-0" />
          </div>
        }
      />
      <ItemAttribute
        label="Value"
        description="The value of the transaction"
        render={
          <div className="flex items-center">
            <span>{transaction.value}</span>
          </div>
        }
      />
    </div>
  ) : null;
};
