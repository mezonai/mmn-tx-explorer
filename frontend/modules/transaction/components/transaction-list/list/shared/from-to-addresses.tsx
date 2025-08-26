'use client';

import { ArrowDown, ArrowNarrowRight } from '@/assets/icons';
import { AddressDisplay } from '@/components/shared';
import { Skeleton } from '@/components/ui/skeleton';

interface FromToAddressesProps {
  fromAddress: string;
  toAddress: string;
}

export const FromToAddresses = ({ fromAddress, toAddress }: FromToAddressesProps) => {
  return (
    <div className="flex w-full items-center gap-2 xl:w-auto">
      <div className="hidden lg:block">
        <ArrowDown className="text-muted-foreground size-4" />
      </div>
      <div className="flex flex-1 flex-row justify-between gap-3 lg:flex-col">
        <AddressDisplay address={fromAddress} />
        <div className="flex items-center justify-center lg:hidden">
          <ArrowNarrowRight className="text-muted-foreground size-4" />
        </div>
        <AddressDisplay address={toAddress} />
      </div>
    </div>
  );
};

export const FromToAddressesSkeleton = () => {
  return (
    <div className="flex w-full items-center gap-2 xl:w-auto">
      <div className="hidden lg:block">
        <Skeleton className="size-4" />
      </div>
      <div className="flex flex-1 flex-row justify-between gap-3 lg:flex-col">
        <Skeleton className="h-6 w-28" />
        <div className="flex items-center justify-center lg:hidden">
          <Skeleton className="size-4" />
        </div>
        <Skeleton className="h-6 w-28" />
      </div>
    </div>
  );
};
