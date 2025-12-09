export type BankOption = 'MB' | 'VCB' | 'TCB' | 'ACB' | 'TPBANK' | 'VIETCOMBANK';

export interface P2POffer {
  offerId: string;
  sellerWalletAddress: string;
  totalMZD: number;
  available: number;
  limit: {
    min: number;
    max: number;
  };
  exchangeRate: number;
  bankInfo?: {
    bank: BankOption;
    accountNumber: string;
    accountName: string;
  };
  transferCode?: string;
}
export interface IP2POfferListParams {
  page: number;
  limit: number;
  rate?: number;
  totalAmountFrom?: number;
  totalAmountTo?: number;
}
