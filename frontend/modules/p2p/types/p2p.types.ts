export type TradeType = 'BUY' | 'SELL';

export interface P2POffer {
  offerId: string;
  sellerWalletAddress: string;
  // Allow number|string because backend can return big integers as strings
  totalMZD: number | string; // Tổng số MZD mà người bán có sẵn để bán (ví dụ: 20000 MZD)
  available: number | string; // Số MZD còn khả dụng để bán (có thể bằng hoặc nhỏ hơn totalMZD)
  limit: {
    min: number | string; // Số MZD tối thiểu cho mỗi giao dịch
    max: number | string; // Số MZD tối đa cho mỗi giao dịch
  };
  exchangeRate: number | string; // Tỉ giá VND/MZD (ví dụ: 0.8 = 1 MZD = 0.8 VND)
  bankInfo?: {
    bank: BankOption;
    accountNumber: string;
    accountName: string;
  };
  transferCode?: string; // Mã chuyển khoản khi tạo offer
}

export interface P2PFilters {
  tradeType: TradeType;
  amount?: number; // Số MZD muốn mua (nếu có)
  currency: string; // MZD, etc.
}

export type BankOption = 'MB' | 'VCB' | 'TCB' | 'ACB' | 'TPBANK' | 'VIETCOMBANK';

export interface CreateOfferFormData {
  tradeType: TradeType;
  amountMZD: number | string; // Số MZD muốn bán
  exchangeRate: number | string; // Tỉ giá VND/MZD (ví dụ: 0.8 = 1 MZD = 0.8 VND)
  limit: {
    min: number; // Số MZD tối thiểu cho mỗi giao dịch
    max: number; // Số MZD tối đa cho mỗi giao dịch
  };
  bank: BankOption;
  accountNumber: string; // Số tài khoản ngân hàng
}

export type OrderStatus = 'PAYMENT_PENDING' | 'WAIT_CONFIRM' | 'PAYMENT_CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface P2POrder {
  orderId: string; // Order ID (ví dụ: "19283746")
  offerId: string; // Reference đến P2POffer
  buyerWalletAddress: string;
  sellerWalletAddress: string;
  amountMZD: number | string; // Số MZD người mua muốn mua
  amountVND: number | string; // Số VND cần thanh toán (tính từ amountMZD * exchangeRate)
  exchangeRate: number | string; // Tỉ giá VND/MZD từ offer
  status: OrderStatus;
  createdAt: string;
  expiresAt: string; // Timer countdown (ISO string)
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
