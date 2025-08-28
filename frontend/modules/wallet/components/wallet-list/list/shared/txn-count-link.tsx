import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/configs/routes.config';

interface TxnCountLinkProps {
  address: string;
  accountNonce: number;
  className?: string;
}

interface TxnCountLinkSkeletonProps {
  className?: string;
}

export const TxnCountLink = ({ address, accountNonce, className }: TxnCountLinkProps) => {
  return (
    <Button variant="link" className={`text-brand-secondary-700 size-fit p-0 font-normal ${className}`} asChild>
      <Link href={ROUTES.WALLET(address, 'tab=transactions')}>{accountNonce}</Link>
    </Button>
  );
};

export const TxnCountLinkSkeleton = ({ className }: TxnCountLinkSkeletonProps) => {
  return <Skeleton className={`h-5 w-12 ${className}`} />;
};
