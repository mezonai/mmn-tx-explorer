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
  totalMZD: number; // Tổng số MZD mà người bán có sẵn để bán (ví dụ: 20000 MZD)
  available: number; // Số MZD còn khả dụng để bán (có thể bằng hoặc nhỏ hơn totalMZD)
  limit: {
    min: number; // Số MZD tối thiểu cho mỗi giao dịch
    max: number; // Số MZD tối đa cho mỗi giao dịch
  };
  paymentMethods: PaymentMethod[];
  isClanOffer?: boolean;
}

export interface P2PFilters {
  tradeType: TradeType;
  amount?: number; // Số MZD muốn mua (nếu có)
  paymentMethod: PaymentMethod;
  friendsOnly: boolean;
  currency: string; // MZD, etc.
}

export type BankOption = 'MB' | 'VCB' | 'TCB' | 'ACB' | 'TPBANK' | 'VIETCOMBANK';

export interface CreateOfferFormData {
  tradeType: TradeType;
  amountMZD: number; // Số MZD muốn bán
  exchangeRate: number; // Tỉ giá VND/MZD (ví dụ: 0.8 = 1 MZD = 0.8 VND)
  limit: {
    min: number; // Số MZD tối thiểu cho mỗi giao dịch
    max: number; // Số MZD tối đa cho mỗi giao dịch
  };
  bank: BankOption;
  accountNumber: string; // Số tài khoản ngân hàng
}

export type OrderStatus = 'PAYMENT_PENDING' | 'WAIT_CONFIRM' | 'PAYMENT_CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface P2POrder {
  id: string; // Order ID (ví dụ: "19283746")
  offerId: string; // Reference đến P2POffer
  buyerId: string;
  sellerId: string;
  sellerUsername: string;
  amountMZD: number; // Số MZD người mua muốn mua
  amountVND: number; // Số VND cần thanh toán (tính từ amountMZD * exchangeRate)
  exchangeRate: number; // Tỉ giá VND/MZD từ offer
  status: OrderStatus;
  createdAt: string;
  expiresAt: string; // Timer countdown (ISO string)
  transferCode: string; // Mã chuyển khoản (ví dụ: "MZD 83729")
  bankInfo: {
    bank: BankOption;
    accountNumber: string;
    accountName: string;
  };
}

export interface ChatMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderType: 'buyer' | 'seller' | 'system';
  content: string;
  timestamp: string;
  isRead: boolean;
}

// Update P2POffer để include bank info (optional, sẽ có khi tạo offer)
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
  totalMZD: number; // Tổng số MZD mà người bán có sẵn để bán (ví dụ: 20000 MZD)
  available: number; // Số MZD còn khả dụng để bán (có thể bằng hoặc nhỏ hơn totalMZD)
  limit: {
    min: number; // Số MZD tối thiểu cho mỗi giao dịch
    max: number; // Số MZD tối đa cho mỗi giao dịch
  };
  paymentMethods: PaymentMethod[];
  isClanOffer?: boolean;
  exchangeRate: number; // Tỉ giá VND/MZD (ví dụ: 0.8 = 1 MZD = 0.8 VND)
  bankInfo?: {
    bank: BankOption;
    accountNumber: string;
    accountName: string;
  };
  transferCode?: string; // Mã chuyển khoản khi tạo offer
}
