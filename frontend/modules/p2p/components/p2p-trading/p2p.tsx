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
import { P2PTabType, TradeTypes, P2POffer } from '../../types';
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
  const { value: tab, handleChangeValue: setTab } = useQueryParam<P2PTabType>({
    queryParam: 'tab',
    defaultValue: P2P_TAB.OFFERS,
    clearParams: ['page', 'min', 'max', 'sort'],
  });
  const joinedRef = useRef(false);
  const joiningRef = useRef(false);
  const intervalRef = useRef<number | null>(null);
  const [cancelingOfferId, setCancelingOfferId] = useState<string | null>(null);

  const handleCancelStart = useCallback((offerId: string) => {
    setCancelingOfferId(offerId);
  }, []);

  useEffect(() => {
    const clearJoinInterval = () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const markJoined = () => {
      joinedRef.current = true;
      joiningRef.current = false;
      clearJoinInterval();
    };

    const markLeft = () => {
      joinedRef.current = false;
      joiningRef.current = false;
    };

    const parseRoomEvent = (evt: unknown): { type: string; room: string } | null => {
      if (typeof evt === 'string') {
        const [type, r] = evt.split(':');
        if (type && r) {
          return { type, room: r };
        }
        return null;
      }

      if (evt && typeof evt === 'object') {
        const e = evt as Record<string, unknown>;
        if (typeof e.type === 'string' && typeof e.room === 'string') {
          return { type: e.type, room: e.room };
        }
      }

      return null;
    };

    const serverHandler = (evt: unknown) => {
      const parsed = parseRoomEvent(evt);
      if (!parsed || parsed.room !== SOCKET_MESSAGE.ROOM_OFFER_UPDATES) return;

      switch (parsed.type) {
        case SOCKET_MESSAGE.SERVER_JOINED_ROOM_PREFIX:
          markJoined();
          break;
        case SOCKET_MESSAGE.SERVER_LEFT_ROOM_PREFIX:
          markLeft();
          break;
      }
    };

    const doJoin = () => {
      if (!wsManager) return;
      if (joinedRef.current || joiningRef.current) return;
      if (!wsManager.isConnected()) return;

      const ok = wsManager.sendRaw(
        JSON.stringify({ type: SOCKET_MESSAGE.MSG_JOIN_ROOM, room: SOCKET_MESSAGE.ROOM_OFFER_UPDATES })
      );

      if (ok) {
        joiningRef.current = true;
      }
    };

    const doLeave = () => {
      if (!wsManager) return;
      if (!joinedRef.current && !joiningRef.current) return;
      wsManager.sendRaw(
        JSON.stringify({ type: SOCKET_MESSAGE.MSG_LEAVE_ROOM, room: SOCKET_MESSAGE.ROOM_OFFER_UPDATES })
      );

      markLeft();
    };

    wsManager?.on(SOCKET_MESSAGE.ROOM_OFFER_UPDATES, serverHandler);

    if (tab === P2P_TAB.OFFERS) {
      doJoin();
      if (!joinedRef.current && intervalRef.current === null) {
        intervalRef.current = window.setInterval(doJoin, 500);
      }
    } else {
      doLeave();
    }
    return () => {
      clearJoinInterval();
      doLeave();
      wsManager?.off(SOCKET_MESSAGE.ROOM_OFFER_UPDATES, serverHandler);
    };
  }, [wsManager, tab]);

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
    side: side,
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
  const handleTabChange = (value: string) => {
    setTab(value as P2PTabType);
  };

  const handleSideChange = (newSide: TradeTypes) => {
    setSide(newSide);
    if (tab !== P2P_TAB.OFFERS) {
      setTab(P2P_TAB.OFFERS);
    }
  };

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
        {/* Row 2 Mobile: Switch + New Offer | Row 1 Desktop Left: New Offer */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <CreateOfferModal />
          </div>

          <div className="hidden md:flex items-center gap-3">
            <AvailableAmountFilter onFilterChange={handleFilterChange} />
            <SortFilter value={sort} onChange={handleSortChange} />
          </div>
        </div>

        {/* Row 3 Mobile: Tabs | Row 2 Desktop Left: Switch + Tabs */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-2 w-full md:w-auto">
            <TradeSideSwitch value={side} onChange={handleSideChange} className="w-full md:w-60" />
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Tabs
                value={tab}
                onValueChange={(v) => handleTabChange(v as 'offers' | 'my-trading' | 'my-offers')}
                className="flex-1 md:w-auto"
              >
                <TabsList className="w-full md:w-auto justify-start">
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
          </div>

          <div className="hidden md:block">
            <Pagination
              {...getPaginationProps(
                tab === P2P_TAB.OFFERS ? offers : tab === P2P_TAB.MY_OFFERS ? myOffers : myTrading,
                tab === P2P_TAB.OFFERS ? isLoading : tab === P2P_TAB.MY_OFFERS ? isMyOffersLoading : isMyTradingLoading
              )}
            />
          </div>
        </div >

        {/* Row 4 Mobile: Pagination (Hidden on desktop) */}
        < div className="flex flex-col gap-3 md:hidden" >
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
        </div >
      </div >

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
