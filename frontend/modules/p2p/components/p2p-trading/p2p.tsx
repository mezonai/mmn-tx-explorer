// app/p2p/page.tsx
'use client';

import { useState, useCallback } from 'react';
import { P2PHeader } from './p2p-header';
import { P2PFiltersComponent } from './p2p-filters';
import { useP2POffers } from '../../hooks/useP2POffers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { P2POffersTabs } from './p2p-tabs-offers';
import { usePaginationQueryParam } from '@/hooks/usePaginationQueryParam';

export const P2P = () => {
  const { page, limit, handleChangePage, handleChangeLimit } = usePaginationQueryParam();

  const [filters, setFilters] = useState<{ min?: number; max?: number }>({});

  const handleFilterChange = useCallback(
    (min: number | undefined, max: number | undefined) => {
      setFilters((prev) => {
        if (prev.min !== min || prev.max !== max) {
          if (page !== 1) {
            handleChangePage(1);
          }
          return { min, max };
        }
        return prev;
      });
    },
    [page, handleChangePage]
  );

  const { data: offers, isLoading } = useP2POffers({
    page: page - 1,
    limit,
    from_amount: filters.min,
    to_amount: filters.max,
  });

  return (
    <div className="w-full space-y-6">
      <P2PHeader />

      <Tabs defaultValue="offers" className="w-full">
        <TabsList>
          <TabsTrigger value="offers">Offers</TabsTrigger>
          <TabsTrigger value="orders">My Orders</TabsTrigger>
          <TabsTrigger value="my-offers">My Offers</TabsTrigger>
        </TabsList>

        <TabsContent value="offers" className="space-y-6">
          <P2PFiltersComponent
            totalItems={offers?.meta.total_items}
            totalPages={offers?.meta.total_pages}
            isLoading={isLoading}
            page={page}
            limit={limit}
            onPageChange={handleChangePage}
            onLimitChange={handleChangeLimit}
            // Truyền Callback xử lý filter
            onFilterChange={handleFilterChange}
          />
          <P2POffersTabs offers={offers?.data} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
