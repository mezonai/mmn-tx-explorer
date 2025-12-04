// Mock API layer for P2P trading (offers & orders).
// - Follows the BE contract where "seller" is the owner of the offer.
// - Currently maps seller -> advertiser to match existing P2POffer type.
// - Later, when BE is wired, we can switch USE_P2P_MOCK to false and
//   use apiDongClient similarly to donation-campaign module.

import { BankOption, P2POffer, P2POrder, TradeType } from './types/p2p.types';
import { P2P_ENDPOINTS } from './constants';
// import { apiDongClient } from '@/service';

const USE_P2P_MOCK = true;

const delay = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

type Seller = {
  id: string;
  username: string;
  avatar?: string;
  isVerified: boolean;
  totalOrders: number;
  completionRate: number;
};

type RawOffer = {
  id: string;
  seller: Seller;
  totalMZD: number;
  available: number;
  limit: {
    min: number;
    max: number;
  };
  exchangeRate: number;
  bankInfo: {
    bank: BankOption;
    accountNumber: string;
    accountName: string;
  };
  transferCode: string;
};

const mockRawOffers: RawOffer[] = [
  {
    id: 'offer_1',
    seller: {
      id: 'user1',
      username: 'Mezon_Trader_Pro',
      avatar: 'https://ui-avatars.com/api/?name=Mezon+Trader&background=2563eb&color=fff',
      isVerified: true,
      totalOrders: 1203,
      completionRate: 99.5,
    },
    totalMZD: 20000,
    available: 5000,
    limit: {
      min: 100,
      max: 5000,
    },
    exchangeRate: 0.8,
    bankInfo: {
      bank: 'TCB',
      accountNumber: '19034482991022',
      accountName: 'NGUYEN VAN A',
    },
    transferCode: 'MZD 83729',
  },
  {
    id: 'offer_2',
    seller: {
      id: 'user2',
      username: 'HaiNam_Dev',
      avatar: 'https://ui-avatars.com/api/?name=Hai+Nam&background=8b5cf6&color=fff',
      isVerified: false,
      totalOrders: 50,
      completionRate: 100,
    },
    totalMZD: 15000,
    available: 1000,
    limit: {
      min: 50,
      max: 2000,
    },
    exchangeRate: 0.75,
    bankInfo: {
      bank: 'VCB',
      accountNumber: '1234567890',
      accountName: 'TRAN VAN B',
    },
    transferCode: 'MZD 12345',
  },
];

const mapRawOfferToP2POffer = (raw: RawOffer): P2POffer => ({
  id: raw.id,
  advertiser: {
    id: raw.seller.id,
    username: raw.seller.username,
    avatar: raw.seller.avatar,
    isVerified: raw.seller.isVerified,
    totalOrders: raw.seller.totalOrders,
    completionRate: raw.seller.completionRate,
  },
  totalMZD: raw.totalMZD,
  available: raw.available,
  limit: {
    ...raw.limit,
  },
  exchangeRate: raw.exchangeRate,
  bankInfo: {
    ...raw.bankInfo,
  },
  transferCode: raw.transferCode,
});

const mockOrders: P2POrder[] = [];

const generateOrderId = () => `order_${Date.now()}`;

const generateTransferCode = () => `MZD ${Math.floor(Math.random() * 100000)}`;

export class P2PService {
  static async getOffers(params: { tradeType?: TradeType; amount?: number; currency?: string }): Promise<P2POffer[]> {
    if (USE_P2P_MOCK) {
      await delay(400);

      let offers = mockRawOffers.slice();

      if (params.amount) {
        offers = offers.filter(
          (offer) =>
            params.amount! >= offer.limit.min && params.amount! <= offer.limit.max && params.amount! <= offer.available
        );
      }

      return offers.map(mapRawOfferToP2POffer);
    }

    // const { data } = await apiDongClient.get<{ offers: RawOffer[] }>(P2P_ENDPOINTS.OFFERS, {
    //   params,
    // });
    // return data.offers.map(mapRawOfferToP2POffer);

    throw new Error('P2P real API not implemented yet');
  }

  static async getOfferById(offerId: string): Promise<P2POffer> {
    if (USE_P2P_MOCK) {
      await delay(300);
      const raw = mockRawOffers.find((offer) => offer.id === offerId);
      if (!raw) {
        throw new Error(`Offer not found: ${offerId}`);
      }
      return mapRawOfferToP2POffer(raw);
    }

    // const { data } = await apiDongClient.get<{ data: RawOffer }>(P2P_ENDPOINTS.OFFER_BY_ID(offerId));
    // return mapRawOfferToP2POffer(data.data);

    throw new Error('P2P real API not implemented yet');
  }

  static async createOrder(payload: { offerId: string; amountMZD: number; amountVND?: number }): Promise<P2POrder> {
    if (USE_P2P_MOCK) {
      await delay(500);

      const raw = mockRawOffers.find((offer) => offer.id === payload.offerId);
      if (!raw) {
        throw new Error(`Offer not found: ${payload.offerId}`);
      }

      const { amountMZD } = payload;

      if (amountMZD < raw.limit.min || amountMZD > raw.limit.max || amountMZD > raw.available) {
        throw new Error('Invalid amountMZD for this offer');
      }

      const exchangeRate = raw.exchangeRate;
      const amountVND = payload.amountVND ?? amountMZD * exchangeRate;

      const orderId = generateOrderId();
      const transferCode = raw.transferCode || generateTransferCode();

      const mockBuyerId = 'mock_buyer_id';

      const newOrder: P2POrder = {
        id: orderId,
        offerId: raw.id,
        buyerId: mockBuyerId,
        sellerId: raw.seller.id,
        sellerUsername: raw.seller.username,
        amountMZD,
        amountVND,
        exchangeRate,
        status: 'PAYMENT_PENDING',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        transferCode,
        bankInfo: {
          ...raw.bankInfo,
        },
      };

      mockOrders.push(newOrder);

      raw.available = Math.max(0, raw.available - amountMZD);

      return newOrder;
    }

    // const { data } = await apiDongClient.post<{ data: P2POrder }>(P2P_ENDPOINTS.ORDERS, payload);
    // return data.data;

    throw new Error('P2P real API not implemented yet');
  }

  static async getOrderById(orderId: string): Promise<P2POrder> {
    if (USE_P2P_MOCK) {
      await delay(300);
      const order = mockOrders.find((item) => item.id === orderId);
      if (!order) {
        if (mockOrders.length === 0) {
          throw new Error(`Order not found: ${orderId}`);
        }
        return mockOrders[0];
      }
      return order;
    }

    // const { data } = await apiDongClient.get<{ data: P2POrder }>(P2P_ENDPOINTS.ORDER_BY_ID(orderId));
    // return data.data;

    throw new Error('P2P real API not implemented yet');
  }

  static async getMyOrders(): Promise<P2POrder[]> {
    if (USE_P2P_MOCK) {
      await delay(300);
      return mockOrders.slice();
    }

    // const { data } = await apiDongClient.get<{ data: P2POrder[] }>(P2P_ENDPOINTS.MY_ORDERS);
    // return data.data;

    throw new Error('P2P real API not implemented yet');
  }
}
