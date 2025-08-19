import { ItemAttribute } from '@/components/shared/item-attribute';
import { Badge } from '@/components/ui/badge';
import { CopyButton } from '@/components/ui/copy-button';
import { Separator } from '@/components/ui/separator';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { CircleCheck, Clock4 } from 'lucide-react';
import Link from 'next/link';

export const TabDetails = () => {
  return (
    <div className="space-y-5">
      <ItemAttribute
        label="Transaction Hash"
        description="The hash of the transaction"
        render={
          <div className="flex items-center">
            <span>0x1234567890</span>
            <CopyButton textToCopy="0x1234567890" />
          </div>
        }
      />
      <ItemAttribute
        label="Status"
        description="The status of the transaction"
        render={
          <Badge variant="outline" className="gap-2">
            <CircleCheck className="text-success-600 size-4" />
            <span className="text-secondary-700">Success</span>
          </Badge>
        }
      />
      <ItemAttribute
        label="Block"
        description="The block of the transaction"
        render={
          <Link className="text-brand-secondary-700 font-semibold" href="/blocks/1234567890">
            1234567890
          </Link>
        }
      />
      <ItemAttribute
        label="Timestamp"
        description="The timestamp of the transaction"
        render={
          <div className="flex items-center space-x-2">
            <Clock4 className="text-foreground-quaternary-400 size-4" />
            <span>{formatRelativeTime(new Date('2025-08-18T20:54:35.000Z'))}</span>
            <span>|</span>
            <span>{formatDate('2025-08-18T20:54:35.000Z')}</span>
          </div>
        }
      />
      <Separator />
      <ItemAttribute
        label="From"
        description="The address of the sender"
        render={
          <div className="flex items-center">
            <span>0x1234567890</span>
            <CopyButton textToCopy="0x1234567890" />
          </div>
        }
      />
      <ItemAttribute
        label="To"
        description="The address of the recipient"
        render={
          <div className="flex items-center">
            <span>0x1234567890</span>
            <CopyButton textToCopy="0x1234567890" />
          </div>
        }
      />
      <ItemAttribute
        label="Value"
        description="The value of the transaction"
        render={
          <div className="flex items-center">
            <span>1234567890</span>
          </div>
        }
      />
    </div>
  );
};
