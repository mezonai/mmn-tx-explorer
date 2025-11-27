export type TradeType = 'BUY' | 'SELL';

export type PaymentMethod = 'BANK_TRANSFER' | 'MOMO' | 'TPBANK' | 'VIETCOMBANK' | 'ALL';

export interface P2POffer {
  id: string;
  advertiser: {
    id: string;
    username: string;
    avatar?: string;
    isVerified: boolean;
    isClanMember: boolean;
    totalOrders: number;
    completionRate: number;
  };
  price: number; // VND per MZD
  available: number; // MZD available
  limit: {
    min: number; // VND
    max: number; // VND
  };
  paymentMethods: PaymentMethod[];
  isClanOffer?: boolean;
  clanDiscount?: number; // percentage
}

export interface P2PFilters {
  tradeType: TradeType;
  amount?: number; // VND
  paymentMethod: PaymentMethod;
  friendsOnly: boolean;
  currency: string; // MZD, etc.
}
