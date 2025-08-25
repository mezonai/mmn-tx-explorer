import Link from 'next/link';

import { InfoSquare } from '@/assets/icons';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ITransaction } from '@/modules/transaction';

interface MoreInfoButtonProps {
  transaction: ITransaction;
}

export const MoreInfoButton = ({ transaction }: MoreInfoButtonProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <InfoSquare className="text-muted-foreground size-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="max-w-80 space-y-4">
        <h4 className="text-lg font-semibold">Additional info</h4>
        <div className="space-y-1">
          <h5 className="text-sm font-semibold">Others</h5>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between gap-2">
              <p className="text-muted-foreground font-semibold">Txn type</p>
              <p className="text-end font-normal">{transaction.transaction_type}</p>
            </div>
            <div className="flex justify-between gap-2">
              <p className="text-muted-foreground font-semibold">Nonce</p>
              <p className="text-end font-normal">{transaction.nonce}</p>
            </div>
          </div>
        </div>
        <Button variant="link" className="p-0 text-sm font-semibold">
          <Link href={`/transaction/${transaction.hash}`}>More details</Link>
        </Button>
      </PopoverContent>
    </Popover>
  );
};
