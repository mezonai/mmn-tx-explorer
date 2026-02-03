'use client';

import { useCallback } from 'react';
import { P2PHeader } from './p2p-header';
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
import { P2PTabType, TradeTypes } from '../../types';
import { P2P_TAB } from '../../constants';
import { useUpdateQueryParams } from '@/hooks/useUpdateQueryParams';
import { TradeSideSwitch } from '../shared/trade-side-switch';
import { CreateOfferModal } from './create-offer-form/create-offer-modal';
import { Pagination } from '@/components/ui/pagination';
import { AvailableAmountFilter } from './filters/available-amount-filter';
import { SortFilter } from './filters/sort-filter';
import { P2PMobileFilters } from './filters/p2p-mobile-filters';
export const P2P = () => {
  const { page, limit, handleChangePage, handleChangeLimit } = usePaginationQueryParam();
  const { updateParams } = useUpdateQueryParams();
  const { value: tab, handleChangeValue: setTab } = useQueryParam<P2PTabType>({
    queryParam: 'tab',
    defaultValue: P2P_TAB.OFFERS,
    clearParams: ['page', 'min', 'max', 'sort'],
  });
  const { value: min } = useQueryParam<number>({
    queryParam: 'min',
    defaultValue: 0,
  });
  const { value: max } = useQueryParam<number>({
    queryParam: 'max',
    defaultValue: 0,
  });
  const { value: sort, handleChangeValue: setSort } = useQueryParam<string>({
    queryParam: 'sort',
    defaultValue: 'rate_asc',
  });
  const { value: side, handleChangeValue: setSide } = useQueryParam<TradeTypes>({
    queryParam: 'side',
    defaultValue: TradeTypes.BUY,
  });
  const handleFilterChange = useCallback(
    (newMin: number | undefined, newMax: number | undefined) => {
      updateParams({
        min: newMin,
        max: newMax,
        page: page !== 1 ? 1 : undefined,
      });
    },
    [updateParams, page]
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
    side: tab === P2P_TAB.OFFERS ? side : undefined,
  };

  const { data: offers, isLoading } = useP2POffers(apiParams, tab === P2P_TAB.OFFERS);
  const { data: myOffers, isLoading: isMyOffersLoading } = useP2PMyOffers(apiParams, tab === P2P_TAB.MY_OFFERS);
  const { data: myTrading, isLoading: isMyTradingLoading } = useMyOrders(apiParams, tab === P2P_TAB.MY_TRADING);
  const handleTabChange = (value: string) => {
    setTab(value as P2PTabType);
  };

  const getPaginationProps = (data: any, isLoading: boolean) => ({
    page,
    limit,
    totalItems: data?.meta.total_items || 0,
    totalPages: data?.meta.total_pages || 1,
    isLoading,
    onChangePage: handleChangePage,
    onChangeLimit: handleChangeLimit,
  });

  return (
    <div className="w-full space-y-4 md:space-y-6">
      <P2PHeader />

      <div className="flex flex-col gap-4">
        {/* Row 2 Mobile: Switch + New Offer | Row 1 Desktop Left: Switch */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <TradeSideSwitch value={side} onChange={setSide} className="flex-1 md:w-80 md:grow-0" />
            <div className="md:hidden flex items-center gap-2">
              <CreateOfferModal />
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <AvailableAmountFilter onFilterChange={handleFilterChange} />
            <SortFilter value={sort} onChange={handleSortChange} />
          </div>
        </div>

        {/* Row 3 Mobile: Tabs | Row 2 Desktop Left: New Offer + Tabs */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="hidden md:block">
              <CreateOfferModal />
            </div>
            <Tabs
              value={tab}
              onValueChange={(v) => handleTabChange(v as 'offers' | 'my-trading' | 'my-offers')}
              className="flex-1 md:w-auto"
            >
              <TabsList className="w-full md:w-auto justify-start">
                <TabsTrigger value={P2P_TAB.OFFERS} className="flex-1 md:flex-none">
                  Offers
                </TabsTrigger>
                <TabsTrigger value={P2P_TAB.MY_TRADING} className="flex-1 md:flex-none text-xs md:text-sm">
                  My Trading
                </TabsTrigger>
                <TabsTrigger value={P2P_TAB.MY_OFFERS} className="flex-1 md:flex-none">
                  My Offers
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="md:hidden">
              <P2PMobileFilters onFilterChange={handleFilterChange} sortValue={sort} onSortChange={handleSortChange} />
            </div>
          </div>

          <div className="hidden md:block">
            <Pagination
              {...getPaginationProps(
                tab === P2P_TAB.OFFERS ? offers : tab === P2P_TAB.MY_OFFERS ? myOffers : myTrading,
                tab === P2P_TAB.OFFERS ? isLoading : tab === P2P_TAB.MY_OFFERS ? isMyOffersLoading : isMyTradingLoading
              )}
            />
          </div>
        </div>

        {/* Row 4 Mobile: Pagination (Hidden on desktop) */}
        <div className="flex flex-col gap-3 md:hidden">
          <div className="flex justify-center pt-2">
            <div className="scale-90">
              <Pagination
                {...getPaginationProps(
                  tab === P2P_TAB.OFFERS ? offers : tab === P2P_TAB.MY_OFFERS ? myOffers : myTrading,
                  tab === P2P_TAB.OFFERS ? isLoading : tab === P2P_TAB.MY_OFFERS ? isMyOffersLoading : isMyTradingLoading
                )}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        {tab === P2P_TAB.OFFERS && (
          <div className="space-y-6">
            <div className="block lg:hidden">
              {(offers?.data ?? []).map((offer) => (
                <OfferMobileCard key={offer.offer_id} offer={offer} />
              ))}
            </div>
            <div className="hidden lg:block">
              <P2POffersTabs offers={offers?.data ?? []} isLoading={isLoading} />
            </div>
          </div>
        )}

        {tab === P2P_TAB.MY_TRADING && (
          <div className="space-y-6">
            <div className="block lg:hidden">
              {(myTrading?.data ?? []).map((td) => (
                <OrderMobileCard key={td.order_id} order={td} />
              ))}
            </div>
            <div className="hidden lg:block">
              <P2POrdersList orders={myTrading?.data ?? []} isLoading={isMyTradingLoading} />
            </div>
          </div>
        )}

        {tab === P2P_TAB.MY_OFFERS && (
          <div className="space-y-6">
            <div className="block lg:hidden">
              {(myOffers?.data ?? []).map((offer) => (
                <OfferMobileCard key={offer.offer_id} offer={offer} />
              ))}
            </div>
            <div className="hidden lg:block">
              <P2POffersTabs offers={myOffers?.data ?? []} isLoading={isMyOffersLoading} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
