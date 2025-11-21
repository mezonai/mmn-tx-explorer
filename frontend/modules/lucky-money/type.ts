import { UUID } from "crypto";

export enum EnvelopeStatus {
  Active = 'ACTIVE',
  Expiry = 'EXPIRY',
  Pending = 'PENDING',
  Claim = 'CLAIM'
}

export interface RedEnvelope {
  id: UUID;
  name: string;
  description: string;
  total_amount: number;
  total_claims: number;
  min_amount: number;
  max_amount: number;
  amount_per_claim: number;
  is_random_distribution: boolean;
  enable_claim_animation: boolean;
  require_captcha: boolean;
  status: EnvelopeStatus;
  claimed_count: number;
  remaining_amount: number;
  created_at: string;
  expires_at: string;
  owner_wallet: string;
  red_envelope_wallet: string;
  creator: string;
}


export interface RedEnvelopeStats {
  total_sent: number;
  count_sent_envelopes: number;
  total_claimed: number;
  count_claimed_envelopes: number;
  total_active_envelopes: number;
}

export type EnvelopeListParams = {
  page: number;
  limit: number;
  wallet_address: string;
}

export interface CreatedEnvelopes {
  id: UUID;
  name: string;
  total_amount: number;
  total_claims: number;
  status: string;
  created_at: string;
  claimed_count: number;
}

export interface ClaimedEnvelopes {
  id: UUID;
  red_envelope_id: number;
  name: string;
  from_wallet: string;
  amount: number;
  claimed_at: string;
  transaction_hash: string | null | undefined;
}

export interface CreateRedEnvelopeForm {
  name: string;
  totalAmount: number;
  participantCount: number;
  amountMin: number;
  amountMax: number;
  message: string;
  randomDistribution: boolean;
  expiryHours: number;
}

export interface CreateRedEnvelopeRequest {
  name: string;
  description: string;
  total_amount: number;
  total_claims: number;
  min_amount: number;
  max_amount: number;
  is_random_distribution: boolean;
  start_date: string;
  end_date: string;
  owner_wallet: string | null | undefined;
}

export interface UpdateStatusRedEnvelopeRequest {
  id: UUID;
  status: number;
}
