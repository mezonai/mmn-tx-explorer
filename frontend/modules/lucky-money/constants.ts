import { CreateRedEnvelopeForm } from "./type";
import { UUID } from "crypto";

export const EXPIRY_OPTIONS = [
  { label: '1h', value: 1 },
  { label: '12h', value: 12 },
  { label: '24h', value: 24 },
  { label: '48h', value: 48 },
] as const;

export const QUERY_KEYS = {
  CLAIMED_ENVELOPES: 'claimed-envelopes', 
  CREATED_ENVELOPES: 'created-envelopes',
  RED_ENVELOPE_STATS: 'red-envelope-stats',
  RED_ENVELOPES: 'red-envelopes',
  RED_ENVELOPE_DETAIL: 'red-envelope-detail',
  RED_ENVELOPE_DETAIL_RECIPIENTS: 'red-envelope-detail-recipients',
}

export const RED_ENVELOPE_ENDPOINTS = {
  STATS: 'api/v1/red-envelopes/stats',
  CREATE_RED_ENVELOPE: 'api/v1/red-envelopes/create',
  CREATED_ENVELOPES_BY_USER: 'api/v1/red-envelopes/created-by-user',
  CLAIMED_ENVELOPES_BY_USER: 'api/v1/red-envelopes/claimed-by-user',
  UPDATE_STATUS_RED_ENVELOPE:`/api/v1/red-envelopes/update-status-red-envelope`,
  CLAIM_AMOUNT: (id: string, wallet_address: string) => `/api/v1/red-envelopes/claim-amount?id=${id}&wallet_address=${wallet_address}`,
  CLAIM: (id: UUID) => `/api/v1/red-envelopes/${id}/claim`,
  RED_ENVELOPE_DETAIL_STATS: (id: UUID) => `api/v1/red-envelopes/detail/${id}`,
  RED_ENVELOPE_DETAIL_RECIPIENTS: (id: UUID) => `api/v1/red-envelopes/${id}/recipients`,
  CLOSE_SESSION: '/api/v1/red-envelopes/close-session',
} as const;

export const DEFAULT_FORM_VALUES: CreateRedEnvelopeForm = {
  name: 'Lucky Money',
  totalAmount: 100,
  participantCount: 10,
  amountMin: 10,
  amountMax: 20,
  message: 'Good luck',
  randomDistribution: true,
  expiryHours: 1,
};