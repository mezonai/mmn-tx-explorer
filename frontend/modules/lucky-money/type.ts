import { UUID } from 'crypto';

export enum EnvelopeStatus {
  Active = 'ACTIVE',
  Expiry = 'EXPIRY',
  Pending = 'PENDING',
  Claim = 'CLAIM',
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

export interface RedEnvelopeStatsByUser {
  total_sent: number;
  total_recipients: number;
  total_claimed: number;
  count_claimed_envelopes: number;
  total_active_envelopes: number;
}

export type EnvelopeListParams = {
  page: number;
  limit: number;
};

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

export interface ClaimEnvelopeRequest {
  split_money_id: number;
}

export interface RedEnvelopeClaim {
  split_money_id: number;
  amount: number;
  description: string;
}

export interface RedEnvelopeDetailStats {
  name: string;
  total_amount: number;
  total_claim: number;
  claimed_count: number;
  total_claimed_amount: number;
  end_date: string;
  red_envelope_wallet: string;
  status: string;
}

export interface CloseSessionRequest {
  id: UUID;
}

export interface RedEnvelopeDetailRecipient {
  claimer_wallet: string;
  amount: number;
  claimed_at: string;
  transaction_hash: string;
}

export interface RedEnvelopeStats {
  total_envelopes: number;
  total_claimed: number;
}
