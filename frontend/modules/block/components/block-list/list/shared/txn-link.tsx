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
    <Button variant="link" className="text-brand-primary size-fit p-0 font-normal" asChild>
      <Link href={ROUTES.BLOCK(blockNumber)}>{count}</Link>
    </Button>
  );
};

export const TxnLinkSkeleton = () => {
  return <Skeleton className="h-5 w-12" />;
};
