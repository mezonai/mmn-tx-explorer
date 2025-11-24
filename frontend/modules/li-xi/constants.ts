import { UUID } from "crypto";

export const QUERY_KEYS = {
  CLAIMED_ENVELOPES: 'claimed-envelopes', 
  CREATED_ENVELOPES: 'created-envelopes',
  RED_ENVELOPE_STATS: 'red-envelope-stats',
  RED_ENVELOPE_DETAIL: 'lucky-money-detail',
  RED_ENVELOPE_DETAIL_RECIPIENTS: 'lucky-money-detail-recipients',
}

export const RED_ENVELOPE_ENPOINTS = {
  STATS: 'api/v1/red-envelopes/stats',
  CREATE_RED_ENVELOPE: 'api/v1/red-envelopes',
  CREATED_ENVELOPES_BY_WALLET: 'api/v1/red-envelopes/created-by-wallet',
  CLAIMED_ENVELOPES_BY_WALLET: 'api/v1/red-envelopes/claimed-by-wallet',
  RED_ENVELOPE_DETAIL_STATS: `api/v1/red-envelopes/detail`,
  RED_ENVELOPE_DETAIL_RECIPIENTS: (id: UUID) => `api/v1/red-envelopes/${id}`,
  CLOSE_SESSION: '/api/v1/red-envelopes/close-session',
} as const;
