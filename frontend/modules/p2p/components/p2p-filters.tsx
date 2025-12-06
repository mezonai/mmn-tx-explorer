'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { P2PFilters } from '../types/p2p.types';
import { Plus } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import { APP_CONFIG } from '@/configs/app.config';

interface P2PFiltersProps {
  filters?: P2PFilters;
  onFiltersChange?: (filters: P2PFilters) => void;
  onNewOfferClick?: () => void;
}

export const P2PFiltersComponent = ({ filters, onFiltersChange, onNewOfferClick }: P2PFiltersProps) => {
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');

  return (
    <div className="flex w-full flex-col gap-4 py-2 md:flex-row md:items-center md:justify-between">
      <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
        <Button
          onClick={onNewOfferClick}
          className="bg-brand-primary hover:bg-brand-primary/90 h-10 w-full shrink-0 rounded-lg font-bold text-white shadow-sm transition-all md:w-auto md:px-5"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Offer
        </Button>

        <div className="bg-background border-input ring-offset-background focus-within:ring-brand-primary flex h-10 w-full items-center rounded-lg border shadow-sm focus-within:ring-1 md:w-auto">
          <div className="bg-muted/50 text-brand-primary flex h-full items-center border-r px-3 text-[10px] font-bold tracking-wider uppercase select-none">
            total amount
          </div>

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
          <Pagination limit={1} />
        </div>
      </div>
    </div>
  );
};
