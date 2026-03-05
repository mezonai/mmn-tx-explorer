'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useWebSocket } from '@/lib/websocket/useWebSocket';
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
import { IPaginatedResponse } from '@/types';
import { P2PTabType, TradeTypes } from '../../types';
import { P2P_TAB } from '../../constants';
import { useUpdateQueryParams } from '@/hooks/useUpdateQueryParams';
import { TradeSideSwitch } from '../shared/trade-side-switch';
import { CreateOfferModal } from './create-offer-form/create-offer-modal';
import { Pagination } from '@/components/ui/pagination';
import { AvailableAmountFilter } from './filters/available-amount-filter';
import { SortFilter } from './filters/sort-filter';
import { P2PMobileFilters } from './filters/p2p-mobile-filters';
import { SOCKET_MESSAGE } from '@/lib/websocket/constants';

export const P2P = () => {
  const wsManager = useWebSocket();
  const { page, limit, handleChangePage, handleChangeLimit } = usePaginationQueryParam();
  const { updateParams } = useUpdateQueryParams();

  const { value: tab } = useQueryParam<P2PTabType>({
    queryParam: 'tab',
    defaultValue: P2P_TAB.OFFERS,
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

  const { value: side } = useQueryParam<TradeTypes>({
    queryParam: 'side',
    defaultValue: TradeTypes.BUY,
  });

  /**
   * ==========================================
   * ✅ SAFE AUTO RESET PAGE WHEN FILTER CHANGE
   * ==========================================
   */
  const prevFilterRef = useRef({
    tab,
    side,
    min,
    max,
    sort,
  });

  useEffect(() => {
    const prev = prevFilterRef.current;

    const filterChanged =
      prev.tab !== tab || prev.side !== side || prev.min !== min || prev.max !== max || prev.sort !== sort;

    if (filterChanged && page !== 1) {
      handleChangePage(1);
    }

    prevFilterRef.current = { tab, side, min, max, sort };
  }, [tab, side, min, max, sort, page, handleChangePage]);

  /**
   * ==========================================
   * FILTER HANDLERS (NO PAGE RESET HERE)
   * ==========================================
   */

  const handleFilterChange = useCallback(
    (newMin?: number, newMax?: number) => {
      updateParams({
        min: newMin,
        max: newMax,
      });
    },
    [updateParams]
  );

  const handleSortChange = useCallback(
    (value: string) => {
      setSort(value);
    },
    [setSort]
  );

  const handleTabChange = (value: string) => {
    if (value !== tab) {
      updateParams({
        tab: value,
        min: undefined,
        max: undefined,
        sort: undefined,
      });
    }
  };

  const handleSideChange = (newSide: TradeTypes) => {
    if (tab !== P2P_TAB.OFFERS) {
      updateParams({
        side: newSide,
        tab: P2P_TAB.OFFERS,
        min: undefined,
        max: undefined,
        sort: undefined,
      });
    } else {
      updateParams({ side: newSide });
    }
  };

  const apiParams = {
    page: page - 1,
    limit,
    from_amount: min || undefined,
    to_amount: max || undefined,
    order_by: sort?.includes('rate') ? 'price_rate' : undefined,
    order: sort?.includes('desc') ? 'desc' : 'asc',
    side,
  };

  const offersApiParams = {
    ...apiParams,
    side: side === TradeTypes.BUY ? TradeTypes.SELL : TradeTypes.BUY,
  };

  const { data: offers, isLoading } = useP2POffers(offersApiParams, tab === P2P_TAB.OFFERS);
  const { data: myOffers, isLoading: isMyOffersLoading } = useP2PMyOffers(
    { ...apiParams, side: undefined },
    tab === P2P_TAB.MY_OFFERS
  );
  const { data: myTrading, isLoading: isMyTradingLoading } = useMyOrders(
    { ...apiParams, side: undefined },
    tab === P2P_TAB.MY_TRADING
  );

  const getPaginationProps = (data: IPaginatedResponse<any> | undefined, isLoading: boolean) => ({
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
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CreateOfferModal />

          <div className="hidden items-center gap-3 md:flex">
            <AvailableAmountFilter onFilterChange={handleFilterChange} />
            <SortFilter value={sort} onChange={handleSortChange} />
          </div>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center md:gap-2">
            <TradeSideSwitch value={side} onChange={handleSideChange} className="w-full md:w-60" />

            <Tabs value={tab} onValueChange={handleTabChange}>
              <TabsList>
                <TabsTrigger value={P2P_TAB.MY_TRADING}>My Trading</TabsTrigger>
                <TabsTrigger value={P2P_TAB.MY_OFFERS}>My Offers</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Pagination
            {...getPaginationProps(
              tab === P2P_TAB.OFFERS ? offers : tab === P2P_TAB.MY_OFFERS ? myOffers : myTrading,
              tab === P2P_TAB.OFFERS ? isLoading : tab === P2P_TAB.MY_OFFERS ? isMyOffersLoading : isMyTradingLoading
            )}
          />
        </div>
      </div>

      <div className="mt-4">
        {tab === P2P_TAB.OFFERS && <P2POffersTabs offers={offers?.data ?? []} isLoading={isLoading} />}

        {tab === P2P_TAB.MY_TRADING && <P2POrdersList orders={myTrading?.data ?? []} isLoading={isMyTradingLoading} />}

        {tab === P2P_TAB.MY_OFFERS && (
          <P2POffersTabs offers={myOffers?.data ?? []} isLoading={isMyOffersLoading} isMyOffer />
        )}
      </div>
    </div>
  );
};
