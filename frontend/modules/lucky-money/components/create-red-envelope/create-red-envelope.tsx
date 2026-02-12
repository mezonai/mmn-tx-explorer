'use client';

import { BreadcrumbNavigation, PageHeader } from '@/components/shared';
import { RedEnvelopeForm } from './red-envelope-form/red-envelope-form';
import { IBreadcrumb } from '@/types';
import { ROUTES } from '@/configs/routes.config';
import { RedEnvelopeSidebar } from './red-envelope-sidebar';
import { CreateRedEnvelopeProvider, useCreateRedEnvelopeContext } from '../../context/CreateRedEnvelopeContext';
import { useWebSocket } from '@/lib/websocket';
import type { WebSocketEvent } from '@/lib/websocket/websocket-manager';
import { SOCKET_MESSAGE } from '@/lib/websocket/constants';
import { RED_ENVELOPE_EVENT_TYPES } from '../../constants';
import { useEffect, useRef } from 'react';

const breadcrumbs: IBreadcrumb[] = [
  { label: 'Lucky Money', href: ROUTES.LUCKY_MONEY },
  { label: 'Create Lucky Money', href: '#' },
] as const;

function CreateRedEnvelopeContent() {
  const wsManager = useWebSocket();
  const { onRedEnvelopeStatusUpdated } = useCreateRedEnvelopeContext();
  const joinedRef = useRef(false);
  const joiningRef = useRef(false);
  const intervalRef = useRef<number | null>(null);

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
      if (!parsed || parsed.room !== SOCKET_MESSAGE.ROOM_RED_ENVELOPE_UPDATES) {
        return;
      }

      switch (parsed.type) {
        case SOCKET_MESSAGE.SERVER_JOINED_ROOM_PREFIX:
          markJoined();
          break;
        case SOCKET_MESSAGE.SERVER_LEFT_ROOM_PREFIX:
          markLeft();
          break;
      }
    };

    const handleRedEnvelopeListRefresh = (event: WebSocketEvent) => {
      const payload = event.payload;
      if (payload && typeof payload === 'object') {
        const data = payload as Record<string, unknown>;
        const redEnvelopeId = (data as { red_envelope_id?: unknown }).red_envelope_id;
        if (typeof redEnvelopeId === 'string' && redEnvelopeId) {
          onRedEnvelopeStatusUpdated(redEnvelopeId);
        } else {
          console.error('[LuckyMoney][WS] Invalid red_envelope_id in payload:', redEnvelopeId);
        }
      } else {
        console.error('[LuckyMoney][WS] RED_ENVELOPE_LIST_REFRESH payload is not an object');
      }
    };

    const doJoin = () => {
      if (!wsManager) return;
      if (joinedRef.current || joiningRef.current) return;
      if (!wsManager.isConnected()) return;

      const ok = wsManager.sendRaw(
        JSON.stringify({
          type: SOCKET_MESSAGE.MSG_JOIN_ROOM,
          room: SOCKET_MESSAGE.ROOM_RED_ENVELOPE_UPDATES,
        })
      );

      if (ok) {
        joiningRef.current = true;
      }
    };

    const doLeave = () => {
      if (!wsManager) return;
      if (!joinedRef.current && !joiningRef.current) return;
      wsManager.sendRaw(
        JSON.stringify({
          type: SOCKET_MESSAGE.MSG_LEAVE_ROOM,
          room: SOCKET_MESSAGE.ROOM_RED_ENVELOPE_UPDATES,
        })
      );

      markLeft();
    };

    wsManager?.on(SOCKET_MESSAGE.ROOM_RED_ENVELOPE_UPDATES, serverHandler);
    wsManager?.on(RED_ENVELOPE_EVENT_TYPES.RED_ENVELOPE_LIST_REFRESH, handleRedEnvelopeListRefresh);

    // Join room when component mounts
    doJoin();
    if (!joinedRef.current && intervalRef.current === null) {
      intervalRef.current = window.setInterval(doJoin, 500);
    }

    return () => {
      clearJoinInterval();
      doLeave();
      wsManager?.off(SOCKET_MESSAGE.ROOM_RED_ENVELOPE_UPDATES, serverHandler);
      wsManager?.off(RED_ENVELOPE_EVENT_TYPES.RED_ENVELOPE_LIST_REFRESH, handleRedEnvelopeListRefresh);
    };
  }, [wsManager, onRedEnvelopeStatusUpdated]);

  return (
    <div className="container mx-auto max-w-7xl space-y-8 px-3 pb-8 sm:space-y-12 sm:px-4 sm:pb-12 md:space-y-16">
      <div className="space-y-4 sm:space-y-6 md:space-y-8">
        <div className="space-y-2 sm:space-y-4">
          <BreadcrumbNavigation breadcrumbs={breadcrumbs} />
        </div>
        <div className="flex flex-col items-start justify-between gap-3 sm:gap-4 md:flex-row md:items-center">
          <PageHeader
            title="Lucky Money"
            header="Create Lucky Money drops with QR codes and lucky messages."
            description="Launch Lucky Money drops with custom rules, quick QR claims, and tight expiry controls."
          />
        </div>
      </div>
      <section className="grid gap-6 sm:gap-8 md:gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <RedEnvelopeForm />
        <RedEnvelopeSidebar />
      </section>
    </div>
  );
}

export function CreateLuckyMoney() {
  return (
    <CreateRedEnvelopeProvider>
      <CreateRedEnvelopeContent />
    </CreateRedEnvelopeProvider>
  );
}
