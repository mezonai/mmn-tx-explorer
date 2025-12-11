'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { APP_CONFIG } from '@/configs/app.config';
import { Pagination } from '@/components/ui/pagination';
import { CreateOfferModal } from './create-offer-modal';
import { CreateOfferRequest } from '../types'; 

interface P2PFiltersComponentProps {
  totalItems: number | undefined;
  totalPages: number | undefined;
  isLoading?: boolean | undefined;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onFilterChange: (min: number | undefined, max: number | undefined) => void;
  onOfferCreate?: (data: CreateOfferRequest) => void;
}

export const P2PFiltersComponent = ({
  totalItems = 0,
  totalPages = 1,
  isLoading = false,
  page,
  limit,
  onPageChange,
  onLimitChange,
  onFilterChange,
  onOfferCreate,
}: P2PFiltersComponentProps) => {
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');

  useEffect(() => {
    const timer = setTimeout(() => {
      const minVal = minAmount ? Number(minAmount) : undefined;
      const maxVal = maxAmount ? Number(maxAmount) : undefined;
      onFilterChange(minVal, maxVal);
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minAmount, maxAmount]);

  return (
    <div className="flex w-full flex-col gap-4 py-2 md:flex-row md:items-center md:justify-between">
      <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
        <CreateOfferModal onSubmit={onOfferCreate} />

        <div className="bg-background border-input ring-offset-background focus-within:ring-brand-primary flex h-10 w-full items-center rounded-lg border shadow-sm focus-within:ring-1 md:w-auto">
          <div className="bg-muted/50 text-brand-primary flex h-full items-center border-r px-3 text-[10px] font-bold tracking-wider uppercase select-none">
            Available amount
          </div>

          {/* Min Input */}
          <div className="relative flex flex-1 items-center md:w-32">
            <Input
              type="text"
              placeholder="Min"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="border-0 bg-transparent pr-9 pl-3 text-sm shadow-none focus-visible:ring-0"
            />
            <span className="text-muted-foreground pointer-events-none absolute right-3 text-[12px] font-bold">
              {APP_CONFIG.CHAIN_SYMBOL}
            </span>
          </div>

          <span className="text-muted-foreground px-1">-</span>

          {/* Max Input */}
          <div className="relative flex flex-1 items-center md:w-32">
            <Input
              type="text"
              placeholder="Max"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              className="border-0 bg-transparent pr-9 pl-3 text-sm shadow-none focus-visible:ring-0"
            />
            <span className="text-muted-foreground pointer-events-none absolute right-3 text-[12px] font-bold">
              {APP_CONFIG.CHAIN_SYMBOL}
            </span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 justify-center md:justify-end">
        <div className="scale-90 md:scale-100">
          <Pagination
            page={page}
            limit={limit}
            totalItems={totalItems}
            totalPages={totalPages}
            isLoading={isLoading}
            onChangePage={onPageChange}
            onChangeLimit={onLimitChange}
          />
        </div>
      </div>
    </div>
  );
};