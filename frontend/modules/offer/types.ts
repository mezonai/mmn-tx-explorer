export type OfferSide = 'BUY' | 'SELL';

export interface ICreateOfferRequest {
  side: OfferSide;
  symbol: string; // token symbol
  quantity: number | string; // integer number of tokens (or string)
  total_quantity?: number | string; // optional total quantity for partial fills
  price: number | string; // price in chain smallest unit or display unit depending on backend expectation
  price_type?: string; // optional price type
  metadata?: string | null; // optional additional info
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
  status?: string;
  metadata?: string | null;
  rate?: string | null; // optional rate field to match indexer computed value
  created_at?: string;
  updated_at?: string;
}
