import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/configs/routes.config';

interface TxnLinkProps {
  count: number;
  blockNumber: number;
}

export const TxnLink = ({ count, blockNumber }: TxnLinkProps) => {
  return (
    <Button variant="link" className="text-brand-secondary-700 size-fit p-0 font-normal" asChild>
      <Link href={ROUTES.BLOCK(blockNumber, 'tab=transactions')}>{count}</Link>
    </Button>
  );
};

export const TxnLinkSkeleton = () => {
  return <Skeleton className="h-5 w-12" />;
};
