export type OfferSide = 'BUY' | 'SELL';

export interface ICreateOfferRequest {
  intermediary_wallet_id?: number | null;
  side: OfferSide;
  symbol: string; // token symbol (e.g. MZD)
  quantity: string; // string to support very large integers
  total_quantity?: string; // optional total quantity for partial fills
  price?: string;
  price_rate?: string;
  price_type?: string; // optional price type
  price_reference?: string;
  spread?: string;
  external_ref?: string;
  metadata?: Record<string, any> | null; // optional additional info (object)
  expires_at?: string;
  limit?: { min?: string; max?: string };
}

export interface IOffer {
  offer_id: number;
  intermediary_wallet_id?: number | null;
  wallet_address?: string;
  side: OfferSide;
  symbol: string;
  quantity: number | string;
  total_quantity?: number | string;
  price: number | string;
  price_type?: string;
  price_rate?: string | null;
  limit?: { min: number | string; max: number | string } | null;
  status?: string;
  metadata?: Record<string, any> | string | null;
  rate?: string | null; // optional rate field to match indexer computed value
  created_at?: string;
  updated_at?: string;
}
