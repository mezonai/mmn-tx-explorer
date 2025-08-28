'use client';

import { ArrowDown, ArrowNarrowRight } from '@/assets/icons';
import { AddressDisplay } from '@/components/shared';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/configs/routes.config';

interface FromToAddressesProps {
  fromAddress: string;
  toAddress: string;
  orientation?: 'horizontal' | 'vertical';
}

interface FromToAddressesSkeletonProps {
  orientation?: 'horizontal' | 'vertical';
}

export const FromToAddresses = ({ fromAddress, toAddress, orientation = 'horizontal' }: FromToAddressesProps) => {
  const isVertical = orientation === 'vertical';

  return (
    <div className="flex w-full items-center gap-2">
      <div className={isVertical ? 'block' : 'hidden'}>
        <ArrowDown className="text-foreground-quaternary-400 size-4" />
      </div>
      <div className={`flex flex-1 gap-3 ${isVertical ? 'flex-col' : 'flex-row justify-between'}`}>
        <AddressDisplay address={fromAddress} href={ROUTES.WALLET(fromAddress)} />
        <div className={`flex items-center justify-center ${isVertical ? 'hidden' : 'block'}`}>
          <ArrowNarrowRight className="text-foreground-quaternary-400 size-4" />
        </div>
        <AddressDisplay address={toAddress} href={ROUTES.WALLET(toAddress)} />
      </div>
    </div>
  );
};

export const FromToAddressesSkeleton = ({ orientation = 'horizontal' }: FromToAddressesSkeletonProps) => {
  const isVertical = orientation === 'vertical';

  return (
    <div className="flex w-full items-center gap-2">
      <div className={isVertical ? 'block' : 'hidden'}>
        <Skeleton className="size-5" />
      </div>
      <div className={`flex flex-1 gap-3 ${isVertical ? 'flex-col' : 'flex-row justify-between'}`}>
        <div className="flex w-30 items-center gap-2">
          <Skeleton className="h-6 flex-1" />
          <Skeleton className="size-5" />
        </div>
        <div className={`flex items-center justify-center ${isVertical ? 'hidden' : 'block'}`}>
          <Skeleton className="size-5" />
        </div>
        <div className="flex w-30 items-center gap-2">
          <Skeleton className="h-6 flex-1" />
          <Skeleton className="size-5" />
        </div>
      </div>
    </div>
  );
};
