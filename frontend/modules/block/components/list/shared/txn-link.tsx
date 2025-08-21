import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/configs/routes.config';

interface TxnLinkProps {
  count: number;
  blockNumber: number;
}

export const TxnLink = ({ count, blockNumber }: TxnLinkProps) => {
  return (
    <Button variant="link" className="h-fit p-0" asChild>
      <Link href={`${ROUTES.BLOCK.replace(':id', blockNumber.toString())}?tab=txs`}>{count}</Link>
    </Button>
  );
};
