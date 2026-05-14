export const HEARTBEAT_CHECK = 'heartbeat_check';
export const HEARTBEAT_ACK = 'heartbeat_ack';
export const HEARTBEAT_CHECK_INTERVAL_MS = 30000; // 30 seconds
export const HEARTBEAT_TIMEOUT_MS = 60000; // 60 seconds
export const MAX_RECONNECT_ATTEMPTS = 5;
export const RECONNECT_DELAY_MS = 3000;

export const SOCKET_MESSAGE = {
  MSG_JOIN_ROOM: 'join_room',
  MSG_LEAVE_ROOM: 'leave_room',
  SERVER_JOINED_ROOM_PREFIX: 'joined_room',
  SERVER_LEFT_ROOM_PREFIX: 'left_room',
  ROOM_OFFER_UPDATES: 'offer_updates',
  ROOM_RED_ENVELOPE_UPDATES: 'red_envelope_updates',
} as const;
