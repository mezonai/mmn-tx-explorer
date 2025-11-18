
export const QUERY_KEYS = {
  CLAIMED_ENVELOPES: 'claimed-envelopes', 
  CREATED_ENVELOPES: 'created-envelopes',
  RED_ENVELOPE_STATS: 'red-envelope-stats'
}

export const RED_ENVELOPE_ENPOINTS = {
  STATS: 'api/v1/red-envelopes/stats',
  CREATE_RED_ENVELOPE: 'api/v1/red-envelopes',
  CREATED_ENVELOPES_BY_WALLET: 'api/v1/red-envelopes/created-by-wallet',
  CLAIMED_ENVELOPES_BY_WALLET: 'api/v1/red-envelopes/claimed-by-wallet',
} as const;
