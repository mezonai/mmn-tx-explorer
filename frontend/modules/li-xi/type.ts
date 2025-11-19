import { UUID } from "crypto";

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

export interface RedEnvelopeDetailRequest {
  id: UUID;
  wallet_address: string;
}

export interface RedEnvelopeDetailRecipient {
  claimer_wallet: string;
  amount: number;
  claimed_at: string;
  transaction_hash: string;
}
