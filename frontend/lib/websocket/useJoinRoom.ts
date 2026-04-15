import { useEffect, useRef } from 'react';
import { useWebSocket } from './useWebSocket';
import { SOCKET_MESSAGE } from './constants';

export const useJoinRoom = (roomId: string, shouldJoin: boolean = true) => {
  const wsManager = useWebSocket();
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
      try {
        if (typeof evt === 'string') {
          const [type, r] = evt.split(':');
          if (type && r) {
            return { type, room: r };
          }
          console.warn(`[useJoinRoom][WS] Invalid string event format:`, evt);
          return null;
        }

        if (evt && typeof evt === 'object') {
          const e = evt as Record<string, unknown>;
          if (typeof e.type === 'string' && typeof e.room === 'string') {
            return { type: e.type, room: e.room };
          }
          console.warn(`[useJoinRoom][WS] Invalid object event format:`, evt);
        }

        return null;
      } catch (error) {
        console.error(`[useJoinRoom][WS] Error parsing room event:`, error);
        return null;
      }
    };

    const serverHandler = (evt: unknown) => {
      try {
        const parsed = parseRoomEvent(evt);
        if (!parsed || parsed.room !== roomId) return;

        switch (parsed.type) {
          case SOCKET_MESSAGE.SERVER_JOINED_ROOM_PREFIX:
            markJoined();
            break;
          case SOCKET_MESSAGE.SERVER_LEFT_ROOM_PREFIX:
            markLeft();
            break;
          default:
            console.warn(`[useJoinRoom][WS] Unhandled room event type "${parsed.type}" for room: ${roomId}`);
            break;
        }
      } catch (error) {
        console.error(`[useJoinRoom][WS] Error in server handler for room ${roomId}:`, error);
      }
    };

    const doJoin = () => {
      if (!wsManager) return;
      if (joinedRef.current || joiningRef.current) return;
      if (!wsManager.isConnected()) return;

      try {
        const ok = wsManager.sendRaw(JSON.stringify({ type: SOCKET_MESSAGE.MSG_JOIN_ROOM, room: roomId }));

        if (ok) {
          joiningRef.current = true;
        } else {
          console.error(`[useJoinRoom][WS] Failed to send join room message for room: ${roomId}`);
        }
      } catch (error) {
        console.error(`[useJoinRoom][WS] Error sending join room message for ${roomId}:`, error);
      }
    };

    const doLeave = () => {
      if (!wsManager) return;
      if (!joinedRef.current && !joiningRef.current) return;

      try {
        const ok = wsManager.sendRaw(JSON.stringify({ type: SOCKET_MESSAGE.MSG_LEAVE_ROOM, room: roomId }));

        if (!ok) {
          console.error(`[useJoinRoom][WS] Failed to send leave room message for room: ${roomId}`);
        }
      } catch (error) {
        console.error(`[useJoinRoom][WS] Error sending leave room message for ${roomId}:`, error);
      } finally {
        markLeft();
      }
    };

    wsManager?.on(roomId, serverHandler);

    if (shouldJoin) {
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
      wsManager?.off(roomId, serverHandler);
    };
  }, [wsManager, roomId, shouldJoin]);

  return { wsManager };
};
