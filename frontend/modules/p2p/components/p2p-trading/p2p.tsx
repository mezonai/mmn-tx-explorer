'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useWebSocket } from '@/lib/websocket/useWebSocket';
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
import { P2PTabType, P2POffer } from '../../types';
import { P2P_TAB } from '../../constants';
import { useUpdateQueryParams } from '@/hooks/useUpdateQueryParams';
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
  };

  const { data: offers, isLoading, isWsRefreshing } = useP2POffers(apiParams, tab === P2P_TAB.OFFERS);
  const { data: myOffers, isLoading: isMyOffersLoading } = useP2PMyOffers(apiParams, tab === P2P_TAB.MY_OFFERS);
  const { data: myTrading, isLoading: isMyTradingLoading } = useMyOrders(apiParams, tab === P2P_TAB.MY_TRADING);

  const handleTabChange = (value: string) => {
    setTab(value as P2PTabType);
  };
  return (
    <div className="w-full space-y-6">
      <P2PHeader />

      <Tabs
        value={tab}
        onValueChange={(v) => handleTabChange(v as 'offers' | 'my-trading' | 'my-offers')}
        className="w-full"
      >
        <TabsList>
          <TabsTrigger value={P2P_TAB.OFFERS}>Offers</TabsTrigger>
          <TabsTrigger value={P2P_TAB.MY_TRADING}>My Trading</TabsTrigger>
          <TabsTrigger value={P2P_TAB.MY_OFFERS}>My Offers</TabsTrigger>
        </TabsList>

        <TabsContent value={P2P_TAB.OFFERS} className="space-y-6">
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
            {(offers?.data ?? []).map((offer: P2POffer) => (
              <OfferMobileCard key={offer.offer_id} offer={offer} />
            ))}
          </div>
          <div className="hidden lg:block">
            <P2POffersTabs offers={offers?.data ?? []} isLoading={isLoading} isRefreshing={isWsRefreshing} />
          </div>
        </TabsContent>

        <TabsContent value={P2P_TAB.MY_TRADING} className="space-y-6">
          <P2PFiltersComponent
            totalItems={myTrading?.meta.total_items}
            totalPages={myTrading?.meta.total_pages}
            isLoading={isMyTradingLoading}
            page={page}
            limit={limit}
            onPageChange={handleChangePage}
            onLimitChange={handleChangeLimit}
            onFilterChange={handleFilterChange}
          />

          <div className="block lg:hidden">
            {(myTrading?.data ?? []).map((td) => (
              <OrderMobileCard key={td.order_id} order={td} />
            ))}
          </div>
          <div className="hidden lg:block">
            <P2POrdersList orders={myTrading?.data ?? []} isLoading={isMyTradingLoading} />
          </div>
        </TabsContent>

        <TabsContent value={P2P_TAB.MY_OFFERS} className="space-y-6">
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
            <P2POffersTabs
              offers={myOffers?.data ?? []}
              isLoading={isMyOffersLoading}
              onCancelStart={handleCancelStart}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
