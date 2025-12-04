// Mock API layer for P2P trading (offers & orders).
// - Mirrors BE contract that uses wallet addresses for buyer/seller identifiers.
// - Later, when BE is wired, we can switch USE_P2P_MOCK to false and
//   use apiDongClient similarly to donation-campaign module.

import { P2POffer, P2POrder, TradeType } from './types/p2p.types';
// import { apiDongClient } from '@/service';

const USE_P2P_MOCK = true;

const delay = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

type RawOffer = P2POffer &
  Required<Pick<P2POffer, 'bankInfo'>> & {
    transferCode: string;
  };

const mockRawOffers: RawOffer[] = [
  {
    offerId: 'offer_1',
    sellerWalletAddress: '0xA1B2c3D4e5F67890abcdef1234567890ABCDEF01',
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
    offerId: 'offer_2',
    sellerWalletAddress: '0xFfEEDDCCbbaa99887766554433221100FFEEDDcc',
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
  offerId: raw.offerId,
  sellerWalletAddress: raw.sellerWalletAddress,
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
      const raw = mockRawOffers.find((offer) => offer.offerId === offerId);
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

      const raw = mockRawOffers.find((offer) => offer.offerId === payload.offerId);
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
      const mockBuyerWallet = '0xBuyerWallet000000000000000000000000000001';

      const newOrder: P2POrder = {
        orderId,
        offerId: raw.offerId,
        buyerWalletAddress: mockBuyerWallet,
        sellerWalletAddress: raw.sellerWalletAddress,
        amountMZD,
        amountVND,
        exchangeRate,
        status: 'PAYMENT_PENDING',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
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
      const order = mockOrders.find((item) => item.orderId === orderId);
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
