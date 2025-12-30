'use client';

import { useCallback } from 'react';
import { P2PHeader } from './p2p-header';
import { P2PFiltersComponent } from './p2p-filters';
import { useP2POffers } from '../../hooks/useP2POffers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { P2POffersTabs } from './p2p-offers-list';
import { usePaginationQueryParam } from '@/hooks/usePaginationQueryParam';
import { useP2PMyOffers } from '../../hooks/useP2PMyOffers';
import { useMyOrders } from '../../hooks/useMyOrders';
import { P2POrdersList } from './p2p-orders-list';
import { OrderMobileCard } from './mobile/order-card';
import OfferMobileCard from './mobile/offer-card';
import { useQueryParam } from '@/hooks';
import { P2PTabType } from '../../types';
import { P2P_TAB } from '../../constants';
export const P2P = () => {
  const { page, limit, handleChangePage, handleChangeLimit } = usePaginationQueryParam();
  const { value: tab, handleChangeValue: setTab } = useQueryParam<P2PTabType>({
    queryParam: 'tab',
    defaultValue: P2P_TAB.OFFERS,
    clearParams: ['page', 'min', 'max', 'sort'],
  });
  const { value: min, handleChangeValue: setMin } = useQueryParam<number>({
    queryParam: 'min',
    defaultValue: 0,
  });
  const { value: max, handleChangeValue: setMax } = useQueryParam<number>({
    queryParam: 'max',
    defaultValue: 0,
  });
  const { value: sort, handleChangeValue: setSort } = useQueryParam<string>({
    queryParam: 'sort',
    defaultValue: 'rate_asc',
  });
  const handleFilterChange = useCallback(
    (newMin: number | undefined, newMax: number | undefined) => {
      if (newMin !== undefined) setMin(newMin);
      if (newMax !== undefined) setMax(newMax);

      if (page !== 1) {
        handleChangePage(1);
      }
    },
    [page, handleChangePage, setMin, setMax]
  );
  const handleSortChange = useCallback(
    (value: string) => {
      setSort(value);
      if (page !== 1) {
        handleChangePage(1);
      }
    },
    [setSort, page, handleChangePage]
  );
  const apiParams = {
    page: page - 1,
    limit,
    from_amount: min || undefined,
    to_amount: max || undefined,
    order_by: sort?.includes('rate') ? 'price_rate' : undefined,
    order: sort?.includes('desc') ? 'desc' : 'asc',
  };

  const { data: offers, isLoading } = useP2POffers(apiParams, tab === P2P_TAB.OFFERS);
  const { data: myOffers, isLoading: isMyOffersLoading } = useP2PMyOffers(apiParams, tab === P2P_TAB.MY_OFFERS);
  const { data: myOrders, isLoading: isMyOrdersLoading } = useMyOrders(apiParams, tab === P2P_TAB.ORDERS);
  const handleTabChange = (value: string) => {
    setTab(value as P2PTabType);
  };
  return (
    <div className="w-full space-y-6">
      <P2PHeader />

      <Tabs
        value={tab}
        onValueChange={(v) => handleTabChange(v as 'offers' | 'orders' | 'my-offers')}
        className="w-full"
      >
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
            onFilterChange={handleFilterChange}
            showSort={true}
            sortValue={sort}
            onSortChange={handleSortChange}
          />

          <div className="block lg:hidden">
            {(offers?.data ?? []).map((offer) => (
              <OfferMobileCard key={offer.offer_id} offer={offer} />
            ))}
          </div>
          <div className="hidden lg:block">
            <P2POffersTabs offers={offers?.data ?? []} isLoading={isLoading} />
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <P2PFiltersComponent
            totalItems={myOrders?.meta.total_items}
            totalPages={myOrders?.meta.total_pages}
            isLoading={isMyOrdersLoading}
            page={page}
            limit={limit}
            onPageChange={handleChangePage}
            onLimitChange={handleChangeLimit}
            onFilterChange={handleFilterChange}
          />

          <div className="block lg:hidden">
            {(myOrders?.data ?? []).map((order) => (
              <OrderMobileCard key={order.order_id} order={order} />
            ))}
          </div>
          <div className="hidden lg:block">
            <P2POrdersList orders={myOrders?.data ?? []} isLoading={isMyOrdersLoading} />
          </div>
        </TabsContent>

        <TabsContent value="my-offers" className="space-y-6">
          <P2PFiltersComponent
            totalItems={myOffers?.meta.total_items}
            totalPages={myOffers?.meta.total_pages}
            isLoading={isMyOffersLoading}
            page={page}
            limit={limit}
            onPageChange={handleChangePage}
            onLimitChange={handleChangeLimit}
            onFilterChange={handleFilterChange}
          />
          <div className="block lg:hidden">
            {(myOffers?.data ?? []).map((offer) => (
              <OfferMobileCard key={offer.offer_id} offer={offer} />
            ))}
          </div>
          <div className="hidden lg:block">
            <P2POffersTabs offers={myOffers?.data ?? []} isLoading={isMyOffersLoading} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
